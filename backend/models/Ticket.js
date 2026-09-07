const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    author_id: { type: String, required: true },
    author_name: { type: String, required: true },
    action: {
      type: String,
      enum: ['created', 'comment', 'status_change', 'assigned'],
      required: true,
    },
    message: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

const TicketSchema = new mongoose.Schema(
  {
    ticket_id: { type: String, unique: true, trim: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },

    attachment_link: { type: String, default: '' },
    attachment_file_url: { type: String, default: '' },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },

    raised_by_id: { type: String, required: true },
    raised_by_name: { type: String, required: true },
    raised_by_role: { type: String, default: 'user' },

    assigned_to_emp_id: { type: String, default: null },
    assigned_to_name: { type: String, default: null },

    plan_date: { type: Date, default: null },
    resolved_at: { type: Date, default: null },

    activity: { type: [activitySchema], default: [] },
  },
  {
    collection: 'tickets',
    timestamps: true,
  }
);

// ── Auto-generate ticket_id ───────────────────────────────
TicketSchema.pre('save', async function (next) {
  if (this.ticket_id) return next();
  try {
    const last = await this.constructor
      .findOne({}, { ticket_id: 1 })
      .sort({ createdAt: -1 })
      .lean();
    let nextNum = 1;
    if (last?.ticket_id) {
      const num = parseInt(last.ticket_id.replace('TKT-', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    this.ticket_id = `TKT-${String(nextNum).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

TicketSchema.index({ ticket_id: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ raised_by_id: 1 });
TicketSchema.index({ assigned_to_emp_id: 1 });

module.exports = mongoose.model('Ticket', TicketSchema);
