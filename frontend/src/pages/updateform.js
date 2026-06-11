import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";

const LIME = "#1976d2";

const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

const FREQ_COUNT_OPTIONS = {
  Monthly:       Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1} Month${i > 0 ? "s" : ""}`,       value: i + 1 })),
  Quarterly:     Array.from({ length: 4  }, (_, i) => ({ label: `${i + 1} Quarter${i > 0 ? "s" : ""}`,     value: (i + 1) * 3 })),
  "Half Yearly": Array.from({ length: 4  }, (_, i) => ({ label: `${i + 1} Half Year${i > 0 ? "s" : ""}`,   value: (i + 1) * 6 })),
  Annually:      Array.from({ length: 5  }, (_, i) => ({ label: `${i + 1} Year${i > 0 ? "s" : ""}`,        value: (i + 1) * 12 })),
};

// ── Date helpers ──────────────────────────────────────────
const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const fmtISO    = (d)    => d ? new Date(d).toISOString().split("T")[0] : "";
const fmtDate   = (d)    => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const BLANK = {
  // item info
  item_id: "", item_name: "", category: "", subcategory: "",
  description: "",
  // service & credentials (mirrors NewForm)
  vendor: "", serviceLink: "",
  credentialUsername: "", credentialPassword: "",
  attachment1Link: "", attachment2Link: "",
  // previous dates
  prev_start_date: "", prev_expiry_date: "",
  // renewal decision
  renewal_required: "",
  // new renewal details
  new_renewal_date: "", frequency: "", frequencyCount: 1,
  customEndDate: "", new_expiry_date: "",
  reminder1Days: 30, reminder2Days: 10, reminderFinalDays: 1,
  // renewer
  renewerName: "", renewerDepartment: "", renewerEmail: "",
  selectedRenewerId: "",
  // user/employee
  selectedEmployeeId: "",
  empName: "", empId: "", department: "", designation: "",
  email: "", reportingManager: "",
  ccRecipients: [],
  userPerson: "", userDepartment: "",
  // payment
  authority: "", renewal_amount: "", payment_mode: "",
  card_holder: "", invoice_ref: "", proof_link: "",
  // closure
  close_reason: "",
};

// ────────────────────────────────────────────────────────
// UPDATE FORM  (Record Renewal Event)
// ────────────────────────────────────────────────────────
export default function UpdateForm({ onSave, onCancel, preSelectedItem = null }) {
  const [form,         setForm]         = useState(BLANK);
  const [errors,       setErrors]       = useState({});
  const [items,        setItems]        = useState([]);
  const [nextId,       setNextId]       = useState("");
  const [loading,      setLoading]      = useState(false);
  const [employees,    setEmployees]    = useState([]);
  const [search,       setSearch]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ccSearch,     setCcSearch]     = useState("");
  const [ccOpen,       setCcOpen]       = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Filtered item search ──────────────────────────────
  const visibleItems = items.filter((item) => {
    const q = search.toLowerCase();
    return !q ||
      (item.item_name || "").toLowerCase().includes(q) ||
      (item.item_id   || "").toLowerCase().includes(q) ||
      (item.category  || "").toLowerCase().includes(q);
  });

  // ── Fetch items & next ID & employees ────────────────
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/renewal-events/items`)
      .then(r => r.json())
      .then(data => { if (data.success) setItems(data.data); })
      .catch(err => console.error("Items fetch error:", err));

    fetch(`${process.env.REACT_APP_API_URL}/api/renewal-events/next-id`)
      .then(r => r.json())
      .then(res => { if (res.success) setNextId(res.event_id); })
      .catch(err => console.error("Next ID fetch error:", err));

    fetch(`${process.env.REACT_APP_API_URL}/api/employee`)
      .then(r => r.json())
      .then(result => {
        const list = result.data || result || [];
        setEmployees(list);

        // Auto-fill admin as default renewer
        const admin = list.find(emp =>
          (emp.Department || "").trim().toLowerCase().includes("admin") &&
          ((emp["Department Head"] || "").trim() || (emp["Dept Head Email"] || "").trim())
        );
        if (admin) {
          setForm(f => ({
            ...f,
            renewerName:       f.renewerName       || admin["Department Head"] || admin.Emp_name || "",
            renewerDepartment: f.renewerDepartment || "Admin",
            renewerEmail:      f.renewerEmail      || admin["Dept Head Email"] || admin["desig Email Id"] || "",
          }));
        }
      })
      .catch(err => console.error("Employee fetch error:", err));
  }, []);

  // ── CC dropdown outside-click close ──────────────────
  useEffect(() => {
    if (!ccOpen) return;
    const handler = (e) => {
      if (!e.target.closest("[data-cc-dropdown]")) setCcOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ccOpen]);

  // ── Renewer select ────────────────────────────────────
  const handleRenewerSelect = (id) => {
    const emp = employees.find(e => e._id === id);
    if (!emp) {
      setForm(f => ({ ...f, selectedRenewerId: "", renewerName: "", renewerDepartment: "", renewerEmail: "" }));
      return;
    }
    setForm(f => ({
      ...f,
      selectedRenewerId:  id,
      renewerName:        emp.Emp_name                                      || "",
      renewerDepartment:  emp.Department                                     || "",
      renewerEmail:       emp["desig Email Id"] || emp["Dept Group Email"]   || "",
    }));
  };

  // ── CC helpers ────────────────────────────────────────
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
  const ccFiltered = employees.filter(em =>
    (em.Emp_name    || "").toLowerCase().includes(ccSearch.toLowerCase()) ||
    (em.Designation || "").toLowerCase().includes(ccSearch.toLowerCase())
  );

  // ── New expiry from new_renewal_date + frequency ──────
  const newExpiry = (() => {
    if (form.frequency === "Other") return form.customEndDate || "";
    if (!form.new_renewal_date || !form.frequency) return "";
    const defaultCount = FREQ_COUNT_OPTIONS[form.frequency]?.[0]?.value ?? 12;
    const months = form.frequencyCount || defaultCount;
    return fmtISO(addMonths(new Date(form.new_renewal_date), months));
  })();

  const rDate = (days) => newExpiry ? fmtISO(addDays(new Date(newExpiry), -days)) : "";

  // ── Item selection → autofill ─────────────────────────
  const handleItemSelect = (item_id) => {
    const item = items.find(i => i.item_id === item_id);
    if (!item) {
      const admin = employees.find(emp =>
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

    const prevStart  = item.start_date ? new Date(item.start_date) : null;
    const prevExpiry = item.end_date   ? new Date(item.end_date)   : null;

    setForm(f => ({
      ...f,
      item_id:            item.item_id,
      item_name:          item.item_name,
      category:           item.category           || "",
      subcategory:        item.subcategory         || "",
      description:        item.description         || "",

      // ── service & credentials (same field names as NewForm) ──
      vendor:             item.vendor              || "",
      serviceLink:        item.service_link        || "",
      credentialUsername: item.username            || "",
      credentialPassword: item.password            || "",
      attachment1Link:    item.attachment1_link    || "",
      attachment2Link:    item.attachment2_link    || "",

      prev_start_date:    prevStart  ? fmtISO(prevStart)  : "",
      prev_expiry_date:   prevExpiry ? fmtISO(prevExpiry) : "",
      frequency:          item.frequency           || "",

      renewerName:        item.renewer_name        || f.renewerName        || "",
      renewerDepartment:  item.renewer_department  || f.renewerDepartment  || "Admin",
      renewerEmail:       item.renewer_email       || f.renewerEmail       || "",

      selectedEmployeeId: item.selected_employee_id || "",
      empName:            item.emp_name            || "",
      empId:              item.emp_id              || "",
      department:         item.department          || "",
      designation:        item.designation         || "",
      email:              item.email               || "",
      reportingManager:   item.reporting_manager   || "",

      // clear renewal-event-specific fields on new selection
      renewal_required:   "", new_renewal_date: "", new_expiry_date: "",
      renewal_amount:     "", payment_mode:     "", card_holder:     "",
      invoice_ref:        "", proof_link:        "", remarks: "",   email_sent: "No",
    }));
    setErrors({});
  };

  // ── Employee select ───────────────────────────────────
  const handleEmployeeSelect = (id) => {
    const emp = employees.find(e => e._id === id);
    if (!emp) {
      setForm(f => ({ ...f, selectedEmployeeId: "", empName: "", empId: "", department: "", designation: "", email: "", reportingManager: "" }));
      return;
    }
    setForm(f => ({
      ...f,
      selectedEmployeeId: emp._id,
      empName:            emp.Emp_name            || "",
      empId:              String(emp.Emp_id)       || "",
      department:         emp.Department           || "",
      designation:        emp.Designation          || "",
      email:              emp["desig Email Id"]    || "",
      reportingManager:   emp["Reporting Manager"] || "",
    }));
  };

  // ── Sync new_expiry_date to form state ────────────────
  useEffect(() => { set("new_expiry_date", newExpiry || ""); }, [newExpiry]); // eslint-disable-line

  // ── Reset renewal fields when "Discontinue" selected ─
  useEffect(() => {
    if (form.renewal_required === "Discontinue") {
      setForm(f => ({
        ...f,
        new_renewal_date: "", frequency: "", new_expiry_date: "",
        renewal_amount: "", payment_mode: "", card_holder: "",
        invoice_ref: "", renewed_by: "", next_due_date: "", proof_link: "",
        remarks: "", email_sent: "No",
      }));
    }
  }, [form.renewal_required]); // eslint-disable-line

  // ── Pre-selected item (when opened from dashboard) ───
  useEffect(() => {
    if (preSelectedItem && items.length > 0) {
      handleItemSelect(preSelectedItem.id);
    }
  }, [preSelectedItem, items]); // eslint-disable-line

  // ── Validation ────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.item_id)          e.item_id          = "Required";
    if (!form.renewal_required) e.renewal_required = "Required";
    if (form.renewal_required === "Renew") {
      if (!form.new_renewal_date) e.new_renewal_date = "Required";
      if (!form.frequency)        e.frequency        = "Required";
      if (!form.new_expiry_date)  e.new_expiry_date  = "Required";
      if (form.frequency === "Other" && !form.customEndDate) e.customEndDate = "Required";
    }
    if (form.renewal_required === "Discontinue" && !form.close_reason?.trim()) {
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
      if (!data.success) { alert(`❌ Error: ${data.message}`); return; }

      const msg = form.renewal_required === "Discontinue"
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

  const showRenewalFields = form.renewal_required === "Renew";

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
        {/* ── Modal header ── */}
        <div style={{ background: LIME, borderRadius: "16px 16px 0 0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {preSelectedItem ? `Update — ${preSelectedItem.itemName}` : "Record Renewal Event"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              {preSelectedItem ? `${preSelectedItem.id} · ${preSelectedItem.category}` : "Log a renewal event against an existing item"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={handleSave} disabled={loading} style={{ background: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, color: LIME, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Saving…" : "✅ Record Event"}
            </button>
            <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>✕</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ══════════════════════════════════════════════
              SECTION 1 — Item Information
          ══════════════════════════════════════════════ */}
          <Section title="Item Information" emoji="📋">
                <div style={grid2}>
                  <Field label="Renewal Event ID (auto-generated)">
                    <input value={nextId || "Auto-generated"} readOnly style={readOnly()} />
                  </Field>

                  <Field label="Item Name" error={errors.item_id} required>
                    <select value={form.item_id} onChange={e => handleItemSelect(e.target.value)} style={sel("item_id")}>
                      <option value="">Choose item name</option>
                      {items.map(i => (
                        <option key={i.item_id} value={i.item_id}>{i.item_name}</option>
                      ))}
                    </select>
                  </Field>

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
                  <Field label="Previous Expiry Date">
                    <input value={form.prev_expiry_date ? fmtDate(form.prev_expiry_date) : ""} readOnly style={readOnly({ color: "#B45309" })} placeholder="Auto-filled" />
                  </Field>


                  {/* Vendor & Service Link */}
                  <Field label="Vendor">
                    <input value={form.vendor} onChange={e => set("vendor", e.target.value)} style={inp("")} placeholder="e.g. Google LLC" />
                  </Field>
                  <Field label="Service Link">
                    <input type="url" value={form.serviceLink} onChange={e => set("serviceLink", e.target.value)} style={inp("")} placeholder="https://..." />
                  </Field>
                </div>

                {/* Description */}
                <div style={{ marginTop: 16 }}>
                  <Field label="Description & Remarks">
                    <textarea
                      value={form.description || ""}
                      onChange={e => set("description", e.target.value)}
                      rows={2}
                      style={{ ...inp(""), resize: "vertical", minHeight: 60 }}
                      placeholder="Description, remarks, or any notes…"
                    />
                  </Field>
                </div>

                {/* Credentials */}
                  {showRenewalFields && (
                    <div style={{ marginTop: 16, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 12 }}>
                        🔑 Credentials <span style={{ fontSize: 11, fontWeight: 400, color: "#B45309" }}>(visible to renewer only)</span>
                      </div>
                      <div style={grid2}>
                        <Field label="Username">
                          <input value={form.credentialUsername} onChange={e => set("credentialUsername", e.target.value)} style={inp("")} placeholder="admin@example.com" />
                        </Field>
                        <Field label="Password (confidential)">
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
                              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#6B7280" }}
                            >
                              {showPassword ? "🙈" : "👁️"}
                            </button>
                          </div>
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {showRenewalFields && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>📎 Attachments</div>
                      <div style={grid2}>
                        {[1, 2].map(n => (
                          <Field key={n} label={`Attachment ${n}`}>
                            <input
                              type="url"
                              value={form[`attachment${n}Link`] || ""}
                              onChange={e => set(`attachment${n}Link`, e.target.value)}
                              style={inp("")}
                              placeholder="Paste a Drive / web link"
                            />
                          </Field>
                        ))}
                      </div>
                    </div>
                  )}

                <Field label="Renewal Required?" error={errors.renewal_required} required>
                    <select value={form.renewal_required} onChange={e => set("renewal_required", e.target.value)} style={sel("renewal_required")}>
                      <option value="">Select</option>
                      <option value="Renew">Renew</option>
                      <option value="Discontinue">Discontinue</option>
                    </select>
                  </Field>
              </Section>

        

          {/* ══════════════════════════════════════════════
              SECTION 3 — Renewer Details
          ══════════════════════════════════════════════ */}
          {showRenewalFields && (
            <Section title="Renewer Details" emoji="👤">
              <div style={{ marginBottom: 16 }}>
                <Field label="Select Renewer">
                  <select
                    value={form.selectedRenewerId || ""}
                    onChange={e => handleRenewerSelect(e.target.value)}
                    style={sel("")}
                  >
                    <option value="">Select renewer</option>
                    {employees
                      .slice().sort((a, b) =>
                        (a.Designation || "").localeCompare(b.Designation || "") ||
                        (a.Emp_name    || "").localeCompare(b.Emp_name    || "")
                      )
                      .map(em => (
                        <option key={em._id} value={em._id}>
                          {em.Designation ? `${em.Designation} — ` : ""}{em.Emp_name}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
              <div style={grid3}>
                <Field label="Renewer Name">      <input value={form.renewerName}        readOnly style={readOnly()} /></Field>
                <Field label="Department">        <input value={form.renewerDepartment}  readOnly style={readOnly()} /></Field>
                <Field label="Renewer Email">     <input value={form.renewerEmail}        readOnly style={readOnly()} /></Field>
              </div>
            </Section>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 4 — User Details
          ══════════════════════════════════════════════ */}
          {showRenewalFields && (
            <Section title="User Details" emoji="👤">
              <div style={{ marginBottom: 16 }}>
                <Field label="Employee Name">
                  <select
                    value={form.selectedEmployeeId}
                    onChange={e => handleEmployeeSelect(e.target.value)}
                    style={sel("")}
                  >
                    <option value="">Select employee</option>
                    {employees
                      .slice().sort((a, b) =>
                        (a.Designation || "").localeCompare(b.Designation || "") ||
                        (a.Emp_name    || "").localeCompare(b.Emp_name    || "")
                      )
                      .map(em => (
                        <option key={em._id} value={em._id}>
                          {em.Designation ? `${em.Designation} — ` : ""}{em.Emp_name}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>

              <div style={grid2}>
                <Field label="Employee ID">         <input value={form.empId}            readOnly style={readOnly()} /></Field>
                <Field label="Department">          <input value={form.department}        readOnly style={readOnly()} /></Field>
                <Field label="Designation">         <input value={form.designation}       readOnly style={readOnly()} /></Field>
                <Field label="Email">               <input value={form.email}             readOnly style={readOnly()} /></Field>
                <Field label="Reporting Manager">   <input value={form.reportingManager}  readOnly style={readOnly()} /></Field>
              </div>

              {/* CC multi-select */}
              <div style={{ marginTop: 16 }}>
                <Field label="CC To (send mail)">
                  <div style={{ position: "relative" }} data-cc-dropdown>
                    <div
                      onClick={() => setCcOpen(o => !o)}
                      style={{
                        ...inp(""),
                        cursor: "pointer",
                        minHeight: 42,
                        maxHeight: 120,
                        overflowY: "auto",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        alignItems: "flex-start",
                        padding: "8px 12px",
                        boxSizing: "border-box",
                      }}
                    >
                      {form.ccRecipients.length === 0 && <span style={{ color: "#9CA3AF" }}>Select people to CC…</span>}
                      {form.ccRecipients.map(c => (
                        <span key={c.id} style={{ background: "#DBEAFE", color: "#1e40af", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, maxWidth: "100%", minWidth: 0, overflow: "hidden", flexShrink: 1 }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                          <span onClick={e => { e.stopPropagation(); toggleCC({ _id: c.id, Emp_name: c.name, "desig Email Id": c.email }); }} style={{ cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>×</span>
                        </span>
                      ))}
                    </div>

                    {ccOpen && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", boxSizing: "border-box", background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 8, zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto" }}>
                        <div style={{ padding: "8px 10px", borderBottom: "1px solid #F3F4F6" }}>
                          <input autoFocus value={ccSearch} onChange={e => setCcSearch(e.target.value)}
                            placeholder="Search by name or designation…"
                            style={{ ...inp(""), fontSize: 13 }}
                            onClick={e => e.stopPropagation()} />
                        </div>
                        {ccFiltered.length === 0 && <div style={{ padding: "12px 14px", color: "#9CA3AF", fontSize: 13 }}>No results</div>}
                        {ccFiltered.slice().sort((a, b) => (a.Emp_name || "").localeCompare(b.Emp_name || "")).map(em => {
                          const selected = form.ccRecipients.find(c => c.id === em._id);
                          return (
                            <div key={em._id} onClick={() => toggleCC(em)}
                              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: selected ? "#EFF6FF" : "transparent" }}
                              onMouseEnter={e => e.currentTarget.style.background = selected ? "#DBEAFE" : "#F9FAFB"}
                              onMouseLeave={e => e.currentTarget.style.background = selected ? "#EFF6FF" : "transparent"}
                            >
                              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? LIME : "#D1D5DB"}`, background: selected ? LIME : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {selected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{em.Emp_name}</div>
                                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{em.Designation || ""} {em["desig Email Id"] ? `· ${em["desig Email Id"]}` : ""}</div>
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ padding: "8px 14px", borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "flex-end" }}>
                          <button onClick={() => setCcOpen(false)} style={{ fontSize: 12, color: LIME, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Done</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {form.ccRecipients.length > 0 && (
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>{form.ccRecipients.length} person{form.ccRecipients.length > 1 ? "s" : ""} selected</div>
                  )}
                </Field>
              </div>
            </Section>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 5 — New Renewal Details
          ══════════════════════════════════════════════ */}
          {showRenewalFields && (
            <Section title="New Renewal Details" emoji="🔄">
              <div style={grid3}>
                <Field label="New Renewal Date" error={errors.new_renewal_date} required>
                  <input type="date" value={form.new_renewal_date} onChange={e => set("new_renewal_date", e.target.value)} style={inp("new_renewal_date")} />
                </Field>

                <Field label="Renewal Frequency" error={errors.frequency} required>
                  <select value={form.frequency} onChange={e => {
                    const freq = e.target.value;
                    const defaultCount = FREQ_COUNT_OPTIONS[freq]?.[0]?.value ?? 1;
                    setForm(f => ({ ...f, frequency: freq, frequencyCount: defaultCount }));
                  }} style={sel("frequency")}>
                    <option value="">Select frequency</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Annually">Annually</option>
                    <option value="Other">Other (Custom Date)</option>
                  </select>
                </Field>

                {/* Duration picker — all standard frequencies */}
                {["Monthly", "Quarterly", "Half Yearly", "Annually"].includes(form.frequency) && FREQ_COUNT_OPTIONS[form.frequency] && (
                  <Field label={`Duration (${form.frequency})`}>
                    <select value={form.frequencyCount} onChange={e => set("frequencyCount", +e.target.value)} style={sel("")}>
                      {FREQ_COUNT_OPTIONS[form.frequency].map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </Field>
                )}

                {/* Custom end date */}
                {form.frequency === "Other" && (
                  <Field label="Service End Date" error={errors.customEndDate} required>
                    <input type="date" value={form.customEndDate} onChange={e => set("customEndDate", e.target.value)} style={inp("customEndDate")} />
                  </Field>
                )}

                <Field label="Expiry Date (auto-calculated)" error={errors.new_expiry_date}>
                  <input value={newExpiry ? fmtDate(newExpiry) : ""} readOnly style={readOnly({ color: "#059669" })} placeholder="Auto-calculated" />
                </Field>

                <Field label="1st Reminder (days before)">
                  <input type="number" min="0" value={form.reminder1Days} onChange={e => set("reminder1Days", +e.target.value)} style={inp("")} />
                </Field>
                <Field label="2nd Reminder (days before)">
                  <input type="number" min="0" value={form.reminder2Days} onChange={e => set("reminder2Days", +e.target.value)} style={inp("")} />
                </Field>
                <Field label="Final Reminder (days before)">
                  <input type="number" min="0" value={form.reminderFinalDays} onChange={e => set("reminderFinalDays", +e.target.value)} style={inp("")} />
                </Field>
              </div>

              {/* Reminder preview */}
              {newExpiry && (
                <div style={{ marginTop: 20, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "16px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 12 }}>📅 Reminder Preview</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                    {[
                      { label: "New End Date",                                 date: newExpiry,                           color: "#059669" },
                      { label: `1st (${form.reminder1Days}d before)`,          date: rDate(form.reminder1Days),           color: "#374151" },
                      { label: `2nd (${form.reminder2Days}d before)`,          date: rDate(form.reminder2Days),           color: "#374151" },
                      { label: `Final (${form.reminderFinalDays}d before)`,    date: rDate(form.reminderFinalDays),       color: "#374151" },
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
          )}

          {/* ══════════════════════════════════════════════
              SECTION 6 — Payment & Other Details
          ══════════════════════════════════════════════ */}
          {showRenewalFields && (
            <Section title="Payment & Other Details" emoji="💳">
              <div style={grid2}>
                <Field label="Authority (if applicable)">
                  <input value={form.authority || ""} onChange={e => set("authority", e.target.value)} style={inp("")} placeholder="" />
                </Field>
                <Field label="Renewal Amount">
                  <input type="number" min="0" step="0.01" value={form.renewal_amount} onChange={e => set("renewal_amount", e.target.value)} style={inp("")} placeholder="0.00" />
                </Field>
                <Field label="Payment Transfer Mode">
                  <select value={form.payment_mode} onChange={e => set("payment_mode", e.target.value)} style={sel("")}>
                    <option value="">Select mode</option>
                    {["Bank Transfer", "Credit Card", "Debit Card", "UPI", "Cheque", "Cash", "Other"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Bank / Card Holder">
                  <select value={form.card_holder} onChange={e => set("card_holder", e.target.value)} style={sel("")}>
                    <option value="">Select holder</option>
                    <option value="admin">Admin</option>
                    <option value="accounts">Accounts</option>
                  </select>
                </Field>
                <Field label="Invoice / Ref No">
                  <input value={form.invoice_ref} onChange={e => set("invoice_ref", e.target.value)} style={inp("")} placeholder="INV-XXXX" />
                </Field>
                <Field label="Proof Link">
                  <input type="url" value={form.proof_link} onChange={e => set("proof_link", e.target.value)} style={inp("")} placeholder="https://drive.google.com/..." />
                </Field>
              </div>
            </Section>
          )}

          {/* ══════════════════════════════════════════════
              SECTION 7 — Closure Details
          ══════════════════════════════════════════════ */}
          {form.renewal_required === "Discontinue" && (
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

          {/* ── Footer action buttons ── */}
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
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "visible" }}>
      <div style={{ margin: "-24px -24px 22px", background: LIME, padding: "13px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <span>{emoji}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{title}</span>
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
  border: "none", background: "#1976d2", color: "#fff",
  fontSize: 14, fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
};