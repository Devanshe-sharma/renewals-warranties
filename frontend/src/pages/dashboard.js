import React, { useState, useEffect, useCallback } from "react";
import Navbar, { NavbarButton } from "../components/navbar";

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

// ── 5 Status colours ──────────────────────────────────────
const STATUS_COLOURS = {
  done:         { bg: "#D1FAE5", text: "#065F46", label: "Done"         },
  done_delayed: { bg: "#FEF9C3", text: "#854D0E", label: "Done Delayed" },
  due:          { bg: "#E5E7EB", text: "#374151", label: "Due"          },
  overdue:      { bg: "#FEE2E2", text: "#991B1B", label: "Overdue"      },
  not_yet_due:  { bg: "#FFFFFF", text: "#6B7280", label: "Not Yet Due"  },
};

// ── Helpers ───────────────────────────────────────────────
const fmtDate     = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtISO      = (d) => d ? new Date(d).toISOString().split("T")[0] : "";
const addDays     = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const addMonths   = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const fmtCurr     = (n) => n != null && n !== "" ? `₹ ${Number(n).toLocaleString("en-IN")}` : "—";
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const toDay       = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

// ────────────────────────────────────────────────────────
// computeStatus
// ────────────────────────────────────────────────────────
export function computeStatus(renewal, latestEvent = null) {
  const today = toDay(new Date());

  if (latestEvent) {
    if (latestEvent.renewal_required === "No") return "overdue";
    const renewedOn  = latestEvent.new_renewal_date  ? toDay(new Date(latestEvent.new_renewal_date))  : null;
    const prevExpiry = latestEvent.prev_expiry_date  ? toDay(new Date(latestEvent.prev_expiry_date))  : null;
    if (renewedOn && prevExpiry) {
      return renewedOn <= prevExpiry ? "done" : "done_delayed";
    }
    return "done";
  }

  const endDate = renewal.endDate   ? toDay(new Date(renewal.endDate))   : null;
  const r2Date  = renewal.reminder2Date ? toDay(new Date(renewal.reminder2Date)) : null;

  if (!endDate) return "not_yet_due";
  if (today > endDate) return "overdue";
  if (r2Date && today >= r2Date) return "due";
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
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: `3px solid ${accent || LIME}` }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#111", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>{label}</div>
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
  id:                 r.item_id,
  itemName:           r.item_name            || "",
  category:           r.category             || "",
  subcategory:        r.subcategory          || "",
  description:        r.description          || "",
  vendor:             r.vendor               || "",
  authority:          r.authority            || "",
  renewerName:        r.renewer_name         || r.emp_name || "",
  renewerDepartment:  r.renewer_department   || r.department || "Admin",
  renewerEmail:       r.renewer_email        || r.email || "",
  responsible:        r.renewer_name         || r.emp_name || "",
  empName:            r.emp_name             || "",
  empId:              r.emp_id               || "",
  department:         r.department           || "",
  designation:        r.designation          || "",
  email:              r.email                || "",
  reportingManager:   r.reporting_manager    || "",
  selectedEmployeeId: r.selected_employee_id || "",
  startDate:          r.start_date    ? r.start_date.split("T")[0]    : "",
  endDate:            r.end_date      ? r.end_date.split("T")[0]      : "",
  reminder2Date:      r.reminder2_date ? r.reminder2_date.split("T")[0] : "",
  frequency:          r.frequency            || "",
  reminder1Days:      r.reminder1_days       ?? 30,
  reminder2Days:      r.reminder2_days       ?? 10,
  reminderFinalDays:  r.reminder_final_days  ?? 1,
  lastRenewedAt:      r.last_renewed_at      || null,
  remarks:            r.remarks              || "",
  link:               r.link                 || "",
  userPerson:         r.user_person          || "",
  userDepartment:     r.user_department      || "",
  attachment1Link:    r.attachment1_link     || "",
  attachment2Link:    r.attachment2_link     || "",
  cost:               r.cost                 ?? 0,
  currency:           r.currency             || "INR",
  active:             r.active               ?? true,
  isClosed:           r.is_closed            ?? false,
  closedAt:           r.closed_at            || null,
  pastRenewals:       r.past_renewals        || [],
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
    <div style={{ border: "1px solid #F3F4F6", borderRadius: 10, overflow: "hidden" }}>
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

// ────────────────────────────────────────────────────────
// HISTORY MODAL
// ────────────────────────────────────────────────────────
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
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>

        {/* Header */}
        <div style={{ background: LIME, borderRadius: "16px 16px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{renewal.itemName}</div>
            <div style={{ fontSize: 12, color: "#bfdbfe", marginTop: 2 }}>{renewal.id} · {renewal.category}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge status={latestStatus} />
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>✕</button>
          </div>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          <DetailSection title="📋 Renewal Details">
            <DetailGrid cols={3}>
              <DetailField label="Item ID"      value={renewal.id} mono />
              <DetailField label="Category"     value={renewal.category} />
              <DetailField label="Subcategory"  value={renewal.subcategory} />
              <DetailField label="Item Name"    value={renewal.itemName} />
              <DetailField label="Vendor"       value={renewal.vendor} />
              <DetailField label="Authority"    value={renewal.authority} />
            </DetailGrid>
            {renewal.description && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
                <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{renewal.description}</div>
              </div>
            )}
          </DetailSection>

          <DetailSection title="👤 Renewer Details">
            <DetailGrid cols={3}>
              <DetailField label="Renewer Name"       value={renewal.renewerName} />
              <DetailField label="Renewer Department" value={renewal.renewerDepartment} />
              <DetailField label="Renewer Email"      value={renewal.renewerEmail} />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="👤 User Details">
            <DetailGrid cols={3}>
              <DetailField label="Employee Name"     value={renewal.empName} />
              <DetailField label="Employee ID"       value={renewal.empId} mono />
              <DetailField label="Department"        value={renewal.department} />
              <DetailField label="Designation"       value={renewal.designation} />
              <DetailField label="Email"             value={renewal.email} />
              <DetailField label="Reporting Manager" value={renewal.reportingManager} />
            </DetailGrid>
          </DetailSection>

          <DetailSection title="🔔 Reminders">
            <DetailGrid cols={3}>
              <DetailField label="Start Date"    value={fmtDate(renewal.startDate)} />
              <DetailField label="End Date"      value={fmtDate(renewal.endDate)} highlight />
              <DetailField label="Frequency"     value={renewal.frequency} />
              <DetailField label="1st Reminder"  value={renewal.reminder1Days ? `${renewal.reminder1Days} days before` : "—"} />
              <DetailField label="2nd Reminder"  value={renewal.reminder2Days ? `${renewal.reminder2Days} days before` : "—"} />
              <DetailField label="Final Reminder" value={renewal.reminderFinalDays ? `${renewal.reminderFinalDays} day before` : "—"} />
              {renewal.reminder2Date && (
                <DetailField label="2nd Reminder Date" value={fmtDate(renewal.reminder2Date)} />
              )}
            </DetailGrid>
          </DetailSection>

          <DetailSection title="ℹ️ Additional Details">
            <DetailGrid cols={3}>
              <DetailField label="Remarks" value={renewal.remarks} />
              {renewal.link
                ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Website Link</div>
                    <a href={renewal.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#1976d2", textDecoration: "none", wordBreak: "break-all" }}>{renewal.link}</a>
                  </div>
                : <DetailField label="Website Link" value="—" />
              }
              {renewal.category === "Warranty" && <>
                <DetailField label="Assigned User"    value={renewal.userPerson} />
                <DetailField label="User Department"  value={renewal.userDepartment} />
              </>}
            </DetailGrid>
          </DetailSection>

          {(renewal.attachment1Link || renewal.attachment2Link) && (
            <DetailSection title="📎 Attachments">
              <DetailGrid cols={2}>
                {[1, 2].map(n => {
                  const link = renewal[`attachment${n}Link`];
                  return link ? (
                    <div key={n} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Attachment {n}</div>
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#1976d2", textDecoration: "none", wordBreak: "break-all" }}>{link}</a>
                    </div>
                  ) : null;
                })}
              </DetailGrid>
            </DetailSection>
          )}

          {/* Renewal history */}
          <div style={{ border: "1px solid #F3F4F6", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: "#F9FAFB", padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#374151", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between" }}>
              <span>Renewal History</span>
              <span style={{ color: "#9CA3AF", fontWeight: 400 }}>{events.length} event{events.length !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#9CA3AF" }}>Loading...</div>
            ) : events.length === 0 ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>No renewal events recorded yet</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      {["Event", "Status", "Prev Expiry", "New Date", "New Expiry", "Amount", "Mode", "By", "On"].map(h => (
                        <th key={h} style={{ padding: "9px 14px", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textAlign: "left", letterSpacing: 0.5, textTransform: "uppercase", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev, idx) => {
                      let evStatus;
                      if (ev.renewal_required === "No") {
                        evStatus = "overdue";
                      } else {
                        const renewedOn  = ev.new_renewal_date  ? toDay(new Date(ev.new_renewal_date))  : null;
                        const prevExpiry = ev.prev_expiry_date  ? toDay(new Date(ev.prev_expiry_date))  : null;
                        if (renewedOn && prevExpiry) {
                          evStatus = renewedOn <= prevExpiry ? "done" : "done_delayed";
                        } else {
                          evStatus = "done";
                        }
                      }

                      const isLatest = idx === 0;
                      return (
                        <tr key={ev._id}
                          style={{ borderBottom: "1px solid #F9FAFB", background: isLatest ? "#EFF6FF" : "transparent" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                          onMouseLeave={e => e.currentTarget.style.background = isLatest ? "#EFF6FF" : "transparent"}
                        >
                          <td style={{ padding: "11px 14px" }}>
                            <div style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "monospace" }}>{ev.event_id}</div>
                            {isLatest && <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, marginTop: 1 }}>LATEST</div>}
                          </td>
                          <td style={{ padding: "11px 14px" }}><StatusBadge status={evStatus} /></td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>{fmtDate(ev.prev_expiry_date)}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>{fmtDate(ev.new_renewal_date)}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#059669", fontWeight: 600 }}>{fmtDate(ev.new_expiry_date)}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151", whiteSpace: "nowrap" }}>{fmtCurr(ev.renewal_amount)}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>{ev.payment_mode || "—"}</td>
                          <td style={{ padding: "11px 14px", fontSize: 12, color: "#374151" }}>{ev.renewed_by || "—"}</td>
                          <td style={{ padding: "11px 14px", fontSize: 11, color: "#9CA3AF" }}>{fmtDate(ev.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button onClick={onClose} style={cancelStyle}>Close</button>
            <button onClick={onEdit} style={saveStyle}>✏️ Edit Item</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// EDIT MODAL
// ────────────────────────────────────────────────────────
const getAdminRenewer = (employees) => {
  const admin = employees.find(emp =>
    (emp.Department || "").trim().toLowerCase().includes("admin") &&
    ((emp["Department Head"] || "").trim() || (emp["Dept Head Email"] || "").trim())
  );
  return {
    renewerName:       admin?.["Department Head"] || admin?.Emp_name || "",
    renewerDepartment: "Admin",
    renewerEmail:      admin?.["Dept Head Email"] || admin?.["desig Email Id"] || "",
  };
};

function EditModal({ renewal, categories, onClose, onSaved }) {
  const [form,      setForm]      = useState({ ...renewal });
  const [employees, setEmployees] = useState([]);
  const [saving,    setSaving]    = useState(false);
  const [errors,    setErrors]    = useState({});
  const [words,     setWords]     = useState(0);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    fetch(`${API}/api/employee`)
      .then(r => r.json())
      .then(data => {
        setEmployees(data);
        setForm(f => {
          if (f.renewerName && f.renewerEmail) return f;
          return { ...f, ...getAdminRenewer(data) };
        });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setWords((form.description || "").trim().split(/\s+/).filter(Boolean).length);
  }, [form.description]);

  useEffect(() => {
    if (form.frequency && DEFAULT_REMIND[form.frequency]) {
      const d = DEFAULT_REMIND[form.frequency];
      setForm(f => ({ ...f, reminder1Days: d.r1, reminder2Days: d.r2, reminderFinalDays: d.rf }));
    }
  }, [form.frequency]);

  const selectedCategory = categories.find(c => c.name === form.category);
  const subcats = selectedCategory?.subcategories || [];

  const endDate = form.startDate && form.frequency
    ? fmtISO(addMonths(new Date(form.startDate), FREQ_MONTHS[form.frequency] || 12))
    : form.endDate || "";

  const rDate = (days) => endDate ? fmtISO(addDays(new Date(endDate), -days)) : "";

  const handleEmployeeSelect = (id) => {
    const emp = employees.find(e => e._id === id);
    if (!emp) {
      setForm(f => ({ ...f, selectedEmployeeId: "", empName: "", empId: "", department: "", designation: "", email: "", reportingManager: "" }));
      return;
    }
    setForm(f => ({
      ...f,
      selectedEmployeeId: id,
      empName:          emp.Emp_name            || "",
      empId:            String(emp.Emp_id)       || "",
      department:       emp.Department           || "",
      designation:      emp.Designation          || "",
      email:            emp["desig Email Id"]    || "",
      reportingManager: emp["Reporting Manager"] || "",
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.itemName?.trim()) e.itemName  = "Required";
    if (!form.category)         e.category  = "Required";
    if (!form.startDate)        e.startDate = "Required";
    if (!form.frequency)        e.frequency = "Required";
    if (words > 150)            e.description = "Max 150 words";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/renewals/${renewal.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, endDate }),
      });
      const data = await res.json();
      if (data.success) { onSaved(); onClose(); }
      else alert(`❌ ${data.message}`);
    } catch (err) { alert("❌ Failed to save"); console.error(err); }
    finally { setSaving(false); }
  };

  const inp = (name, extra = {}) => ({ border: `1.5px solid ${errors[name] ? "#EF4444" : "#E5E7EB"}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#111", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", ...extra });
  const sel = (name) => ({ ...inp(name), cursor: "pointer", background: "#fff", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32 });
  const ro  = (extra = {}) => inp("", { background: "#F9FAFB", color: "#6B7280", ...extra });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 780, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.25)" }}>

        {/* Header */}
        <div style={{ background: LIME, borderRadius: "16px 16px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Edit Renewal</div>
            <div style={{ fontSize: 12, color: "#bfdbfe", marginTop: 2 }}>{renewal.id} · {renewal.itemName}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>✕</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          <MSection title="Renewal Details">
            {/* Row 1: Item ID + Category */}
            <div style={g2}>
              <MField label="Item ID">
                <input value={renewal.id} readOnly style={ro()} />
              </MField>
              <MField label="Category *" error={errors.category}>
                <select value={form.category} onChange={e => { set("category", e.target.value); set("subcategory", ""); }} style={sel("category")}>
                  <option value="">Choose</option>
                  {/* Fallback: keep existing value visible even if categories haven't loaded/matched */}
                  {form.category && !categories.find(c => c.name === form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </MField>
            </div>

            {/* Subcategory — always visible */}
            <div style={{ marginTop: 14 }}>
              <MField label="Subcategory">
                <select value={form.subcategory} onChange={e => set("subcategory", e.target.value)} style={sel("")}>
                  <option value="">None</option>
                  {/* Fallback: keep existing subcategory visible even if subcats list is empty */}
                  {form.subcategory && !subcats.find(s => s.name === form.subcategory) && (
                    <option value={form.subcategory}>{form.subcategory}</option>
                  )}
                  {subcats.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </MField>
            </div>

            {/* Row 2: Item Name + Vendor + Authority */}
            <div style={{ ...g2, marginTop: 14 }}>
              <MField label="Item Name *" error={errors.itemName}>
                <input value={form.itemName} onChange={e => set("itemName", e.target.value)} style={inp("itemName")} />
              </MField>
              <MField label="Vendor">
                <input value={form.vendor} onChange={e => set("vendor", e.target.value)} style={inp("")} />
              </MField>
              <MField label="Authority">
                <input value={form.authority || ""} onChange={e => set("authority", e.target.value)} style={inp("")} />
              </MField>
            </div>

            <div style={{ marginTop: 14 }}>
              <MField label="Description" error={errors.description}>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} style={{ ...inp("description"), resize: "vertical", minHeight: 70 }} />
                <div style={{ fontSize: 11, color: words > 150 ? "#EF4444" : "#9CA3AF", textAlign: "right", marginTop: 2 }}>{words} / 150 words</div>
              </MField>
            </div>
          </MSection>

          <MSection title="Renewer Details">
            <div style={g3}>
              <MField label="Renewer Name"><input value={form.renewerName || ""} readOnly style={ro()} /></MField>
              <MField label="Department"><input value={form.renewerDepartment || "Admin"} readOnly style={ro()} /></MField>
              <MField label="Email"><input value={form.renewerEmail || ""} readOnly style={ro()} /></MField>
            </div>
          </MSection>

          <MSection title="User Details">
            <MField label="Employee">
              <select value={form.selectedEmployeeId} onChange={e => handleEmployeeSelect(e.target.value)} style={sel("")}>
                <option value="">Select employee</option>
                {employees.map(em => <option key={em._id} value={em._id}>{em.Emp_name}</option>)}
              </select>
            </MField>
            <div style={{ ...g2, marginTop: 14 }}>
              <MField label="Employee ID"><input value={form.empId} readOnly style={ro()} /></MField>
              <MField label="Department"><input value={form.department} readOnly style={ro()} /></MField>
              <MField label="Designation"><input value={form.designation} readOnly style={ro()} /></MField>
              <MField label="Email"><input value={form.email} readOnly style={ro()} /></MField>
              <MField label="Reporting Manager"><input value={form.reportingManager} readOnly style={ro()} /></MField>
            </div>
          </MSection>

          <MSection title="Reminders">
            <div style={g3}>
              <MField label="Start Date *" error={errors.startDate}>
                <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} style={inp("startDate")} />
              </MField>
              <MField label="End Date (auto)">
                <input value={endDate ? fmtDate(endDate) : ""} readOnly style={ro({ color: "#059669" })} />
              </MField>
              <MField label="Frequency *" error={errors.frequency}>
                <select value={form.frequency} onChange={e => set("frequency", e.target.value)} style={sel("frequency")}>
                  <option value="">Select</option>
                  {Object.keys(FREQ_MONTHS).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </MField>
              <MField label="1st Reminder (days before)"><input type="number" min="0" value={form.reminder1Days} onChange={e => set("reminder1Days", +e.target.value)} style={inp("")} /></MField>
              <MField label="2nd Reminder (days before)"><input type="number" min="0" value={form.reminder2Days} onChange={e => set("reminder2Days", +e.target.value)} style={inp("")} /></MField>
              <MField label="Final Reminder (days before)"><input type="number" min="0" value={form.reminderFinalDays} onChange={e => set("reminderFinalDays", +e.target.value)} style={inp("")} /></MField>
            </div>
            {endDate && (
              <div style={{ marginTop: 14, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", marginBottom: 10 }}>📅 Reminder Preview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[
                    { label: "End Date",                             date: endDate,                       color: "#059669" },
                    { label: `1st (${form.reminder1Days}d before)`,  date: rDate(form.reminder1Days),     color: "#374151" },
                    { label: `2nd (${form.reminder2Days}d before)`,  date: rDate(form.reminder2Days),     color: "#374151" },
                    { label: `Final (${form.reminderFinalDays}d)`,   date: rDate(form.reminderFinalDays), color: "#374151" },
                  ].map(({ label, date, color }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 3, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color }}>{fmtDate(date)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </MSection>

          <MSection title="Additional Details">
            <div style={g2}>
              <MField label="Remarks"><input value={form.remarks} onChange={e => set("remarks", e.target.value)} style={inp("")} /></MField>
              <MField label="Website Link"><input type="url" value={form.link} onChange={e => set("link", e.target.value)} style={inp("")} placeholder="https://..." /></MField>
            </div>
            {form.category === "Warranty" && (
              <div style={{ ...g2, marginTop: 14 }}>
                <MField label="Assigned User">
                  <select value={form.userPerson} onChange={e => { const emp = employees.find(em => em.Emp_name === e.target.value); setForm(f => ({ ...f, userPerson: e.target.value, userDepartment: emp?.Department || "" })); }} style={sel("")}>
                    <option value="">Choose user</option>
                    {employees.map(em => <option key={em._id} value={em.Emp_name}>{em.Emp_name}</option>)}
                  </select>
                </MField>
                <MField label="User Department"><input value={form.userDepartment} readOnly style={ro()} /></MField>
              </div>
            )}
          </MSection>

          <MSection title="Attachments (optional)">
            {[1, 2].map(n => (
              <div key={n}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Attachment {n}</div>
                <input type="url" value={form[`attachment${n}Link`]} onChange={e => set(`attachment${n}Link`, e.target.value)} style={{ ...inp(""), marginBottom: n === 1 ? 14 : 0 }} placeholder="Paste a Drive / web link" />
              </div>
            ))}
          </MSection>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
            <button onClick={onClose} style={cancelStyle}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ ...saveStyle, opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>
        </div>
      </div>
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
  const [historyMode,     setHistoryMode]     = useState(null);
  const [editMode,        setEditMode]        = useState(null);
  const [tab,             setTab]             = useState("active");

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

  useEffect(() => { fetchRenewals(); }, [fetchRenewals]);

  const statusCounts = renewals.reduce((acc, r) => {
    const s = computeStatus(r, latestEventMap[r.id] ?? null);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const visible = (tab === "archived" ? archived : renewals).filter((r) => {
    const q           = search.toLowerCase();
    const name        = (r.itemName    || "").toLowerCase();
    const vendor      = (r.vendor      || "").toLowerCase();
    const responsible = (r.responsible || "").toLowerCase();
    const s           = computeStatus(r, latestEventMap[r.id] ?? null);
    return (
      (!q || name.includes(q) || vendor.includes(q) || responsible.includes(q)) &&
      (tab === "archived" || statusF === "all" || s === statusF) &&
      (catF === "all" || r.category === catF)
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
              <NavbarButton onClick={onNavigateUpdateForm} label="✏️ Update Renewal" variant="secondary" />
              <NavbarButton onClick={onNew} icon="+" label="Create Renewal List" />
            </div>
          ) : (
            <NavbarButton onClick={onNew} icon="+" label="Create Renewal List" />
          )
        }
      />

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 28 }}>
        <StatsCard label="Total"        value={renewals.length}               accent={LIME}     />
        <StatsCard label="Not Yet Due"  value={statusCounts.not_yet_due || 0} accent="#E5E7EB"  />
        <StatsCard label="Due"          value={statusCounts.due         || 0} accent="#9CA3AF"  />
        <StatsCard label="Done"         value={(statusCounts.done || 0) + (statusCounts.done_delayed || 0)} accent="#22C55E" />
        <StatsCard label="Overdue"      value={statusCounts.overdue     || 0} accent="#EF4444"  />
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
            <option value="done">Done</option>
            <option value="done_delayed">Done Delayed</option>
            <option value="overdue">Overdue</option>
          </select>
        )}
        <select value={catF} onChange={e => setCatF(e.target.value)} style={selectStyle}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        {(search || statusF !== "all" || catF !== "all") && (
          <button onClick={() => { setSearch(""); setStatusF("all"); setCatF("all"); }} style={clearBtnStyle}>Clear</button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <TH>ID</TH><TH>Item</TH><TH>Category</TH><TH>Vendor</TH>
                {tab === "active" ? (
                  <><TH>Responsible</TH><TH>End Date</TH><TH>Status</TH><TH></TH></>
                ) : (
                  <><TH>Responsible</TH><TH>Closed On</TH><TH></TH></>
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map(r => {
                const status = computeStatus(r, latestEventMap[r.id] ?? null);
                return (
                  <tr key={r.id}
                    onClick={() => setHistoryMode(r)}
                    style={{ borderBottom: "1px solid #F9FAFB", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "13px 16px", fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{r.id}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{r.itemName}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{r.subcategory}</div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.category}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.vendor}</td>
                    {tab === "active" ? (
                      <>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.responsible}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ fontSize: 13, color: "#374151" }}>{fmtDate(r.endDate)}</div>
                          {!latestEventMap[r.id] && <DaysChip endDate={r.endDate} />}
                        </td>
                        <td style={{ padding: "13px 16px" }}><StatusBadge status={status} /></td>
                        <td style={{ padding: "13px 16px" }}>
                          <button
                            onClick={e => { e.stopPropagation(); setEditMode(r); }}
                            style={{ background: LIME_PALE, color: "#1d4ed8", border: `1px solid ${LIME}`, borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Edit
                          </button>
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

      {editMode && (
        <EditModal
          renewal={editMode}
          categories={categories}
          onClose={() => setEditMode(null)}
          onSaved={() => { fetchRenewals(); setEditMode(null); }}
        />
      )}
    </div>
  );
}

const inputStyle    = { flex: 1, minWidth: 200, border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 14px", fontSize: 14, outline: "none", color: "#111", fontFamily: "inherit" };
const selectStyle   = { border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 14px", fontSize: 14, color: "#374151", cursor: "pointer", fontFamily: "inherit", background: "#fff", outline: "none" };
const clearBtnStyle = { border: "none", background: "#F3F4F6", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#6B7280", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" };