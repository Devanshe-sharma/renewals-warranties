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
    renewal_status:      { type: String, default: 'not_yet_due' },
    renewal_status_updated_at: { type: Date, default: null },
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

NewrenewalSchema.pre("save", function (next) {

  if (this.end_date) {

    const r1 = new Date(this.end_date);
    r1.setDate(r1.getDate() - (this.reminder1_days || 30));
    this.reminder1_date = r1;

    const r2 = new Date(this.end_date);
    r2.setDate(r2.getDate() - (this.reminder2_days || 10));
    this.reminder2_date = r2;

    const rf = new Date(this.end_date);
    rf.setDate(rf.getDate() - (this.reminder_final_days || 1));
    this.reminder_final_date = rf;
  }

  next();
});

// ── Indexes ──────────────────────────────────────────────
NewrenewalSchema.index({ item_id: 1 });
NewrenewalSchema.index({ category: 1 });
NewrenewalSchema.index({ active: 1 });
NewrenewalSchema.index({ end_date: 1 });
NewrenewalSchema.index({ emp_id: 1 });
NewrenewalSchema.index({ department: 1 });

module.exports = mongoose.model('Newrenewal', NewrenewalSchema);
