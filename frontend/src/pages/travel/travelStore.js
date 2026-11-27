// Travel requests live in MongoDB behind /api/travel so the employee, their
// manager and Admin all see the same records.
export const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

// Calls the travel API and returns { ok, status, data } without throwing on
// HTTP errors, so callers can show the backend's message.
export async function travelApi(token, path, { method = "GET", body } = {}) {
  try {
    const res = await fetch(`${API}/api/travel${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { message: `Could not reach the server at ${API}` } };
  }
}

export function errorMessage({ status, data }, fallback = "Something went wrong") {
  if (status === 401) return "Your session has expired — log out and log in again";
  return data?.message || data?.error || (status ? `${fallback} (HTTP ${status})` : fallback);
}

// Must match backend/utils/travel/travelRules.js.
export const MIN_NOTICE_HOURS = { Normal: 48, Tatkal: 24 };
export const EVENT_GRACE_DAYS = 2;

export const SLOT_START_HOUR = {
  "Early Morning (12 AM – 6 AM)": 0,
  "Morning (6 AM – 12 PM)": 6,
  "Afternoon (12 PM – 4 PM)": 12,
  "Evening (4 PM – 8 PM)": 16,
  "Night (8 PM – 12 AM)": 20,
};

export function departureAt(outDate, outTime) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(outDate || "")) return null;
  const hh = String(SLOT_START_HOUR[outTime] ?? 0).padStart(2, "0");
  const d = new Date(`${outDate}T${hh}:00:00+05:30`);
  return isNaN(d) ? null : d;
}

export function eventLag(eventCreatedAt, at = new Date()) {
  if (!eventCreatedAt) return null;
  const days = Math.max(0, Math.floor((at - new Date(eventCreatedAt)) / 86400000));
  return { days, score: -Math.max(0, days - EVENT_GRACE_DAYS) };
}

export const fmtDate = (d) => {
  if (!d) return "—";
  const x = /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T00:00:00+05:30`) : new Date(d);
  return isNaN(x) ? d : x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
