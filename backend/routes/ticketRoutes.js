const express = require("express");
const router = express.Router();

const Ticket = require("../models/Ticket");

const sendTicketCreatedMail = require("../utils/mailer/services/sendTicketCreatedMail");
const sendTicketStatusUpdateMail = require("../utils/mailer/services/sendTicketStatusUpdateMail");

// Ticket management is restricted to this one address specifically — not
// whoever HR-Forms happens to report as 'Admin' for the day. Deliberately
// separate from the generic role-based adminOnly in middleware/auth.js.
const TICKET_ADMIN_EMAIL = "admin@briskolive.com";
const isTicketAdmin = (req) => req.user.email === TICKET_ADMIN_EMAIL;

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
