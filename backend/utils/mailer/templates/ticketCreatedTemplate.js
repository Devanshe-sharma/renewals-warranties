module.exports = (ticket) => {

  return `

  <html>

    <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">

      <p>
        A new support ticket has been raised in the system.
      </p>

      <table
        border="1"
        cellpadding="10"
        cellspacing="0"
        style="border-collapse: collapse; margin-top: 15px;"
      >

        <tr>
          <td><b>Ticket ID</b></td>
          <td>${ticket.ticket_id || "-"}</td>
        </tr>

        <tr>
          <td><b>Title</b></td>
          <td>${ticket.title || "-"}</td>
        </tr>

        <tr>
          <td><b>Description</b></td>
          <td>${ticket.description || "-"}</td>
        </tr>

        <tr>
          <td><b>Priority</b></td>
          <td>${ticket.priority || "-"}</td>
        </tr>

        <tr>
          <td><b>Raised By</b></td>
          <td>${ticket.raised_by_name || "-"}</td>
        </tr>

        <tr>
          <td><b>Plan Date</b></td>
          <td>${ticket.plan_date ? new Date(ticket.plan_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "-"}</td>
        </tr>

        <tr>
          <td><b>Attachment</b></td>
          <td>
            ${
              ticket.attachment_link || ticket.attachment_file_url
                ? `<a href="${ticket.attachment_link || ticket.attachment_file_url}" target="_blank">View Attachment</a>`
                : "-"
            }
          </td>
        </tr>

      </table>

      <p style="margin-top: 20px;">
        This is an automated notification from the Brisk Olive Renewal Management System.
      </p>

      <p style="margin-top: 25px;">
        Thanks & Regards<br/>
        <b>Brisk Olive Admin Team</b>
      </p>

    </body>

  </html>

  `;
};
