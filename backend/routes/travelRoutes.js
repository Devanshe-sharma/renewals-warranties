const express = require("express");
const router = express.Router();

// Employee list for the travel request form's "Employee Name" dropdown,
// from HR-Forms's external employees API. Picking an employee auto-fills
// their employee ID, department, approving manager (reporting head) and
// origin (office location). Only current employees are returned, and only
// the fields the form needs — personal email, mobile etc. stay in HR-Forms.
// Cached briefly so the dropdown doesn't hit HR-Forms on every page load.
let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getTravelEmployees() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) return cache.data;

  const res = await fetch(process.env.HR_EMPLOYEES_URL, {
    headers: { "x-api-key": process.env.HR_EMPLOYEES_API_KEY },
  });
  if (!res.ok) throw new Error(`HR-Forms responded with ${res.status}`);
  const { data: records = [] } = await res.json();

  const employees = records
    .filter((r) => r.is_current)
    .map((r) => ({
      name: String(r.full_name || "").trim(),
      email: String(r.official_email || r.email || "").trim().toLowerCase(),
      empId: String(r.employee_id || "").trim(),
      dept: r.department || "",
      designation: r.designation || "",
      reportingHead: String(r.reporting_head || "").trim(),
      location: r.location || "",
    }))
    .filter((e) => e.name && e.empId)
    .sort((a, b) => a.name.localeCompare(b.name));

  cache = { data: employees, fetchedAt: now };
  return employees;
}

router.get("/employees", async (req, res) => {
  try {
    res.json({ success: true, data: await getTravelEmployees() });
  } catch (err) {
    console.error("travel employees:", err.message);
    res.status(502).json({
      success: false,
      message: "Could not load employee list from HR-Forms",
    });
  }
});

module.exports = router;
