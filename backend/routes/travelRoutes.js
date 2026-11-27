const express = require("express");
const router = express.Router();

const TravelRequest = require("../models/TravelRequest");
const rules = require("../utils/travel/travelRules");
const mails = require("../utils/mailer/services/travelMails");

// ─────────────────────────────────────────────────────────────────────────────
// Who counts as "Admin" for travel: same people who handle tickets.
// ─────────────────────────────────────────────────────────────────────────────
const TRAVEL_ADMIN_EMAILS = ["admin@briskolive.com", "software.developer@briskolive.com"];
const FULL_ACCESS_ROLES = ["admin", "management"];

const myEmail = (req) => String(req.user?.email || "").toLowerCase();
const isTravelAdmin = (req) => TRAVEL_ADMIN_EMAILS.includes(myEmail(req)) || FULL_ACCESS_ROLES.includes(req.user?.role);

const fail = (res, code, message) => res.status(code).json({ success: false, message });

// Emails never block or fail a request — a mail outage shouldn't lose a
// travel request. sendMail already logs failures.
const notify = (fn, t) => Promise.resolve(fn(t)).catch((err) => console.error("travel mail:", err.message));

// ─────────────────────────────────────────────────────────────────────────────
// HR-Forms lookups (cached 5 min)
// ─────────────────────────────────────────────────────────────────────────────
function cached(loader) {
  let cache = { data: null, at: 0 };
  return async () => {
    if (cache.data && Date.now() - cache.at < 5 * 60 * 1000) return cache.data;
    const data = await loader();
    cache = { data, at: Date.now() };
    return data;
  };
}

// Current employees from HR-Forms's external employees API — only the
// fields the travel form needs; personal email, mobile etc. stay in HR-Forms.
const getTravelEmployees = cached(async () => {
  const res = await fetch(process.env.HR_EMPLOYEES_URL, {
    headers: { "x-api-key": process.env.HR_EMPLOYEES_API_KEY },
  });
  if (!res.ok) throw new Error(`HR-Forms responded with ${res.status}`);
  const { data: records = [] } = await res.json();
  return records
    .filter((r) => r.is_current)
    .map((r) => ({
      name: String(r.full_name || "").trim(),
      email: String(r.official_email || r.email || "").trim().toLowerCase(),
      empId: String(r.employee_id || "").trim(),
      dept: r.department || "",
      designation: r.designation || "",
      reportingHead: String(r.reporting_head || "").trim(),
      location: r.location || "",
    }))
    .filter((e) => e.name && e.empId)
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Upcoming / active events from HR-Forms's Outing form. "Event created on"
// is when the outing was proposed — the lateness score is measured from it.
const OUTINGS_URL = () => process.env.HR_OUTINGS_URL || "https://hr.briskolive.com/api/outing";
const getTravelEvents = cached(async () => {
  const url = `${OUTINGS_URL()}?status=Proposed,Suggested,Scheduled&limit=200`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HR-Forms responded with ${res.status}`);
  const { data = [] } = await res.json();
  return data.map((o) => ({
    id: String(o._id),
    name: o.topic || "",
    date: o.tentativeDate || null,
    place: o.tentativePlace || "",
    status: o.status || "",
    createdAt: o.proposedAt || o.createdAt || null,
  }));
});

router.get("/employees", async (req, res) => {
  try {
    res.json({ success: true, data: await getTravelEmployees() });
  } catch (err) {
    console.error("travel employees:", err.message);
    fail(res, 502, "Could not load employee list from HR-Forms");
  }
});

router.get("/events", async (req, res) => {
  try {
    res.json({ success: true, data: await getTravelEvents() });
  } catch (err) {
    console.error("travel events:", err.message);
    fail(res, 502, "Could not load events from HR-Forms");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Requests
// ─────────────────────────────────────────────────────────────────────────────
const TABS = {
  mine: (req) => ({ $or: [{ employeeEmail: myEmail(req) }, { createdBy: myEmail(req) }] }),
  approvals: (req) => (isTravelAdmin(req) ? { status: "Pending Manager Approval" } : { managerEmail: myEmail(req) }),
  admin: () => ({ status: { $in: ["Pending Admin Booking", "Booked", "Cancelled by Admin"] } }),
  all: () => ({}),
};
const ADMIN_ONLY_TABS = ["admin", "all"];

router.get("/requests", async (req, res) => {
  const tab = TABS[req.query.tab] ? req.query.tab : "mine";
  if (ADMIN_ONLY_TABS.includes(tab) && !isTravelAdmin(req)) return fail(res, 403, "Admin only");
  try {
    const data = await TravelRequest.find(TABS[tab](req)).sort({ createdAt: -1 }).lean();
    // Live admin delay for requests still waiting to be booked.
    const now = new Date();
    for (const t of data) {
      if (t.status === "Pending Admin Booking") Object.assign(t, rules.adminDelay(t.adminDueAt, now));
    }
    res.json({ success: true, data, isAdmin: isTravelAdmin(req), me: myEmail(req) });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

async function nextTravelId() {
  const ids = await TravelRequest.find({}, { travel_id: 1 }).lean();
  const max = Math.max(0, ...ids.map((t) => +((t.travel_id || "").match(/(\d+)$/) || [])[1] || 0));
  return "BO-TR-" + String(max + 1).padStart(3, "0");
}

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
const FORM_FIELDS = [
  "employee", "employeeEmail", "empid", "designation", "category", "dept", "purpose",
  "manager", "managerEmail",
  "journeyType", "unplannedApproved", "bookingType",
  "from", "to", "outDate", "outTime", "outMode",
  "returnRequired", "returnFrom", "returnTo", "returnDate", "returnTime", "returnMode", "railEntitlement",
  "hotel", "hotelAddress", "checkin", "checkout", "nights", "room",
  "estimate", "remarks", "eventId",
];

router.post("/requests", async (req, res) => {
  const b = pick(req.body || {}, FORM_FIELDS);
  const missing = [
    ["employee", "Employee Name"], ["manager", "Approving Manager"], ["purpose", "Business Purpose"],
    ["from", "Origin"], ["to", "Destination"], ["outDate", "Departure Date"],
  ].filter(([k]) => !String(b[k] || "").trim()).map(([, l]) => l);
  if (missing.length) return fail(res, 400, `Please fill in: ${missing.join(", ")}`);

  b.bookingType = b.bookingType === "Tatkal" ? "Tatkal" : "Normal";
  const departure = rules.departureAt(b.outDate, b.outTime);
  const noticeErr = rules.noticeError(departure, b.bookingType);
  if (noticeErr) return fail(res, 400, noticeErr);

  if (b.returnRequired === "Yes" && b.returnDate && b.returnDate < b.outDate) {
    return fail(res, 400, "Return date cannot be earlier than the onward date.");
  }

  try {
    // Fill in emails from HR-Forms when the form didn't send them, so the
    // approval mail reaches the manager.
    const employees = await getTravelEmployees().catch(() => []);
    const byName = (n) => employees.find((e) => e.name.toLowerCase() === String(n || "").trim().toLowerCase());
    if (!b.employeeEmail) b.employeeEmail = byName(b.employee)?.email || "";
    if (!b.managerEmail) b.managerEmail = byName(b.manager)?.email || "";

    // Event details come from HR-Forms, not the client, so the late score
    // can't be gamed by sending a different "created" date.
    let event = null;
    if (b.eventId) {
      const events = await getTravelEvents().catch(() => []);
      event = events.find((e) => e.id === b.eventId);
      if (!event) return fail(res, 400, "The selected event was not found in HR-Forms. Please pick it again.");
    }

    const now = new Date();
    const doc = await TravelRequest.create({
      ...b,
      travel_id: await nextTravelId(),
      nights: +b.nights || 0,
      estimate: +b.estimate || 0,
      departureAt: departure,
      eventId: event?.id || "",
      eventName: event?.name || "",
      eventDate: event?.date || null,
      eventCreatedAt: event?.createdAt || null,
      ...rules.employeeLateScore(event?.createdAt, now),
      status: "Pending Manager Approval",
      createdBy: myEmail(req),
      activity: [{ by_name: req.user.name, by_email: myEmail(req), action: "created", message: "Travel request submitted" }],
    });

    notify(mails.sendSubmittedToManager, doc.toObject());
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

// Manager (or Admin/Management stepping in after an escalation) approves or rejects.
router.post("/requests/:id/manager-decision", async (req, res) => {
  const { decision, remarks = "" } = req.body || {};
  if (!["approve", "reject"].includes(decision)) return fail(res, 400, "Decision must be approve or reject");
  if (decision === "reject" && !remarks.trim()) return fail(res, 400, "Please give a reason for rejecting");

  try {
    const t = await TravelRequest.findById(req.params.id);
    if (!t) return fail(res, 404, "Travel request not found");
    if (t.status !== "Pending Manager Approval") return fail(res, 409, `This request is already "${t.status}"`);
    const isManager = t.managerEmail && t.managerEmail === myEmail(req);
    if (!isManager && !isTravelAdmin(req)) return fail(res, 403, "Only the approving manager can decide on this request");

    const now = new Date();
    t.managerActionAt = now;
    t.managerActionBy = req.user.name;
    t.managerRemarks = remarks.trim();
    if (decision === "approve") {
      t.status = "Pending Admin Booking";
      t.adminDueAt = new Date(now.getTime() + rules.ADMIN_BOOKING_WINDOW_HOURS * rules.HOUR);
    } else {
      t.status = "Rejected by Manager";
    }
    t.activity.push({
      by_name: req.user.name,
      by_email: myEmail(req),
      action: decision === "approve" ? "approved" : "rejected",
      message: remarks.trim(),
    });
    await t.save();

    notify(decision === "approve" ? mails.sendApprovedToAdmin : mails.sendRejectedToEmployee, t.toObject());
    res.json({ success: true, data: t });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

// Admin marks tickets booked (with details) or cancels.
router.post("/requests/:id/admin-action", async (req, res) => {
  if (!isTravelAdmin(req)) return fail(res, 403, "Only Admin can book travel");
  const { action, bookingDetails = "", remarks = "" } = req.body || {};
  if (!["booked", "cancelled"].includes(action)) return fail(res, 400, "Action must be booked or cancelled");
  if (action === "booked" && !bookingDetails.trim()) return fail(res, 400, "Enter the booking details (PNR / ticket / hotel confirmation)");
  if (action === "cancelled" && !remarks.trim()) return fail(res, 400, "Please give a reason for cancelling");

  try {
    const t = await TravelRequest.findById(req.params.id);
    if (!t) return fail(res, 404, "Travel request not found");
    if (t.status !== "Pending Admin Booking") return fail(res, 409, `This request is "${t.status}", not waiting for booking`);

    const now = new Date();
    t.status = action === "booked" ? "Booked" : "Cancelled by Admin";
    t.adminActionAt = now;
    t.adminActionBy = req.user.name;
    t.adminActionByEmail = myEmail(req);
    t.bookingDetails = bookingDetails.trim();
    t.adminRemarks = remarks.trim();
    // The 2-day clock counts whichever way the admin closes it out.
    Object.assign(t, rules.adminDelay(t.adminDueAt, now));
    t.activity.push({ by_name: req.user.name, by_email: myEmail(req), action, message: (bookingDetails || remarks).trim() });
    await t.save();

    notify(mails.sendAdminOutcome, t.toObject());
    res.json({ success: true, data: t });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

// Score totals: employees (late requests) and admins (late bookings).
// Admin/Management see everyone; others see only their own line.
router.get("/scores", async (req, res) => {
  try {
    const all = await TravelRequest.find({}).lean();
    const now = new Date();
    const employees = {};
    const admins = {};
    for (const t of all) {
      const ek = t.employeeEmail || t.employee;
      employees[ek] = employees[ek] || { name: t.employee, email: t.employeeEmail, requests: 0, lateRequests: 0, score: 0 };
      employees[ek].requests += 1;
      if (t.employeeScore < 0) employees[ek].lateRequests += 1;
      employees[ek].score += t.employeeScore || 0;

      // Pending bookings past due count against the Admin mailbox until someone books them.
      const delay = t.status === "Pending Admin Booking" ? rules.adminDelay(t.adminDueAt, now) : t;
      if (t.adminDueAt && (t.adminActionAt || t.status === "Pending Admin Booking")) {
        const ak = t.adminActionByEmail || "admin@briskolive.com";
        admins[ak] = admins[ak] || { name: t.adminActionBy || "Admin", email: ak, handled: 0, late: 0, score: 0 };
        admins[ak].handled += 1;
        if (delay.adminScore < 0) admins[ak].late += 1;
        admins[ak].score += delay.adminScore || 0;
      }
    }
    const byScore = (o) => Object.values(o).sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
    let emp = byScore(employees);
    let adm = byScore(admins);
    if (!isTravelAdmin(req)) {
      emp = emp.filter((e) => e.email === myEmail(req));
      adm = adm.filter((a) => a.email === myEmail(req));
    }
    res.json({ success: true, data: { employees: emp, admins: adm } });
  } catch (err) {
    fail(res, 500, err.message);
  }
});

module.exports = router;
