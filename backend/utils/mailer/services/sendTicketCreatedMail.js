const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const ticketCreatedTemplate = require("../templates/ticketCreatedTemplate");

module.exports = async (ticket) => {

  return await sendMail({

    to: MAIL.ADMIN.join(","),

    cc: ticket.cc || [],

    subject: `New Ticket Raised - ${ticket.ticket_id}: ${ticket.title}`,

    html: ticketCreatedTemplate(ticket),

  });

};
