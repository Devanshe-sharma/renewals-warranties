const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const ticketCreatedTemplate = require("../templates/ticketCreatedTemplate");

// The portal admin's own mailbox is also EMAIL_USER (the account these
// emails send from) — never list it as a recipient, even if it ends up in
// a ticket's cc list.
const EXCLUDE_EMAIL = "software.developer@briskolive.com";

module.exports = async (ticket) => {

  // Management is CC'd by default on every ticket — a silent side effect,
  // never surfaced on the raise-ticket form itself. The raiser is CC'd too,
  // so they get a copy confirming their own ticket was raised.
  const cc = [
    ...(ticket.cc || []),
    ...MAIL.MANAGEMENT,
    ...(ticket.raised_by_email ? [ticket.raised_by_email] : []),
  ].filter((e) => e.toLowerCase() !== EXCLUDE_EMAIL);

  return await sendMail({

    to: MAIL.ADMIN.join(","),

    cc,

    // Same subject format on every ticket mail (created/status/follow-up) so
    // mail clients thread them together into one conversation per ticket.
    subject: `Ticket ${ticket.ticket_id}: ${ticket.title}`,

    html: ticketCreatedTemplate(ticket),

  });

};
