module.exports = (renewal) => {
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; margin: 0; padding: 0;">

      <!-- Header -->
      <div style="background: #1F2937; padding: 20px 28px;">
        <h2 style="margin: 0; color: #fff; font-size: 18px;">📦 Renewal Discontinued</h2>
        <p style="margin: 4px 0 0; color: #9CA3AF; font-size: 13px;">A renewal item has been marked as discontinued and moved to archive.</p>
      </div>

      <!-- Item Details -->
      <div style="padding: 24px 28px;">
        <h3 style="margin: 0 0 14px; font-size: 13px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Item Details</h3>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; border-collapse: collapse;">
          ${[
            ["Item ID",      renewal.item_id       || "—"],
            ["Item Name",    renewal.item_name      || "—"],
            ["Category",     renewal.category       || "—"],
            ["Subcategory",  renewal.subcategory    || "—"],
            ["Frequency",    renewal.frequency      || "—"],
            ["Start Date",   fmtDate(renewal.start_date)],
            ["End Date",     fmtDate(renewal.end_date)],
          ].map(([label, value], i) => `
            <tr style="background: ${i % 2 === 0 ? "#F9FAFB" : "#fff"};">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #374151; width: 180px; border: 1px solid #E5E7EB;">${label}</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #111; border: 1px solid #E5E7EB;">${value}</td>
            </tr>
          `).join("")}
        </table>

        <!-- Reason -->
        <div style="margin-top: 20px; background: #F3F4F6; border-left: 4px solid #6B7280; border-radius: 6px; padding: 14px 18px;">
          <p style="margin: 0; font-size: 13px; font-weight: 700; color: #374151;">Reason for Discontinuation</p>
          <p style="margin: 6px 0 0; font-size: 13px; color: #4B5563;">${renewal.discontinue_reason || "No reason provided"}</p>
        </div>

        <!-- Responsible -->
        <h3 style="margin: 24px 0 14px; font-size: 13px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Responsible Person</h3>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; border-collapse: collapse;">
          ${[
            ["Renewer",    renewal.renewer_name       || "—"],
            ["Department", renewal.renewer_department || "—"],
            ["Email",      renewal.renewer_email      || "—"],
          ].map(([label, value], i) => `
            <tr style="background: ${i % 2 === 0 ? "#F9FAFB" : "#fff"};">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #374151; width: 180px; border: 1px solid #E5E7EB;">${label}</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #111; border: 1px solid #E5E7EB;">${value}</td>
            </tr>
          `).join("")}
        </table>

        <div style="margin-top: 24px; background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 14px 18px;">
          <p style="margin: 0; font-size: 13px; color: #92400E;">
            📦 This item has been <b>archived</b> and will no longer trigger renewal reminders.
            If this was done in error, please contact the admin team.
          </p>
        </div>

        <p style="margin-top: 28px; font-size: 13px; color: #6B7280;">
          This is an automated notification from the Brisk Olive Renewals & Warranties Management System.
        </p>
        <p style="font-size: 13px; color: #374151;">
          Regards,<br/><b>Brisk Olive Admin Team</b>
        </p>
      </div>

    </body>
  </html>
  `;
};