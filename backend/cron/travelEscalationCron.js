const cron = require("node-cron");
const TravelRequest = require("../models/TravelRequest");
const rules = require("../utils/travel/travelRules");
const mails = require("../utils/mailer/services/travelMails");

// Every stage has a reminder and then an escalation to Management, each sent
// once per request:
//   Manager:  reminder 24h after submission, escalation at 48h.
//   Admin:    reminder 24h after approval, escalation once the 2-day booking
//             window (adminDueAt) has passed. Admin late score itself is
//             computed live and fixed when the request is booked/cancelled.

async function runTravelEscalations(now = new Date()) {
  const ago = (hours) => new Date(now.getTime() - hours * rules.HOUR);
  const log = (t, action, message) =>
    TravelRequest.updateOne({ _id: t._id }, { $push: { activity: { by_name: "System", action, message, at: now } } });

  // ── Manager stage ──
  const mgrReminder = await TravelRequest.find({
    status: "Pending Manager Approval",
    createdAt: { $lte: ago(rules.MANAGER_REMINDER_HOURS) },
    managerReminderSentAt: null,
  }).lean();
  for (const t of mgrReminder) {
    await mails.sendManagerReminder(t);
    await TravelRequest.updateOne({ _id: t._id }, { managerReminderSentAt: now });
    await log(t, "reminder", "Manager reminded: approval pending 24h");
  }

  const mgrEscalate = await TravelRequest.find({
    status: "Pending Manager Approval",
    createdAt: { $lte: ago(rules.MANAGER_ESCALATE_HOURS) },
    managerEscalatedAt: null,
  }).lean();
  for (const t of mgrEscalate) {
    await mails.sendManagerEscalation(t);
    await TravelRequest.updateOne({ _id: t._id }, { managerEscalatedAt: now });
    await log(t, "escalated", "Escalated to Management: manager approval pending 48h");
  }

  // ── Admin stage ──
  const admReminder = await TravelRequest.find({
    status: "Pending Admin Booking",
    managerActionAt: { $lte: ago(rules.ADMIN_REMINDER_HOURS) },
    adminReminderSentAt: null,
  }).lean();
  for (const t of admReminder) {
    await mails.sendAdminReminder(t);
    await TravelRequest.updateOne({ _id: t._id }, { adminReminderSentAt: now });
    await log(t, "reminder", "Admin reminded: booking pending 24h");
  }

  const admEscalate = await TravelRequest.find({
    status: "Pending Admin Booking",
    adminDueAt: { $lte: now },
    adminEscalatedAt: null,
  }).lean();
  for (const t of admEscalate) {
    await mails.sendAdminEscalation(t);
    await TravelRequest.updateOne({ _id: t._id }, { adminEscalatedAt: now });
    await log(t, "escalated", "Escalated to Management: booking not done within 2 days");
  }

  const total = mgrReminder.length + mgrEscalate.length + admReminder.length + admEscalate.length;
  if (total) console.log(`✈️ Travel escalations: ${total} mail(s) sent`);
}

cron.schedule("0 * * * *", () => {
  runTravelEscalations().catch((err) => console.error("Travel escalation cron failed:", err));
});

console.log("✈️ Travel escalation cron loaded");

module.exports = { runTravelEscalations };
