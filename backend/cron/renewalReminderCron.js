const cron = require("node-cron");
const Newrenewal = require("../models/Newrenewal");

const sendReminder1 = require("../utils/mailer/services/sendRenewalReminder1");
const sendReminder2 = require("../utils/mailer/services/sendRenewalReminder2");
const sendReminder3 = require("../utils/mailer/services/sendRenewalReminder3");

console.log("🚀 Renewal cron loaded");

function isSameDay(d1, d2) {
  return (
    d1.getDate()     === d2.getDate()     &&
    d1.getMonth()    === d2.getMonth()    &&
    d1.getFullYear() === d2.getFullYear()
  );
}

function toMidnight(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// ── Runs every day at 9:00 AM ──────────────────────────
// For debug: change to "* * * * *"
cron.schedule(
  "0 9 * * *",
  async () => {
  console.log("\n=================================");
  console.log("⏰ RENEWAL REMINDER CRON FIRED");
  console.log("TIME:", new Date().toLocaleString("en-IN"));
  console.log("=================================\n");

  

  try {
    const renewals = await Newrenewal.find({
      active: true,
      is_closed: { $ne: true },
    }).lean();

    console.log(`📋 Active Renewals: ${renewals.length}`);

    const today = toMidnight(new Date());

    for (const renewal of renewals) {
      const itemName = renewal.item_name || renewal._id;

      // ── Parse reminder dates ──────────────────────────
      const r1Date    = renewal.reminder1_date ? toMidnight(new Date(renewal.reminder1_date)) : null;
      const r2Date    = renewal.reminder2_date ? toMidnight(new Date(renewal.reminder2_date)) : null;
      const finalDate = renewal.reminder_final_date ? toMidnight(new Date(renewal.reminder_final_date)) : null;
      const endDate   = renewal.end_date ? toMidnight(new Date(renewal.end_date)) : null;

      // ── Skip if already expired ───────────────────────
      if (endDate && today > endDate) {
        console.log(`⏭️  ${itemName} — past end date, skipping`);
        continue;
      }

      try {

        // ── FINAL REMINDER (escalation) ───────────────────
        // Send once on final reminder date — escalation mail to management
        if (finalDate && isSameDay(today, finalDate)) {
          console.log(`🚨 ${itemName} — FINAL REMINDER (escalation)`);
          await sendReminder3(renewal);
          console.log(`✅ Final reminder sent for ${itemName}`);
          continue;
        }

        // ── 2ND REMINDER (daily from r2Date until finalDate) ──
        // Send every day from 2nd reminder date up to (but not including) final reminder date
        if (
          r2Date && finalDate &&
          today >= r2Date &&
          today < finalDate
        ) {
          console.log(`🔴 ${itemName} — 2nd REMINDER (daily)`);
          await sendReminder2(renewal);
          console.log(`✅ 2nd reminder sent for ${itemName}`);
          continue;
        }

        // ── 1ST REMINDER (once on r1Date) ─────────────────
        // Send only once on the exact 1st reminder date
        if (r1Date && isSameDay(today, r1Date)) {
          console.log(`🟡 ${itemName} — 1st REMINDER (once)`);
          await sendReminder1(renewal);
          console.log(`✅ 1st reminder sent for ${itemName}`);
          continue;
        }

        console.log(`⏭️  ${itemName} — no reminder today`);

      } catch (mailErr) {
        console.error(`❌ Mail failed for ${itemName}:`, mailErr.message);
      }
    }

  } catch (err) {
    console.error("❌ CRON ERROR:", err);
  }

  console.log("\n=================================");
  console.log("✅ CRON COMPLETE");
  console.log("=================================\n");

  },
  {
    timezone: "Asia/Kolkata",
  }
);