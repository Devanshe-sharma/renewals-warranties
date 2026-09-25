const sendMail = require("../../sendMail");

const MAIL = require("../constants/mailRecipients");

const ticketStatusUpdateTemplate = require("../templates/ticketStatusUpdateTemplate");

module.exports = async (ticket) => {

  return await sendMail({

    // Status changes (closing, etc.) are the admin acting — the raiser is
    // who needs telling. Older tickets predating raised_by_email fall back
    // to admin so this never fails to send.
    to: ticket.raised_by_email || MAIL.ADMIN.join(","),

    cc: [...MAIL.ADMIN, ...(ticket.cc || [])],

    subject: `Ticket ${ticket.ticket_id} - Status: ${ticket.status}`,

    html: ticketStatusUpdateTemplate(ticket),

  });

};
