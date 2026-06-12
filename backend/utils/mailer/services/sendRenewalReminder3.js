const sendMail = require("../../sendMail");
const MAIL     = require("../constants/mailRecipients");
const template = require("../templates/renewalReminder3Template");

module.exports = async (renewal) => {
  // compute score at send time
  const today   = new Date(); today.setHours(0,0,0,0);
  const endDate = new Date(renewal.end_date); endDate.setHours(0,0,0,0);
  const daysOverdue = Math.round((today - endDate) / 86400000);
  const score = daysOverdue > 0 ? -daysOverdue : 0;

  return await sendMail({
    to: [
      ...MAIL.ADMIN,
      ...MAIL.MANAGEMENT,
    ].join(","),

    cc: [
      ...MAIL.AUTOMATION,
      renewal.email,
    ]
      .filter(Boolean)
      .join(","),

    subject: `FINAL Reminder — ${renewal.item_name} Renewal Overdue (Score: ${score})`,

    html: template(renewal, score),
  });
};