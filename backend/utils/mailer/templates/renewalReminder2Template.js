module.exports = (renewal) => {

const updateLink =
`http://3.110.162.1:3004/renewals?update=${renewal.item_id}`;


return `

<html>
<body style="font-family:Arial;background:#f5f7fb;padding:30px">


<h2 style="color:#f59e0b">
⚠️ Renewal Reminder - 2nd Notice
</h2>


<p>
This renewal is approaching its expiry date.
Kindly review and update the renewal details.
</p>


<table border="1" cellpadding="10" cellspacing="0">

<tr>
<td><b>Item</b></td>
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
<td><b>Expiry Date</b></td>
<td>
${
renewal.end_date
? new Date(renewal.end_date).toLocaleDateString("en-IN")
:"-"
}
</td>
</tr>

</table>


<br>


<a href="${updateLink}"
style="
background:#2563eb;
color:white;
padding:12px 18px;
border-radius:6px;
text-decoration:none;
">

Update Renewal

</a>


<br><br>

Regards,<br>
Brisk Olive Admin Team


</body>
</html>

`;

};