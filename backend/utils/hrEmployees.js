// Shared HR-Forms onboarding registry lookup — used by the ticket CC picker
// (routes/ticketRoutes.js) and by auth (routes/authRoutes.js, to resolve a
// logged-in user's department for department-gated pages). Strips
// everything except name/email/designation/dept — the onboarding record
// also carries PAN, bank details, Aadhaar, etc. that this app has no
// business holding onto. Cached briefly since it's ~140 full records.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getHrEmployees() {
  const now = Date.now();
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const res = await fetch(process.env.HR_ONBOARDING_URL);
  if (!res.ok) {
    throw new Error(`HR-Forms responded with ${res.status}`);
  }
  const { data: records = [] } = await res.json();

  const seen = new Set();
  const employees = records
    .filter((r) => r.joiningStatus === "Joined")
    .map((r) => ({
      name: (r.name || "").trim(),
      email: String(r.officialEmail || "").trim().toLowerCase(),
      designation: r.designation || "",
      dept: r.dept || "",
    }))
    .filter((e) => e.name && EMAIL_RE.test(e.email))
    .filter((e) => (seen.has(e.email) ? false : (seen.add(e.email), true)))
    .sort((a, b) => a.name.localeCompare(b.name));

  cache = { data: employees, fetchedAt: now };
  return employees;
}

module.exports = { getHrEmployees };
