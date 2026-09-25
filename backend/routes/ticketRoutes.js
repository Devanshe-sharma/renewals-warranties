const express = require("express");
const router = express.Router();

const Ticket = require("../models/Ticket");

const sendTicketCreatedMail = require("../utils/mailer/services/sendTicketCreatedMail");
const sendTicketStatusUpdateMail = require("../utils/mailer/services/sendTicketStatusUpdateMail");

// Full ticket access (see every ticket, close/delete any ticket) — not just
// whoever HR-Forms happens to report as 'Admin' for the day:
//  - the fixed ticket-handling mailbox
//  - the portal admin (dev owner of this app)
//  - anyone HR-Forms reports as Admin or Management
// Everyone else only ever sees their own raised tickets.
const TICKET_ADMIN_EMAIL = "admin@briskolive.com";
const PORTAL_ADMIN_EMAIL = "software.developer@briskolive.com";
const FULL_ACCESS_ROLES = ["admin", "management"];

const isTicketAdmin = (req) =>
  req.user.email === TICKET_ADMIN_EMAIL ||
  req.user.email === PORTAL_ADMIN_EMAIL ||
  FULL_ACCESS_ROLES.includes(req.user.role);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accepts either an array or a comma-separated string from the form,
// trims, drops anything that isn't a valid-looking address, and dedupes.
function normalizeCc(cc) {
  const list = Array.isArray(cc) ? cc : String(cc || "").split(",");
  return [...new Set(list.map((e) => e.trim()).filter((e) => EMAIL_RE.test(e)))];
}

const ticketAdminOnly = (req, res, next) => {
  if (!isTicketAdmin(req)) {
    return res.status(403).json({
      success: false,
      message: "Only the ticket admin can perform this action",
    });
  }
  next();
};

// ── Employee picker for "Keep in CC" ────────────────────────────────────
// Proxies HR-Forms's onboarding records so the raise-ticket form can offer
// a dropdown instead of free-typed addresses. Deliberately strips
// everything except name/email/designation/dept — the onboarding record
// also carries PAN, bank details, Aadhaar, etc. that this app has no
// business holding onto or exposing to the frontend. Cached briefly since
// it's ~140 full records fetched on every raise-ticket form open otherwise.
let employeeCache = { data: null, fetchedAt: 0 };
const EMPLOYEE_CACHE_TTL_MS = 5 * 60 * 1000;

router.get("/employees", async (req, res) => {
  try {
    const now = Date.now();
    if (employeeCache.data && now - employeeCache.fetchedAt < EMPLOYEE_CACHE_TTL_MS) {
      return res.json({ success: true, data: employeeCache.data });
    }

    const hrRes = await fetch(process.env.HR_ONBOARDING_URL);
    if (!hrRes.ok) {
      throw new Error(`HR-Forms responded with ${hrRes.status}`);
    }
    const { data: records = [] } = await hrRes.json();

    const seen = new Set();
    const employees = records
      .filter((r) => r.joiningStatus === "Joined")
      .map((r) => ({
        name: (r.name || "").trim(),
        email: String(r.officialEmail || "").trim().toLowerCase(),
        designation: r.designation || "",
        dept: r.dept || "",
      }))
      .filter((e) => e.name && EMAIL_RE.test(e.email))
      .filter((e) => (seen.has(e.email) ? false : (seen.add(e.email), true)))
      .sort((a, b) => a.name.localeCompare(b.name));

    employeeCache = { data: employees, fetchedAt: now };

    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(502).json({
      success: false,
      message: "Could not load employee list from HR-Forms",
    });
  }
});

//
// GET ALL (own tickets for a user, all tickets for admin)
//
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (!isTicketAdmin(req) || req.query.mine === "true") {
      filter.raised_by_id = req.user.id;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// GET ONE
//
router.get("/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!isTicketAdmin(req) && ticket.raised_by_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this ticket",
      });
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// CREATE TICKET
//
router.post("/", async (req, res) => {
  try {
    const { title, description, priority, attachment_link, attachment_file_url, plan_date, cc } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const ticket = await Ticket.create({
      title: title.trim(),
      description: description.trim(),
      priority,
      attachment_link: attachment_link || "",
      attachment_file_url: attachment_file_url || "",
      plan_date: plan_date || null,
      cc: normalizeCc(cc),
      raised_by_id: req.user.id,
      raised_by_name: req.user.name,
      raised_by_role: req.user.role,
      activity: [
        {
          author_id: req.user.id,
          author_name: req.user.name,
          action: "created",
          message: "Ticket raised",
        },
      ],
    });

    const mailTicket = ticket.attachment_file_url
      ? {
          ...ticket.toObject(),
          attachment_file_url: `${req.protocol}://${req.get("host")}${ticket.attachment_file_url}`,
        }
      : ticket;

    sendTicketCreatedMail(mailTicket).catch((err) =>
      console.error("Ticket created mail failed:", err)
    );

    res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// MANAGE TICKET (status / priority / done date) — admin only.
// plan_date is intentionally NOT editable here — it's set once by the
// raiser at creation and locked afterward.
//
router.put("/:id/manage", ticketAdminOnly, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const { status, priority, done_date, remarks } = req.body;

    const changes = [];

    if (status && status !== ticket.status) {
      changes.push(`Status changed from "${ticket.status}" to "${status}"`);
      ticket.status = status;
      ticket.done_date = ["Resolved", "Closed"].includes(status) ? (ticket.done_date || new Date()) : null;
    }

    if (priority && priority !== ticket.priority) {
      changes.push(`Priority changed from "${ticket.priority}" to "${priority}"`);
      ticket.priority = priority;
    }

    if (done_date !== undefined) {
      ticket.done_date = done_date || null;
    }

    if (remarks !== undefined && remarks !== ticket.remarks) {
      ticket.remarks = remarks;
      if (remarks) changes.push(`Remarks: "${remarks}"`);
    }

    if (changes.length) {
      ticket.activity.push({
        author_id: req.user.id,
        author_name: req.user.name,
        action: "status_change",
        message: changes.join("; "),
      });
    }

    await ticket.save();

    if (status && changes.length) {
      sendTicketStatusUpdateMail(ticket).catch((err) =>
        console.error("Ticket status update mail failed:", err)
      );
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// ADD COMMENT
//
router.post("/:id/comments", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (!isTicketAdmin(req) && ticket.raised_by_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this ticket",
      });
    }

    if (!req.body.message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment message is required",
      });
    }

    ticket.activity.push({
      author_id: req.user.id,
      author_name: req.user.name,
      action: "comment",
      message: req.body.message.trim(),
    });

    await ticket.save();

    res.json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

//
// DELETE TICKET — admin only
//
router.delete("/:id", ticketAdminOnly, async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
