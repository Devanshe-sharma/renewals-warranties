const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const template = require("../templates/renewalReminder2Template");


module.exports = async (renewal) => {

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

    subject: `2nd Reminder - ${renewal.item_name} Renewal Approaching`,

    html: template(renewal),

  });

};