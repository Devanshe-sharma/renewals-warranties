module.exports = (renewal) => {

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return `

  <html>

    <body style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">

      <p>
        A new renewal item has been successfully created in the system.
      </p>

      <table
        border="1"
        cellpadding="10"
        cellspacing="0"
        style="border-collapse: collapse; margin-top: 15px;"
      >

        <tr>
          <td><b>Item ID</b></td>
          <td>${renewal.item_id || "-"}</td>
        </tr>

        <tr>
          <td><b>Category</b></td>
          <td>${renewal.category || "-"}</td>
        </tr>

        <tr>
          <td><b>Subcategory</b></td>
          <td>${renewal.subcategory || "-"}</td>
        </tr>

        <tr>
          <td><b>Item Name</b></td>
          <td>${renewal.item_name || "-"}</td>
        </tr>

        <tr>
          <td><b>Description</b></td>
          <td>${renewal.description || "-"}</td>
        </tr>

        <tr>
          <td><b>Renewer</b></td>
          <td>${renewal.renewer_name || "-"}</td>
        </tr>

        <tr>
          <td><b>Department</b></td>
          <td>${renewal.department || "-"}</td>
        </tr>

        <tr>
          <td><b>Start Date</b></td>
          <td>${formatDate(renewal.start_date)}</td>
        </tr>

        <tr>
          <td><b>Website Link</b></td>
          <td>
            ${
              renewal.link
                ? `<a href="${renewal.link}" target="_blank">${renewal.link}</a>`
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

