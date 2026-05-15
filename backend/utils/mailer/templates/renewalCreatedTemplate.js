module.exports = (renewal) => {

  return `
  
  <html>

    <body style="font-family: Arial;">

      <h2>New Renewal Created</h2>

      <p>
        A new renewal has been created.
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
          <td><b>Subcategory</b></td>
          <td>${renewal.subcategory || "-"}</td>
        </tr>

        <tr>
          <td><b>Renewer</b></td>
          <td>${renewal.renewer_name || "-"}</td>
        </tr>

      </table>

    </body>

  </html>

  `;
};