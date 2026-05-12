await sendMail({

  // MAIN RECEIVER
  to: "admin@briskolive.com",

  // CC PEOPLE
  cc: [
    "management@briskolive.com",
    renewal.email, // user email
  ]
    .filter(Boolean)
    .join(","),

  subject: `Renewal Created - ${renewal.item_name}`,

  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">

      <h2 style="color:#1976d2;">
        ✅ Renewal Created Successfully
      </h2>

      <p>
        A new renewal item has been created in the system.
      </p>

      <hr/>

      <h3>📋 Item Details</h3>

      <table cellpadding="6">

        <tr>
          <td><b>Item ID:</b></td>
          <td>${renewal.item_id || "-"}</td>
        </tr>

        <tr>
          <td><b>Category:</b></td>
          <td>${renewal.category || "-"}</td>
        </tr>

        <tr>
          <td><b>Subcategory:</b></td>
          <td>${renewal.subcategory || "-"}</td>
        </tr>

        <tr>
          <td><b>Item Name:</b></td>
          <td>${renewal.item_name || "-"}</td>
        </tr>

        <tr>
          <td><b>Description:</b></td>
          <td>${renewal.description || "-"}</td>
        </tr>

        <tr>
          <td><b>Renewer:</b></td>
          <td>${renewal.renewer_name || "-"}</td>
        </tr>

        <tr>
          <td><b>User Department:</b></td>
          <td>${renewal.user_department || "-"}</td>
        </tr>

        <tr>
          <td><b>Renewer Contact Email:</b></td>
          <td>${renewal.renewer_email || "-"}</td>
        </tr>

        <tr>
          <td><b>Start Date:</b></td>
          <td>
            ${
              renewal.start_date
                ? new Date(renewal.start_date).toLocaleDateString("en-IN")
                : "-"
            }
          </td>
        </tr>

        <tr>
          <td><b>Website Link:</b></td>
          <td>
            ${
              renewal.link
                ? `<a href="${renewal.link}" target="_blank">${renewal.link}</a>`
                : "-"
            }
          </td>
        </tr>

      </table>

      <br/>

      <p>
        Regards,<br/>
        Brisk Olive Admin
      </p>

    </div>
  `,
});