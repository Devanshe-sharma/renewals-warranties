const sendMail = require("../../sendMail");
const MAIL = require("../constants/mailRecipients");
const { describeLag, EVENT_GRACE_DAYS } = require("../../travel/travelRules");

// Same rule as the ticket mails: the account these mails send from is never
// a recipient.
const EXCLUDE_EMAIL = "software.developer@briskolive.com";

const APP_URL = () => (process.env.TRAVEL_APP_URL || "http://3.110.162.1:3004").replace(/\/$/, "");

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const fmtDate = (d) => {
  if (!d) return "-";
  // Plain YYYY-MM-DD strings from the form are calendar dates, not instants.
  const x = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00+05:30`) : new Date(d);
  return x.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
};

const money = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

const clean = (list) =>
  [...new Set(list.filter(Boolean).map((e) => e.toLowerCase()))].filter((e) => e !== EXCLUDE_EMAIL);

function row(label, value, highlight) {
  return `<tr><td style="background:#f5f7fa;width:220px"><b>${esc(label)}</b></td><td${highlight ? ' style="color:#b91c1c;font-weight:bold"' : ""}>${value}</td></tr>`;
}

// The core details table every travel mail shares, including the event → request
// time difference the Manager needs to judge how late the request was raised.
function detailsTable(t) {
  const lagLate = t.eventLagDays != null && t.eventLagDays > EVENT_GRACE_DAYS;
  return `
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;margin-top:12px;font-size:14px">
    ${row("Travel ID", esc(t.travel_id))}
    ${row("Employee", `${esc(t.employee)}${t.empid ? ` (${esc(t.empid)})` : ""}`)}
    ${row("Department / Category", `${esc(t.dept)} / ${esc(t.category || "-")}`)}
    ${row("Purpose", esc(t.purpose))}
    ${row("Route", `${esc(t.from)} → ${esc(t.to)}`)}
    ${row("Departure", `${fmtDate(t.outDate)} · ${esc(t.outTime || "Any time")} · ${esc(t.outMode)}`)}
    ${row("Return", t.returnRequired === "Yes" ? `${fmtDate(t.returnDate)} · ${esc(t.returnTime || "Any time")} · ${esc(t.returnMode)}` : "Not required")}
    ${row("Hotel", t.hotel === "Yes" ? `${esc(t.hotelAddress || "-")} · ${fmtDate(t.checkin)} – ${fmtDate(t.checkout)}` : "Not required")}
    ${row("Journey / Booking Type", `${esc(t.journeyType)}${t.unplannedApproved ? ` (approved: ${esc(t.unplannedApproved)})` : ""} · ${esc(t.bookingType)}`)}
    ${row("Estimated Budget", money(t.estimate))}
    ${row("Related Event", t.eventName ? `${esc(t.eventName)}${t.eventDate ? ` (event date ${fmtDate(t.eventDate)})` : ""}` : "Not linked to an event")}
    ${t.eventName ? row("Event Created On", fmtDateTime(t.eventCreatedAt)) : ""}
    ${row("Travel Request Raised On", fmtDateTime(t.createdAt))}
    ${t.eventName ? row("Time Between Event & Request", `${describeLag(t.eventLagDays)}${lagLate ? " — raised late" : ""}`, lagLate) : ""}
    ${t.eventName ? row("Employee Late Score", String(t.employeeScore || 0), t.employeeScore < 0) : ""}
  </table>`;
}

function layout(intro, t, { button, footer } = {}) {
  return `
  <html><body style="font-family:Arial,sans-serif;color:#222;line-height:1.6">
    <p>${intro}</p>
    ${detailsTable(t)}
    ${footer || ""}
    ${button ? `<p style="margin-top:18px"><a href="${button.href}" style="background:#1976d2;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(button.label)}</a></p>` : ""}
    <p style="margin-top:20px;color:#666;font-size:12px">This is an automated notification from the Brisk Olive Travel Management system.</p>
    <p>Thanks &amp; Regards<br/><b>Brisk Olive Admin Team</b></p>
  </body></html>`;
}

// One subject per request so every mail about it threads together.
const subject = (t, tag) => `Travel Request ${t.travel_id}: ${t.employee} – ${t.from} → ${t.to}${tag ? ` [${tag}]` : ""}`;

const approvalsLink = () => `${APP_URL()}/travel?tab=approvals`;
const adminLink = () => `${APP_URL()}/travel?tab=admin`;
const myLink = () => `${APP_URL()}/travel?tab=mine`;

// 1. New request → Manager (employee CC'd).
async function sendSubmittedToManager(t) {
  const to = clean([t.managerEmail]);
  if (!to.length) {
    // No manager mailbox on record: route to Admin so it isn't silently stuck.
    return sendMail({
      to: clean(MAIL.ADMIN).join(","),
      cc: clean([t.employeeEmail]),
      subject: subject(t, "Manager email missing"),
      html: layout(
        `A travel request was submitted but no email address was found for the approving manager <b>${esc(t.manager)}</b>. Please forward it to them for approval.`,
        t
      ),
    });
  }
  return sendMail({
    to: to.join(","),
    cc: clean([t.employeeEmail]),
    subject: subject(t),
    html: layout(`Dear ${esc(t.manager)},<br/><br/><b>${esc(t.employee)}</b> has raised a travel request that needs your approval.`, t, {
      button: { href: approvalsLink(), label: "Review & Approve" },
    }),
  });
}

// 2a. Manager approved → Admin (employee + manager CC'd).
async function sendApprovedToAdmin(t) {
  return sendMail({
    to: clean(MAIL.ADMIN).join(","),
    cc: clean([t.employeeEmail, t.managerEmail]),
    subject: subject(t, "Approved"),
    html: layout(
      `The travel request below was <b>approved by ${esc(t.managerActionBy || t.manager)}</b>. Please arrange the tickets by <b>${fmtDateTime(t.adminDueAt)}</b> (2-day booking window).`,
      t,
      {
        footer: t.managerRemarks ? `<p><b>Manager remarks:</b> ${esc(t.managerRemarks)}</p>` : "",
        button: { href: adminLink(), label: "Open Admin Queue" },
      }
    ),
  });
}

// 2b. Manager rejected → Employee.
async function sendRejectedToEmployee(t) {
  return sendMail({
    to: clean([t.employeeEmail]).join(",") || clean(MAIL.ADMIN).join(","),
    cc: clean([t.managerEmail]),
    subject: subject(t, "Rejected"),
    html: layout(`Your travel request was <b>rejected by ${esc(t.managerActionBy || t.manager)}</b>.`, t, {
      footer: `<p><b>Remarks:</b> ${esc(t.managerRemarks || "-")}</p>`,
      button: { href: myLink(), label: "View My Requests" },
    }),
  });
}

// 3. Admin booked / cancelled → Employee (manager CC'd).
async function sendAdminOutcome(t) {
  const booked = t.status === "Booked";
  return sendMail({
    to: clean([t.employeeEmail]).join(",") || clean([t.managerEmail]).join(","),
    cc: clean([t.managerEmail, ...MAIL.ADMIN]),
    subject: subject(t, booked ? "Booked" : "Cancelled"),
    html: layout(
      booked ? `Your travel has been <b>booked</b> by ${esc(t.adminActionBy || "Admin")}.` : `Your travel request was <b>cancelled</b> by ${esc(t.adminActionBy || "Admin")}.`,
      t,
      {
        footer: `${t.bookingDetails ? `<p><b>Booking details:</b><br/>${esc(t.bookingDetails).replace(/\n/g, "<br/>")}</p>` : ""}${t.adminRemarks ? `<p><b>Admin remarks:</b> ${esc(t.adminRemarks)}</p>` : ""}${
          t.adminDelayDays > 0 ? `<p style="color:#b91c1c"><b>Booked ${t.adminDelayDays} day(s) after the 2-day window — Admin score ${t.adminScore}.</b></p>` : ""
        }`,
        button: { href: myLink(), label: "View My Requests" },
      }
    ),
  });
}

// 4. Reminders and escalations (from the hourly cron).
async function sendManagerReminder(t) {
  if (!t.managerEmail) return;
  return sendMail({
    to: clean([t.managerEmail]).join(","),
    cc: clean([t.employeeEmail]),
    subject: subject(t, "Reminder: approval pending"),
    html: layout(`Reminder: this travel request has been waiting for your approval since ${fmtDateTime(t.createdAt)}.`, t, {
      button: { href: approvalsLink(), label: "Review & Approve" },
    }),
  });
}

async function sendManagerEscalation(t) {
  return sendMail({
    to: clean(MAIL.MANAGEMENT).join(","),
    cc: clean([t.managerEmail, t.employeeEmail]),
    subject: subject(t, "Escalation: manager approval overdue"),
    html: layout(
      `<b>Escalation:</b> this travel request has not been approved or rejected by <b>${esc(t.manager)}</b> for over 48 hours (raised ${fmtDateTime(t.createdAt)}).`,
      t,
      { button: { href: approvalsLink(), label: "Open Approvals" } }
    ),
  });
}

async function sendAdminReminder(t) {
  return sendMail({
    to: clean(MAIL.ADMIN).join(","),
    cc: [],
    subject: subject(t, "Reminder: booking pending"),
    html: layout(`Reminder: this approved travel request still needs tickets. Booking is due by <b>${fmtDateTime(t.adminDueAt)}</b>.`, t, {
      button: { href: adminLink(), label: "Open Admin Queue" },
    }),
  });
}

async function sendAdminEscalation(t) {
  return sendMail({
    to: clean(MAIL.MANAGEMENT).join(","),
    cc: clean([...MAIL.ADMIN, t.managerEmail, t.employeeEmail]),
    subject: subject(t, "Escalation: booking overdue"),
    html: layout(
      `<b>Escalation:</b> Admin has not booked this approved travel request within the 2-day window (due ${fmtDateTime(t.adminDueAt)}). Admin scoring of -1 per day late applies until it is booked.`,
      t,
      { button: { href: adminLink(), label: "Open Admin Queue" } }
    ),
  });
}

module.exports = {
  sendSubmittedToManager,
  sendApprovedToAdmin,
  sendRejectedToEmployee,
  sendAdminOutcome,
  sendManagerReminder,
  sendManagerEscalation,
  sendAdminReminder,
  sendAdminEscalation,
};
