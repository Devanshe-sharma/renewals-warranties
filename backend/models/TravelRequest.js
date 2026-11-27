const mongoose = require('mongoose');

// Workflow: employee submits → Manager approves/rejects → Admin books/cancels.
const STATUSES = [
  'Pending Manager Approval',
  'Rejected by Manager',
  'Pending Admin Booking',
  'Booked',
  'Cancelled by Admin',
];

const activitySchema = new mongoose.Schema(
  {
    by_name: { type: String, default: '' },
    by_email: { type: String, default: '' },
    action: { type: String, required: true }, // created, approved, rejected, booked, cancelled, reminder, escalated
    message: { type: String, default: '' },
  },
  { _id: false, timestamps: { createdAt: 'at', updatedAt: false } }
);

const TravelRequestSchema = new mongoose.Schema(
  {
    travel_id: { type: String, unique: true, trim: true },

    // ── Employee ──
    employee: { type: String, required: true, trim: true },
    employeeEmail: { type: String, default: '', lowercase: true, trim: true },
    empid: { type: String, default: '' },
    designation: { type: String, default: '' },
    category: { type: String, default: '' },
    dept: { type: String, default: '' },
    purpose: { type: String, default: '' },

    // ── Approving manager ──
    manager: { type: String, required: true, trim: true },
    managerEmail: { type: String, default: '', lowercase: true, trim: true },

    // ── Linked event (HR-Forms Outing) ──
    eventId: { type: String, default: '' },
    eventName: { type: String, default: '' },
    eventDate: { type: Date, default: null },
    eventCreatedAt: { type: Date, default: null },

    // ── Journey ──
    journeyType: { type: String, default: 'Planned' },
    unplannedApproved: { type: String, default: '' },
    bookingType: { type: String, enum: ['Normal', 'Tatkal'], default: 'Normal' },
    from: { type: String, default: '' },
    to: { type: String, default: '' },
    outDate: { type: String, default: '' }, // YYYY-MM-DD
    outTime: { type: String, default: '' }, // time slot label
    departureAt: { type: Date, default: null }, // start of the slot, IST
    outMode: { type: String, default: '' },
    returnRequired: { type: String, default: 'Yes' },
    returnFrom: { type: String, default: '' },
    returnTo: { type: String, default: '' },
    returnDate: { type: String, default: '' },
    returnTime: { type: String, default: '' },
    returnMode: { type: String, default: '' },
    railEntitlement: { type: String, default: '' },

    // ── Hotel ──
    hotel: { type: String, default: 'No' },
    hotelAddress: { type: String, default: '' },
    checkin: { type: String, default: '' },
    checkout: { type: String, default: '' },
    nights: { type: Number, default: 0 },
    room: { type: String, default: '' },

    estimate: { type: Number, default: 0 },
    remarks: { type: String, default: '' },

    // ── Workflow ──
    status: { type: String, enum: STATUSES, default: 'Pending Manager Approval', index: true },
    createdBy: { type: String, default: '' },

    managerActionAt: { type: Date, default: null },
    managerActionBy: { type: String, default: '' },
    managerRemarks: { type: String, default: '' },

    // Admin must book within 2 days of manager approval.
    adminDueAt: { type: Date, default: null },
    adminActionAt: { type: Date, default: null },
    adminActionBy: { type: String, default: '' },
    adminActionByEmail: { type: String, default: '' },
    bookingDetails: { type: String, default: '' },
    adminRemarks: { type: String, default: '' },

    // ── Scoring (negative points) ──
    // Employee: days between the event being created and this request, past a 2-day grace.
    eventLagDays: { type: Number, default: null },
    employeeScore: { type: Number, default: 0 },
    // Admin: days booked past adminDueAt.
    adminDelayDays: { type: Number, default: 0 },
    adminScore: { type: Number, default: 0 },

    // ── Escalation tracking (each sent once) ──
    managerReminderSentAt: { type: Date, default: null },
    managerEscalatedAt: { type: Date, default: null },
    adminReminderSentAt: { type: Date, default: null },
    adminEscalatedAt: { type: Date, default: null },

    activity: { type: [activitySchema], default: [] },
  },
  { timestamps: true }
);

TravelRequestSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('TravelRequest', TravelRequestSchema);
