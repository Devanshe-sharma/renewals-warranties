// The renewals area — "Renewal Items Master", "Renewals Records", and
// "Categories" — is restricted to Admin, Management, and the Data
// Analytics & Automation department. Everyone else only sees Tickets.
// Mirrors nothing on the backend today (this app has no per-department
// API gate yet) — this is UI-level only.
const RENEWALS_DEPARTMENT = "Data Analytics and Automation";

export function canAccessRenewalsArea(user) {
  if (!user) return false;
  if (user.role === "admin" || user.role === "management") return true;
  return user.department === RENEWALS_DEPARTMENT;
}
