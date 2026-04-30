const mongoose = require('mongoose');

const RenewalEventSchema = new mongoose.Schema(
  {
    // ── Auto-generated Event ID ──────────────────────
    event_id: {
      type:   String,
      unique: true,
      trim:   true,
    },

    // ── Linked Renewal Item (from Newrenewal) ────────
    item_id:     { type: String, required: true, trim: true },  // RW-0001
    item_name:   { type: String, required: true, trim: true },
    category:    { type: String, default: '' },
    subcategory: { type: String, default: '' },

    // Previous cycle dates (auto-filled from linked renewal)
    prev_start_date:  { type: Date },
    prev_expiry_date: { type: Date },  // calculated: prev_start + frequency

    // ── Renewal Decision ─────────────────────────────
    renewal_required: {
      type:     String,
      enum:     ['Yes', 'No'],
      required: true,
    },

    // Status — Open if renewed, Closed if not
    status: {
      type:    String,
      enum:    ['Open', 'Closed'],
      default: 'Open',
    },

    // ── New Renewal Details (filled when renewal_required = Yes) ──
    new_renewal_date: { type: Date },
    frequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half Yearly', 'Annually', ''],
      default: '',
    },
    new_expiry_date: { type: Date },  // calculated: new_renewal_date + frequency

    // ── Payment & Other Details ───────────────────────
    renewal_amount: { type: Number,  default: null },
    payment_mode: {
      type: String,
      enum: ['Bank Transfer', 'Credit Card', 'Debit Card', 'UPI', 'Cheque', 'Cash', 'Other', ''],
      default: '',
    },
    card_holder: {
      type: String,
      enum: ['admin', 'accounts', ''],
      default: '',
    },
    invoice_ref:   { type: String, default: '' },
    renewed_by:    { type: String, default: '' },
    next_due_date: { type: Date },
    proof_link:    { type: String, default: '' },

    // ── Additional Information ────────────────────────
    user_person:     { type: String, default: '' },  // Warranty only
    user_department: { type: String, default: '' },  // Warranty only
    remarks:         { type: String, default: '' },
    email_sent: {
      type:    String,
      enum:    ['Yes', 'No'],
      default: 'No',
    },
  },
  {
    collection: 'renewal_events',
    timestamps: true,
  }
);

// ── Auto-generate event_id before save (RE-0001, RE-0002…) ──
RenewalEventSchema.pre('save', async function (next) {
  if (this.event_id) return next();
  try {
    const last = await this.constructor
      .findOne({}, { event_id: 1 })
      .sort({ createdAt: -1 })
      .lean();

    let nextNum = 1;
    if (last?.event_id) {
      const num = parseInt(last.event_id.replace('RE-', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    this.event_id = `RE-${String(nextNum).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

// ── Indexes ───────────────────────────────────────────────
RenewalEventSchema.index({ event_id:  1 });
RenewalEventSchema.index({ item_id:   1 });
RenewalEventSchema.index({ status:    1 });
RenewalEventSchema.index({ new_expiry_date: 1 });
RenewalEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RenewalEvent', RenewalEventSchema);