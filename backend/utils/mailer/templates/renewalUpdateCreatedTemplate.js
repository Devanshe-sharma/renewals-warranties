module.exports = (renewal) => {
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    }) : "—";

  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; margin: 0; padding: 0;">

      <!-- Header -->
      <div style="background: #1e40af; padding: 20px 28px;">
        <h2 style="margin: 0; color: #fff; font-size: 18px;">New Renewal Created</h2>
        <p style="margin: 4px 0 0; color: #BFDBFE; font-size: 13px;">
          A new renewal item has been successfully added to the system.
        </p>
      </div>

      <!-- Info Banner -->
      <div style="background: #EFF6FF; border-left: 4px solid #2563EB; padding: 12px 20px;">
        <p style="margin: 0; font-size: 13px; color: #1e40af;">
          Item <b>${renewal.item_name || "—"}</b> has been created.
          Renewal is due on <b>${fmtDate(renewal.end_date)}</b>.
        </p>
      </div>

      <div style="padding: 24px 28px;">

        <!-- Item Details -->
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
          Renewal Item Details
        </h3>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; border-collapse: collapse; margin-bottom: 24px;">
          ${[
            ["Item ID",      renewal.item_id      || "—"],
            ["Item Name",    renewal.item_name    || "—"],
            ["Category",     renewal.category     || "—"],
            ["Subcategory",  renewal.subcategory  || "—"],
            ["Frequency",    renewal.frequency    || "—"],
            ["Description",  renewal.description  || "—"],
          ].map(([label, value], i) => `
            <tr style="background: ${i % 2 === 0 ? "#F9FAFB" : "#fff"};">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #374151; width: 180px; border: 1px solid #E5E7EB;">${label}</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #111; border: 1px solid #E5E7EB;">${value}</td>
            </tr>
          `).join("")}
          <tr style="background: #ECFDF5;">
            <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #065F46; border: 1px solid #A7F3D0;">End / Expiry Date</td>
            <td style="padding: 10px 14px; font-size: 14px; font-weight: 700; color: #059669; border: 1px solid #A7F3D0;">${fmtDate(renewal.end_date)}</td>
          </tr>
        </table>

        <!-- Responsible Person -->
        <h3 style="margin: 0 0 12px; font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">
          Responsible Person
        </h3>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; border-collapse: collapse; margin-bottom: 24px;">
          ${[
            ["Renewer",    renewal.renewer_name       || "—"],
            ["Department", renewal.renewer_department || "—"],
            ["Email",      renewal.renewer_email      || "—"],
            ["User",       renewal.emp_name           || "—"],
            ["User Email", renewal.email              || "—"],
          ].map(([label, value], i) => `
            <tr style="background: ${i % 2 === 0 ? "#F9FAFB" : "#fff"};">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #374151; width: 180px; border: 1px solid #E5E7EB;">${label}</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #111; border: 1px solid #E5E7EB;">${value}</td>
            </tr>
          `).join("")}
        </table>

        ${renewal.link ? `
        <div style="margin-bottom: 20px;">
          <span style="font-size: 13px; font-weight: 600; color: #374151;">Website Link: </span>
          <a href="${renewal.link}" target="_blank" style="font-size: 13px; color: #2563EB;">${renewal.link}</a>
        </div>
        ` : ""}

        <p style="margin-top: 24px; font-size: 13px; color: #6B7280;">
          This is an automated notification from the Brisk Olive Renewals &amp; Warranties Management System.
        </p>
        <p style="font-size: 13px; color: #374151;">
          Regards,<br/>
          <b>Brisk Olive Admin Team</b>
        </p>

      </div>
    </body>
  </html>
  `;
};