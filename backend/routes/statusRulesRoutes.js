const express     = require('express');
const router      = express.Router();
const StatusRules = require('../models/StatusRules');
const Newrenewal  = require('../models/Newrenewal');


const STATUS_COLOURS = {
  done:         { bg: "#D1FAE5", text: "#065F46", label: "Done"         },
  done_delayed: { bg: "#FEF9C3", text: "#854D0E", label: "Done Delayed" },
  due:          { bg: "#E5E7EB", text: "#374151", label: "Due"          },
  overdue:      { bg: "#FEE2E2", text: "#991B1B", label: "Overdue"      },
  not_yet_due:  { bg: "#F9FAFB", text: "#6B7280", label: "Not Yet Due"  },
};

// ── Helper: compute status ────────────────────────────────
async function computeStatusWithRules(renewal, lastEventDate = null) {
  const rules       = await StatusRules.findOne({ rules_id: 'global' }).lean();
  const graceDays   = rules?.done_grace_days   ?? 0;
  const overdueDays = rules?.overdue_start_days ?? 10;

  const today   = new Date(); today.setHours(0,0,0,0);
  const endDate = renewal.end_date       ? new Date(renewal.end_date)       : null;
  const r2Date  = renewal.reminder2_date ? new Date(renewal.reminder2_date) : null;

  // ── Renewed ───────────────────────────────────────────
  if (lastEventDate) {
    const renewedOn = new Date(lastEventDate); renewedOn.setHours(0,0,0,0);
    if (endDate) {
      const deadline = new Date(endDate); deadline.setHours(0,0,0,0);
      const graceDeadline = new Date(deadline);
      graceDeadline.setDate(graceDeadline.getDate() + graceDays);
      return renewedOn <= graceDeadline ? 'done' : 'done_delayed';
    }
    return 'done';
  }

  // ── Not renewed ───────────────────────────────────────
  if (!endDate) return 'not_yet_due';

  const deadline = new Date(endDate); deadline.setHours(0,0,0,0);

  // After deadline → overdue
  if (today > deadline) return 'overdue';

  // After 2nd reminder → due
  if (r2Date) {
    const r2 = new Date(r2Date); r2.setHours(0,0,0,0);
    if (today >= r2) return 'due';
  } else {
    // Fallback: use overdue_start_days if no reminder2_date
    const overdueStart = new Date(deadline);
    overdueStart.setDate(overdueStart.getDate() - overdueDays);
    if (today >= overdueStart) return 'due';
  }

  return 'not_yet_due';
}


// ── GET /api/status-rules/preview ────────────────────────
router.get('/preview', async (req, res) => {
  try {
    const renewals      = await Newrenewal.find({ is_closed: { $ne: true } }).lean();
    const RenewalEvent  = require('../models/updaterenewal');

    const result = await Promise.all(renewals.map(async (r) => {
      const lastEvent = await RenewalEvent
        .findOne({ item_id: r.item_id, renewal_required: 'Yes' })
        .sort({ createdAt: -1 })
        .lean();

      const status = await computeStatusWithRules(r, lastEvent?.createdAt || null);
      return {
        item_id:        r.item_id,
        item_name:      r.item_name,
        end_date:       r.end_date,
        reminder2_date: r.reminder2_date,
        status,
      };
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/status-rules ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let rules = await StatusRules.findOne({ rules_id: 'global' }).lean();
    if (!rules) rules = await StatusRules.create({ rules_id: 'global' });
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/status-rules ─────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const updated = await StatusRules.findOneAndUpdate(
      { rules_id: 'global' },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
module.exports = router;
module.exports.computeStatusWithRules = computeStatusWithRules;
module.exports.STATUS_COLOURS = STATUS_COLOURS;