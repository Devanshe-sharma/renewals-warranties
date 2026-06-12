const sendMail   = require("../../sendMail");
const MAIL       = require("../constants/mailRecipients");
const template   = require("../templates/renewalUpdateCreatedTemplate");

module.exports = async (renewal, event) => {
  return await sendMail({
    to: MAIL.ADMIN.join(","),

    cc: [
      ...MAIL.MANAGEMENT,
      ...MAIL.AUTOMATION,
      renewal.renewer_email,
      renewal.email,
      ...(Array.isArray(renewal.cc_recipients)
        ? renewal.cc_recipients.map(c => c.email)
        : []),
    ]
      .filter(Boolean)
      .join(","),

    subject: `Renewal Updated — ${renewal.item_name}`,

    html: template(renewal, event),
  });
};