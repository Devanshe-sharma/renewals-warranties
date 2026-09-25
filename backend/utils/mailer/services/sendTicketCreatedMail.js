const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const ticketCreatedTemplate = require("../templates/ticketCreatedTemplate");

// The portal admin's own mailbox is also EMAIL_USER (the account these
// emails send from) — never list it as a recipient, even if it ends up in
// a ticket's cc list.
const EXCLUDE_EMAIL = "software.developer@briskolive.com";

module.exports = async (ticket) => {

  return await sendMail({

    to: MAIL.ADMIN.join(","),

    cc: (ticket.cc || []).filter((e) => e.toLowerCase() !== EXCLUDE_EMAIL),

    subject: `New Ticket Raised - ${ticket.ticket_id}: ${ticket.title}`,

    html: ticketCreatedTemplate(ticket),

  });

};
