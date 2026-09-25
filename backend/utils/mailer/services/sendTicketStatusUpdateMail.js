const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const ticketStatusUpdateTemplate = require("../templates/ticketStatusUpdateTemplate");

module.exports = async (ticket) => {

  return await sendMail({

    to: MAIL.ADMIN.join(","),

    cc: ticket.cc || [],

    subject: `Ticket ${ticket.ticket_id} - Status: ${ticket.status}`,

    html: ticketStatusUpdateTemplate(ticket),

  });

};
