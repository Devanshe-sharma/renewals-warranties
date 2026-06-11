const express    = require('express');
const router     = express.Router();
const RenewalEvent = require('../models/updaterenewal');
const Newrenewal   = require('../models/Newrenewal');

// ── Helper: add months to a date ─────────────────────────
const freqMonths = { Monthly: 1, Quarterly: 3, 'Half Yearly': 6, Annually: 12 };

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

// ── Helper: next event_id preview (used by frontend) ─────
async function getNextEventId() {
  const last = await RenewalEvent
    .findOne({}, { event_id: 1 })
    .sort({ createdAt: -1 })
    .lean();
  let nextNum = 1;
  if (last?.event_id) {
    const n = parseInt(last.event_id.replace('RE-', ''), 10);
    if (!isNaN(n)) nextNum = n + 1;
  }
  return `RE-${String(nextNum).padStart(4, '0')}`;
}

// ────────────────────────────────────────────────────────
// GET /api/renewal-events/next-id
// Returns the next auto-generated event_id for preview
// ────────────────────────────────────────────────────────
router.get('/next-id', async (req, res) => {
  try {
    const id = await getNextEventId();
    res.json({ success: true, event_id: id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/renewal-events/items
// Returns all active renewal items for the dropdown
// Shape: [{ item_id, item_name, category, subcategory,
//           start_date, frequency, user_person, user_department,
//           renewer_name, emp_name }]
// ────────────────────────────────────────────────────────
router.get('/items', async (req, res) => {
  try {
    // renewalEventRoutes.js — GET /items
    const items = await Newrenewal
      .find({ active: true, is_closed: { $ne: true } })
      .select(`
        item_id item_name category subcategory
        start_date end_date frequency
        vendor service_link username password description
        attachment1_link attachment2_link
        renewer_name renewer_department renewer_email
        emp_name emp_id department designation email reporting_manager
        selected_employee_id user_person user_department
      `)
      .sort({ item_name: 1 })
      .lean();

    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ────────────────────────────────────────────────────────
// POST /api/renewal-events
// Record a new renewal event
// ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const b = req.body;

    const linkedItem = await Newrenewal.findOne({ item_id: b.item_id }).lean();
    if (!linkedItem) {
      return res.status(404).json({ success: false, message: `Renewal item ${b.item_id} not found` });
    }

    // ── Previous dates — read directly from stored end_date ──
    const prevStartDate  = linkedItem.start_date || null;
    const prevExpiryDate = linkedItem.end_date   || null;   // ← was being recalculated

    // ── New expiry — respect frequencyCount and "Other" ──────
    let newExpiryDate = null;
    if (b.renewal_required === 'Renew' && b.new_renewal_date) {
      if (b.frequency === 'Other' && b.customEndDate) {
        newExpiryDate = new Date(b.customEndDate);
      } else {
        const months = Number(b.frequencyCount) || freqMonths[b.frequency] || 12;
        newExpiryDate = addMonths(new Date(b.new_renewal_date), months);
      }
    }

    const event = new RenewalEvent({
      item_id:     linkedItem.item_id,
      item_name:   linkedItem.item_name,
      category:    linkedItem.category    || '',
      subcategory: linkedItem.subcategory || '',
      description: linkedItem.description || '',

      prev_start_date:  prevStartDate,
      prev_expiry_date: prevExpiryDate,

      renewal_required: b.renewal_required,
      status: b.renewal_required === 'Discontinue' ? 'Closed' : 'Open',
      close_reason: b.close_reason || '',

      // ── Renewer ──
      selectedRenewerId: b.selectedRenewerId || '',
      renewerName:       b.renewerName       || '',
      renewerDepartment: b.renewerDepartment || '',
      renewerEmail:      b.renewerEmail      || '',

      // ── Employee ──
      selectedEmployeeId: b.selectedEmployeeId || '',
      empName:            b.empName            || '',
      empId:              b.empId              || '',
      department:         b.department         || '',
      designation:        b.designation        || '',
      email:              b.email              || '',
      reportingManager:   b.reportingManager   || '',
      ccRecipients:       b.ccRecipients       || [],

      // ── New renewal ──
      new_renewal_date: b.renewal_required === 'Renew' && b.new_renewal_date
        ? new Date(b.new_renewal_date) : null,
      frequency:     b.renewal_required === 'Renew' ? (b.frequency || '') : '',
      frequencyCount: Number(b.frequencyCount) || 1,
      customEndDate:  b.frequency === 'Other' && b.customEndDate
        ? new Date(b.customEndDate) : null,
      new_expiry_date: newExpiryDate,

      reminder1Days:      b.reminder1Days      ?? null,
      reminder2Days:      b.reminder2Days      ?? null,
      reminderFinalDays:  b.reminderFinalDays  ?? null,

      // ── Payment ──
      vendor:         b.vendor         || linkedItem.vendor || '',
      authority:      b.authority      || '',
      renewal_amount: b.renewal_amount ? Number(b.renewal_amount) : null,
      payment_mode:   b.payment_mode   || '',
      card_holder:    b.card_holder    || '',
      invoice_ref:    b.invoice_ref    || '',
      proof_link:     b.proof_link     || '',

      // ── Credentials (snapshot from item at time of event) ──
      service_link:     b.serviceLink          || linkedItem.service_link  || '',
      username:         b.credentialUsername   || linkedItem.username       || '',
      password:         b.credentialPassword   || linkedItem.password       || '',
      attachment1_link: b.attachment1Link || linkedItem.attachment1_link || '',
      attachment2_link: b.attachment2Link || linkedItem.attachment2_link || '',
    });

    // Auto-assign event_id
    event.event_id = await getNextEventId();
    const saved = await event.save();

    // ── Update linked Newrenewal on Renew ────────────────────
    if (b.renewal_required === 'Renew' && b.new_renewal_date && newExpiryDate) {
        await Newrenewal.findOneAndUpdate(
          { item_id: linkedItem.item_id },
          {
            $set: {
              start_date:   new Date(b.new_renewal_date),
              end_date:     newExpiryDate,
              frequency:    b.frequency || linkedItem.frequency,
              is_closed:    false,
              // ── sync edited credentials back to the item ──
              vendor:       b.vendor             || linkedItem.vendor       || '',
              service_link: b.serviceLink        || linkedItem.service_link || '',
              username:     b.credentialUsername || linkedItem.username     || '',
              password:     b.credentialPassword || linkedItem.password     || '',
            },
            $push: {
            past_renewals: {
              event_id:     saved.event_id,
              renewal_date: new Date(b.new_renewal_date),
              expiry_date:  newExpiryDate,
              amount:       b.renewal_amount ? Number(b.renewal_amount) : null,
              renewed_by:   b.renewerName || linkedItem.renewer_name || '',
              notes:        b.remarks || '',
            },
          },
        }
        );
      }

    // ── Mark as closed on Discontinue ───────────────────────
    if (b.renewal_required === 'Discontinue') {
      await Newrenewal.findOneAndUpdate(
        { item_id: linkedItem.item_id },
        {
          $set: {
            is_closed:    true,
            closed_at:    new Date(),
            vendor:       b.vendor             || linkedItem.vendor       || '',
            service_link: b.serviceLink        || linkedItem.service_link || '',
            username:     b.credentialUsername || linkedItem.username     || '',
            password:     b.credentialPassword || linkedItem.password     || '',
          },
        }
      );
    }

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('Renewal event create error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/renewal-events
// List events — optional filter: item_id, status
// ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.item_id) filter.item_id = req.query.item_id;
    if (req.query.status)  filter.status  = req.query.status;

    const events = await RenewalEvent.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/renewal-events/:id
// Single event by event_id
// ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const event = await RenewalEvent.findOne({ event_id: req.params.id }).lean();
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
