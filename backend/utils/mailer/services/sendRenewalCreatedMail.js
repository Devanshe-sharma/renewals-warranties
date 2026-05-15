const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const renewalCreatedTemplate = require("../templates/renewalCreatedTemplate");

module.exports = async (renewal) => {

  return await sendMail({

    to: MAIL.TO,

    cc: [
      ...MAIL.CC,
      renewal.email,
    ]
      .filter(Boolean)
      .join(","),

    subject: `A Renewal Created - ${renewal.item_name}`,

    html: renewalCreatedTemplate(renewal),

  });

};