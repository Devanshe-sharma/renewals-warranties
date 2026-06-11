// renewalReminder3Template.js
module.exports = (renewal) => {
  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const daysDiff = renewal.end_date
    ? Math.ceil((new Date(renewal.end_date) - new Date()) / 86400000)
    : null;

  const urgencyText = daysDiff !== null
    ? daysDiff <= 0
      ? "This renewal has <b style='color:#7F1D1D;'>already expired</b>."
      : `This renewal expires in <b style='color:#7F1D1D;'>${daysDiff} day${daysDiff !== 1 ? "s" : ""}</b>.`
    : "";

  return `
  <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; margin: 0; padding: 0;">

      <!-- Header -->
      <div style="background: #7F1D1D; padding: 20px 28px;">
        <h2 style="margin: 0; color: #fff; font-size: 18px;">🚨 ESCALATION — Final Renewal Reminder</h2>
        <p style="margin: 4px 0 0; color: #FCA5A5; font-size: 13px;">This is a management escalation. Immediate action is required.</p>
      </div>

      <!-- Urgency Banner -->
      <div style="background: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 20px;">
        <p style="margin: 0; font-size: 14px; color: #991B1B;">${urgencyText} Previous reminders have been sent and no renewal has been recorded.</p>
      </div>

      <!-- Item Details -->
      <div style="padding: 24px 28px;">
        <h3 style="margin: 0 0 14px; font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Renewal Item Details</h3>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; border-collapse: collapse;">
          ${[
            ["Item ID",     renewal.item_id    || "—"],
            ["Item Name",   renewal.item_name  || "—"],
            ["Category",    renewal.category   || "—"],
            ["Subcategory", renewal.subcategory || "—"],
            ["Frequency",   renewal.frequency  || "—"],
          ].map(([label, value], i) => `
            <tr style="background: ${i % 2 === 0 ? "#F9FAFB" : "#fff"};">
              <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #374151; width: 180px; border: 1px solid #E5E7EB;">${label}</td>
              <td style="padding: 10px 14px; font-size: 13px; color: #111; border: 1px solid #E5E7EB;">${value}</td>
            </tr>
          `).join("")}
          <tr style="background: #FEF2F2;">
            <td style="padding: 10px 14px; font-size: 13px; font-weight: 600; color: #991B1B; border: 1px solid #FECACA;">End / Expiry Date</td>
            <td style="padding: 10px 14px; font-size: 14px; font-weight: 700; color: #DC2626; border: 1px solid #FECACA;">${fmtDate(renewal.end_date)}</td>
          </tr>
        </table>

        <!-- Responsible Person -->
        <h3 style="margin: 24px 0 14px; font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">Responsible Person</h3>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; border-collapse: collapse;">
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

        <!-- Action Required -->
        <div style="margin-top: 24px; background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px 20px;">
          <p style="margin: 0; font-size: 14px; color: #92400E; font-weight: 700;">⚡ Action Required</p>
          <p style="margin: 6px 0 0; font-size: 13px; color: #78350F; line-height: 1.6;">
            Please ensure the renewal is processed immediately or confirm discontinuation to avoid service disruption.<br/>
            Log into the <b>Brisk Olive RMS</b> and record the renewal event.
          </p>
        </div>

        <p style="margin-top: 28px; font-size: 13px; color: #6B7280;">
          This is an automated escalation from the Brisk Olive Renewals & Warranties Management System.
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