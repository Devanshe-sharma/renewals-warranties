const express = require('express');
const router  = express.Router();
const Newrenewal = require('../models/Newrenewal');
const Employee = require('../models/Employee');
// const sendMail = require("../../sendMail");
const sendRenewalCreatedMail = require("../utils/mailer/services/sendRenewalCreatedMail");




// Add at top of file, after requires
function mapBodyToDoc(b) {   // ← remove adminRenewer param
  const endDate = b.frequency === "Other"
    ? (b.customEndDate || b.endDate || null)
    : (b.endDate || null);

  const reminderDates = calcReminderDates(
    endDate,
    b.reminder1Days     ?? 30,
    b.reminder2Days     ?? 10,
    b.reminderFinalDays ?? 1,
  );

  return {
    item_name:            b.itemName,
    category:             b.category,
    subcategory:          b.subcategory         || '',
    description:          b.description         || '',
    vendor:               b.vendor              || '',
    service_link:         b.serviceLink         || '',
    credential_username:  b.credentialUsername  || '',
    credential_password:  b.credentialPassword  || '',
    attachment1_link:     b.attachment1Link     || '',
    attachment2_link:     b.attachment2Link     || '',

    // Renewer — now always from frontend selection
    renewer_name:         b.renewerName         || '',
    renewer_department:   b.renewerDepartment   || '',
    renewer_email:        b.renewerEmail        || '',
    selected_renewer_id:  b.selectedRenewerId   || '',

    selected_employee_id: b.selectedEmployeeId  || '',
    emp_name:             b.empName             || '',
    emp_id:               b.empId               || '',
    department:           b.department          || '',
    designation:          b.designation         || '',
    email:                b.email               || '',
    reporting_manager:    b.reportingManager    || '',
    cc_recipients:        Array.isArray(b.ccRecipients) ? b.ccRecipients : [],

    user_person:          b.userPerson          || '',
    user_department:      b.userDepartment      || '',

    start_date:           b.startDate,
    end_date:             endDate,
    custom_end_date:      b.customEndDate       || null,
    frequency:            b.frequency,
    frequency_count:      b.frequencyCount      || 1,
    reminder1_days:       b.reminder1Days       ?? 30,
    reminder2_days:       b.reminder2Days       ?? 10,
    reminder_final_days:  b.reminderFinalDays   ?? 1,
    ...reminderDates,
  };
}

// ── Helper: calculate reminder dates ─────────────────────
function calcReminderDates(endDate, r1, r2, rf) {
  if (!endDate) return {};
  const end = new Date(endDate);
  const sub = (days) => {
    const d = new Date(end);
    d.setDate(d.getDate() - days);
    return d;
  };
  return {
    reminder1_date:      sub(r1),
    reminder2_date:      sub(r2),
    reminder_final_date: sub(rf),
  };
}

async function getAdminDeptHead() {
  const admin = await Employee.findOne({
    Department: { $regex: /admin/i },
    $or: [
      { 'Department Head': { $ne: '' } },
      { 'Dept Head Email': { $ne: '' } },
    ],
  }).lean();

  if (!admin) return { name: '', department: 'Admin', email: '' };

  return {
    name: admin['Department Head'] || admin.Emp_name || '',
    department: 'Admin',
    email: admin['Dept Head Email'] || admin['desig Email Id'] || '',
  };
}

// ────────────────────────────────────────────────────────
// POST /api/renewals
// Create new renewal
// ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const adminRenewer = await getAdminDeptHead();
    const fields = mapBodyToDoc(req.body);

    const renewal = new Newrenewal({ ...fields, active: true, past_renewals: [] });
    const saved = await renewal.save();

    try {
      const mailInfo = await sendRenewalCreatedMail(saved);
      console.log("✅ Renewal mail sent:", mailInfo.accepted);
    } catch (mailErr) {
      console.error("❌ Renewal mail error:", mailErr);
    }

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('Create renewal error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});
    

// ────────────────────────────────────────────────────────
// GET /api/renewals
// Get all renewals (optional filters: active, category, dept)
// ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = { is_closed: { $ne: true } };
    if (req.query.active)     filter.active     = req.query.active === 'true';
    if (req.query.category)   filter.category   = req.query.category;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.emp_id)     filter.emp_id     = req.query.emp_id;

    const renewals = await Newrenewal.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: renewals.length, data: renewals });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/renewals/archived/list
// Get all archived/closed renewals
// ────────────────────────────────────────────────────────
router.get('/archived/list', async (req, res) => {
  try {
    const archived = await Newrenewal.find({ is_closed: true }).sort({ closed_at: -1, createdAt: -1 }).lean();
    res.json({ success: true, count: archived.length, data: archived });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────
// GET /api/renewals/:id
// Get single renewal by item_id
// ────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const renewal = await Newrenewal.findOne({ item_id: req.params.id }).lean();
    if (!renewal) {
      return res.status(404).json({ success: false, message: 'Renewal not found' });
    }
    res.json({ success: true, data: renewal });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────
// PUT /api/renewals/:id
// Update renewal by item_id
// ────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const adminRenewer = await getAdminDeptHead();
    const fields = mapBodyToDoc(req.body);

    const updated = await Newrenewal.findOneAndUpdate(
      { item_id: req.params.id },
      { $set: fields },
      { new: true, runValidators: false }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Renewal not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ────────────────────────────────────────────────────────
// DELETE /api/renewals/:id
// Soft delete — sets active = false
// ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const updated = await Newrenewal.findOneAndUpdate(
      { item_id: req.params.id },
      { $set: { active: false } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Renewal not found' });
    }
    res.json({ success: true, message: `${req.params.id} deactivated` });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// POST /api/renewals/:id/archive
router.post("/:id/archive", async (req, res) => {
  try {
    const { reason } = req.body;
    const renewal = await Newrenewal.findOneAndUpdate(
      { item_id: req.params.id },
      {
        is_closed: true,
        closed_at: new Date(),
        discontinue_reason: reason || "",
      },
      { new: true }
    );
    if (!renewal) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: renewal });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
