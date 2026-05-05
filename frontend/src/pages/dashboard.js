import React, { useState, useEffect, useCallback } from "react";
import Navbar, { NavbarButton } from "../components/navbar";

const API       = process.env.REACT_APP_API_URL;
const LIME      = "#ADE80A";
const LIME_PALE = "#F4FFD6";

const FREQ_MONTHS = { Monthly: 1, Quarterly: 3, "Half Yearly": 6, Annually: 12 };
const DEFAULT_REMIND = {
  Annually:      { r1: 30, r2: 10, rf: 1 },
  "Half Yearly": { r1: 30, r2: 10, rf: 1 },
  Quarterly:     { r1: 10, r2:  5, rf: 1 },
  Monthly:       { r1: 10, r2:  5, rf: 1 },
};

const STATUS_META = {
  active:   { label: "Active",        bg: "#DCFCE7", text: "#166534", dot: "#22C55E" },
  expiring: { label: "Expiring Soon", bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  critical: { label: "Critical",      bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  expired:  { label: "Expired",       bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
};

const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtISO   = (d) => d ? new Date(d).toISOString().split("T")[0] : "";
const addDays  = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const addMonths= (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

const getAdminRenewer = (employees) => {
  const admin = employees.find((emp) =>
    (emp.Department || "").trim().toLowerCase().includes("admin") &&
    ((emp["Department Head"] || "").trim() || (emp["Dept Head Email"] || "").trim())
  );

  return {
    renewerName: admin?.["Department Head"] || admin?.Emp_name || "",
    renewerDepartment: "Admin",
    renewerEmail: admin?.["Dept Head Email"] || admin?.["desig Email Id"] || "",
  };
};

export function getStatus(endDate) {
  if (!endDate) return "active";
  const d = daysBetween(new Date(), new Date(endDate));
  if (d < 0)   return "expired";
  if (d <= 7)  return "critical";
  if (d <= 30) return "expiring";
  return "active";
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.active;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.bg, color: m.text, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function DaysChip({ endDate }) {
  if (!endDate) return null;
  const d = daysBetween(new Date(), new Date(endDate));
  if (d < 0) return <span style={{ color: "#9CA3AF", fontSize: 12 }}>{Math.abs(d)}d overdue</span>;
  return <span style={{ color: d <= 7 ? "#EF4444" : d <= 30 ? "#F59E0B" : "#9CA3AF", fontSize: 12, fontWeight: 600 }}>in {d}d</span>;
}

// ────────────────────────────────────────────────────────
// VIEW MODAL (read-only)
// ────────────────────────────────────────────────────────
function ViewModal({ renewal, onClose, onEdit }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 780, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        {/* Header */}
        <div style={{ background: LIME, borderRadius: "16px 16px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>View Renewal</div>
            <div style={{ fontSize: 12, color: "#333", marginTop: 2 }}>{renewal.id} · {renewal.itemName}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.1)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Renewal Details */}
          <MSection title="Renewal Details">
            <div style={g2}>
              <ViewField label="Item ID" value={renewal.id} />
              <ViewField label="Category" value={renewal.category} />
            </div>
            {renewal.subcategory && (
              <div style={{ marginTop: 14 }}>
                <ViewField label="Subcategory" value={renewal.subcategory} />
              </div>
            )}
            <div style={{ ...g2, marginTop: 14 }}>
              <ViewField label="Item Name" value={renewal.itemName} />
              <ViewField label="Vendor" value={renewal.vendor || "—"} />
              <ViewField label="Authority" value={renewal.authority || "—"} />
            </div>
            {renewal.description && (
              <div style={{ marginTop: 14 }}>
                <ViewField label="Description" value={renewal.description} multiline />
              </div>
            )}
          </MSection>

          {/* Renewer Details */}
          <MSection title="Renewer Details">
            <div style={g3}>
              <ViewField label="Renewer Name" value={renewal.renewerName} />
              <ViewField label="Renewer Department" value={renewal.renewerDepartment} />
              <ViewField label="Renewer Email" value={renewal.renewerEmail} />
            </div>
          </MSection>

          {/* User Details */}
          <MSection title="User Details">
            <div style={g2}>
              <ViewField label="Employee Name" value={renewal.empName} />
              <ViewField label="Employee ID" value={renewal.empId} />
              <ViewField label="Department" value={renewal.department} />
              <ViewField label="Designation" value={renewal.designation} />
              <ViewField label="Email" value={renewal.email} />
              <ViewField label="Reporting Manager" value={renewal.reportingManager} />
            </div>
          </MSection>

          {/* Reminders */}
          <MSection title="Reminders">
            <div style={g3}>
              <ViewField label="Start Date" value={fmtDate(renewal.startDate)} />
              <ViewField label="End Date" value={fmtDate(renewal.endDate)} />
              <ViewField label="Frequency" value={renewal.frequency} />
              <ViewField label="1st Reminder (days before)" value={renewal.reminder1Days} />
              <ViewField label="2nd Reminder (days before)" value={renewal.reminder2Days} />
              <ViewField label="Final Reminder (days before)" value={renewal.reminderFinalDays} />
            </div>
          </MSection>

          {/* Additional */}
          <MSection title="Additional Details">
            <div style={g2}>
              {renewal.remarks && <ViewField label="Remarks" value={renewal.remarks} multiline />}
              {renewal.link && <ViewField label="Website Link" value={renewal.link} />}
            </div>
            {renewal.category === "Warranty" && (
              <div style={{ ...g2, marginTop: 14 }}>
                <ViewField label="Assigned User" value={renewal.userPerson || "—"} />
                <ViewField label="User Department" value={renewal.userDepartment || "—"} />
              </div>
            )}
          </MSection>

          {/* Attachments */}
          {(renewal.attachment1Link || renewal.attachment2Link) && (
            <MSection title="Attachments">
              {renewal.attachment1Link && <ViewField label="Attachment 1" value={renewal.attachment1Link} link />}
              {renewal.attachment2Link && <ViewField label="Attachment 2" value={renewal.attachment2Link} link />}
            </MSection>
          )}

          {/* Footer buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
            <button onClick={onClose} style={cancelStyle}>Close</button>
            <button onClick={onEdit} style={{ ...saveStyle, background: LIME }}>
              ✏️ Edit
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function ViewField({ label, value, multiline, link }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>{label}</label>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#0EA5E9", textDecoration: "none", wordBreak: "break-all" }}>{value}</a>
      ) : multiline ? (
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{value}</div>
      ) : (
        <div style={{ fontSize: 13, color: "#374151" }}>{value || "—"}</div>
      )}
    </div>
  );
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
  startDate:          r.start_date  ? r.start_date.split("T")[0]  : "",
  endDate:            r.end_date    ? r.end_date.split("T")[0]    : "",
  frequency:          r.frequency            || "",
  reminder1Days:      r.reminder1_days       ?? 30,
  reminder2Days:      r.reminder2_days       ?? 10,
  reminderFinalDays:  r.reminder_final_days  ?? 1,
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

// ────────────────────────────────────────────────────────
// EDIT MODAL
// ────────────────────────────────────────────────────────
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
      .catch(err => console.error(err));
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
    if (!emp) { setForm(f => ({ ...f, selectedEmployeeId: "", empName: "", empId: "", department: "", designation: "", email: "", reportingManager: "" })); return; }
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
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, endDate }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (err) {
      alert("❌ Failed to save");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inp = (name, extra = {}) => ({
    border: `1.5px solid ${errors[name] ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 8, padding: "8px 12px", fontSize: 13,
    color: "#111", outline: "none", width: "100%",
    boxSizing: "border-box", fontFamily: "inherit", ...extra,
  });

  const sel = (name) => ({
    ...inp(name), cursor: "pointer", background: "#fff", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 32,
  });

  const ro = (extra = {}) => inp("", { background: "#F9FAFB", color: "#6B7280", ...extra });

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 16px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 780, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
      >
        {/* Header */}
        <div style={{ background: LIME, borderRadius: "16px 16px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>Edit Renewal</div>
            <div style={{ fontSize: 12, color: "#333", marginTop: 2 }}>{renewal.id} · {renewal.itemName}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.1)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Renewal Details */}
          <MSection title="Renewal Details">
            <div style={g2}>
              <MField label="Item ID"><input value={renewal.id} readOnly style={ro()} /></MField>
              <MField label="Category *" error={errors.category}>
                <select value={form.category} onChange={e => { set("category", e.target.value); set("subcategory", ""); }} style={sel("category")}>
                  <option value="">Choose</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </MField>
            </div>
            {subcats.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <MField label="Subcategory">
                  <select value={form.subcategory} onChange={e => set("subcategory", e.target.value)} style={sel("")}>
                    <option value="">Choose</option>
                    {subcats.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </MField>
              </div>
            )}
            <div style={{ ...g2, marginTop: 14 }}>
              <MField label="Item Name *" error={errors.itemName}>
                <input value={form.itemName} onChange={e => set("itemName", e.target.value)} style={inp("itemName")} />
              </MField>
              <MField label="Vendor">
                <input value={form.vendor} onChange={e => set("vendor", e.target.value)} style={inp("")} />
              </MField>
              <MField label="Authority (if applicable)">
                <input value={form.authority} onChange={e => set("authority", e.target.value)} style={inp("")} />
              </MField>
            </div>
            <div style={{ marginTop: 14 }}>
              <MField label="Description" error={errors.description}>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} style={{ ...inp("description"), resize: "vertical", minHeight: 70 }} />
                <div style={{ fontSize: 11, color: words > 150 ? "#EF4444" : "#9CA3AF", textAlign: "right", marginTop: 2 }}>{words} / 150 words</div>
              </MField>
            </div>
          </MSection>

          {/* Renewer Details */}
          <MSection title="Renewer Details">
            <div style={g3}>
              <MField label="Renewer Name">
                <input value={form.renewerName || ""} readOnly style={ro()} placeholder="Admin department head" />
              </MField>
              <MField label="Renewer Department">
                <input value={form.renewerDepartment || "Admin"} readOnly style={ro()} />
              </MField>
              <MField label="Renewer Email">
                <input value={form.renewerEmail || ""} readOnly style={ro()} placeholder="Admin dept head email" />
              </MField>
            </div>
          </MSection>

          {/* User Details */}
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

          {/* Reminders */}
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
              <MField label="1st Reminder (days before)">
                <input type="number" min="0" value={form.reminder1Days} onChange={e => set("reminder1Days", +e.target.value)} style={inp("")} />
              </MField>
              <MField label="2nd Reminder (days before)">
                <input type="number" min="0" value={form.reminder2Days} onChange={e => set("reminder2Days", +e.target.value)} style={inp("")} />
              </MField>
              <MField label="Final Reminder (days before)">
                <input type="number" min="0" value={form.reminderFinalDays} onChange={e => set("reminderFinalDays", +e.target.value)} style={inp("")} />
              </MField>
            </div>

            {endDate && (
              <div style={{ marginTop: 14, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", marginBottom: 10 }}>📅 Reminder Preview</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                  {[
                    { label: "Renewal Date",                         date: endDate,                       color: "#059669" },
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

          {/* Additional */}
          <MSection title="Additional Details">
            <div style={g2}>
              <MField label="Remarks">
                <input value={form.remarks} onChange={e => set("remarks", e.target.value)} style={inp("")} />
              </MField>
              <MField label="Website Link">
                <input type="url" value={form.link} onChange={e => set("link", e.target.value)} style={inp("")} placeholder="https://..." />
              </MField>
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

          {/* Attachments */}
          <MSection title="Attachments (optional)">
            {[1, 2].map(n => (
              <div key={n}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Attachment {n}</div>
                <input type="url" value={form[`attachment${n}Link`]} onChange={e => set(`attachment${n}Link`, e.target.value)} style={{ ...inp(""), marginBottom: n === 1 ? 14 : 0 }} placeholder="Paste a Drive / web link" />
              </div>
            ))}
          </MSection>

          {/* Footer buttons */}
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

// ── Modal sub-components ──────────────────────────────────
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
const saveStyle   = { padding: "10px 26px", borderRadius: 8, border: "none", background: LIME, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };

// ────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────
export default function Dashboard({ categories = [], onNew, onEdit, onSelect, onUpdate, onNavigateUpdateForm }) {
  const [renewals,  setRenewals]  = useState([]);
  const [archived,  setArchived]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [statusF,   setStatusF]   = useState("all");
  const [catF,      setCatF]      = useState("all");
  const [viewMode,  setViewMode]  = useState(null);
  const [editMode,  setEditMode]  = useState(null);
  const [tab,       setTab]       = useState("active"); // ← "active" or "archived"

  const fetchRenewals = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API}/api/renewals`);
      const data = await res.json();
      if (data.success) setRenewals(data.data.map(mapRenewal));

      const arRes = await fetch(`${API}/api/renewals/archived/list`);
      const arData = await arRes.json();
      if (arData.success) setArchived(arData.data.map(mapRenewal));
    } catch (err) {
      console.error("Failed to fetch renewals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRenewals(); }, [fetchRenewals]);

  const counts = renewals.reduce(
    (acc, r) => { acc[getStatus(r.endDate)]++; return acc; },
    { active: 0, expiring: 0, critical: 0, expired: 0 }
  );

  const visible = (tab === "archived" ? archived : renewals).filter((r) => {
    const q           = search.toLowerCase();
    const name        = (r.itemName    || "").toLowerCase();
    const vendor      = (r.vendor      || "").toLowerCase();
    const responsible = (r.responsible || "").toLowerCase();
    return (
      (!q || name.includes(q) || vendor.includes(q) || responsible.includes(q)) &&
      (tab === "archived" || (statusF === "all" || getStatus(r.endDate) === statusF)) &&
      (catF    === "all" || r.category === catF)
    );
  });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #E5E7EB", borderTop: "3px solid #ADE80A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#9CA3AF", fontSize: 14 }}>Loading renewals...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        <StatsCard label="Total Renewals" value={renewals.length}                   sub="All items"        accent={LIME}    />
        <StatsCard label="Active"         value={counts.active}                     sub="In good standing" accent="#22C55E" />
        <StatsCard label="Expiring Soon"  value={counts.expiring + counts.critical} sub="Within 30 days"   accent="#F59E0B" />
        <StatsCard label="Overdue"        value={counts.expired}                    sub="Needs attention"  accent="#EF4444" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, borderBottom: "2px solid #F3F4F6" }}>
        <button
          onClick={() => { setTab("active"); setSearch(""); setStatusF("all"); setCatF("all"); }}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 600,
            color: tab === "active" ? "#111" : "#9CA3AF",
            cursor: "pointer",
            borderBottom: tab === "active" ? `3px solid ${LIME}` : "none",
            marginBottom: "-2px",
          }}
        >
          📋 Active Renewals ({renewals.length})
        </button>
        <button
          onClick={() => { setTab("archived"); setSearch(""); setStatusF("all"); setCatF("all"); }}
          style={{
            padding: "12px 20px",
            border: "none",
            background: "transparent",
            fontSize: 14,
            fontWeight: 600,
            color: tab === "archived" ? "#111" : "#9CA3AF",
            cursor: "pointer",
            borderBottom: tab === "archived" ? `3px solid ${LIME}` : "none",
            marginBottom: "-2px",
          }}
        >
          📦 Archive ({archived.length})
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "archived" ? "Search by name, vendor..." : "Search by name, vendor, person…"} style={inputStyle} />
        {tab === "active" && (
          <>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={selectStyle}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="critical">Critical</option>
              <option value="expired">Expired</option>
            </select>
          </>
        )}
        <select value={catF} onChange={(e) => setCatF(e.target.value)} style={selectStyle}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        {(search || (tab === "active" && statusF !== "all") || catF !== "all") && (
          <button onClick={() => { setSearch(""); setStatusF("all"); setCatF("all"); }} style={clearBtnStyle}>Clear</button>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <TH>ID</TH><TH>Item</TH><TH>Category</TH><TH>Vendor</TH>
                {tab === "active" ? (
                  <>
                    <TH>Responsible</TH><TH>Renewal Date</TH><TH>Status</TH><TH></TH>
                  </>
                ) : (
                  <>
                    <TH>Closed Date</TH><TH></TH>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setViewMode(r)}
                  style={{ borderBottom: "1px solid #F9FAFB", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
                        <DaysChip endDate={r.endDate} />
                      </td>
                      <td style={{ padding: "13px 16px" }}><StatusBadge status={getStatus(r.endDate)} /></td>
                      <td style={{ padding: "13px 16px" }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditMode(r); }}
                          style={{ background: LIME_PALE, color: "#4B5320", border: `1px solid ${LIME}`, borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{fmtDate(r.closedAt)}</td>
                      <td></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>No renewals found</div>
        )}
        <div style={{ padding: "12px 18px", borderTop: "1px solid #F3F4F6", color: "#9CA3AF", fontSize: 12 }}>
          Showing {visible.length} of {renewals.length} items
        </div>
      </div>

      {/* ── Modals ── */}
      {viewMode && (
        <ViewModal
          renewal={viewMode}
          onClose={() => setViewMode(null)}
          onEdit={() => { setEditMode(viewMode); setViewMode(null); }}
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
