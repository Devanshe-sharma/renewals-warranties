const mongoose = require("mongoose");

const RenewalEventSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────
    // Event Information
    // ─────────────────────────────────────────────
    event_id: {
      type: String,
      unique: true,
      trim: true,
    },

    item_id: {
      type: String,
      required: true,
      trim: true,
    },

    item_name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "",
    },

    subcategory: {
      type: String,
      default: "",
    },

    prev_start_date: Date,
    prev_expiry_date: Date,

    // ─────────────────────────────────────────────
    // Renewal Decision
    // ─────────────────────────────────────────────
    renewal_required: {
      type: String,
      enum: ["Renew", "Discontinue"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },

    discontinue_reason: {
      type: String,
      required: function () {
        return this.renewal_required === "Discontinue";
      },
      default: "",
    },

    // ─────────────────────────────────────────────
    // Renewer Details
    // ─────────────────────────────────────────────
    selectedRenewerId: String,
    renewerName: String,
    renewerDepartment: String,
    renewerEmail: String,

    // ─────────────────────────────────────────────
    // Employee Details
    // ─────────────────────────────────────────────
    selectedEmployeeId: String,

    empName: String,
    empId: String,

    department: String,
    designation: String,

    email: String,
    reportingManager: String,

    // CC List
    ccRecipients: [
      {
        id: String,
        name: String,
        email: String,
      },
    ],

    // ─────────────────────────────────────────────
    // Renewal Details
    // ─────────────────────────────────────────────
    new_renewal_date: Date,

    frequency: {
      type: String,
      enum: [
        "Monthly",
        "Quarterly",
        "Half Yearly",
        "Annually",
        "Other",
        "",
      ],
      default: "",
    },

    frequencyCount: {
      type: Number,
      default: 1,
    },

    customEndDate: Date,

    new_expiry_date: Date,


    reminder1Days: {
      type: Number,
      default: null,
    },

    reminder2Days: {
      type: Number,
      default: null,
    },

    reminderFinalDays: {
      type: Number,
      default: null,
    },

    // ─────────────────────────────────────────────
    // Payment Details
    // ─────────────────────────────────────────────
    

   vendor: { type: String, default: "", trim: true },
    authority: { type: String, default: "", trim: true },
    renewal_amount: { type: Number, default: null },
    payment_mode: {
      type: String,
      enum: ["Bank Transfer","Credit Card","Debit Card","UPI","Cheque","Cash","Other",""],
      default: "",
    },
    card_holder: { type: String, enum: ["admin","accounts",""], default: "" },
    invoice_ref:  { type: String, default: "" },
    proof_link:   { type: String, default: "" },

  service_link:  { type: String, default: "", trim: true },
    username:      { type: String, default: "", trim: true },
    password:      { type: String, default: "", trim: true },
    description:   { type: String, default: "", trim: true },
    attachment1_link: { type: String, default: "", trim: true },
    attachment2_link: { type: String, default: "", trim: true },

  close_reason:  {           
      type: String,
      required: function () { return this.renewal_required === "Discontinue"; },
      default: "",
    },
  },
  {
    collection: "renewal_events",
    timestamps: true,
  }
);

// ── Indexes ───────────────────────────────────────────────
RenewalEventSchema.index({ event_id:  1 });
RenewalEventSchema.index({ item_id:   1 });
RenewalEventSchema.index({ status:    1 });
RenewalEventSchema.index({ new_expiry_date: 1 });
RenewalEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RenewalEvent', RenewalEventSchema);