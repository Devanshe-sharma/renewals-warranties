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
//           emp_name }]
// ────────────────────────────────────────────────────────
router.get('/items', async (req, res) => {
  try {
    const items = await Newrenewal
      .find({ active: true })
      .select('item_id item_name category subcategory start_date frequency user_person user_department emp_name emp_id')
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

    // Fetch the linked renewal to get prev_start and calculate prev_expiry
    const linkedItem = await Newrenewal.findOne({ item_id: b.item_id }).lean();
    if (!linkedItem) {
      return res.status(404).json({ success: false, message: `Renewal item ${b.item_id} not found` });
    }

    const prevStartDate  = linkedItem.start_date || null;
    const prevFreqMonths = freqMonths[linkedItem.frequency] || 12;
    const prevExpiryDate = prevStartDate
      ? addMonths(prevStartDate, prevFreqMonths)
      : null;

    // Calculate new expiry from new_renewal_date + frequency
    const newFreqMonths = freqMonths[b.frequency] || 12;
    const newExpiryDate = b.new_renewal_date && b.renewal_required === 'Yes'
      ? addMonths(new Date(b.new_renewal_date), newFreqMonths)
      : null;

    const event = new RenewalEvent({
      item_id:     linkedItem.item_id,
      item_name:   linkedItem.item_name,
      category:    linkedItem.category    || '',
      subcategory: linkedItem.subcategory || '',

      prev_start_date:  prevStartDate,
      prev_expiry_date: prevExpiryDate,

      renewal_required: b.renewal_required,
      status: b.renewal_required === 'No' ? 'Closed' : 'Open',

      // New renewal details
      new_renewal_date: b.renewal_required === 'Yes' && b.new_renewal_date
        ? new Date(b.new_renewal_date) : null,
      frequency:        b.renewal_required === 'Yes' ? (b.frequency || '') : '',
      new_expiry_date:  newExpiryDate,

      // Payment
      renewal_amount: b.renewal_amount ? Number(b.renewal_amount) : null,
      payment_mode:   b.payment_mode   || '',
      card_holder:    b.card_holder    || '',
      invoice_ref:    b.invoice_ref    || '',
      renewed_by:     b.renewed_by     || linkedItem.emp_name || '',
      next_due_date:  b.next_due_date  ? new Date(b.next_due_date) : null,
      proof_link:     b.proof_link     || '',

      // Additional
      user_person:     b.user_person     || linkedItem.user_person     || '',
      user_department: b.user_department || linkedItem.user_department || '',
      remarks:         b.remarks         || '',
      email_sent:      b.email_sent      || 'No',
    });

    const saved = await event.save();

    // If renewed, update the linked Newrenewal's start_date and end_date
    // so it reflects the new cycle
    if (b.renewal_required === 'Yes' && b.new_renewal_date && newExpiryDate) {
      await Newrenewal.findOneAndUpdate(
        { item_id: linkedItem.item_id },
        {
          $set: {
            start_date: new Date(b.new_renewal_date),
            end_date:   newExpiryDate,
            frequency:  b.frequency || linkedItem.frequency,
          },
          $push: {
            past_renewals: {
              event_id:    saved.event_id,
              renewal_date: new Date(b.new_renewal_date),
              expiry_date:  newExpiryDate,
              amount:       b.renewal_amount ? Number(b.renewal_amount) : null,
              renewed_by:   b.renewed_by || linkedItem.emp_name || '',
              notes:        b.remarks || '',
            },
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
