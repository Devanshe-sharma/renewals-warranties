import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar, { NavbarButton } from "../components/navbar";
import NewForm from "./newform";
import UpdateForm from "./updateform";

const API       = process.env.REACT_APP_API_URL;
const LIME      = "#2563EB";
const LIME_PALE = "#EFF6FF";

const FREQ_MONTHS = { Monthly: 1, Quarterly: 3, "Half Yearly": 6, Annually: 12 };
const DEFAULT_REMIND = {
  Annually:      { r1: 30, r2: 10, rf: 1 },
  "Half Yearly": { r1: 30, r2: 10, rf: 1 },
  Quarterly:     { r1: 10, r2:  5, rf: 1 },
  Monthly:       { r1: 10, r2:  5, rf: 1 },
};

const FREQ_COUNT_OPTIONS = {
  Monthly:       Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1} Month${i > 0 ? "s" : ""}`,      value: i + 1 })),
  Quarterly:     Array.from({ length: 4  }, (_, i) => ({ label: `${i + 1} Quarter${i > 0 ? "s" : ""}`,    value: (i + 1) * 3 })),
  "Half Yearly": Array.from({ length: 4  }, (_, i) => ({ label: `${i + 1} Half Year${i > 0 ? "s" : ""}`,  value: (i + 1) * 6 })),
  Annually:      Array.from({ length: 5  }, (_, i) => ({ label: `${i + 1} Year${i > 0 ? "s" : ""}`,       value: (i + 1) * 12 })),
};

// ── 5 Status colours ──────────────────────────────────────
const STATUS_COLOURS = {
  due:         { bg: "#fcf700", text: "#374151", label: "Due"        },
  overdue:     { bg: "#ee0606", text: "#991B1B", label: "Overdue"    },
  not_yet_due: { bg: "#FFFFFF", text: "#6B7280", label: "Not Yet Due" },
};

// ── Helpers ───────────────────────────────────────────────
const fmtDate     = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtISO      = (d) => d ? new Date(d).toISOString().split("T")[0] : "";
const addDays     = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const addMonths   = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const fmtCurr     = (n) => n != null && n !== "" ? `₹ ${Number(n).toLocaleString("en-IN")}` : "—";
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const toDay       = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };




const actionBtn = {
  border: "none",
  borderRadius: 5,
  padding: "4px 4px",
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  whiteSpace: "nowrap",
  lineHeight: 1.2,
};

// ────────────────────────────────────────────────────────
// computeStatus
// ────────────────────────────────────────────────────────
export function computeStatus(renewal, latestEvent = null) {
  const today = toDay(new Date());

  // ── If latest event exists and renewal_required = Yes ──
  // The item was renewed — now check if the NEW expiry is approaching
  if (latestEvent && latestEvent.renewal_required === "Yes") {
    // Use new_expiry_date from the latest event as the new end date
    const newExpiry = latestEvent.new_expiry_date
      ? toDay(new Date(latestEvent.new_expiry_date))
      : null;
    const newR2 = latestEvent.new_expiry_date
      ? toDay(new Date(new Date(latestEvent.new_expiry_date).setDate(
          new Date(latestEvent.new_expiry_date).getDate() - (renewal.reminder2Days || 10)
        )))
      : null;

    if (!newExpiry) return "not_yet_due";
    if (today > newExpiry)              return "overdue";
    if (newR2 && today >= newR2)        return "due";
    return "not_yet_due";
  }

  // ── If latest event is "No" (closed/discontinued) ──
  if (latestEvent && latestEvent.renewal_required === "No") {
    return "overdue";
  }

  // ── No event yet — use original renewal dates ──────────
  const endDate = renewal.endDate   ? toDay(new Date(renewal.endDate))        : null;
  const r2Date  = renewal.reminder2Date ? toDay(new Date(renewal.reminder2Date)) : null;

  if (!endDate)                        return "not_yet_due";
  if (today > endDate)                 return "overdue";
  if (r2Date && today >= r2Date)       return "due";
  return "not_yet_due";
}

export function getStatus() { return "not_yet_due"; }

// ── Status badge ──────────────────────────────────────────
export function StatusBadge({ status }) {
  const c = STATUS_COLOURS[status] || STATUS_COLOURS.not_yet_due;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", border: status === "not_yet_due" ? "1px solid #E5E7EB" : "none" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function DaysChip({ endDate }) {
  if (!endDate) return null;
  const d = daysBetween(new Date(), new Date(endDate));
  if (d < 0) return <span style={{ color: "#9CA3AF", fontSize: 12 }}>{Math.abs(d)}d overdue</span>;
  return <span style={{ color: d <= 7 ? "#EF4444" : d <= 30 ? "#F59E0B" : "#9CA3AF", fontSize: 12, fontWeight: 600 }}>in {d}d</span>;
}

function StatsCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: `3px solid ${accent || LIME}` }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#111", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function TH({ children }) {
  return (
    <th style={{ padding: "11px 16px", fontSize: 11, fontWeight: 700, color: "#6B7280", textAlign: "left", letterSpacing: 0.6, textTransform: "uppercase", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}


// ── Map DB renewal → frontend ─────────────────────────────
const mapRenewal = (r) => ({
  id:                 r.item_id                                   || "",
  itemName:           r.item_name                                 || "",
  category:           r.category                                  || "",
  subcategory:        r.subcategory                               || "",
  description:        r.description                               || "",
  vendor:             r.vendor                                    || "",
  authority:          r.authority                                 || "",

  // Renewer
  renewerName:        r.renewer_name       || r.emp_name          || "",
  renewerDepartment:  r.renewer_department || r.department        || "",
  renewerEmail:       r.renewer_email      || r.email             || "",
  responsible:        r.renewer_name       || r.emp_name          || "",
  selectedRenewerId:  r.selected_renewer_id                       || "",

  // Employee / User
  empName:            r.emp_name                                  || "",
  empId:              r.emp_id                                    || "",
  department:         r.department                                || "",
  designation:        r.designation                               || "",
  email:              r.email                                     || "",
  reportingManager:   r.reporting_manager                         || "",
  selectedEmployeeId: r.selected_employee_id                      || "",

  // Dates
  startDate:          r.start_date     ? r.start_date.split("T")[0]     : "",
  endDate:            r.end_date       ? r.end_date.split("T")[0]       : "",
  reminder2Date:      r.reminder2_date ? r.reminder2_date.split("T")[0] : "",

  // Frequency & reminders
  frequency:          r.frequency                                 || "",
  frequencyCount:     r.frequency_count                           ?? 1,
  reminder1Days:      r.reminder1_days                            ?? 30,
  reminder2Days:      r.reminder2_days                            ?? 10,
  reminderFinalDays:  r.reminder_final_days                       ?? 1,

  // Misc
  lastRenewedAt:      r.last_renewed_at                           || null,
  remarks:            r.remarks                                   || "",
  link:               r.link                                      || "",

  // Warranty user
  userPerson:         r.user_person                               || "",
  userDepartment:     r.user_department                           || "",

  // Attachments
  attachment1Link:    r.attachment1_link                          || "",
  attachment2Link:    r.attachment2_link                          || "",

  // Financials
  cost:               r.cost                                      ?? 0,
  currency:           r.currency                                  || "INR",

  // Status / archive
  active:             r.active                                    ?? true,
  isClosed:           r.is_closed                                 ?? false,
  closedAt:           r.closed_at                                 || null,
  pastRenewals:       r.past_renewals                             || [],
  createdAt:          r.createdAt                                 || null,

  // Credentials & service
  serviceLink:        r.service_link                              || "",
  credentialUsername: r.credential_username                       || "",
  credentialPassword: r.credential_password                       || "",

  // CC & recipients
  ccRecipients:       Array.isArray(r.cc_recipients) ? r.cc_recipients : [],
});

function buildLatestEventMap(events) {
  const map = {};
  for (const ev of events) {
    if (!map[ev.item_id]) map[ev.item_id] = ev;
  }
  return map;
}

// ── Detail view helpers ───────────────────────────────────
function DetailSection({ title, children }) {
  return (
    <div style={{ border: "1px solid #F3F4F6", borderRadius: 10, overflow: "visible" }}>
      <div style={{ background: "#F9FAFB", padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#374151", borderBottom: "1px solid #F3F4F6" }}>{title}</div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
function DetailGrid({ cols = 3, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "10px 24px" }}>
      {children}
    </div>
  );
}
function DetailField({ label, value, mono, highlight }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, color: highlight ? "#059669" : "#111", fontWeight: highlight ? 700 : 500, marginTop: 2, fontFamily: mono ? "monospace" : "inherit" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function PasswordField({ label, value }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#111", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{show ? (value || "—") : (value ? "••••••••" : "—")}</span>
        {value && (
          <button onClick={() => setShow(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#6B7280", padding: 0 }}>
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// HISTORY MODAL
// ────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE HistoryModal — drop-in replacement for dashboard.jsx
// Requires: computeStatus, StatusBadge, fmtDate, fmtCurr, toDay
// (all already defined in your dashboard.jsx)
// ─────────────────────────────────────────────────────────────────────────────

function HistoryModal({ renewal, onClose, onEdit }) {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/renewal-events?item_id=${renewal.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setEvents(d.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [renewal.id]);

  const latestEvent  = events.length > 0 ? events[0] : null;
  const latestStatus = computeStatus(renewal, latestEvent);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
               backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
               zIndex: 2147483647, display: "flex", alignItems: "center",
               justifyContent: "center", padding: "24px 16px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 900,
                 maxHeight: "90vh", overflowY: "auto",
                 boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
      >

        {/* ── Header ── */}
        <div style={{ background: LIME, borderRadius: "16px 16px 0 0", padding: "16px 24px",
                      display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{renewal.itemName}</div>
            <div style={{ fontSize: 12, color: "#bfdbfe", marginTop: 2 }}>
              {renewal.id} · {renewal.category}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge status={latestStatus} />
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
                       width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex",
                       alignItems: "center", justifyContent: "center", color: "#fff" }}
            >✕</button>
          </div>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Item Details ── */}
          <DetailSection title="📋 Item Details">
            <DetailGrid cols={3}>
              <DetailField label="Item ID"     value={renewal.id}          mono />
              <DetailField label="Category"    value={renewal.category} />
              <DetailField label="Subcategory" value={renewal.subcategory} />
              <DetailField label="Item Name"   value={renewal.itemName} />
              <DetailField label="Vendor"      value={renewal.vendor} />
              <DetailField label="Authority"   value={renewal.authority} />
            </DetailGrid>

            {/* Cost */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
              <DetailGrid cols={3}>
                <DetailField label="Cost"     value={fmtCurr(renewal.cost)} highlight />
                <DetailField label="Currency" value={renewal.currency} />
              </DetailGrid>
            </div>

            {/* Service Link */}
         
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 4 }}>Service Link</div>
                <a href={renewal.serviceLink} target="_blank" rel="noopener noreferrer"
                   style={{ fontSize: 13, color: "#1976d2", textDecoration: "none", wordBreak: "break-all" }}>
                  {renewal.serviceLink}
                </a>
              </div>
            

            {/* Description */}
           
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 4 }}>
                  Description & Remarks
                </div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {renewal.description}
                </div>
              </div>
            

            {/* Attachments */}
          
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 8 }}>
                  📎 Attachments
                </div>
                <DetailGrid cols={2}>
                  {[1, 2].map(n => {
                    const link = renewal[`attachment${n}Link`];
                    return link ? (
                      <div key={n}>
                        <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Attachment {n}</div>
                        <a href={link} target="_blank" rel="noopener noreferrer"
                           style={{ fontSize: 13, color: "#1976d2", textDecoration: "none", wordBreak: "break-all" }}>
                          {link}
                        </a>
                      </div>
                    ) : null;
                  })}
                </DetailGrid>
              </div>
            

            {/* Credentials */}
            {(renewal.credentialUsername || renewal.credentialPassword) && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6",
                            background: "#FFF7ED", border: "1px solid #FED7AA",
                            borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 10 }}>
                  🔐 Credentials
                </div>
                <DetailGrid cols={2}>
                  <DetailField label="Username" value={renewal.credentialUsername} />
                  <PasswordField label="Password" value={renewal.credentialPassword} />
                </DetailGrid>
              </div>
            )}
          </DetailSection>

          {/* ── Renewer Details ── */}
          <DetailSection title="👤 Renewer Details">
            <DetailGrid cols={3}>
              <DetailField label="Renewer Name"       value={renewal.renewerName} />
              <DetailField label="Renewer Department" value={renewal.renewerDepartment} />
              <DetailField label="Renewer Email"      value={renewal.renewerEmail} />
            </DetailGrid>
          </DetailSection>

          {/* ── User Details ── */}
          <DetailSection title="👤 User Details">
            <DetailGrid cols={3}>
              <DetailField label="Employee Name"     value={renewal.empName} />
              <DetailField label="Employee ID"       value={renewal.empId} mono />
              <DetailField label="Department"        value={renewal.department} />
              <DetailField label="Designation"       value={renewal.designation} />
              <DetailField label="Email"             value={renewal.email} />
              <DetailField label="Reporting Manager" value={renewal.reportingManager} />
            </DetailGrid>

            {/* CC Recipients */}
            {renewal.ccRecipients?.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 8 }}>
                  CC Recipients
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {renewal.ccRecipients.map(c => (
                    <span key={c.id}
                      style={{ background: "#DBEAFE", color: "#1e40af", padding: "3px 10px",
                               borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warranty user */}
            {renewal.category === "Warranty" && (renewal.userPerson || renewal.userDepartment) && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                <DetailGrid cols={2}>
                  <DetailField label="Assigned User"   value={renewal.userPerson} />
                  <DetailField label="User Department" value={renewal.userDepartment} />
                </DetailGrid>
              </div>
            )}
          </DetailSection>

          {/* ── Reminders ── */}
          <DetailSection title="🔔 Reminders">
            <DetailGrid cols={3}>
              <DetailField label="Start Date"     value={fmtDate(renewal.startDate)} />
              <DetailField label="End Date"       value={fmtDate(renewal.endDate)} highlight />
              <DetailField label="Frequency"      value={renewal.frequency} />
              <DetailField label="Frequency Count" value={renewal.frequencyCount ? String(renewal.frequencyCount) : "—"} />
              <DetailField label="1st Reminder"   value={renewal.reminder1Days   ? `${renewal.reminder1Days} days before`  : "—"} />
              <DetailField label="2nd Reminder"   value={renewal.reminder2Days   ? `${renewal.reminder2Days} days before`  : "—"} />
              <DetailField label="Final Reminder" value={renewal.reminderFinalDays ? `${renewal.reminderFinalDays} day before` : "—"} />
              {renewal.reminder2Date && (
                <DetailField label="2nd Reminder Date" value={fmtDate(renewal.reminder2Date)} />
              )}
            </DetailGrid>
          </DetailSection>

          {/* ── Renewal History table ── */}
          <div style={{ border: "1px solid #F3F4F6", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: "#F9FAFB", padding: "8px 16px", fontSize: 12, fontWeight: 700,
                          color: "#374151", borderBottom: "1px solid #F3F4F6",
                          display: "flex", justifyContent: "space-between" }}>
              <span>Renewal History</span>
              <span style={{ color: "#9CA3AF", fontWeight: 400 }}>
                {events.length} event{events.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#9CA3AF" }}>
                Loading...
              </div>
            ) : events.length === 0 ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                No renewal events recorded yet
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Event", "Renewal Req.", "Prev Expiry", "New Date", "New Expiry",
                        "Amount", "Mode", "By", "On"].map(h => (
                        <th key={h}
                          style={{ padding: "9px 14px", fontSize: 10, fontWeight: 700,
                                   color: "#9CA3AF", textAlign: "left", letterSpacing: 0.5,
                                   textTransform: "uppercase", borderBottom: "1px solid #F3F4F6",
                                   whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev, idx) => {
                      const isLatest = idx === 0;

                      // derive row status exactly as original code did
                      let evStatus;
                      if (ev.renewal_required === "No") {
                        evStatus = "overdue";
                      } else {
                        const renewedOn  = ev.new_renewal_date ? toDay(new Date(ev.new_renewal_date)) : null;
                        const prevExpiry = ev.prev_expiry_date ? toDay(new Date(ev.prev_expiry_date)) : null;
                        evStatus = (renewedOn && prevExpiry && renewedOn <= prevExpiry)
                          ? "done" : "done_delayed";
                      }

                      return (
                        <tr
                          key={ev._id}
                          style={{ borderBottom: "1px solid #F9FAFB",
                                   background: isLatest ? "#EFF6FF" : "transparent" }}
                          onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.97)"}
                          onMouseLeave={e => e.currentTarget.style.filter = "none"}
                        >
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>
                              {ev.event_id}
                            </div>
                            {isLatest && (
                              <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, marginTop: 1 }}>
                                LATEST
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "11px 14px" }}>
                            <span style={{
                              background: ev.renewal_required === "Yes" ? "#DCFCE7" : "#FEE2E2",
                              color:      ev.renewal_required === "Yes" ? "#166534" : "#991B1B",
                              padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700
                            }}>
                              {ev.renewal_required || "—"}
                            </span>
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>
                            {fmtDate(ev.prev_expiry_date)}
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>
                            {fmtDate(ev.new_renewal_date)}
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#059669", fontWeight: 600 }}>
                            {fmtDate(ev.new_expiry_date)}
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>
                            {fmtCurr(ev.renewal_amount)}
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>
                            {ev.payment_mode || "—"}
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>
                            {ev.renewed_by || "—"}
                          </td>
                          <td style={{ padding: "11px 14px", fontSize: 11, color: "#9CA3AF" }}>
                            {fmtDate(ev.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button onClick={onClose} style={cancelStyle}>Close</button>
            <button onClick={onEdit}  style={saveStyle}>✏️ Edit Item</button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// EDIT MODAL
// ────────────────────────────────────────────────────────


function EditModal({ renewal, categories: categoriesProp, onClose, onSaved }) {
  const [employees,    setEmployees]    = useState([]);
  const [categories,  setCategories]  = useState(categoriesProp || []);
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState({});
  const [words,        setWords]        = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [ccSearch,     setCcSearch]     = useState("");
  const [ccOpen,       setCcOpen]       = useState(false);
 
  const [form, setForm] = useState({
    // Item
    itemName:           renewal.itemName           || "",
    category:           renewal.category           || "",
    subcategory:        renewal.subcategory        || "",
    description:        renewal.description        || "",
    vendor:             renewal.vendor             || "",
    authority:          renewal.authority          || "",
    serviceLink:        renewal.serviceLink        || "",
    credentialUsername: renewal.credentialUsername || "",
    credentialPassword: renewal.credentialPassword || "",
    attachment1Link:    renewal.attachment1Link    || "",
    attachment2Link:    renewal.attachment2Link    || "",
    // Renewer
    selectedRenewerId:  renewal.selectedRenewerId  || "",
    renewerName:        renewal.renewerName        || "",
    renewerDepartment:  renewal.renewerDepartment  || "",
    renewerEmail:       renewal.renewerEmail       || "",
    // User
    selectedEmployeeId: renewal.selectedEmployeeId || "",
    empName:            renewal.empName            || "",
    empId:              renewal.empId              || "",
    department:         renewal.department         || "",
    designation:        renewal.designation        || "",
    email:              renewal.email              || "",
    reportingManager:   renewal.reportingManager   || "",
    ccRecipients:       renewal.ccRecipients       || [],
    userPerson:         renewal.userPerson         || "",
    userDepartment:     renewal.userDepartment     || "",
    // Reminders
    startDate:          renewal.startDate          || "",
    frequency:          renewal.frequency          || "",
    frequencyCount:     renewal.frequencyCount     || 1,
    customEndDate:      renewal.endDate            || "",
    reminder1Days:      renewal.reminder1Days      ?? 30,
    reminder2Days:      renewal.reminder2Days      ?? 10,
    reminderFinalDays:  renewal.reminderFinalDays  ?? 1,
    // Misc
    remarks:            renewal.remarks            || "",
    link:               renewal.link               || "",
  });
 
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
 
  // ── fetch employees ──────────────────────────────────────────────────────
  useEffect(() => {
  fetch(`${API}/api/employee`)
    .then(r => r.json())
    .then(setEmployees)
    .catch(console.error);

  // fetch categories independently
  fetch(`${API}/api/categories`)        // ← your actual endpoint
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) setCategories(data);
      else if (data.success && Array.isArray(data.data)) setCategories(data.data);
    })
    .catch(console.error);
}, []);
 
  // ── word count ───────────────────────────────────────────────────────────
  useEffect(() => {
    setWords((form.description || "").trim().split(/\s+/).filter(Boolean).length);
  }, [form.description]);
 
  // ── default reminder days on frequency change ────────────────────────────
  // AFTER — use a ref to skip the first run
const isFirstRender = useRef(true);
useEffect(() => {
  if (isFirstRender.current) { isFirstRender.current = false; return; }
  if (form.frequency && DEFAULT_REMIND[form.frequency]) {
    const d = DEFAULT_REMIND[form.frequency];
    setForm(f => ({ ...f, reminder1Days: d.r1, reminder2Days: d.r2, reminderFinalDays: d.rf, frequencyCount: 1 }));
  }
}, [form.frequency]); // eslint-disable-line
 
  // ── close CC dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    if (!ccOpen) return;
    const handler = (e) => { if (!e.target.closest("[data-cc-dropdown]")) setCcOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ccOpen]);
 
  // ── derived: category → subcategories ───────────────────────────────────
  const selectedCategory = categories.find(c => c.name === form.category);
  const subcats = selectedCategory?.subcategories || [];
 
  // ── derived: end date ────────────────────────────────────────────────────
  const endDate = (() => {
    if (form.frequency === "Other") return form.customEndDate || "";
    if (!form.startDate || !form.frequency) return "";
    const months = ["Monthly", "Annually"].includes(form.frequency)
      ? (form.frequencyCount || 1)
      : (FREQ_MONTHS[form.frequency] || 12);
    return fmtISO(addMonths(new Date(form.startDate), months));
  })();
 
  const rDate = (days) => endDate ? fmtISO(addDays(new Date(endDate), -days)) : "";
 
  // ── employee select handlers ─────────────────────────────────────────────
  const handleRenewerSelect = (id) => {
    const emp = employees.find(e => e._id === id);
    if (!emp) {
      setForm(f => ({ ...f, selectedRenewerId: "", renewerName: "", renewerDepartment: "", renewerEmail: "" }));
      return;
    }
    setForm(f => ({
      ...f,
      selectedRenewerId:  id,
      renewerName:        emp.Emp_name                                     || "",
      renewerDepartment:  emp.Department                                    || "",
      renewerEmail:       emp["desig Email Id"] || emp["Dept Group Email"]  || "",
    }));
  };
 
  const handleEmployeeSelect = (id) => {
    const emp = employees.find(e => e._id === id);
    if (!emp) {
      setForm(f => ({ ...f, selectedEmployeeId: "", empName: "", empId: "", department: "", designation: "", email: "", reportingManager: "" }));
      return;
    }
    setForm(f => ({
      ...f,
      selectedEmployeeId: id,
      empName:            emp.Emp_name            || "",
      empId:              String(emp.Emp_id)       || "",
      department:         emp.Department           || "",
      designation:        emp.Designation          || "",
      email:              emp["desig Email Id"]    || "",
      reportingManager:   emp["Reporting Manager"] || "",
    }));
  };
 
  // ── CC helpers ───────────────────────────────────────────────────────────
  const toggleCC = (emp) => {
    setForm(f => {
      const exists = f.ccRecipients.find(c => c.id === emp._id);
      return {
        ...f,
        ccRecipients: exists
          ? f.ccRecipients.filter(c => c.id !== emp._id)
          : [...f.ccRecipients, { id: emp._id, name: emp.Emp_name, email: emp["desig Email Id"] || "" }],
      };
    });
  };
 
  const ccFiltered = employees
    .filter(em =>
      (em.Emp_name    || "").toLowerCase().includes(ccSearch.toLowerCase()) ||
      (em.Designation || "").toLowerCase().includes(ccSearch.toLowerCase())
    )
    .slice()
    .sort((a, b) => (a.Emp_name || "").localeCompare(b.Emp_name || ""));
 
  // ── validation ───────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.itemName?.trim()) e.itemName     = "Required";
    if (!form.category)         e.category     = "Required";
    if (!form.startDate)        e.startDate    = "Required";
    if (!form.frequency)        e.frequency    = "Required";
    if (form.frequency === "Other" && !form.customEndDate) e.customEndDate = "Required";
    if (words > 150)            e.description  = "Max 150 words";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/renewals/${renewal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, endDate }),
      });
      const data = await res.json();
      if (data.success) { onSaved(); onClose(); }
      else alert(`❌ ${data.message}`);
    } catch (err) {
      alert("❌ Failed to save");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
 
  // ── style helpers ────────────────────────────────────────────────────────
  const inp = (name, extra = {}) => ({
    border: `1.5px solid ${errors[name] ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#111",
    outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", ...extra,
  });
  const sel = (name) => ({
    ...inp(name), cursor: "pointer", background: "#fff", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32,
  });
  const ro = (extra = {}) => inp("", { background: "#F9FAFB", color: "#6B7280", ...extra });
 
  const eg2 = { display: "grid", gridTemplateColumns: "1fr 1fr",     gap: 14 };
  const eg3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 };
 
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
               backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
               zIndex: 2147483647, display: "flex", alignItems: "center",
               justifyContent: "center", padding: "24px 16px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 820,
                 maxHeight: "90vh", overflowY: "auto",
                 boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}
      >
 
        {/* ── Header ── */}
        <div style={{ background: LIME, borderRadius: "16px 16px 0 0", padding: "16px 24px",
                      display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Edit Renewal</div>
            <div style={{ fontSize: 12, color: "#bfdbfe", marginTop: 2 }}>
              {renewal.id} · {renewal.itemName}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
                     width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex",
                     alignItems: "center", justifyContent: "center", color: "#fff" }}
          >✕</button>
        </div>
 
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
 
          {/* ══════════════════════════════════════════════════════════════
              SECTION 1 — Item Details
          ══════════════════════════════════════════════════════════════ */}
          <ESection title="📋 Item Details">
 
            {/* Row: Item ID + Category */}
            <div style={eg2}>
              <EField label="Item ID">
                <input value={renewal.id} readOnly style={ro()} />
              </EField>
              <EField label="Category *" error={errors.category}>
              <select
                value={form.category}
                onChange={e => { set("category", e.target.value); set("subcategory", ""); }}
                style={sel("category")}
              >
                <option value="">Choose category</option>
                {categories.length === 0 && form.category && (
                  <option value={form.category}>{form.category} (loading...)</option>
                )}
                {form.category && categories.length > 0 && !categories.find(c => c.name === form.category) && (
                  <option value={form.category}>{form.category}</option>
                )}
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </EField>
            </div>
 
            {/* Subcategory — always rendered, options come from selected category */}
            <div style={{ marginTop: 14 }}>
              <EField label="Subcategory">
                <select
                  value={form.subcategory}
                  onChange={e => set("subcategory", e.target.value)}
                  style={sel("")}
                >
                  <option value="">None</option>
                  {form.subcategory && !subcats.find(s => s.name === form.subcategory) && (
                    <option value={form.subcategory}>{form.subcategory}</option>
                  )}
                  {subcats.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </EField>
            </div>
 
            {/* Row: Item Name + Vendor + Authority + Service Link */}
            <div style={{ ...eg2, marginTop: 14 }}>
              <EField label="Item Name *" error={errors.itemName}>
                <input
                  value={form.itemName}
                  onChange={e => set("itemName", e.target.value)}
                  style={inp("itemName")}
                />
              </EField>
              <EField label="Vendor">
                <input
                  value={form.vendor}
                  onChange={e => set("vendor", e.target.value)}
                  style={inp("")}
                />
              </EField>
              <EField label="Authority">
                <input
                  value={form.authority}
                  onChange={e => set("authority", e.target.value)}
                  style={inp("")}
                />
              </EField>
              <EField label="Service Link">
                <input
                  type="url"
                  value={form.serviceLink}
                  onChange={e => set("serviceLink", e.target.value)}
                  style={inp("")}
                  placeholder="https://..."
                />
              </EField>
            </div>
 
            {/* Description */}
            <div style={{ marginTop: 14 }}>
              <EField label="Description & Remarks" error={errors.description}>
                <textarea
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  style={{ ...inp("description"), resize: "vertical", minHeight: 70 }}
                />
                <div style={{ fontSize: 11, color: words > 150 ? "#EF4444" : "#9CA3AF",
                              textAlign: "right", marginTop: 2 }}>
                  {words} / 150 words
                </div>
              </EField>
            </div>
 
            {/* Credentials */}
            <div style={{ marginTop: 14, background: "#FFF7ED", border: "1px solid #FED7AA",
                          borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 12 }}>
                🔐 Credentials{" "}
                <span style={{ fontSize: 11, fontWeight: 400, color: "#B45309" }}>
                  (visible to renewer only)
                </span>
              </div>
              <div style={eg2}>
                <EField label="Username">
                  <input
                    value={form.credentialUsername}
                    onChange={e => set("credentialUsername", e.target.value)}
                    style={inp("")}
                    placeholder="admin@example.com"
                  />
                </EField>
                <EField label="Password (confidential)">
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.credentialPassword}
                      onChange={e => set("credentialPassword", e.target.value)}
                      style={{ ...inp(""), paddingRight: 44 }}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      style={{ position: "absolute", right: 10, top: "50%",
                               transform: "translateY(-50%)", background: "none",
                               border: "none", cursor: "pointer", fontSize: 14, color: "#6B7280" }}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </EField>
              </div>
            </div>
 
            {/* Attachments */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                📎 Attachments (optional)
              </div>
              {[1, 2].map(n => (
                <div key={n} style={{ marginBottom: n === 1 ? 12 : 0 }}>
                  <EField label={`Attachment ${n}`}>
                    <input
                      type="url"
                      value={form[`attachment${n}Link`]}
                      onChange={e => set(`attachment${n}Link`, e.target.value)}
                      style={inp("")}
                      placeholder="Paste a Drive / web link"
                    />
                  </EField>
                </div>
              ))}
            </div>
 
          </ESection>
 
          {/* ══════════════════════════════════════════════════════════════
              SECTION 2 — Renewer Details
          ══════════════════════════════════════════════════════════════ */}
          <ESection title="👤 Renewer Details">
            <EField label="Select Renewer">
              <select
                value={form.selectedRenewerId}
                onChange={e => handleRenewerSelect(e.target.value)}
                style={sel("")}
              >
                <option value="">Select renewer</option>
                {employees
                  .slice()
                  .sort((a, b) =>
                    (a.Designation || "").localeCompare(b.Designation || "") ||
                    (a.Emp_name    || "").localeCompare(b.Emp_name    || "")
                  )
                  .map(em => (
                    <option key={em._id} value={em._id}>
                      {em.Designation ? `${em.Designation} — ` : ""}{em.Emp_name}
                    </option>
                  ))}
              </select>
            </EField>
            <div style={{ ...eg3, marginTop: 14 }}>
              <EField label="Renewer Name">
                <input value={form.renewerName}       readOnly style={ro()} />
              </EField>
              <EField label="Department">
                <input value={form.renewerDepartment} readOnly style={ro()} />
              </EField>
              <EField label="Email">
                <input value={form.renewerEmail}      readOnly style={ro()} />
              </EField>
            </div>
          </ESection>
 
          {/* ══════════════════════════════════════════════════════════════
              SECTION 3 — User Details
          ══════════════════════════════════════════════════════════════ */}
          <ESection title="👤 User Details">
            <EField label="Employee">
              <select
                value={form.selectedEmployeeId}
                onChange={e => handleEmployeeSelect(e.target.value)}
                style={sel("")}
              >
                <option value="">Select employee</option>
                {employees
                  .slice()
                  .sort((a, b) =>
                    (a.Designation || "").localeCompare(b.Designation || "") ||
                    (a.Emp_name    || "").localeCompare(b.Emp_name    || "")
                  )
                  .map(em => (
                    <option key={em._id} value={em._id}>
                      {em.Designation ? `${em.Designation} — ` : ""}{em.Emp_name}
                    </option>
                  ))}
              </select>
            </EField>
            <div style={{ ...eg2, marginTop: 14 }}>
              <EField label="Employee ID">
                <input value={form.empId}           readOnly style={ro()} />
              </EField>
              <EField label="Department">
                <input value={form.department}       readOnly style={ro()} />
              </EField>
              <EField label="Designation">
                <input value={form.designation}      readOnly style={ro()} />
              </EField>
              <EField label="Email">
                <input value={form.email}            readOnly style={ro()} />
              </EField>
              <EField label="Reporting Manager">
                <input value={form.reportingManager} readOnly style={ro()} />
              </EField>
            </div>
 
            {/* CC multi-select */}
            <div style={{ marginTop: 14 }}>
              <EField label="CC To (send mail)">
                <div style={{ position: "relative" }} data-cc-dropdown>
                  <div
                    onClick={() => setCcOpen(o => !o)}
                    style={{ ...inp(""), cursor: "pointer", minHeight: 42, height: "auto",
                             display: "flex", flexWrap: "wrap", gap: 8,
                             alignItems: "flex-start", padding: "8px 12px", overflow: "visible" }}
                  >
                    {form.ccRecipients.length === 0 && (
                      <span style={{ color: "#9CA3AF" }}>Select people to CC…</span>
                    )}
                    {form.ccRecipients.map(c => (
                      <span
                        key={c.id}
                        style={{ background: "#DBEAFE", color: "#1e40af", padding: "4px 10px",
                                 borderRadius: 12, fontSize: 12, fontWeight: 600, display: "flex",
                                 alignItems: "center", gap: 6, whiteSpace: "normal",
                                 wordBreak: "break-word", lineHeight: 1.4 }}
                      >
                        {c.name}
                        <span
                          onClick={e => {
                            e.stopPropagation();
                            toggleCC({ _id: c.id, Emp_name: c.name, "desig Email Id": c.email });
                          }}
                          style={{ cursor: "pointer", fontWeight: 700 }}
                        >×</span>
                      </span>
                    ))}
                  </div>
 
                  {ccOpen && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0,
                                  background: "#fff", border: "1.5px solid #E5E7EB",
                                  borderRadius: 8, zIndex: 1000,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                  maxHeight: 240, overflowY: "auto" }}>
                      <div style={{ padding: "8px 10px", borderBottom: "1px solid #F3F4F6" }}>
                        <input
                          autoFocus
                          value={ccSearch}
                          onChange={e => setCcSearch(e.target.value)}
                          placeholder="Search by name or designation…"
                          style={{ ...inp(""), fontSize: 13 }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      {ccFiltered.length === 0 && (
                        <div style={{ padding: "12px 14px", color: "#9CA3AF", fontSize: 13 }}>
                          No results
                        </div>
                      )}
                      {ccFiltered.map(em => {
                        const selected = form.ccRecipients.find(c => c.id === em._id);
                        return (
                          <div
                            key={em._id}
                            onClick={() => toggleCC(em)}
                            style={{ padding: "10px 14px", cursor: "pointer", display: "flex",
                                     alignItems: "center", gap: 10,
                                     background: selected ? "#EFF6FF" : "transparent" }}
                            onMouseEnter={e => e.currentTarget.style.background = selected ? "#DBEAFE" : "#F9FAFB"}
                            onMouseLeave={e => e.currentTarget.style.background = selected ? "#EFF6FF" : "transparent"}
                          >
                            <div style={{ width: 18, height: 18, borderRadius: 4,
                                          border: `2px solid ${selected ? LIME : "#D1D5DB"}`,
                                          background: selected ? LIME : "#fff", display: "flex",
                                          alignItems: "center", justifyContent: "center",
                                          flexShrink: 0 }}>
                              {selected && (
                                <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
                                {em.Emp_name}
                              </div>
                              <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                                {em.Designation || ""}
                                {em["desig Email Id"] ? ` · ${em["desig Email Id"]}` : ""}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ padding: "8px 14px", borderTop: "1px solid #F3F4F6",
                                    display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => setCcOpen(false)}
                          style={{ fontSize: 12, color: LIME, background: "none",
                                   border: "none", cursor: "pointer", fontWeight: 600 }}
                        >Done</button>
                      </div>
                    </div>
                  )}
                </div>
                {form.ccRecipients.length > 0 && (
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>
                    {form.ccRecipients.length} person{form.ccRecipients.length > 1 ? "s" : ""} selected
                  </div>
                )}
              </EField>
            </div>
 
            {/* Warranty user fields */}
            {form.category === "Warranty" && (
              <div style={{ ...eg2, marginTop: 14 }}>
                <EField label="Assigned User">
                  <select
                    value={form.userPerson}
                    onChange={e => {
                      const emp = employees.find(em => em.Emp_name === e.target.value);
                      setForm(f => ({ ...f, userPerson: e.target.value, userDepartment: emp?.Department || "" }));
                    }}
                    style={sel("")}
                  >
                    <option value="">Choose user</option>
                    {employees.map(em => (
                      <option key={em._id} value={em.Emp_name}>{em.Emp_name}</option>
                    ))}
                  </select>
                </EField>
                <EField label="User Department">
                  <input value={form.userDepartment} readOnly style={ro()} />
                </EField>
              </div>
            )}
          </ESection>
 
          {/* ══════════════════════════════════════════════════════════════
              SECTION 4 — Reminders
          ══════════════════════════════════════════════════════════════ */}
          <ESection title="🔔 Reminders">
            <div style={eg3}>
 
              <EField label="Start Date *" error={errors.startDate}>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => set("startDate", e.target.value)}
                  style={inp("startDate")}
                />
              </EField>
 
              <EField label="Renewal Frequency *" error={errors.frequency}>
                <select
                  value={form.frequency}
                  onChange={e => set("frequency", e.target.value)}
                  style={sel("frequency")}
                >
                  <option value="">Select frequency</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half Yearly">Half Yearly</option>
                  <option value="Annually">Annually</option>
                  <option value="Other">Other (Custom Date)</option>
                </select>
              </EField>
 
              {/* Duration — only for Monthly / Annually */}
              {["Monthly", "Annually"].includes(form.frequency) &&
                FREQ_COUNT_OPTIONS[form.frequency] && (
                  <EField label={`Duration (${form.frequency})`}>
                    <select
                      value={form.frequencyCount}
                      onChange={e => set("frequencyCount", +e.target.value)}
                      style={sel("")}
                    >
                      {FREQ_COUNT_OPTIONS[form.frequency].map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </EField>
              )}
 
              {/* Custom end date for "Other" */}
              {form.frequency === "Other" && (
                <EField label="Service End Date *" error={errors.customEndDate}>
                  <input
                    type="date"
                    value={form.customEndDate}
                    onChange={e => set("customEndDate", e.target.value)}
                    style={inp("customEndDate")}
                  />
                </EField>
              )}
 
              <EField label="End Date (auto-calculated)">
                <input
                  value={endDate ? fmtDate(endDate) : ""}
                  readOnly
                  style={ro({ color: "#059669" })}
                  placeholder="Set start date & frequency"
                />
              </EField>
 
              <EField label="1st Reminder (days before)">
                <input
                  type="number" min="0"
                  value={form.reminder1Days}
                  onChange={e => set("reminder1Days", +e.target.value)}
                  style={inp("")}
                />
              </EField>
              <EField label="2nd Reminder (days before)">
                <input
                  type="number" min="0"
                  value={form.reminder2Days}
                  onChange={e => set("reminder2Days", +e.target.value)}
                  style={inp("")}
                />
              </EField>
              <EField label="Final Reminder (days before)">
                <input
                  type="number" min="0"
                  value={form.reminderFinalDays}
                  onChange={e => set("reminderFinalDays", +e.target.value)}
                  style={inp("")}
                />
              </EField>
            </div>
 
            {/* Reminder preview */}
            {endDate && (
              <div style={{ marginTop: 14, background: "#EFF6FF", border: "1px solid #BFDBFE",
                            borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", marginBottom: 10 }}>
                  📅 Reminder Preview
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[
                    { label: "End Date",                              date: endDate,                        color: "#059669" },
                    { label: `1st (${form.reminder1Days}d before)`,   date: rDate(form.reminder1Days),      color: "#374151" },
                    { label: `2nd (${form.reminder2Days}d before)`,   date: rDate(form.reminder2Days),      color: "#374151" },
                    { label: `Final (${form.reminderFinalDays}d)`,    date: rDate(form.reminderFinalDays),  color: "#374151" },
                  ].map(({ label, date, color }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 3, fontWeight: 600 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>
                        {fmtDate(date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ESection>
 
 
          {/* ── Footer ── */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
            <button onClick={onClose} style={cancelStyle}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ ...saveStyle, opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
 
        </div>
      </div>
    </div>
  );
}
 
// ─────────────────────────────────────────────────────────────────────────────
// ESection + EField — local sub-components for EditModal
// Add these to dashboard.jsx near MSection / MField
// ─────────────────────────────────────────────────────────────────────────────
 
function ESection({ title, children }) {
  return (
    <div style={{ border: "1px solid #F3F4F6", borderRadius: 10, overflow: "visible" }}>
      <div style={{ background: "#F9FAFB", padding: "8px 16px", fontSize: 12, fontWeight: 700,
                    color: "#374151", borderBottom: "1px solid #F3F4F6" }}>
        {title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
 
function EField({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#EF4444" }}>{error}</span>}
    </div>
  );
}

// ── Shared modal sub-components ───────────────────────────
function MSection({ title, children }) {
  return (
    <div style={{ border: "1px solid #F3F4F6", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ background: "#F9FAFB", padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#374151", borderBottom: "1px solid #F3F4F6" }}>{title}</div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}
function MField({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#EF4444" }}>{error}</span>}
    </div>
  );
}

const g2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };
const g3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 };
const cancelStyle = { padding: "10px 22px", borderRadius: 8, border: "1.5px solid #E5E7EB", background: "#fff", color: "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const saveStyle   = { padding: "10px 26px", borderRadius: 8, border: "none", background: LIME, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };

// ────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────
export default function Dashboard({ categories = [], onNew, onEdit, onSelect, onUpdate, onNavigateUpdateForm }) {
  const [renewals,        setRenewals]        = useState([]);
  const [archived,        setArchived]        = useState([]);
  const [latestEventMap,  setLatestEventMap]  = useState({});
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [statusF,         setStatusF]         = useState("all");
  const [catF,            setCatF]            = useState("all");
  const [employeeF,        setEmployeeF]        = useState("all");
  const [historyMode,     setHistoryMode]     = useState(null);
  const [editMode,        setEditMode]        = useState(null);
  const [createMode,      setCreateMode]      = useState(false);
  const [tab,             setTab]             = useState("active");
  const [updateItem,      setUpdateItem]      = useState(null);
  const [discontinueItem, setDiscontinueItem] = useState(null);
  
  

  const fetchRenewals = useCallback(async () => {
    try {
      setLoading(true);
      const [renewRes, arRes, evRes] = await Promise.all([
        fetch(`${API}/api/renewals`),
        fetch(`${API}/api/renewals/archived/list`),
        fetch(`${API}/api/renewal-events`),
      ]);
      const renewData = await renewRes.json();
      const arData    = await arRes.json();
      const evData    = await evRes.json();

      if (renewData.success) setRenewals(renewData.data.map(mapRenewal));
      if (arData.success)    setArchived(arData.data.map(mapRenewal));
      if (evData.success)    setLatestEventMap(buildLatestEventMap(evData.data));
    } catch (err) {
      console.error("Failed to fetch renewals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDiscontinue = async (renewal) => {
  try {
    const res = await fetch(`${API}/api/renewals/${renewal.id}/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: renewal.reason }),
    });
    const data = await res.json();
    if (data.success) {
      alert("✅ Renewal discontinued successfully");
      fetchRenewals();
    } else {
      alert(data.message || "Failed to discontinue renewal");
    }
  } catch (err) {
    console.error(err);
    alert("Failed to discontinue renewal");
  }
};

  useEffect(() => { fetchRenewals(); }, [fetchRenewals]);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("update");

  if(itemId && renewals.length){
    const item = renewals.find(r => r.id === itemId);

    if(item){
      setUpdateItem(item);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

}, [renewals]);

  const handleCreateSaved = () => {
    setCreateMode(false);
    fetchRenewals();
  };

  const statusCounts = renewals.reduce((acc, r) => {
    const s = computeStatus(r, latestEventMap[r.id] ?? null);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const visible = (tab === "archived" ? archived : renewals).filter((r) => {
  const q = search.toLowerCase().trim();

  const itemName = (r.itemName || "").toLowerCase();
  const vendor = (r.vendor || "").toLowerCase();
  const responsible = (r.responsible || "").toLowerCase();
  const empName = (r.empName || "").toLowerCase();
  const renewerName = (r.renewerName || "").toLowerCase();

  const status = computeStatus(r, latestEventMap[r.id] ?? null);

  const matchesSearch =
    !q ||
    itemName.includes(q) ||
    vendor.includes(q) ||
    responsible.includes(q) ||
    empName.includes(q) ||
    renewerName.includes(q);

  const matchesStatus =
    tab !== "active" ||
    statusF === "all" ||
    status === statusF;

  const matchesCategory =
    catF === "all" ||
    r.category === catF;

  const matchesEmployee =
    employeeF === "all" ||
    r.empName === employeeF;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesCategory &&
    matchesEmployee
  );
});

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #E5E7EB", borderTop: `3px solid ${LIME}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#9CA3AF", fontSize: 14 }}>Loading renewals...</span>
       
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        title="Renewals Dashboard"
        subtitle="Track and manage all renewals & warranties"
        actions={
          tab === "active" ? (
            <div style={{ display: "flex", gap: 10 }}>
              {/* <NavbarButton onClick={onNavigateUpdateForm} label="✏️ Update Renewal" variant="secondary" /> */}
              <NavbarButton onClick={() => setCreateMode(true)} icon="+" label="Create a Renewal" />
            </div>
          ) : (
            <NavbarButton onClick={() => setCreateMode(true)} icon="+" label="Create a Renewal" />
          )
        }
      />

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 0 }}>
        <StatsCard label="Total"       value={renewals.length}               accent={LIME}    />
        <StatsCard label="Not Yet Due" value={statusCounts.not_yet_due || 0} accent="#E5E7EB" />
        <StatsCard label="Due"         value={statusCounts.due         || 0} accent="#9CA3AF" />
        <StatsCard label="Overdue"     value={statusCounts.overdue     || 0} accent="#EF4444" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", marginBottom: 16, borderBottom: "2px solid #F3F4F6" }}>
        {[
          { key: "active",   label: `📋 Active Renewals (${renewals.length})` },
          { key: "archived", label: `📦 Archive (${archived.length})`          },
        ].map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); setStatusF("all"); setCatF("all"); }}
            style={{ padding: "12px 20px", border: "none", background: "transparent", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: tab === t.key ? "#111" : "#9CA3AF", borderBottom: tab === t.key ? `3px solid ${LIME}` : "3px solid transparent", marginBottom: "-2px" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, vendor, person…" style={inputStyle} />
        {tab === "active" && (
          <select value={statusF} onChange={e => setStatusF(e.target.value)} style={selectStyle}>
            <option value="all">All Status</option>
            <option value="not_yet_due">Not Yet Due</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
          </select>
        )}
        <select
            value={catF}
            onChange={(e) => setCatF(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All Categories</option>

            {[...new Set(
              [...renewals, ...archived]
                .map(r => r.category)
                .filter(Boolean)
            )]
              .sort()
              .map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
          </select>
        <select
                value={employeeF}
                onChange={(e) => setEmployeeF(e.target.value)}
                style={selectStyle}
              >
                <option value="all">All Users</option>

                {[...new Set(
                  [...renewals, ...archived]
                    .map(r => r.empName)
                    .filter(Boolean)
                )]
                  .sort()
                  .map(employee => (
                    <option key={employee} value={employee}>
                      {employee}
                    </option>
                  ))}
              </select>
        {(search || statusF !== "all" || catF !== "all" || employeeF !== "all") && (
          <button onClick={() => { setSearch(""); setStatusF("all"); setCatF("all"); setEmployeeF("all"); }} style={clearBtnStyle}>Clear</button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                  <TH>Item ID</TH>
                  <TH>Item</TH>
                  <TH>Category</TH>

                  {tab === "active" ? (
                    <>
                      <TH>Renewer</TH>
                      <TH>Service Start</TH>
                      <TH>Next Renewal Date</TH>
                      <TH>Status</TH>
                      <TH>Action</TH>
                    </>
                  ) : (
                    <>
                      <TH>Responsible</TH>
                      <TH>Closed On</TH>
                      <TH></TH>
                    </>
                  )}

                  <TH>Recorded On</TH>
                </tr>
            </thead>
            <tbody>
              {visible.map(r => {
                const status = computeStatus(r, latestEventMap[r.id] ?? null);
                const rowColors = {
                    done: "#ECFDF5",
                    done_delayed: "#FEFCE8",
                    due: "#F3F4F6",
                    overdue: "#FEF2F2",
                    not_yet_due: "#FFFFFF"
                  };
                return (
                      <tr
                        key={r.id}
                        onClick={() => setHistoryMode(r)}
                        style={{
                          background: rowColors[status] || "#FFFFFF",
                          borderBottom: "1px solid #E5E7EB",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.filter = "brightness(0.98)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.filter = "none";
                        }}
                      >
                    <td style={{ padding: "13px 16px", fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{r.id}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "#111" }}>{r.itemName}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{r.subcategory}</div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.category}</td>
                    
                    {tab === "active" ? (
                      <>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>
                            {r.responsible}
                          </td>

                          {/* Service Start */}
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ fontSize: 13, color: "#374151" }}>
                              {fmtDate(r.startDate)}
                            </div>
                          </td>

                          {/* Next Renewal Date */}
                          <td style={{ padding: "13px 16px" }}>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#059669",
                                fontWeight: 700
                              }}
                            >
                              {fmtDate(r.endDate)}
                            </div>
                            <DaysChip endDate={r.endDate} />
                          </td>

                          <td style={{ padding: "13px 16px" }}>
                            <div
                              style={{
                                display: "inline-flex",
                                padding: "4px",
                                borderRadius: "8px",
                                background:
                                  status === "done"
                                    ? "#D1FAE5"
                                    : status === "done_delayed"
                                    ? "#FEF3C7"
                                    : status === "due"
                                    ? "#E0E7FF"
                                    : status === "overdue"
                                    ? "#FECACA"
                                    : "#F3F4F6",
                              }}
                            >
                              <StatusBadge status={status} />
                            </div>
                          </td>
                        <td style={{ padding: "10px 12px" }}>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHistoryMode(r);
                                }}
                                style={{
                                  ...actionBtn,
                                  background: "#EFF6FF",
                                  color: "#1D4ED8",
                                }}
                              >
                                👁 View
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditMode(r);
                                }}
                                style={{
                                  ...actionBtn,
                                  background: "#FEF3C7",
                                  color: "#92400E",
                                }}
                              >
                                ✏️ Edit
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); setUpdateItem(r); }}
                                style={{
                                  ...actionBtn,
                                  background: "#DCFCE7",
                                  color: "#166534",
                                }}
                              >
                                🔄 Update
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDiscontinueItem(r);
                                }}
                                style={{
                                  ...actionBtn,
                                  background: "#FEE2E2",
                                  color: "#991B1B",
                                }}
                              >
                                ⛔ Discontinue
                              </button>

                            </div>
                          </td>
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#374151" }}>
                        <div>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.responsible}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ background: "#F3F4F6", color: "#6B7280", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                            
                            📦 {fmtDate(r.closedAt)}
                          </span>
                        </td>
                        <td></td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>No renewals found</div>
        )}
        <div style={{ padding: "12px 18px", borderTop: "1px solid #F3F4F6", color: "#9CA3AF", fontSize: 12 }}>
          Showing {visible.length} of {tab === "archived" ? archived.length : renewals.length} items
        </div>
      </div>

      {historyMode && (
        <HistoryModal
          renewal={historyMode}
          onClose={() => setHistoryMode(null)}
          onEdit={() => { setEditMode(historyMode); setHistoryMode(null); }}
        />
      )}

      {updateItem && (
        <UpdateForm
          preSelectedItem={updateItem}
          onSave={() => { setUpdateItem(null); fetchRenewals(); }}
          onCancel={() => setUpdateItem(null)}
        />
      )}

      {editMode && (
        <EditModal
          renewal={editMode}
          categories={categories}
          onClose={() => setEditMode(null)}
          onSaved={() => { fetchRenewals(); setEditMode(null); }}
        />
      )}

      {createMode && (
        <div onClick={() => setCreateMode(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#F3F4F6", borderRadius: 16, width: "100%", maxWidth: 940, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>
            <div style={{ background: LIME, borderRadius: "16px 16px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Create a Renewal</div>
                <div style={{ fontSize: 12, color: "#bfdbfe", marginTop: 2 }}>Add a new renewal or warranty record</div>
              </div>
              <button onClick={() => setCreateMode(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <NewForm
                embedded
                onSave={handleCreateSaved}
                onCancel={() => setCreateMode(false)}
              />
            </div>
          </div>
        </div>
      )}

      {discontinueItem && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
    <div style={{ background: "#fff", borderRadius: 12, width: 440, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
      <h3 style={{ margin: 0, marginBottom: 8, fontSize: 16, color: "#111" }}>⛔ Discontinue Renewal</h3>
      <p style={{ color: "#4B5563", lineHeight: 1.6, marginBottom: 4, fontSize: 14 }}>
        You are about to discontinue <strong>{discontinueItem.itemName}</strong>.
      </p>
      <p style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 16 }}>This item will be moved to the Archive section.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
          Reason for discontinuing <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          value={discontinueItem.reason || ""}
          onChange={e => setDiscontinueItem(d => ({ ...d, reason: e.target.value }))}
          placeholder="e.g. Service no longer needed, replaced by another tool…"
          rows={3}
          style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "9px 13px", fontSize: 14, color: "#111", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", resize: "vertical" }}
        />
        {discontinueItem.reasonError && (
          <span style={{ fontSize: 11, color: "#EF4444" }}>{discontinueItem.reasonError}</span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={() => setDiscontinueItem(null)} style={cancelStyle}>Cancel</button>
        <button
          onClick={async () => {
            if (!discontinueItem.reason?.trim()) {
              setDiscontinueItem(d => ({ ...d, reasonError: "Please provide a reason" }));
              return;
            }
            await handleDiscontinue(discontinueItem);
            setDiscontinueItem(null);
          }}
          style={{ ...saveStyle, background: "#DC2626" }}
        >
          Yes, Discontinue
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

const inputStyle    = { flex: 1, minWidth: 200, border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 14px", fontSize: 14, outline: "none", color: "#111", fontFamily: "inherit" };
const selectStyle   = { border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 14px", fontSize: 14, color: "#374151", cursor: "pointer", fontFamily: "inherit", background: "#fff", outline: "none" };
const clearBtnStyle = { border: "none", background: "#F3F4F6", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#6B7280", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" };
