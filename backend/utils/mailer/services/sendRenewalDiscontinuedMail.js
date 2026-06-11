const sendMail = require("../../sendMail");
const MAIL     = require("../constants/mailRecipients");
const template = require("../templates/renewalDiscontinuedTemplate");

module.exports = async (renewal) => {
  return await sendMail({
    to:      [...MAIL.ADMIN, ...(MAIL.MANAGEMENT || [])].join(","),
    cc:      [...MAIL.AUTOMATION, renewal.renewer_email, renewal.email]
               .filter(Boolean).join(","),
    subject: `📦 Renewal Discontinued — ${renewal.item_name} (${renewal.item_id})`,
    html:    template(renewal),
  });
};