const mongoose = require('mongoose');

const NewrenewalSchema = new mongoose.Schema(
  {
    // ── IDs ──────────────────────────────────────────
    item_id: {
      type: String,
      unique: true,
      trim: true,
    },

    // ── Renewal Details ──────────────────────────────
    item_name:   { type: String, required: true, trim: true },
    category:    { type: String, required: true, trim: true },
    subcategory: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    vendor:      { type: String, default: '', trim: true },
    authority:   { type: String, default: '', trim: true },

    // ── Renewer Details ──────────────────────────────
    renewer_name:       { type: String, default: '' },
    renewer_department: { type: String, default: '' },
    renewer_email:      { type: String, default: '' },
    selected_employee_id: { type: String, default: '' },
    emp_name:             { type: String, default: '' },
    emp_id:               { type: String, default: '' },
    department:           { type: String, default: '' },
    designation:          { type: String, default: '' },
    email:                { type: String, default: '' },
    reporting_manager:    { type: String, default: '' },

    // ── Reminders ────────────────────────────────────
    start_date:           { type: Date,   required: true },
    end_date:             { type: Date },
    frequency:            {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Half Yearly', 'Annually'],
      required: true,
    },
    reminder1_days:       { type: Number, default: 30 },
    reminder2_days:       { type: Number, default: 10 },
    reminder_final_days:  { type: Number, default: 1  },
    reminder1_date:       { type: Date },
    reminder2_date:       { type: Date },
    reminder_final_date:  { type: Date },

    // ── Additional Details ───────────────────────────
    remarks:          { type: String, default: '' },
    link:             { type: String, default: '' },
    user_person:      { type: String, default: '' },
    user_department:  { type: String, default: '' },

    // ── Attachments ──────────────────────────────────
    attachment1_link: { type: String, default: '' },
    attachment2_link: { type: String, default: '' },

    // ── Status ───────────────────────────────────────
    active: { type: Boolean, default: true },
    is_closed: { type: Boolean, default: false },
    closed_at: { type: Date, default: null },

    // ── Past Renewals (events log) ───────────────────
    past_renewals: { type: Array, default: [] },
  },
  {
    collection: 'renewals',
    timestamps: true,
  }
);

// ── Auto-generate item_id before save ────────────────────
NewrenewalSchema.pre('save', async function (next) {
  if (this.item_id) return next();
  try {
    const last = await this.constructor
      .findOne({}, { item_id: 1 })
      .sort({ createdAt: -1 })
      .lean();

    let nextNum = 1;
    if (last?.item_id) {
      const num = parseInt(last.item_id.replace('RW-', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    this.item_id = `RW-${String(nextNum).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

// ── Indexes ──────────────────────────────────────────────
NewrenewalSchema.index({ item_id: 1 });
NewrenewalSchema.index({ category: 1 });
NewrenewalSchema.index({ active: 1 });
NewrenewalSchema.index({ end_date: 1 });
NewrenewalSchema.index({ emp_id: 1 });
NewrenewalSchema.index({ department: 1 });

module.exports = mongoose.model('Newrenewal', NewrenewalSchema);
