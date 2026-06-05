const mongoose = require('mongoose');

const NewrenewalSchema = new mongoose.Schema(
  {
    item_id: { type: String, unique: true, trim: true },

    // ── Item Details ─────────────────────────────────
    item_name:            { type: String, required: true, trim: true },
    category:             { type: String, required: true, trim: true },
    subcategory:          { type: String, default: '', trim: true },
    description:          { type: String, default: '', trim: true },
    vendor:               { type: String, default: '', trim: true },
    service_link:         { type: String, default: '' },
    credential_username:  { type: String, default: '' },
    credential_password:  { type: String, default: '' },
    attachment1_link:     { type: String, default: '' },
    attachment2_link:     { type: String, default: '' },

    // ── Renewer Details ──────────────────────────────
    selected_renewer_id: { type: String, default: '' },
    renewer_name:         { type: String, default: '' },
    renewer_department:   { type: String, default: '' },
    renewer_email:        { type: String, default: '' },

    // ── User Details ─────────────────────────────────
    selected_employee_id: { type: String, default: '' },
    emp_name:             { type: String, default: '' },
    emp_id:               { type: String, default: '' },
    department:           { type: String, default: '' },
    designation:          { type: String, default: '' },
    email:                { type: String, default: '' },
    reporting_manager:    { type: String, default: '' },
    cc_recipients: {
      type: [
        {
          id:    { type: String },
          name:  { type: String },
          email: { type: String },
        }
      ],
      default: [],
    },

    // ── Warranty ─────────────────────────────────────
    user_person:          { type: String, default: '' },
    user_department:      { type: String, default: '' },

    // ── Reminders ────────────────────────────────────
    start_date:           { type: Date, required: true },
    end_date:             { type: Date },
    custom_end_date:      { type: Date },
    frequency: {
      type: String,
      // removed strict enum — "Other" needs to be allowed
      trim: true,
      required: true,
    },
    frequency_count:      { type: Number, default: 1 },
    reminder1_days:       { type: Number, default: 30 },
    reminder2_days:       { type: Number, default: 10 },
    reminder_final_days:  { type: Number, default: 1  },
    reminder1_date:       { type: Date },
    reminder2_date:       { type: Date },
    reminder_final_date:  { type: Date },

    // ── Status & Archive ─────────────────────────────
    active:                    { type: Boolean, default: true },
    is_closed:                 { type: Boolean, default: false },
    closed_at:                 { type: Date,    default: null  },
    discontinue_reason:        { type: String,  default: ''    },
    renewal_status:            { type: String,  default: 'not_yet_due' },
    renewal_status_updated_at: { type: Date,    default: null  },
    past_renewals:             { type: Array,   default: []    },
  },
  {
    collection: 'renewals',
    timestamps: true,
  }
);

// ── Auto-generate item_id ─────────────────────────────────
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

// ── Auto-calculate reminder dates ────────────────────────
NewrenewalSchema.pre('save', function (next) {
  const end = this.end_date || this.custom_end_date;
  if (end) {
    const sub = (days) => {
      const d = new Date(end);
      d.setDate(d.getDate() - days);
      return d;
    };
    this.reminder1_date      = sub(this.reminder1_days     || 30);
    this.reminder2_date      = sub(this.reminder2_days     || 10);
    this.reminder_final_date = sub(this.reminder_final_days || 1);
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