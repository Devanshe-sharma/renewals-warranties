import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";


const LIME = "#1976d2";

const FREQ_MONTHS = { Monthly: 1, Quarterly: 3, "Half Yearly": 6, Annually: 12 };

// ── Date helpers ──────────────────────────────────────────
const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const fmtISO    = (d)    => d ? new Date(d).toISOString().split("T")[0] : "";
const fmtDate   = (d)    => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const BLANK = {
  // item selection
  item_id: "", item_name: "", category: "", subcategory: "",
  prev_start_date: "", prev_expiry_date: "",
  // decision
  renewal_required: "",
  // new renewal
  new_renewal_date: "", frequency: "", new_expiry_date: "",
  // payment
  renewal_amount: "", payment_mode: "", card_holder: "",
  invoice_ref: "", proof_link: "",
  // additional
  user_person: "", user_department: "", remarks: "", email_sent: "No",
  // renewer details
  renewerName: "", renewerDepartment: "", renewerEmail: "",
  // user details
  selectedEmployeeId: "",
  empName: "", empId: "", department: "", designation: "",
  email: "", reportingManager: "",
  close_reason: "",
};

// ────────────────────────────────────────────────────────
// UPDATE FORM  (Record Renewal Event)
// ────────────────────────────────────────────────────────
export default function UpdateForm({ onSave, onCancel }) {
  const [form,      setForm]      = useState(BLANK);
  const [errors,    setErrors]    = useState({});
  const [items,     setItems]     = useState([]);   // dropdown: all active renewals
  const [nextId,    setNextId]    = useState("");   // preview event_id
  const [loading,   setLoading]   = useState(false);
  const [employees, setEmployees] = useState([]);   // for user details section
  const [search, setSearch] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Filter items ─────────────────────────────
  const visibleItems = items.filter((item) => {
    const q = search.toLowerCase();
    return !q ||
      (item.item_name || "").toLowerCase().includes(q) ||
      (item.item_id || "").toLowerCase().includes(q)||
      (item.category || "").toLowerCase().includes(q);
  });

  // ── Fetch items for dropdown ──────────────────────────
  const fetchItems = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/renewal-events/items`);
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (err) {
      console.error("Items fetch error:", err);
    }
  };

  // ── Fetch item list for dropdown ──────────────────────
 



useEffect(() => {
  fetchItems();

  fetch(`${process.env.REACT_APP_API_URL}/api/renewal-events/next-id`)
    .then((r) => r.json())
    .then((res) => {
      if (res.success) setNextId(res.event_id);
    })
    .catch((err) => console.error("Next ID fetch error:", err));

  fetch(`${process.env.REACT_APP_API_URL}/api/employee`)
    .then(r => r.json())
    .then(result => {
      console.log("EMPLOYEE API:", result);

      const employeeList = result.data || result || [];

      console.log("Employees loaded:", employeeList.length);

      setEmployees(employeeList);

      const admin = employeeList.find((emp) =>
        (emp.Department || "").trim().toLowerCase().includes("admin") &&
        (
          (emp["Department Head"] || "").trim() ||
          (emp["Dept Head Email"] || "").trim()
        )
      );

      if (admin) {
        setForm(f => ({
          ...f,
          renewerName:
            f.renewerName ||
            admin["Department Head"] ||
            admin.Emp_name ||
            "",

          renewerDepartment:
            f.renewerDepartment || "Admin",

          renewerEmail:
            f.renewerEmail ||
            admin["Dept Head Email"] ||
            admin["desig Email Id"] ||
            "",
        }));
      }
    })
    .catch(err => console.error("Employee fetch error:", err));

}, []);

  // ── Item selection → autofill from linked renewal ────
  // ── 1. handleItemSelect ───────────────────────────────────
const handleItemSelect = (item_id) => {
  const item = items.find((i) => i.item_id === item_id);

  if (!item) {
    const admin = employees.find((emp) =>
      (emp.Department || "").trim().toLowerCase().includes("admin") &&
      ((emp["Department Head"] || "").trim() || (emp["Dept Head Email"] || "").trim())
    );
    setForm({
      ...BLANK,
      renewerName:       admin?.["Department Head"] || admin?.Emp_name || "",
      renewerDepartment: "Admin",
      renewerEmail:      admin?.["Dept Head Email"] || admin?.["desig Email Id"] || "",
    });
    return;
  }

  // ✅ Use actual end_date from renewal instead of calculating
  const prevStart  = item.start_date ? new Date(item.start_date) : null;
  const prevExpiry = item.end_date   ? new Date(item.end_date)   : null;

  setForm((f) => ({
    ...f,
    item_id:            item.item_id,
    item_name:          item.item_name,
    category:           item.category           || "",
    subcategory:        item.subcategory        || "",
    prev_start_date:    prevStart  ? fmtISO(prevStart)  : "",
    prev_expiry_date:   prevExpiry ? fmtISO(prevExpiry) : "", // ✅ actual end_date
    frequency:          item.frequency          || "",
    renewerName:        item.renewer_name       || f.renewerName       || "",
    renewerDepartment:  item.renewer_department || f.renewerDepartment || "Admin",
    renewerEmail:       item.renewer_email      || f.renewerEmail      || "",
    selectedEmployeeId: item.selected_employee_id || "",
    empName:            item.emp_name           || "",
    empId:              item.emp_id             || "",
    department:         item.department         || "",
    designation:        item.designation        || "",
    email:              item.email              || "",
    reportingManager:   item.reporting_manager  || "",
    user_person:        item.user_person        || "",
    user_department:    item.user_department    || "",
    renewal_required:   "", new_renewal_date: "", new_expiry_date: "",
    renewal_amount:     "", payment_mode: "",   card_holder: "",
    invoice_ref:        "", proof_link: "",     remarks: "", email_sent: "No",
  }));
  setErrors({});
};

// ── 2. handleEmployeeSelect ───────────────────────────────
const handleEmployeeSelect = (id) => {
  const emp = employees.find((e) => e._id === id);

  if (!emp) {
    setForm(f => ({
      ...f,
      selectedEmployeeId: "",
      empName: "", empId: "", department: "",
      designation: "", email: "", reportingManager: "",
      user_person: "", user_department: "",
    }));
    return;
  }

  setForm(f => ({
    ...f,
    selectedEmployeeId: emp._id,
    empName:          emp.Emp_name              || "",
    empId:            String(emp.Emp_id)         || "",
    department:       emp.Department             || "",
    designation:      emp.Designation            || "",
    email:            emp["desig Email Id"]      || "",
    reportingManager: emp["Reporting Manager"]   || "",
    user_person:      emp.Emp_name               || "",
    user_department:  emp.Department             || "",
  }));
};

  // ── Employee select → autofill ────────────────────────
  // ── Auto-calculate new expiry ─────────────────────────
  useEffect(() => {
    if (form.new_renewal_date && form.frequency) {
      const expiry = addMonths(new Date(form.new_renewal_date), FREQ_MONTHS[form.frequency] || 12);
      set("new_expiry_date", fmtISO(expiry));
    } else {
      set("new_expiry_date", "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.new_renewal_date, form.frequency]);

  // ── Clear conditional fields when renewal_required = No ──
  useEffect(() => {
    if (form.renewal_required === "No") {
      setForm((f) => ({
        ...f,
        new_renewal_date: "", frequency: "", new_expiry_date: "",
        renewal_amount: "", payment_mode: "", card_holder: "",
        invoice_ref: "", renewed_by: "", next_due_date: "", proof_link: "",
        remarks: "", email_sent: "No",
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.renewal_required]);

  // ── Validation ────────────────────────────────────────
  const validate = () => {
  const e = {};
  if (!form.item_id)          e.item_id          = "Required";
  if (!form.renewal_required) e.renewal_required = "Required";
  if (form.renewal_required === "Yes") {
    if (!form.new_renewal_date) e.new_renewal_date = "Required";
    if (!form.frequency)        e.frequency        = "Required";
    if (!form.new_expiry_date)  e.new_expiry_date  = "Required";
  }
  if (form.renewal_required === "No" && !form.close_reason?.trim()) {
    e.close_reason = "Please provide a reason for closing";
  }
  setErrors(e);
  return Object.keys(e).length === 0;
};

  // ── Submit ────────────────────────────────────────────
  const handleSave = async () => {
  if (!validate()) return;
  setLoading(true);
  try {
    const res  = await fetch(`${process.env.REACT_APP_API_URL}/api/renewal-events`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(form),
    });
    const data = await res.json();

    if (!data.success) {
      alert(`❌ Error: ${data.message}`);
      return;
    }

    const msg = form.renewal_required === "No"
      ? `✅ Event recorded — ID: ${data.data.event_id}\n📦 Item moved to archive.`
      : `✅ Event recorded — ID: ${data.data.event_id}`;

    alert(msg);
    onSave(data.data);

  } catch (err) {
    alert("❌ Failed to save. Check your connection.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  // ── Style helpers ─────────────────────────────────────
  const inp = (name, extra = {}) => ({
    border: `1.5px solid ${errors[name] ? "#EF4444" : "#E5E7EB"}`,
    borderRadius: 8, padding: "9px 13px", fontSize: 14,
    color: "#111", outline: "none", width: "100%",
    boxSizing: "border-box", fontFamily: "inherit", ...extra,
  });

  const sel = (name) => ({
    ...inp(name), cursor: "pointer", background: "#fff", appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", paddingRight: 36,
  });

  const readOnly = (extra = {}) => inp("", { background: "#F9FAFB", color: "#6B7280", ...extra });

  const showRenewalFields = form.renewal_required === "Yes";
  const isWarranty        = form.category === "Warranty";

return (
  <div
    style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      zIndex: 2147483647,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      overflowY: "auto",
      padding: "24px 16px",
    }}
  >
  <div
    style={{
      background: "#F3F4F6",
      borderRadius: 16,
      width: "100%",
      maxWidth: 900,
      boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
      marginBottom: 24,
    }}
  >
      {/* <Navbar
        title="Record Renewal Event"
        // subtitle="Log a renewal event against an existing renewal item"
        breadcrumb={[{ label: "Renewal Events", onClick: onCancel }, { label: "Record Event" }]}
        actions={
          <>
            <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleSave} disabled={loading} style={{ ...saveBtnStyle, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving…" : "✅ Record Event"}
            </button>
          </>
        }
      /> */}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Section 1: Item Information ── */}
        <Section title="Item Information" emoji="📋">
          <div style={grid2}>
            {/* Event ID preview */}
            <Field label="Renewal Event ID (auto-generated)">
              <input value={nextId || "Auto-generated"} readOnly style={readOnly()} />
            </Field>

            {/* Item Name dropdown */}
            <Field label="Item Name" error={errors.item_id} required>
              <select value={form.item_id} onChange={(e) => handleItemSelect(e.target.value)} style={sel("item_id")}>
                <option value="">Choose item name</option>
                {items.map((i) => (
                  <option key={i.item_id} value={i.item_id}>{i.item_name}</option>
                ))}
              </select>
            </Field>

            {/* Auto-filled from selected item */}
            <Field label="Item ID">
              <input value={form.item_id} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
            <Field label="Category / Renewal Type">
              <input value={form.category} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
            <Field label="Sub-Category">
              <input value={form.subcategory} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
            <Field label="Previous Renewal Start Date">
              <input value={form.prev_start_date ? fmtDate(form.prev_start_date) : ""} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
            <Field label="Previous Expiry Date (calculated)">
              <input value={form.prev_expiry_date ? fmtDate(form.prev_expiry_date) : ""} readOnly style={readOnly({ color: "#B45309" })} placeholder="Auto-calculated" />
            </Field>

            {/* Renewal Required */}
            <Field label="Renewal Required?" error={errors.renewal_required} required>
              <select value={form.renewal_required} onChange={(e) => set("renewal_required", e.target.value)} style={sel("renewal_required")}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ── Section 2: Renewer Details ── */}
        {showRenewalFields && (
          <>
        <Section title="Renewer Details" emoji="👤">
          <div style={grid2}>
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

        {/* ── Section 3: User Details ── */}
        <Section title="User Details" emoji="👤">
          <div style={{ marginBottom: 20 }}>
            <Field label="Employee Name">
              <select
                  value={form.selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  style={sel("")}
                >
                  <option value="">Select employee</option>

                  {employees
                    .sort((a, b) =>
                      (a.Emp_name || "").localeCompare(b.Emp_name || "")
                    )
                    .map((em) => (
                      <option
                        key={em._id || em.id || em.Emp_id}
                        value={String(em._id || em.id || em.Emp_id)}
                      >
                        {em.Emp_name}
                      </option>
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
            <Field label="CC – Reporting Manager">
              <input value={form.reportingManager} readOnly style={readOnly()} placeholder="Auto-filled" />
            </Field>
          </div>
        </Section>

          </>
        )}

        {/* ── Section 4: New Renewal Details (only if renewal_required = Yes) ── */}
        {showRenewalFields && (
          <Section title="New Renewal Details" emoji="🔄">
            <div style={grid3}>
              <Field label="New Renewal Date" error={errors.new_renewal_date} required>
                <input type="date" value={form.new_renewal_date} onChange={(e) => set("new_renewal_date", e.target.value)} style={inp("new_renewal_date")} />
              </Field>
              <Field label="Renewal Frequency" error={errors.frequency} required>
                <select value={form.frequency} onChange={(e) => set("frequency", e.target.value)} style={sel("frequency")}>
                  <option value="">Select frequency</option>
                  {Object.keys(FREQ_MONTHS).map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Expiry Date (calculated)" error={errors.new_expiry_date}>
                <input value={form.new_expiry_date ? fmtDate(form.new_expiry_date) : ""} readOnly style={readOnly({ color: "#059669" })} placeholder="Auto-calculated" />
              </Field>
            </div>
          </Section>
        )}

        {/* ── Section 5: Payment & Other Details (only if renewal_required = Yes) ── */}
        {showRenewalFields && (
          <Section title="Payment & Other Details" emoji="💳">
            <div style={grid2}>
              <Field label="Vendor">
                <input value={form.vendor} onChange={e => set("vendor", e.target.value)} style={inp("")} placeholder="" />
              </Field>
              <Field label="Authority (if applicable)">
                <input value={form.authority} onChange={e => set("authority", e.target.value)} style={inp("")} placeholder="" />
              </Field>
              <Field label="Renewal Amount">
                <input type="number" min="0" step="0.01" value={form.renewal_amount} onChange={(e) => set("renewal_amount", e.target.value)} style={inp("")} placeholder="0.00" />
              </Field>
              <Field label="Payment Transfer Mode">
                <select value={form.payment_mode} onChange={(e) => set("payment_mode", e.target.value)} style={sel("")}>
                  <option value="">Select mode</option>
                  {["Bank Transfer", "Credit Card", "Debit Card", "UPI", "Cheque", "Cash", "Other"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Bank / Card Holder">
                <select value={form.card_holder} onChange={(e) => set("card_holder", e.target.value)} style={sel("")}>
                  <option value="">Select holder</option>
                  <option value="admin">Admin</option>
                  <option value="accounts">Accounts</option>
                </select>
              </Field>
              <Field label="Invoice / Ref No">
                <input value={form.invoice_ref} onChange={(e) => set("invoice_ref", e.target.value)} style={inp("")} placeholder="INV-XXXX" />
              </Field>
              <Field label="Proof Link">
                <input type="url" value={form.proof_link} onChange={(e) => set("proof_link", e.target.value)} style={inp("")} placeholder="https://drive.google.com/..." />
              </Field>
            </div>
          </Section>
        )}

        {/* ── Section 6: Additional Information (only if renewal_required = Yes) ── */}
        {showRenewalFields && (
          <Section title="Additional Information" emoji="ℹ️">
            {/* Warranty-only fields */}
            {isWarranty && (
              <div style={{ ...grid2, marginBottom: 20 }}>
                <Field label="User">
                  <input value={form.user_person} onChange={(e) => set("user_person", e.target.value)} style={inp("")} placeholder="Auto-filled" />
                </Field>
                <Field label="User Department">
                  <input value={form.user_department} readOnly style={readOnly()} placeholder="Auto-filled" />
                </Field>
              </div>
            )}

            <div style={grid2}>
              <Field label="Remarks">
                <textarea value={form.remarks} onChange={(e) => set("remarks", e.target.value)}
                  style={{ ...inp(""), resize: "vertical", minHeight: 80 }}
                  placeholder="Any notes about this renewal event" />
              </Field>
              <Field label="Email Sent?">
                <select value={form.email_sent} onChange={(e) => set("email_sent", e.target.value)} style={sel("")}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
            </div>
          </Section>
        )}

        
        {/* ── If Renewal Required = No, ask for reason ── */}
        {form.renewal_required === "No" && (
          <Section title="Closure Details" emoji="⚠️">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#991B1B", fontSize: 14 }}>Marked as Closed</div>
                  <div style={{ color: "#B91C1C", fontSize: 13, marginTop: 3 }}>
                    This item will be recorded as <strong>Closed</strong> and moved to Archive.
                  </div>
                </div>
              </div>

              <Field label="Reason for closing" error={errors.close_reason} required>
                <textarea
                  value={form.close_reason || ""}
                  onChange={e => set("close_reason", e.target.value)}
                  placeholder="e.g. Service discontinued, replaced by another tool, contract ended…"
                  rows={3}
                  style={{
                    border: `1.5px solid ${errors.close_reason ? "#EF4444" : "#E5E7EB"}`,
                    borderRadius: 8, padding: "9px 13px", fontSize: 14,
                    color: "#111", outline: "none", width: "100%",
                    boxSizing: "border-box", fontFamily: "inherit", resize: "vertical",
                  }}
                />
              </Field>
            </div>
          </Section>
        )}

        {/* ── Submit ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 40 }}>
          <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ ...saveBtnStyle, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving…" : "✅ Record Event"}
          </button>
        </div>
      </div>
      </div>
    </div> 

  );
}

// ────────────────────────────────────────────────────────
// Sub-components
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

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 };

const cancelBtnStyle = {
  padding: "11px 24px", borderRadius: 10,
  border: "1.5px solid #E5E7EB", background: "#fff",
  color: "#374151", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit",
};

const saveBtnStyle = {
  padding: "11px 28px", borderRadius: 10,
  border: "none", background: "#1976d2", color: "#000",
  fontSize: 14, fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
};
