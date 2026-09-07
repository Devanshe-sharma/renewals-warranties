const sendMail = require("../../sendMail");

const ticketStatusUpdateTemplate = require("../templates/ticketStatusUpdateTemplate");

// TEMP: ticket mails route only to this address for now (per request) —
// switch back to MAIL.ADMIN (../constants/mailRecipients) + assignee cc once ready.
const TICKET_MAIL_TO = "software.developer@briskolive.com";

module.exports = async (ticket) => {

  return await sendMail({

    to: TICKET_MAIL_TO,

    subject: `Ticket ${ticket.ticket_id} - Status: ${ticket.status}`,

    html: ticketStatusUpdateTemplate(ticket),

  });

};
