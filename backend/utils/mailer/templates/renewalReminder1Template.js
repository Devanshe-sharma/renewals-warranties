module.exports = (renewal) => {

  return `

  <html>

    <body style="font-family: Arial, sans-serif; line-height:1.6;">

      <h2 style="color:#1976d2;">
        🔔 1st Reminder - Renewal Due
      </h2>

      <p>
        This is the first reminder regarding the following renewal item.
      </p>

      <table border="1" cellpadding="10" cellspacing="0">

        <tr>
          <td><b>Item ID</b></td>
          <td>${renewal.item_id || "-"}</td>
        </tr>

        <tr>
          <td><b>Item Name</b></td>
          <td>${renewal.item_name || "-"}</td>
        </tr>

        <tr>
          <td><b>Category</b></td>
          <td>${renewal.category || "-"}</td>
        </tr>

        <tr>
          <td><b>Renewer</b></td>
          <td>${renewal.renewer_name || "-"}</td>
        </tr>

        <tr>
          <td><b>End Date</b></td>
          <td>
            ${
              renewal.end_date
                ? new Date(renewal.end_date).toLocaleDateString("en-IN")
                : "-"
            }
          </td>
        </tr>

      </table>

      <br/>

      <p>
        Please initiate the renewal process before the due date.
      </p>

      <br/>

      <p>
        Regards,<br/>
        Brisk Olive Admin Team
      </p>

    </body>

  </html>

  `;
};