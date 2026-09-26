const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const ticketCreatedTemplate = require("../templates/ticketCreatedTemplate");

// The portal admin's own mailbox is also EMAIL_USER (the account these
// emails send from) — never list it as a recipient, even if it ends up in
// a ticket's cc list.
const EXCLUDE_EMAIL = "software.developer@briskolive.com";

module.exports = async (ticket) => {

  // Critical tickets loop Management in automatically — this is a silent
  // side effect, never surfaced on the raise-ticket form itself.
  const cc = [
    ...(ticket.cc || []),
    ...(ticket.priority === "Critical" ? MAIL.MANAGEMENT : []),
  ].filter((e) => e.toLowerCase() !== EXCLUDE_EMAIL);

  return await sendMail({

    to: MAIL.ADMIN.join(","),

    cc,

    subject: `New Ticket Raised - ${ticket.ticket_id}: ${ticket.title}`,

    html: ticketCreatedTemplate(ticket),

  });

};
