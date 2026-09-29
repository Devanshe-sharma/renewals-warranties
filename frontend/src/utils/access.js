// Renewals ("Renewal Items Master" / "Renewals Records") are restricted to
// Admin, Management, and the Data Analytics & Automation department —
// everyone else only sees Categories/Tickets. Mirrors nothing on the
// backend today (this app has no per-department API gate yet) — this is
// UI-level only.
const RENEWALS_DEPARTMENT = "Data Analytics and Automation";

export function canAccessRenewals(user) {
  if (!user) return false;
  if (user.role === "admin" || user.role === "management") return true;
  return user.department === RENEWALS_DEPARTMENT;
}
