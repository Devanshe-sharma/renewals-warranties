import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";

// ── Constants ─────────────────────────────────────────────
const LIME = "#ADE80A";

const FREQ_MONTHS = { Monthly: 1, Quarterly: 3, "Half Yearly": 6, Annually: 12 };

const DEFAULT_REMIND = {
  Annually:      { r1: 30, r2: 10, rf: 1 },
  "Half Yearly": { r1: 30, r2: 10, rf: 1 },
  Quarterly:     { r1: 10, r2:  5, rf: 1 },
  Monthly:       { r1: 10, r2:  5, rf: 1 },
};

const MOCK_EMPLOYEES = [
  { name: "Ranjeet Singh",  department: "Admin"      },
  { name: "Priya Sharma",   department: "IT"         },
  { name: "Amit Kumar",     department: "Finance"    },
  { name: "Neha Gupta",     department: "HR"         },
  { name: "Rohit Verma",    department: "Operations" },
];

// ── Date helpers ──────────────────────────────────────────
const addDays   = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const fmtISO    = (d)    => d ? new Date(d).toISOString().split("T")[0] : "";
const fmtDate   = (d)    => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

// ────────────────────────────────────────────────────────
// UPDATE FORM
// Props:
//   renewal    {Object} – the existing renewal to edit (required)
//   categories {Array}  – [{ id, name, subcategories:[{id,name}] }]
//   onSave     {fn}     – called with the updated renewal object
//   onCancel   {fn}
// ────────────────────────────────────────────────────────
export default function UpdateForm({ renewal, categories = [], onSave, onCancel }) {
  // Pre-fill form from the existing renewal object
  const [form,   setForm]   = useState({ ...renewal });
  const [errors, setErrors] = useState({});
  const [words,  setWords]  = useState(0);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Derived ───────────────────────────────────────────
  const selectedCategory = categories.find((c) => c.name === form.category);
  const subcats = selectedCategory ? selectedCategory.subcategories : [];

  const endDate = form.startDate && form.frequency
    ? fmtISO(addMonths(new Date(form.startDate), FREQ_MONTHS[form.frequency] || 12))
    : "";

  const rDate = (days) => (endDate ? fmtISO(addDays(new Date(endDate), -days)) : "");

  // ── Side effects ──────────────────────────────────────
  useEffect(() => {
    setWords((form.description || "").trim().split(/\s+/).filter(Boolean).length);
  }, [form.description]);

  // Changing category → reset subcategory (unless already matching)
  const handleCategoryChange = (newCat) => {
    const cat = categories.find((c) => c.name === newCat);
    const subExists = cat?.subcategories.some((s) => s.name === form.subcategory);
    setForm((f) => ({ ...f, category: newCat, subcategory: subExists ? f.subcategory : "" }));
  };

  // ── Validation ────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.itemName.trim()) e.itemName  = "Required";
    if (!form.category)        e.category  = "Required";
    if (!form.startDate)       e.startDate = "Required";
    if (!form.frequency)       e.frequency = "Required";
    if (!form.mode)            e.mode      = "Required";
    if (!form.currency)        e.currency  = "Required";
    if (!form.holder)          e.holder    = "Required";
    if (words > 150)           e.description = "Max 150 words";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      ...form,
      endDate, // recalculate from startDate + frequency
    });
  };

  // ── Style factories ───────────────────────────────────
  const inp = (name, extra = {}) => ({
    border: `1.5px solid ${errors[name] ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 8, padding: "9px 13px",
    fontSize: 14, color: "#111", outline: "none",
    width: "100%", boxSizing: "border-box",
    fontFamily: "inherit", ...extra,
  });

  const sel = (name) => ({
    ...inp(name),
    cursor: "pointer", background: "#fff", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
    paddingRight: 36,
  });

  return (
    <div>
      {/* ── Navbar ── */}
      <Navbar
        title="Update Renewal"
        subtitle={`Editing: ${renewal.itemName}`}
        breadcrumb={[{ label: "Dashboard", onClick: onCancel }, { label: renewal.itemName }]}
        actions={
  <>
    <button
      onClick={onCancel}
      style={{
        padding: "8px 16px",
        borderRadius: 8,
        border: "1px solid #E5E7EB",
        background: "#fff",
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Cancel
    </button>

    <button
      onClick={handleSave}
      style={{
        padding: "8px 16px",
        borderRadius: 8,
        border: "none",
        background: "#ADE80A",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      ✅ Create Renewal
    </button>
  </>
}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Renewal Details ── */}
        <Section title="Renewal Details" emoji="📋">
          <div style={grid2}>
            {/* ID is read-only on edit */}
            <Field label="Item ID">
              <input value={renewal.id} readOnly style={inp("", { background: "#F9FAFB", color: "#9CA3AF" })} />
            </Field>
            <Field label="Category" name="category" error={errors.category} required>
              <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)} style={sel("category")}>
                <option value="">Choose category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {subcats.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Field label="Subcategory">
                <select value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)} style={sel("")}>
                  <option value="">Choose subcategory</option>
                  {subcats.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <Field label="Item Name" name="itemName" error={errors.itemName} required>
              <input value={form.itemName} onChange={(e) => set("itemName", e.target.value)} style={inp("itemName")} />
            </Field>
          </div>

          <div style={{ marginTop: 20 }}>
            <Field label="Description" name="description" error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                style={{ ...inp("description"), resize: "vertical", minHeight: 80 }}
                placeholder="Optional description (max 150 words)"
              />
              <div style={{ fontSize: 11, color: words > 150 ? "#EF4444" : "#9CA3AF", textAlign: "right", marginTop: 2 }}>
                {words} / 150 words
              </div>
            </Field>
          </div>

          <div style={{ marginTop: 20 }}>
            <Field label="Vendor / Authority">
              <input value={form.vendor} onChange={(e) => set("vendor", e.target.value)} style={inp("")} />
            </Field>
          </div>
        </Section>

        {/* ── Renewer Details ── */}
        <Section title="Renewer Details" emoji="👤">
          <div style={grid2}>
            <Field label="Responsible Person">
              <select
                value={form.responsible}
                onChange={(e) => {
                  const emp = MOCK_EMPLOYEES.find((em) => em.name === e.target.value);
                  setForm((f) => ({ ...f, responsible: e.target.value, department: emp?.department || "" }));
                }}
                style={sel("")}
              >
                {MOCK_EMPLOYEES.map((em) => (
                  <option key={em.name} value={em.name}>{em.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Renewal Department">
              <input value={form.department} readOnly style={inp("", { background: "#F9FAFB" })} />
            </Field>
            <Field label="Email (Owner)">
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} style={inp("")} />
            </Field>
          </div>
        </Section>

        {/* ── Reminders ── */}
        <Section title="Reminders" emoji="🔔">
          <div style={grid3}>
            <Field label="Start Date" name="startDate" error={errors.startDate} required>
              <input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} style={inp("startDate")} />
            </Field>
            <Field label="End Date (auto-calculated)">
              <input value={endDate ? fmtDate(endDate) : ""} readOnly style={inp("", { background: "#F9FAFB", color: "#059669" })} />
            </Field>
            <Field label="Renewal Frequency" name="frequency" error={errors.frequency} required>
              <select value={form.frequency} onChange={(e) => set("frequency", e.target.value)} style={sel("frequency")}>
                <option value="">Select frequency</option>
                {Object.keys(FREQ_MONTHS).map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="1st Reminder (days before)">
              <input type="number" min="0" value={form.reminder1Days} onChange={(e) => set("reminder1Days", +e.target.value)} style={inp("")} />
            </Field>
            <Field label="2nd Reminder (days before)">
              <input type="number" min="0" value={form.reminder2Days} onChange={(e) => set("reminder2Days", +e.target.value)} style={inp("")} />
            </Field>
            <Field label="Final Reminder (days before)">
              <input type="number" min="0" value={form.reminderFinalDays} onChange={(e) => set("reminderFinalDays", +e.target.value)} style={inp("")} />
            </Field>
          </div>

          {endDate && (
            <div style={{ marginTop: 20, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 12 }}>📅 Reminder Preview</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { label: "Renewal Date",                        date: endDate,                      color: "#059669" },
                  { label: `1st (${form.reminder1Days}d before)`, date: rDate(form.reminder1Days),    color: "#374151" },
                  { label: `2nd (${form.reminder2Days}d before)`, date: rDate(form.reminder2Days),    color: "#374151" },
                  { label: `Final (${form.reminderFinalDays}d)`,  date: rDate(form.reminderFinalDays),color: "#374151" },
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

        {/* ── Payment ── */}
        <Section title="Payment Details" emoji="💳">
          <div style={grid2}>
            <Field label="Standard Renewal Cost">
              <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set("cost", e.target.value)} style={inp("")} />
            </Field>
            <Field label="Payment Transfer Mode" name="mode" error={errors.mode} required>
              <select value={form.mode} onChange={(e) => set("mode", e.target.value)} style={sel("mode")}>
                <option value="">Select mode</option>
                {["Bank", "Credit Card", "Prepaid Card", "Auto Update"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Currency" name="currency" error={errors.currency} required>
              <select value={form.currency} onChange={(e) => set("currency", e.target.value)} style={sel("currency")}>
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </Field>
            <Field label="Holder" name="holder" error={errors.holder} required>
              <select value={form.holder} onChange={(e) => set("holder", e.target.value)} style={sel("holder")}>
                <option value="">Select holder</option>
                <option value="admin">Admin</option>
                <option value="accounts">Accounts</option>
              </select>
            </Field>
            <Field label="Active">
              <select value={form.active} onChange={(e) => set("active", e.target.value)} style={sel("")}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Additional ── */}
        <Section title="Additional Details" emoji="ℹ️">
          <div style={grid2}>
            <Field label="Remarks">
              <input value={form.remarks} onChange={(e) => set("remarks", e.target.value)} style={inp("")} />
            </Field>
            <Field label="Website Link">
              <input type="url" value={form.link} onChange={(e) => set("link", e.target.value)} style={inp("")} />
            </Field>
          </div>

          {form.category === "Warranty" && (
            <div style={{ ...grid2, marginTop: 20 }}>
              <Field label="User (optional)">
                <select
                  value={form.userPerson}
                  onChange={(e) => {
                    const emp = MOCK_EMPLOYEES.find((em) => em.name === e.target.value);
                    setForm((f) => ({ ...f, userPerson: e.target.value, userDepartment: emp?.department || "" }));
                  }}
                  style={sel("")}
                >
                  <option value="">Choose user</option>
                  {MOCK_EMPLOYEES.map((em) => <option key={em.name} value={em.name}>{em.name}</option>)}
                </select>
              </Field>
              <Field label="User Department (auto-filled)">
                <input value={form.userDepartment} readOnly style={inp("", { background: "#F9FAFB" })} />
              </Field>
            </div>
          )}
        </Section>

        {/* ── Attachments ── */}
        <Section title="Attachments (optional)" emoji="📎">
          {[1, 2].map((n) => (
            <div key={n}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Attachment {n}</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1.5px solid #E5E7EB", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 500, background: "#F9FAFB", whiteSpace: "nowrap" }}>
                  📎 Choose File
                  <input type="file" style={{ display: "none" }} />
                </label>
                <span style={{ color: "#9CA3AF", fontSize: 13 }}>or</span>
                <input
                  type="url"
                  value={form[`attachment${n}Link`] || ""}
                  onChange={(e) => set(`attachment${n}Link`, e.target.value)}
                  style={{ ...inp(""), flex: 1, minWidth: 200 }}
                  placeholder="Paste a Drive / web link"
                />
              </div>
              {n === 1 && <div style={{ height: 1, background: "#F3F4F6", margin: "20px 0" }} />}
            </div>
          ))}
        </Section>

        {/* ── Past Renewals (read-only history) ── */}
        {renewal.pastRenewals?.length > 0 && (
          <Section title="Past Renewals History" emoji="📜">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  {["#", "Renewal Date", "Amount Paid", "Notes"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#6B7280", textAlign: "left", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #F3F4F6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {renewal.pastRenewals.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F9FAFB" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF" }}>{i + 1}</td>
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#374151" }}>
                      {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#111" }}>
                      {p.currency} {Number(p.cost).toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#6B7280" }}>{p.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* ── Bottom submit ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 40 }}>
          <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleSave} style={saveBtnStyle}>💾 Save Changes</button>
        </div>

      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Local sub-components
// ────────────────────────────────────────────────────────
function Section({ title, emoji, children }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
      <div style={{ margin: "-24px -24px 22px", background: LIME, padding: "13px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <span>{emoji}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, name, error, required, children }) {
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

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 };

const cancelBtnStyle = {
  padding: "12px 28px", borderRadius: 10,
  border: "1.5px solid #E5E7EB", background: "#fff",
  color: "#374151", fontSize: 15, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
};

const saveBtnStyle = {
  padding: "12px 32px", borderRadius: 10,
  border: "none", background: LIME, color: "#000",
  fontSize: 15, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
  display: "flex", alignItems: "center", gap: 8,
};