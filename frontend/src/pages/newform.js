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
  itemName: "", category: "", subcategory: "", description: "",
  vendor: "", 
  serviceLink: "",
  credentialUsername: "", credentialPassword: "",
  attachment1Link: "", attachment2Link: "",
  renewerName: "", renewerDepartment: "", renewerEmail: "",
  selectedRenewerId: "",
  selectedEmployeeId: "",
  empName: "", empId: "", department: "", designation: "",
  email: "", reportingManager: "",
  ccRecipients: [],
  startDate: "", frequency: "", frequencyCount: 1, customEndDate: "",
  reminder1Days: 30, reminder2Days: 10, reminderFinalDays: 1,
  userPerson: "", userDepartment: "",
};

const addDays   = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const fmtISO    = (d)    => d ? new Date(d).toISOString().split("T")[0] : "";
const fmtDate   = (d)    => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";


// frequency count options
const FREQ_COUNT_OPTIONS = {
  Monthly:      Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1} Month${i > 0 ? "s" : ""}`, value: i + 1 })),
  Quarterly:    Array.from({ length: 4  }, (_, i) => ({ label: `${i + 1} Quarter${i > 0 ? "s" : ""}`, value: (i + 1) * 3 })),
  "Half Yearly":Array.from({ length: 4  }, (_, i) => ({ label: `${i + 1} Half Year${i > 0 ? "s" : ""}`, value: (i + 1) * 6 })),
  Annually:     Array.from({ length: 5  }, (_, i) => ({ label: `${i + 1} Year${i > 0 ? "s" : ""}`, value: (i + 1) * 12 })),
};

export default function NewForm({ onSave, onCancel, embedded = false }) {
  const [form,         setForm]         = useState(BLANK);
  const [errors,       setErrors]       = useState({});
  const [words,        setWords]        = useState(0);
  const [categories,   setCategories]   = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [nextItemId,   setNextItemId]   = useState("RW-0001");
  const [showPassword, setShowPassword] = useState(false);
  const [ccSearch,     setCcSearch]     = useState("");
  const [ccOpen,       setCcOpen]       = useState(false);
  const [saving,       setSaving]       = useState(false); 

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // ── Fetch next item ID ────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/renewals`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          const existingIds = data.data
            .map(item => { const m = (item.item_id || "").match(/RW[-\s]*(\d+)/i); return m ? parseInt(m[1]) : 0; })
            .filter(id => id > 0);
          const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
          setNextItemId(`RW-${String(maxId + 1).padStart(4, "0")}`);
        }
      })
      .catch(() => setNextItemId("RW—"));
  }, []);

  // ── Fetch categories ──────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/categories`)
      .then(r => r.json())
      .then(res => {
        const d = res.data || res || [];
        setCategories(d.map(c => ({ id: c._id, name: c.name, subcategories: (c.subcategories || []).map(s => ({ id: s._id, name: s.name })) })));
      })
      .catch(err => console.error("Category fetch error:", err));
  }, []);

  // ── Fetch employees ───────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/employee`)
      .then(r => r.json())
      .then(data => {
        setEmployees(data);
      
      })
      .catch(err => console.error("Employee fetch error:", err));
  }, []);

  // ── Derived ───────────────────────────────────────────
  const selectedCategory = categories.find(c => c.name === form.category);
  const subcats = selectedCategory?.subcategories || [];

  // compute endDate based on frequency + count or custom
  const endDate = (() => {
    if (form.frequency === "Other") return form.customEndDate || "";
    if (!form.startDate || !form.frequency) return "";
    const months = form.frequencyCount || FREQ_MONTHS[form.frequency] || 12;
    return fmtISO(addMonths(new Date(form.startDate), months));
  })();

  const rDate = (days) => endDate ? fmtISO(addDays(new Date(endDate), -days)) : "";

  // ── Side effects ──────────────────────────────────────
  useEffect(() => {
    setWords((form.description || "").trim().split(/\s+/).filter(Boolean).length);
  }, [form.description]);

  useEffect(() => {
    set("subcategory", "");
    if (form.category !== "Warranty") { set("userPerson", ""); set("userDepartment", ""); }
  }, [form.category]); // eslint-disable-line

  useEffect(() => {
    if (form.frequency && DEFAULT_REMIND[form.frequency]) {
      const d = DEFAULT_REMIND[form.frequency];
      setForm(f => ({ ...f, reminder1Days: d.r1, reminder2Days: d.r2, reminderFinalDays: d.rf, frequencyCount: 1 }));
    }
  }, [form.frequency]);


  useEffect(() => {
  if (!ccOpen) return;
  const handler = (e) => {
    if (!e.target.closest("[data-cc-dropdown]")) setCcOpen(false);
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, [ccOpen]);

  // ── Employee select ───────────────────────────────────
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

  const handleRenewerSelect = (id) => {
  const emp = employees.find(e => e._id === id);
  if (!emp) {
    setForm(f => ({ ...f, selectedRenewerId: "", renewerName: "", renewerDepartment: "", renewerEmail: "" }));
    return;
  }
  setForm(f => ({
    ...f,
    selectedRenewerId: id,
    renewerName:       emp.Emp_name                                  || "",
    renewerDepartment: emp.Department                                 || "",
    renewerEmail:      emp["desig Email Id"] || emp["Dept Group Email"] || "",
  }));
};

  // ── CC multi-select helpers ───────────────────────────
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
    (em.Emp_name || "").toLowerCase().includes(ccSearch.toLowerCase()) ||
    (em.Designation || "").toLowerCase().includes(ccSearch.toLowerCase())
  );

  // ── Validation ────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.itemName.trim()) e.itemName  = "Required";
    if (!form.category)        e.category  = "Required";
    if (!form.startDate)       e.startDate = "Required";
    if (!form.frequency)       e.frequency = "Required";
    if (form.frequency === "Other" && !form.customEndDate) e.customEndDate = "Required";
    if (words > 150)           e.description = "Max 150 words";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
  if (!validate()) return;
  setSaving(true);
  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/renewals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    alert("❌ Failed to save.");
    console.error(err);
  } finally {
    setSaving(false);
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
    <div style={{ paddingTop: embedded ? 0 : 56 }}>
      {!embedded && (
        <Navbar
          breadcrumb={[{ label: "Dashboard", onClick: onCancel }, { label: "Create Renewal" }]}
          actions={
            <>
              <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
              <button onClick={handleSave} style={{ ...saveBtnStyle, background: LIME, color: "#fff" }}>✅ Create Renewal</button>
            </>
          }
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Item Details ── */}
        <Section title="Item Details" emoji="📋">
          <div style={grid2}>
            <Field label="Item ID">
              <input value={nextItemId} readOnly style={readOnly()} />
            </Field>
            <Field label="Category" error={errors.category} required>
              <select value={form.category} onChange={e => set("category", e.target.value)} style={sel("category")}>
                <option value="">Choose category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          {subcats.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Field label="Subcategory">
                <select value={form.subcategory} onChange={e => set("subcategory", e.target.value)} style={sel("")}>
                  <option value="">Choose subcategory</option>
                  {subcats.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
            </div>
          )}

          <div style={{ ...grid2, marginTop: 16 }}>
            <Field label="Item Name" error={errors.itemName} required>
              <input value={form.itemName} onChange={e => set("itemName", e.target.value)} style={inp("itemName")} placeholder="e.g. Google Workspace Annual" />
            </Field>
            <Field label="Vendor">
              <input value={form.vendor} onChange={e => set("vendor", e.target.value)} style={inp("")} placeholder="e.g. Google LLC" />
            </Field>
            
            <Field label="Service Link">
              <input type="url" value={form.serviceLink} onChange={e => set("serviceLink", e.target.value)} style={inp("")} placeholder="https://..." />
            </Field>
          </div>

          <div style={{ marginTop: 16 }}>
            <Field label="Description & Remarks" error={errors.description}>
              <textarea value={form.description} onChange={e => set("description", e.target.value)}
                style={{ ...inp("description"), resize: "vertical", minHeight: 80 }}
                placeholder="Description, remarks, or any notes (max 150 words)" />
              <div style={{ fontSize: 11, color: words > 150 ? "#EF4444" : "#9CA3AF", textAlign: "right", marginTop: 2 }}>{words} / 150 words</div>
            </Field>
          </div>

          {/* Credentials */}
          <div style={{ marginTop: 16, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 12 }}>🔐 Credentials <span style={{ fontSize: 11, fontWeight: 400, color: "#B45309" }}>(visible to renewer only)</span></div>
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

          {/* Attachments inside Item Details */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>📎 Attachments (optional)</div>
            {[1, 2].map(n => (
              <div key={n} style={{ marginBottom: n === 1 ? 12 : 0 }}>
                <Field label={`Attachment ${n}`}>
                  <input type="url" value={form[`attachment${n}Link`]}
                    onChange={e => set(`attachment${n}Link`, e.target.value)}
                    style={inp("")} placeholder="Paste a Drive / web link" />
                </Field>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Renewer Details ── */}
        {/* ── Renewer Details ── */}
      <Section title="Renewer Details" emoji="👤">
        <div style={{ marginBottom: 16 }}>
          <Field label="Select Renewer" required>
            <select
              value={form.selectedRenewerId || ""}
              onChange={e => handleRenewerSelect(e.target.value)}
              style={sel(form.selectedRenewerId ? "" : "renewerName")}
            >
              <option value="">Select renewer</option>
              {employees
                .slice()
                .sort((a, b) =>
                  (a.Designation || "").localeCompare(b.Designation || "") ||
                  (a.Emp_name || "").localeCompare(b.Emp_name || "")
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
          <Field label="Renewer Name">
            <input value={form.renewerName} readOnly style={readOnly()} />
          </Field>
          <Field label="Renewer Department">
            <input value={form.renewerDepartment} readOnly style={readOnly()} />
          </Field>
          <Field label="Renewer Email">
            <input value={form.renewerEmail} readOnly style={readOnly()} />
          </Field>
        </div>
      </Section>

        {/* ── User Details ── */}
        <Section title="User Details" emoji="👤">
          <div style={{ marginBottom: 16 }}>
            <Field label="Employee" required>
              <select value={form.selectedEmployeeId} onChange={e => handleEmployeeSelect(e.target.value)} style={sel("")}>
                <option value="">Select employee</option>
                {employees
                  .slice().sort((a, b) => (a.Designation || "").localeCompare(b.Designation || "") || (a.Emp_name || "").localeCompare(b.Emp_name || ""))
                  .map(em => (
                    <option key={em._id} value={em._id}>
                      {em.Designation ? `${em.Designation} — ` : ""}{em.Emp_name}
                    </option>
                  ))}
              </select>
            </Field>
          </div>

          <div style={grid2}>
            <Field label="Employee ID"><input value={form.empId} readOnly style={readOnly()} /></Field>
            <Field label="Department"><input value={form.department} readOnly style={readOnly()} /></Field>
            <Field label="Designation"><input value={form.designation} readOnly style={readOnly()} /></Field>
            <Field label="Email"><input value={form.email} readOnly style={readOnly()} /></Field>
            <Field label="Reporting Manager"><input value={form.reportingManager} readOnly style={readOnly()} /></Field>
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
                      height: "auto",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      alignItems: "flex-start",
                      padding: "8px 12px",
                      overflow: "visible"
                    }}
                  >
                  {form.ccRecipients.length === 0 && <span style={{ color: "#9CA3AF" }}>Select people to CC…</span>}
                  {form.ccRecipients.map(c => (
                    <span
                          key={c.id}
                          style={{
                            background: "#DBEAFE",
                            color: "#1e40af",
                            padding: "4px 10px",
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            maxWidth: "100%",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            lineHeight: 1.4
                          }}
                        >
                      {c.name}
                      <span onClick={e => { e.stopPropagation(); toggleCC({ _id: c.id, Emp_name: c.name, "desig Email Id": c.email }); }} style={{ cursor: "pointer", fontWeight: 700 }}>×</span>
                    </span>
                  ))}
                </div>

                {ccOpen && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: 8, zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto" }}>
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
                    {ccFiltered.length === 0 && <div style={{ padding: "12px 14px", color: "#9CA3AF", fontSize: 13 }}>No results</div>}
                    {ccFiltered .slice() .sort((a, b) => (a.Emp_name || "").localeCompare(b.Emp_name || "") ) .map(em => {
                      const selected = form.ccRecipients.find(c => c.id === em._id);
                      return (
                        <div
                          key={em._id}
                          onClick={() => toggleCC(em)}
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

          {form.category === "Warranty" && (
            <div style={{ ...grid2, marginTop: 16 }}>
              <Field label="Assigned User">
                <select value={form.userPerson} onChange={e => { const emp = employees.find(em => em.Emp_name === e.target.value); setForm(f => ({ ...f, userPerson: e.target.value, userDepartment: emp?.Department || "" })); }} style={sel("")}>
                  <option value="">Choose user</option>
                  {employees.map(em => <option key={em._id} value={em.Emp_name}>{em.Designation ? `${em.Designation} — ` : ""}{em.Emp_name}</option>)}
                </select>
              </Field>
              <Field label="User Department"><input value={form.userDepartment} readOnly style={readOnly()} /></Field>
            </div>
          )}
        </Section>

        {/* ── Reminders ── */}
        <Section title="Reminders" emoji="🔔">
          <div style={grid3}>
            <Field label="Service Start Date" error={errors.startDate} required>
              <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} style={inp("startDate")} />
            </Field>

            <Field label="Renewal Frequency" error={errors.frequency} required>
              <select value={form.frequency} onChange={e => set("frequency", e.target.value)} style={sel("frequency")}>
                <option value="">Select frequency</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half Yearly">Half Yearly</option>
                <option value="Annually">Annually</option>
                <option value="Other">Other (Custom Date)</option>
              </select>
            </Field>

            
            {/* Count dropdown only for Monthly and Annually */}
              {["Monthly", "Annually"].includes(form.frequency) &&
                FREQ_COUNT_OPTIONS[form.frequency] && (
                  <Field label={`Duration (${form.frequency})`}>
                    <select
                      value={form.frequencyCount}
                      onChange={e => set("frequencyCount", +e.target.value)}
                      style={sel("")}
                    >
                      {FREQ_COUNT_OPTIONS[form.frequency].map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Field>
              )}

            {/* Custom end date for Other */}
            {form.frequency === "Other" && (
              <Field label="Service End Date" error={errors.customEndDate} required>
                <input type="date" value={form.customEndDate} onChange={e => set("customEndDate", e.target.value)} style={inp("customEndDate")} />
              </Field>
            )}

            <Field label="End Date (auto-calculated)">
              <input value={endDate ? fmtDate(endDate) : ""} readOnly style={readOnly({ color: "#059669" })} placeholder="Set start date & frequency" />
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

          {endDate && (
            <div style={{ marginTop: 20, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 12 }}>📅 Reminder Preview</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {[
                  { label: "End Date",                          date: endDate,                       color: "#059669" },
                  { label: `1st (${form.reminder1Days}d before)`,  date: rDate(form.reminder1Days),  color: "#374151" },
                  { label: `2nd (${form.reminder2Days}d before)`,  date: rDate(form.reminder2Days),  color: "#374151" },
                  { label: `Final (${form.reminderFinalDays}d)`,   date: rDate(form.reminderFinalDays), color: "#374151" },
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

        {/* ── Submit ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: embedded ? 0 : 40 }}>
          <button onClick={onCancel} style={{ ...cancelBtnStyle, color: LIME }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...saveBtnStyle,
              background: saving ? "#90CAF9" : LIME,
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8,
              opacity: saving ? 0.85 : 1,
            }}
          >
            {saving ? (
              <>
                <span style={{
                  width: 14, height: 14, border: "2px solid #fff",
                  borderTopColor: "transparent", borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                }} />
                Saving…
              </>
            ) : "✅ Create Renewal"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────
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

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
const grid3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 };

const cancelBtnStyle = { padding: "11px 24px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const saveBtnStyle   = { padding: "11px 28px", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };