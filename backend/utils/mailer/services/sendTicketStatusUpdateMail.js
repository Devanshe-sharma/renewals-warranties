const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const ticketStatusUpdateTemplate = require("../templates/ticketStatusUpdateTemplate");

// The portal admin's own mailbox is also EMAIL_USER (the account these
// emails send from) — never list it as a recipient, even if it raised the
// ticket itself or ended up in the cc list.
const EXCLUDE_EMAIL = "software.developer@briskolive.com";

module.exports = async (ticket) => {

  const raiserEmail = (ticket.raised_by_email || "").toLowerCase();

  return await sendMail({

    // Status changes (closing, etc.) are the admin acting — the raiser is
    // who needs telling. Falls back to admin when there's no usable raiser
    // address — either an older ticket predating raised_by_email, or the
    // raiser is the excluded mailbox itself.
    to: raiserEmail && raiserEmail !== EXCLUDE_EMAIL ? ticket.raised_by_email : MAIL.ADMIN.join(","),

    cc: [...MAIL.ADMIN, ...(ticket.cc || [])].filter((e) => e.toLowerCase() !== EXCLUDE_EMAIL),

    subject: `Ticket ${ticket.ticket_id} - Status: ${ticket.status}`,

    html: ticketStatusUpdateTemplate(ticket),

  });

};
