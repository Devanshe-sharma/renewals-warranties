import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";

const LIME = "#1976d2";
const FREQ_MONTHS = { Monthly: 1, Quarterly: 3, "Half Yearly": 6, Annually: 12 };
const DEFAULT_REMIND = {
  Annually:      { r1: 30, r2: 10, rf: 1 },
  "Half Yearly": { r1: 30, r2: 10, rf: 1 },
  Quarterly:     { r1: 10, r2:  5, rf: 1 },
  Monthly:       { r1: 10, r2:  5, rf: 1 },
};

const BLANK = {
  itemName: "", category: "", subcategory: "", description: "", vendor: "", authority: "",
  renewerName: "", renewerDepartment: "Admin", renewerEmail: "",
  selectedEmployeeId: "",
  empName: "", empId: "", department: "", designation: "",
  email: "", reportingManager: "",
  startDate: "", frequency: "",
  reminder1Days: 30, reminder2Days: 10, reminderFinalDays: 1,
  remarks: "", link: "",
  userPerson: "", userDepartment: "",
  attachment1Link: "", attachment2Link: "",
};

const addDays   = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const fmtISO    = (d)    => d ? new Date(d).toISOString().split("T")[0] : "";
const fmtDate   = (d)    => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

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

const getAdminUser = (employees) => {
  const user = employees.find((emp) =>
    (emp.Department || "").trim().toLowerCase().includes("admin") &&
    ((emp["Department Head"] || "").trim() || (emp["Dept Head Email"] || "").trim())
  );

  return {
    renewerName: user?.["Department Head"] || user?.Emp_name || "",
    renewerDepartment: "Admin",
    renewerEmail: user?.["Dept Head Email"] || user?.["desig Email Id"] || "",
  };
};

export default function NewForm({ onSave, onCancel }) {
  const [form,       setForm]       = useState(BLANK);
  const [errors,     setErrors]     = useState({});
  const [words,      setWords]      = useState(0);
  const [categories, setCategories] = useState([]);
  const [employees,  setEmployees]  = useState([]);
  const [nextItemId, setNextItemId]  = useState("RW 001");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

// ── Fetch next item ID ────────────────────────────────
useEffect(() => {
  fetch(`${process.env.REACT_APP_API_URL}/api/renewals`)
    .then(r => r.json())
    .then(data => {
      if (data.success && data.data) {
        const existingIds = data.data
          .map(item => {
            const match = (item.item_id || "").match(/RW[-\s]*(\d+)/i);   // ← item.item_id, not item.id
            return match ? parseInt(match[1]) : 0;
          })
          .filter(id => id > 0);

        const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
        setNextItemId(`RW-${String(maxId + 1).padStart(4, "0")}`);
      }
    })
    .catch(() => setNextItemId("RW —"));
}, []);

  // ── Fetch yyycategories ──────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/categories`)
      .then(r => r.json())
      .then(data => setCategories(
        data.map(c => ({
          id: c._id, name: c.name,
          subcategories: (c.subcategories || []).map(s => ({ id: s._id, name: s.name }))
        }))
      ))
      .catch(err => console.error("Category fetch error:", err));
  }, []);

  // ── Fetch employees ───────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/employee`)
      .then(r => r.json())
      .then(data => {
        console.log("Employees loaded:", data.length);
        console.log("Sample:", data[0]);
        setEmployees(data);
        setForm(f => ({ ...f, ...getAdminUser(data) }));
      })
      .catch(err => console.error("Employee fetch error:", err));
  }, []);

  // ── Derived ───────────────────────────────────────────
  const selectedCategory = categories.find(c => c.name === form.category);
  const subcats = selectedCategory?.subcategories || [];

  const endDate = form.startDate && form.frequency
    ? fmtISO(addMonths(new Date(form.startDate), FREQ_MONTHS[form.frequency] || 12))
    : "";

  const rDate = (days) => endDate ? fmtISO(addDays(new Date(endDate), -days)) : "";

  // ── Side effects ──────────────────────────────────────
  useEffect(() => {
    setWords((form.description || "").trim().split(/\s+/).filter(Boolean).length);
  }, [form.description]);

  useEffect(() => {
    set("subcategory", "");
    if (form.category !== "Warranty") {
      set("userPerson", "");
      set("userDepartment", "");
    }
  }, [form.category]);

  useEffect(() => {
    if (form.frequency && DEFAULT_REMIND[form.frequency]) {
      const d = DEFAULT_REMIND[form.frequency];
      setForm(f => ({ ...f, reminder1Days: d.r1, reminder2Days: d.r2, reminderFinalDays: d.rf }));
    }
  }, [form.frequency]);

  // ── Employee select → autofill ────────────────────────
  const handleEmployeeSelect = (id) => {
    const emp = employees.find(e => e._id === id);
    if (!emp) {
      setForm(f => ({
        ...f,
        selectedEmployeeId: "",
        empName: "", empId: "", department: "",
        designation: "", email: "", reportingManager: ""
      }));
      return;
    }
    setForm(f => ({
      ...f,
      selectedEmployeeId: id,
      empName:          emp.Emp_name              || "",
      empId:            String(emp.Emp_id)         || "",
      department:       emp.Department             || "",
      designation:      emp.Designation            || "",
      email:            emp["desig Email Id"]      || "",
      reportingManager: emp["Reporting Manager"]   || "",
    }));
  };

  // ── Validation ────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.itemName.trim()) e.itemName   = "Required";
    if (!form.category)        e.category   = "Required";
    if (!form.startDate)       e.startDate  = "Required";
    if (!form.frequency)       e.frequency  = "Required";
    if (words > 150)           e.description = "Max 150 words";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
  if (!validate()) return;
  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/renewals`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, endDate }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Renewal created — ID: ${data.data.item_id}`);
      onSave(data.data);
    } else {
      alert(`❌ Error: ${data.message}`);
    }
  } catch (err) {
    alert('❌ Failed to save. Check your connection.');
    console.error(err);
  }
};

  // ── Styles ────────────────────────────────────────────
  const inp = (name, extra = {}) => ({
    border: `1.5px solid ${errors[name] ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 8, padding: "9px 13px", fontSize: 14,
    color: "#000", outline: "none", width: "100%",
    boxSizing: "border-box", fontFamily: "inherit", ...extra,
  });

  const sel = (name) => ({
    ...inp(name), cursor: "pointer", background: "#fff", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 36,
  });

  const readOnly = (extra = {}) => inp("", { background: "#F9FAFB", color: "#6B7280", ...extra });

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        
        
        breadcrumb={[{ label: "Dashboard", onClick: onCancel }, { label: "Create Renewal List" }]}
        actions={
          <>
            <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleSave} style={saveBtnStyle}> Create Renewal List</button>
          </>
        }
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Renewal Details ── */}
        <Section title="Renewal Details" emoji="📋">
          <div style={grid2}>
            <Field label="Item ID">
              <input value={nextItemId} readOnly style={readOnly()} placeholder="Auto-generated" />
            </Field>
            <Field label="Category" error={errors.category} required>
              <select value={form.category} onChange={e => set("category", e.target.value)} style={sel("category")}>
                <option value="">Choose category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          {subcats.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Field label="Subcategory">
                <select value={form.subcategory} onChange={e => set("subcategory", e.target.value)} style={sel("")}>
                  <option value="">Choose subcategory</option>
                  {subcats.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <Field label="Item Name" error={errors.itemName} required>
              <input value={form.itemName} onChange={e => set("itemName", e.target.value)}
                style={inp("itemName")} placeholder="e.g. Google Workspace Annual" />
            </Field>
          </div>

          <div style={{ marginTop: 20 }}>
            <Field label="Description" error={errors.description}>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                style={{ ...inp("description"), resize: "vertical", minHeight: 80 }}
                placeholder="Optional description (max 150 words)" />
              <div style={{ fontSize: 11, color: words > 150 ? "#EF4444" : "#9CA3AF", textAlign: "right", marginTop: 2 }}>
                {words} / 150 words
              </div>
            </Field>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={grid2}>
              <Field label="Vendor">
                <input value={form.vendor} onChange={e => set("vendor", e.target.value)}
                  style={inp("")} placeholder="" />
              </Field>
              <Field label="Authority (if applicable)">
                <input value={form.authority} onChange={e => set("authority", e.target.value)}
                  style={inp("")} placeholder="" />
              </Field>
            </div>
          </div>
        </Section>

        {/* Renewer Details */}
        <Section title="Renewer Details" emoji="👤">
          <div style={grid3}>
            <Field label="Renewer Name">
              <input value={form.renewerName} readOnly style={readOnly()} placeholder="Admin department head" />
            </Field>
            <Field label="Renewer Department">
              <input value={form.renewerDepartment} readOnly style={readOnly()} />
            </Field>
            <Field label="Renewer Email">
              <input value={form.renewerEmail} readOnly style={readOnly()} placeholder="Admin dept head email" />
            </Field>
          </div>
        </Section>

        {/* User Details */}
        <Section title="User Details" emoji="👤">
          <div style={{ marginBottom: 20 }}>
            <Field label="Employee Name" required>
              <select value={form.selectedEmployeeId}
                onChange={e => handleEmployeeSelect(e.target.value)} style={sel("")}>
                <option value="">Select employee</option>
                {employees.sort((a, b) => a.Emp_name.localeCompare(b.Emp_name)).map(em => (
                  <option key={em._id} value={em._id}>{em.Emp_name}</option>
                ))}
              </select>
            </Field>
          </div>

          <div style={grid2}>
            <Field label="Employee ID">
              <input value={form.empId} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
            <Field label="Department">
              <input value={form.department} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
            <Field label="Designation">
              <input value={form.designation} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
            <Field label="Email">
              <input value={form.email} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
            <Field label="Reporting Manager">
              <input value={form.reportingManager} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
          </div>
        </Section>

        {/* ── Reminders ── */}
        <Section title="Reminders" emoji="🔔">
          <div style={grid3}>
            <Field label="Service start Date" error={errors.startDate} required>
              <input type="date" value={form.startDate}
                onChange={e => set("startDate", e.target.value)} style={inp("startDate")} />
            </Field>
            <Field label="Renewal Frequency" error={errors.frequency} required>
              <select value={form.frequency} onChange={e => set("frequency", e.target.value)} style={sel("frequency")}>
                <option value="">Select frequency</option>
                {Object.keys(FREQ_MONTHS).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="End Date (auto-calculated)">
              <input value={endDate ? fmtDate(endDate) : ""} readOnly
                style={readOnly({ color: "#059669" })} placeholder="Set Service start date & frequency" />
            </Field>
            
            <Field label="1st Reminder (days before)">
              <input type="number" min="0" value={form.reminder1Days}
                onChange={e => set("reminder1Days", +e.target.value)} style={inp("")} />
            </Field>
            <Field label="2nd Reminder (days before)">
              <input type="number" min="0" value={form.reminder2Days}
                onChange={e => set("reminder2Days", +e.target.value)} style={inp("")} />
            </Field>
            <Field label="Final Reminder (days before)">
              <input type="number" min="0" value={form.reminderFinalDays}
                onChange={e => set("reminderFinalDays", +e.target.value)} style={inp("")} />
            </Field>
          </div>

          {endDate && (
            <div style={{ marginTop: 20, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 12 }}>📅 Reminder Preview</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { label: "Renewal Date",                          date: endDate,                       color: "#059669" },
                  { label: `1st (${form.reminder1Days}d before)`,   date: rDate(form.reminder1Days),     color: "#374151" },
                  { label: `2nd (${form.reminder2Days}d before)`,   date: rDate(form.reminder2Days),     color: "#374151" },
                  { label: `Final (${form.reminderFinalDays}d)`,    date: rDate(form.reminderFinalDays), color: "#374151" },
                ].map(({ label, date, color }) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#6B7280", marginBottom: 4, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color }}>{fmtDate(date)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* ── Additional Details ── */}
        <Section title="Additional Details" emoji="ℹ️">
          <div style={grid2}>
            <Field label="Remarks">
              <textarea
                value={form.remarks}
                onChange={e => set("remarks", e.target.value)}
                style={{
                  ...inp(""),
                  minHeight: "50px",
                  resize: "vertical",
                  paddingTop: "10px"
                }}
                placeholder="Optional remarks"
              />
            </Field>
            <Field label="Website Link">
              <input type="url" value={form.link} onChange={e => set("link", e.target.value)}
                style={inp("")} placeholder="https://..." />
            </Field>
          </div>

          {form.category === "Warranty" && (
            <div style={{ ...grid2, marginTop: 20 }}>
              <Field label="Assigned User">
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
              </Field>
              <Field label="User Department (auto-filled)">
                <input value={form.userDepartment} readOnly style={readOnly()} />
              </Field>
            </div>
          )}
        </Section>

        {/* ── Attachments ── */}
        <Section title="Attachments (optional)" emoji="📎">
          {[1, 2].map(n => (
            <div key={n}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
                Attachment {n}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1.5px solid #E5E7EB", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 500, background: "#F9FAFB", whiteSpace: "nowrap" }}>
                  📎 Choose File
                  <input type="file" style={{ display: "none" }} />
                </label>
                <span style={{ color: "#9CA3AF", fontSize: 13 }}>or</span>
                <input type="url" value={form[`attachment${n}Link`]}
                  onChange={e => set(`attachment${n}Link`, e.target.value)}
                  style={{ ...inp(""), flex: 1, minWidth: 200 }}
                  placeholder="Paste a Drive / web link" />
              </div>
              {n === 1 && <div style={{ height: 1, background: "#F3F4F6", margin: "20px 0" }} />}
            </div>
          ))}
        </Section>

        {/* ── Submit ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 40, background: "#fff" }}>
          <button onClick={onCancel} style={{ ...cancelBtnStyle, background: "#fff", color: "#1976d2" }}>Cancel</button>
          <button onClick={handleSave} style={{ ...saveBtnStyle, background: "#1976d2", color: "#fff" }}>✅ Create Renewal</button>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────
function Section({ title, emoji, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      <div style={{ margin: "-24px -24px 22px", background: LIME, padding: "13px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <span>{emoji}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
        {label} {required && <span style={{ color: "#EF4444" }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#EF4444" }}>{error}</span>}
    </div>
  );
}

// ── Layout & Buttons ──────────────────────────────────────
const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 };

const cancelBtnStyle = {
  padding: "11px 24px", borderRadius: 10,
  border: "1.5px solid #E5E7EB", background: "#fff", color: "#1976d2",
  fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
};

const saveBtnStyle = {
  padding: "11px 28px", borderRadius: 10,
  border: "none", background: "#fff", color: "#1976d2",
  fontSize: 14, fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
};
