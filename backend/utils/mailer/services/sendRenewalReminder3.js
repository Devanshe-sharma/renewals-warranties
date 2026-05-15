const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const template = require("../templates/renewalReminder3Template");

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

    subject: `FINAL Reminder - ${renewal.item_name} Renewal Due`,

    html: template(renewal),

  });

};