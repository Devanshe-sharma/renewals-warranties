const express = require('express');
const router  = express.Router();
const Newrenewal = require('../models/Newrenewal');
const Employee = require('../models/Employee');

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
    const b = req.body;
    const adminRenewer = await getAdminDeptHead();
    const renewerName = b.renewerName || adminRenewer.name;
    const renewerDepartment = b.renewerDepartment || adminRenewer.department;
    const renewerEmail = b.renewerEmail || adminRenewer.email;

    const reminderDates = calcReminderDates(
      b.endDate,
      b.reminder1Days     ?? 30,
      b.reminder2Days     ?? 10,
      b.reminderFinalDays ?? 1,
    );

    const renewal = new Newrenewal({
      // Renewal Details
      item_name:   b.itemName,
      category:    b.category,
      subcategory: b.subcategory  || '',
      description: b.description  || '',
      vendor:      b.vendor       || '',

      // Renewer Details
      renewer_name:         renewerName,
      renewer_department:   renewerDepartment,
      renewer_email:        renewerEmail,
      selected_employee_id: b.selectedEmployeeId || '',
      emp_name:             b.empName            || '',
      emp_id:               b.empId              || '',
      department:           b.department         || '',
      designation:          b.designation        || '',
      email:                b.email              || '',
      reporting_manager:    b.reportingManager   || '',

      // Reminders
      start_date:           b.startDate,
      end_date:             b.endDate || null,
      frequency:            b.frequency,
      reminder1_days:       b.reminder1Days     ?? 30,
      reminder2_days:       b.reminder2Days     ?? 10,
      reminder_final_days:  b.reminderFinalDays ?? 1,
      ...reminderDates,

      // Additional
      remarks:         b.remarks        || '',
      link:            b.link           || '',
      user_person:     b.userPerson     || '',
      user_department: b.userDepartment || '',

      // Attachments
      attachment1_link: b.attachment1Link || '',
      attachment2_link: b.attachment2Link || '',

      active:       true,
      past_renewals: [],
    });

    const saved = await renewal.save();
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
    const filter = {};
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
    const b = req.body;
    const adminRenewer = await getAdminDeptHead();
    const renewerName = b.renewerName || adminRenewer.name;
    const renewerDepartment = b.renewerDepartment || adminRenewer.department;
    const renewerEmail = b.renewerEmail || adminRenewer.email;

    const reminderDates = calcReminderDates(
      b.endDate,
      b.reminder1Days     ?? 30,
      b.reminder2Days     ?? 10,
      b.reminderFinalDays ?? 1,
    );

    const updated = await Newrenewal.findOneAndUpdate(
      { item_id: req.params.id },
      {
        $set: {
          item_name:            b.itemName,
          category:             b.category,
          subcategory:          b.subcategory        || '',
          description:          b.description        || '',
          vendor:               b.vendor             || '',
          renewer_name:         renewerName,
          renewer_department:   renewerDepartment,
          renewer_email:        renewerEmail,
          selected_employee_id: b.selectedEmployeeId || '',
          emp_name:             b.empName            || '',
          emp_id:               b.empId              || '',
          department:           b.department         || '',
          designation:          b.designation        || '',
          email:                b.email              || '',
          reporting_manager:    b.reportingManager   || '',
          start_date:           b.startDate,
          end_date:             b.endDate            || null,
          frequency:            b.frequency,
          reminder1_days:       b.reminder1Days      ?? 30,
          reminder2_days:       b.reminder2Days      ?? 10,
          reminder_final_days:  b.reminderFinalDays  ?? 1,
          ...reminderDates,
          remarks:              b.remarks            || '',
          link:                 b.link               || '',
          user_person:          b.userPerson         || '',
          user_department:      b.userDepartment     || '',
          attachment1_link:     b.attachment1Link    || '',
          attachment2_link:     b.attachment2Link    || '',
        }
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Renewal not found' });
    }
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

module.exports = router;
