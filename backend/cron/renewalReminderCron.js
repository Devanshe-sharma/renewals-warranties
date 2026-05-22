const cron = require("node-cron");

const Newrenewal = require("../models/Newrenewal");

const sendReminder1 = require("../utils/mailer/services/sendRenewalReminder1");
const sendReminder2 = require("../utils/mailer/services/sendRenewalReminder2");
const sendReminder3 = require("../utils/mailer/services/sendRenewalReminder3");

function isSameDay(d1, d2) {

  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );

}

cron.schedule("0 9 * * *", async () => {

  console.log("=================================");
  console.log("⏰ RUNNING RENEWAL REMINDER CRON");
  console.log("=================================");

  try {

    const renewals = await Newrenewal.find({
      active: true,
      is_closed: { $ne: true },
    });

    const today = new Date();

    for (const renewal of renewals) {

      try {

        console.log("TODAY:", today);

        console.log(
          "R1:",
          renewal.reminder1_date
        );

        console.log(
          "MATCH:",
          renewal.reminder1_date &&
          isSameDay(new Date(renewal.reminder1_date), today)
        );

        if (
          renewal.reminder1_date &&
          isSameDay(new Date(renewal.reminder1_date), today)
        ) {

          await sendReminder1(renewal);

          console.log("✅ Reminder 1 Sent:", renewal.item_name);
        }

        if (
          renewal.reminder2_date &&
          isSameDay(new Date(renewal.reminder2_date), today)
        ) {

          await sendReminder2(renewal);

          console.log("✅ Reminder 2 Sent:", renewal.item_name);
        }

        if (
          renewal.reminder_final_date &&
          isSameDay(new Date(renewal.reminder_final_date), today)
        ) {

          await sendReminder3(renewal);

          console.log("✅ Final Reminder Sent:", renewal.item_name);
        }

      } catch (mailErr) {

        console.error("❌ Reminder Mail Failed:", renewal.item_name);
        console.error(mailErr);

      }

    }

  } catch (err) {

    console.error("❌ CRON ERROR");
    console.error(err);

  }


});

