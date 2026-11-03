const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const ticketFollowupTemplate = require("../templates/ticketFollowupTemplate");

// The portal admin's own mailbox is also EMAIL_USER (the account these
// emails send from) — never list it as a recipient, even if it ends up in
// a ticket's cc list.
const EXCLUDE_EMAIL = "software.developer@briskolive.com";

module.exports = async (ticket, message) => {

  return await sendMail({

    to: MAIL.ADMIN.join(","),

    cc: [...MAIL.MANAGEMENT, ...(ticket.cc || [])].filter((e) => e.toLowerCase() !== EXCLUDE_EMAIL),

    // Same subject format on every ticket mail (created/status/follow-up) so
    // mail clients thread them together into one conversation per ticket.
    subject: `Ticket ${ticket.ticket_id}: ${ticket.title}`,

    html: ticketFollowupTemplate(ticket, message),

  });

};
