const sendMail = require("../../sendMail");

const ticketCreatedTemplate = require("../templates/ticketCreatedTemplate");

// TEMP: ticket mails route only to this address for now (per request) —
// switch back to MAIL.ADMIN (../constants/mailRecipients) once ready.
const TICKET_MAIL_TO = "software.developer@briskolive.com";

module.exports = async (ticket) => {

  return await sendMail({

    to: TICKET_MAIL_TO,

    subject: `New Ticket Raised - ${ticket.ticket_id}: ${ticket.title}`,

    html: ticketCreatedTemplate(ticket),

  });

};
