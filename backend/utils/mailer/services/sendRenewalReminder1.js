const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const template = require("../templates/renewalReminder1Template");

module.exports = async (renewal) => {

  return await sendMail({

    to: MAIL.ADMIN.join(","),

    cc: [
      ...MAIL.AUTOMATION,
      renewal.email,
    ]
      .filter(Boolean)
      .join(","),

    subject: `1st Reminder - ${renewal.item_name} Renewal Due`,

    html: template(renewal),

  });

};