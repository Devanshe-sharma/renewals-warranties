// Business rules for travel requests — kept in one place so the routes,
// the escalation cron and the emails all agree.

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Minimum notice before departure, so the Admin has time to arrange tickets.
const MIN_NOTICE_HOURS = { Normal: 48, Tatkal: 24 };

// Admin gets 2 days from manager approval to book.
const ADMIN_BOOKING_WINDOW_HOURS = 48;

// Employee: no penalty for raising the travel request within 2 days of the
// event being created; -1 point for every full day after that.
const EVENT_GRACE_DAYS = 2;

// Escalation timings.
const MANAGER_REMINDER_HOURS = 24;
const MANAGER_ESCALATE_HOURS = 48;
const ADMIN_REMINDER_HOURS = 24; // after approval; escalation is at adminDueAt

// Start hour (IST) of each departure time slot on the form.
const SLOT_START_HOUR = {
  'Early Morning (12 AM – 6 AM)': 0,
  'Morning (6 AM – 12 PM)': 6,
  'Afternoon (12 PM – 4 PM)': 12,
  'Evening (4 PM – 8 PM)': 16,
  'Night (8 PM – 12 AM)': 20,
};

// Departure as an instant: the start of the chosen slot in IST (server runs
// in UTC, so the offset is pinned). No slot → start of the day, the strictest.
function departureAt(outDate, outTime) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(outDate || '')) return null;
  const hh = String(SLOT_START_HOUR[outTime] ?? 0).padStart(2, '0');
  const d = new Date(`${outDate}T${hh}:00:00+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function noticeError(departure, bookingType, now = new Date()) {
  if (!departure) return 'Departure date is required';
  const need = MIN_NOTICE_HOURS[bookingType] ?? MIN_NOTICE_HOURS.Normal;
  const hours = (departure.getTime() - now.getTime()) / HOUR;
  if (hours >= need) return '';
  return bookingType === 'Tatkal'
    ? 'Tatkal requests must be raised at least 24 hours before departure.'
    : 'Travel requests must be raised at least 2 days before departure so Admin can arrange tickets. For Tatkal, at least 24 hours.';
}

function employeeLateScore(eventCreatedAt, requestedAt = new Date()) {
  if (!eventCreatedAt) return { eventLagDays: null, employeeScore: 0 };
  const lag = Math.max(0, Math.floor((requestedAt - new Date(eventCreatedAt)) / DAY));
  return { eventLagDays: lag, employeeScore: lag > EVENT_GRACE_DAYS ? EVENT_GRACE_DAYS - lag : 0 };
}

// Full days (rounded up) past the due time; 0 if on time.
function adminDelay(adminDueAt, at = new Date()) {
  if (!adminDueAt) return { adminDelayDays: 0, adminScore: 0 };
  const late = at - new Date(adminDueAt);
  const days = late > 0 ? Math.ceil(late / DAY) : 0;
  return { adminDelayDays: days, adminScore: days ? -days : 0 };
}

function describeLag(days) {
  if (days == null) return '—';
  if (days === 0) return 'Same day';
  return `${days} day${days === 1 ? '' : 's'}`;
}

module.exports = {
  HOUR,
  DAY,
  MIN_NOTICE_HOURS,
  ADMIN_BOOKING_WINDOW_HOURS,
  EVENT_GRACE_DAYS,
  MANAGER_REMINDER_HOURS,
  MANAGER_ESCALATE_HOURS,
  ADMIN_REMINDER_HOURS,
  departureAt,
  noticeError,
  employeeLateScore,
  adminDelay,
  describeLag,
};
