const sendMail = require("../../sendMail");

try {
  const ccList = [
    // "management@briskolive.com",
    "da.automation@briskolive.com",
    renewal.email,
  ]
    .filter(Boolean)
    .join(",");

  console.log("FINAL CC LIST:", ccList);

  const mailInfo = await sendMail({
    // MAIN RECEIVER
    to: "admin@briskolive.com",

    // CC PEOPLE
    cc: ccList,

    subject: `A Renewal Created - ${renewal.item_name}`,

    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;
box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- HEADER -->
<tr>
<td style="background:#1976d2;padding:28px 36px;">

<table width="100%">
<tr>

<td>
<div style="font-size:22px;font-weight:700;color:#ffffff;">
Brisk Olive
</div>

<div style="font-size:13px;color:#bbdefb;margin-top:4px;">
Renewal Management System
</div>
</td>

<td align="right">
<div style="background:#ffffff;color:#1976d2;font-size:12px;
font-weight:700;padding:6px 14px;border-radius:20px;">
✅ NEW RENEWAL
</div>
</td>

</tr>
</table>

</td>
</tr>

<!-- BODY -->
<tr>
<td style="padding:28px 36px;">

<p style="margin:0 0 20px;font-size:15px;color:#374151;">
A new renewal item has been successfully created in the system.
</p>

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#6b7280;font-weight:600;width:40%;">
Item ID
</td>

<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#111827;font-weight:700;">
${renewal.item_id || "-"}
</td>
</tr>

<tr><td colspan="2" style="height:2px;"></td></tr>

<tr>
<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#6b7280;font-weight:600;">
Category
</td>

<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#111827;">
${renewal.category || "-"}
</td>
</tr>

<tr><td colspan="2" style="height:2px;"></td></tr>

<tr>
<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#6b7280;font-weight:600;">
Subcategory
</td>

<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#111827;">
${renewal.subcategory || "-"}
</td>
</tr>

<tr><td colspan="2" style="height:2px;"></td></tr>

<tr>
<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#6b7280;font-weight:600;">
Item Name
</td>

<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#111827;font-weight:600;">
${renewal.item_name || "-"}
</td>
</tr>

<tr><td colspan="2" style="height:2px;"></td></tr>

<tr>
<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#6b7280;font-weight:600;">
Renewer
</td>

<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#111827;">
${renewal.renewer_name || "-"}
</td>
</tr>

<tr><td colspan="2" style="height:2px;"></td></tr>

<tr>
<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#6b7280;font-weight:600;">
Department
</td>

<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#111827;">
${renewal.department || "-"}
</td>
</tr>

<tr><td colspan="2" style="height:2px;"></td></tr>

<tr>
<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#6b7280;font-weight:600;">
Start Date
</td>

<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#111827;">
${
  renewal.start_date
    ? new Date(renewal.start_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-"
}
</td>
</tr>

<tr><td colspan="2" style="height:2px;"></td></tr>

<tr>
<td style="padding:10px 14px;background:#f8faff;
font-size:13px;color:#6b7280;font-weight:600;">
Website Link
</td>

<td style="padding:10px 14px;background:#f8faff;
font-size:13px;">
${
  renewal.link
    ? `
      <a href="${renewal.link}" target="_blank"
      style="color:#1976d2;text-decoration:none;font-weight:600;">
      🔗 Visit Link
      </a>
    `
    : "-"
}
</td>
</tr>

</table>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="background:#f8faff;padding:20px 36px;
border-top:1px solid #e5e7eb;">

<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.8;">

This is an automated notification from the
Brisk Olive Renewal Management System.

<br/><br/>

<b style="color:#6b7280;">Thanks & Regards</b><br/>

<span style="color:#1976d2;font-weight:700;">
Brisk Olive Admin Team
</span>

</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  });

  console.log("MAIL INFO:", mailInfo);

} catch (err) {
  console.error("RENEWAL MAIL ERROR:", err);
}