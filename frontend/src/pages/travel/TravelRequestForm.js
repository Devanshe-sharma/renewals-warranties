import React, { useContext, useEffect, useMemo, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { UserContext } from "../../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

// No travel backend yet — requests are stored in this browser under the same
// key/shape as the standalone BRISK OLIVE Travel Management demo, so the
// later Approvals / Booking / Register pages can read the same records.
const STORAGE_KEY = "boTravel_trips";

const DEPARTMENTS = ["Admin", "Engineering", "Production", "Sales", "HR", "Accounts", "IT", "Management"];
const MODES = ["Flight", "Train", "Bus", "Company Car", "Hired Cab", "Own Vehicle", "Multiple Modes", "Other"];
const ROOM_TYPES = ["Single", "Double", "Twin", "Other"];

const BRAND_BLUE = "#1976d2";

const blankForm = () => ({
  employee: "",
  employeeEmail: "",
  empid: "",
  dept: "Admin",
  manager: "",
  purpose: "",
  from: "",
  to: "",
  outDate: "",
  outTime: "",
  outMode: "Flight",
  returnRequired: "Yes",
  returnFrom: "",
  returnTo: "",
  returnDate: "",
  returnTime: "",
  returnMode: "Flight",
  hotel: "Yes",
  hotelAddress: "",
  checkin: "",
  checkout: "",
  nights: "",
  room: "Single",
  estimate: "",
  remarks: "",
});

// Form fields filled in from an HR-Forms employee record. Origin defaults to
// their office location but only if the user hasn't typed one already.
const employeeFields = (emp, form) => ({
  employee: emp.name,
  employeeEmail: emp.email,
  empid: emp.empId || "",
  dept: emp.dept || "Admin",
  manager: emp.reportingHead || "",
  from: form.from || emp.location || "",
});

function loadTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function nextTravelId(trips) {
  const max = Math.max(0, ...trips.map((t) => +((t.id || "").match(/(\d+)$/) || [])[1] || 0));
  return "BO-TR-" + String(max + 1).padStart(3, "0");
}

const s = {
  page: { padding: 24, maxWidth: 1100 },
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
  },
  h2: { fontSize: 20, fontWeight: 700, margin: "0 0 4px", color: "#111827" },
  muted: { color: "#6b7280", fontSize: 13 },
  h3: { fontSize: 15, fontWeight: 700, margin: "22px 0 12px", color: "#1f2937" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 5, minWidth: 0 },
  full: { gridColumn: "1 / -1" },
  label: { fontSize: 12, fontWeight: 700, color: "#374151" },
  input: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 11px",
    fontSize: 14,
    fontFamily: "inherit",
    background: "#fff",
    outline: "none",
  },
  hr: { border: 0, borderTop: "1px solid #e5e7eb", margin: "22px 0 0" },
  actions: { display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap" },
  primary: {
    background: BRAND_BLUE,
    color: "#fff",
    border: 0,
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  secondary: {
    background: "#f3f4f6",
    color: "#1f2937",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 18px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "10px 12px",
    marginTop: 16,
    fontSize: 13,
  },
};

function Field({ label, full, children }) {
  return (
    <div style={{ ...s.field, ...(full ? s.full : null) }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

export default function TravelRequestForm({ onSave }) {
  const { user, token } = useContext(UserContext);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Picking an employee fills in everything HR-Forms knows about them; the
  // fields stay editable since some HR records have no ID / reporting head.
  const pickEmployee = (emp) =>
    setForm((f) => ({
      ...f,
      ...(emp
        ? employeeFields(emp, f)
        : { employee: "", employeeEmail: "", empid: "", manager: "" }),
    }));

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/travel/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.success) {
          setEmployeesError(data.message || "Could not load employee list");
          return;
        }
        setEmployees(data.data);
        // Default to the logged-in user, like most requests will be.
        const me = data.data.find((e) => e.email === (user?.email || "").toLowerCase());
        if (me) setForm((f) => (f.employee ? f : { ...f, ...employeeFields(me, f) }));
      })
      .catch(() => !cancelled && setEmployeesError("Could not load employee list"))
      .finally(() => !cancelled && setLoadingEmployees(false));
    return () => { cancelled = true; };
  }, [token, user?.email]);

  // Department options follow HR-Forms's department names; fall back to the
  // fixed list if the employee list couldn't be loaded.
  const departments = useMemo(() => {
    const list = employees.length
      ? [...new Set(employees.map((e) => e.dept).filter(Boolean))].sort()
      : DEPARTMENTS;
    return form.dept && !list.includes(form.dept) ? [form.dept, ...list] : list;
  }, [employees, form.dept]);

  const selectedEmployee = employees.find((e) => e.empId === form.empid && e.name === form.employee) || null;

  const input = (k, type = "text", extra = {}) => (
    <input style={s.input} type={type} value={form[k]} onChange={set(k)} {...extra} />
  );
  const select = (k, options) => (
    <select style={s.input} value={form[k]} onChange={set(k)}>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  const returnOn = form.returnRequired === "Yes";
  const hotelOn = form.hotel === "Yes";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const required = [
      ["employee", "Employee Name"],
      ["manager", "Approving Manager"],
      ["purpose", "Business Purpose"],
      ["from", "Origin"],
      ["to", "Destination"],
      ["outDate", "Departure Date"],
      ["estimate", "Estimated Total Budget"],
    ];
    const missing = required.filter(([k]) => !String(form[k]).trim()).map(([, l]) => l);
    if (missing.length) {
      setError(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    if (returnOn && form.returnDate && form.returnDate < form.outDate) {
      setError("Return date cannot be earlier than the onward date.");
      return;
    }
    if (hotelOn && form.checkin && form.checkout && form.checkout < form.checkin) {
      setError("Check-out date cannot be earlier than check-in.");
      return;
    }

    const trips = loadTrips();
    const id = nextTravelId(trips);
    const trip = {
      ...form,
      id,
      nights: +form.nights || 0,
      estimate: +form.estimate || 0,
      actual: 0,
      paid: 0,
      outPNR: "",
      outStatus: "Pending",
      returnFrom: returnOn ? form.returnFrom || form.to : "",
      returnTo: returnOn ? form.returnTo || form.from : "",
      returnPNR: "",
      returnStatus: returnOn ? "Pending" : "Not Required",
      hotelName: "",
      hotelRef: "",
      hotelStatus: hotelOn ? "Pending" : "Not Required",
      status: "Pending Approval",
      approvalRemark: "Awaiting manager approval",
      adminRemark: form.remarks || "",
      invoiceStatus: "Pending",
      createdBy: user?.email || "",
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([trip, ...trips]));
    } catch (err) {
      setError("Could not save the request: " + err.message);
      return;
    }

    setForm(blankForm());
    onSave && onSave(trip);
  };

  return (
    <div style={s.page}>
      <section style={s.panel}>
        <h2 style={s.h2}>New Travel Request</h2>
        <div style={s.muted}>
          Complete all applicable details. Outbound, return and hotel bookings are tracked independently.
        </div>

        <form onSubmit={handleSubmit} onReset={(e) => { e.preventDefault(); setForm(blankForm()); setError(""); }}>
          <h3 style={s.h3}>1. Employee &amp; Purpose</h3>
          <div style={s.grid}>
            <Field label="Employee Name *">
              {employeesError ? (
                input("employee", "text", { placeholder: "Type employee name" })
              ) : (
                <Autocomplete
                  size="small"
                  options={employees}
                  loading={loadingEmployees}
                  value={selectedEmployee}
                  onChange={(_, emp) => pickEmployee(emp)}
                  getOptionLabel={(e) => e.name}
                  isOptionEqualToValue={(a, b) => a.empId === b.empId}
                  renderOption={(props, e) => (
                    <li {...props} key={e.empId}>
                      <div>
                        <div style={{ fontSize: 14 }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          {[e.empId, e.designation, e.dept].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={loadingEmployees ? "Loading employees..." : "Search employee"}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 14, background: "#fff" } }}
                    />
                  )}
                />
              )}
              {employeesError && (
                <span style={{ fontSize: 11, color: "#b91c1c" }}>
                  {employeesError} — type the name instead.
                </span>
              )}
            </Field>
            <Field label="Employee ID">{input("empid", "text", { placeholder: "Auto-filled from employee" })}</Field>
            <Field label="Department *">{select("dept", departments)}</Field>
            <Field label="Approving Manager *">{input("manager", "text", { placeholder: "Auto-filled from reporting head" })}</Field>
            <Field label="Business Purpose *" full>
              <textarea
                style={{ ...s.input, minHeight: 70, resize: "vertical" }}
                value={form.purpose}
                onChange={set("purpose")}
                placeholder="Client meeting, factory visit, training..."
              />
            </Field>
          </div>

          <hr style={s.hr} />
          <h3 style={s.h3}>2. Onward Journey</h3>
          <div style={s.grid}>
            <Field label="Origin *">{input("from")}</Field>
            <Field label="Destination *">{input("to")}</Field>
            <Field label="Departure Date *">{input("outDate", "date")}</Field>
            <Field label="Departure Time">{input("outTime", "time")}</Field>
            <Field label="Onward Mode">{select("outMode", MODES)}</Field>
          </div>

          <hr style={s.hr} />
          <h3 style={s.h3}>3. Return Journey</h3>
          <div style={s.grid}>
            <Field label="Return Journey Required?">{select("returnRequired", ["Yes", "No"])}</Field>
            {returnOn && (
              <>
                <Field label="Return From">{input("returnFrom", "text", { placeholder: form.to || "Defaults to destination" })}</Field>
                <Field label="Return To">{input("returnTo", "text", { placeholder: form.from || "Defaults to origin" })}</Field>
                <Field label="Return Date">{input("returnDate", "date", { min: form.outDate || undefined })}</Field>
                <Field label="Return Time">{input("returnTime", "time")}</Field>
                <Field label="Return Mode">{select("returnMode", MODES)}</Field>
              </>
            )}
          </div>

          <hr style={s.hr} />
          <h3 style={s.h3}>4. Hotel / Accommodation</h3>
          <div style={s.grid}>
            <Field label="Hotel Required?">{select("hotel", ["Yes", "No"])}</Field>
            {hotelOn && (
              <>
                <Field label="Hotel City / Preferred Area">{input("hotelAddress")}</Field>
                <Field label="Check-in Date">{input("checkin", "date")}</Field>
                <Field label="Check-out Date">{input("checkout", "date", { min: form.checkin || undefined })}</Field>
                <Field label="Number of Nights">{input("nights", "number", { min: 0 })}</Field>
                <Field label="Room Type">{select("room", ROOM_TYPES)}</Field>
              </>
            )}
          </div>

          <hr style={s.hr} />
          <h3 style={s.h3}>5. Budget &amp; Remarks</h3>
          <div style={s.grid}>
            <Field label="Estimated Total Budget (₹) *">{input("estimate", "number", { min: 0, step: 1 })}</Field>
            <Field label="Special Requirements" full>
              <textarea
                style={{ ...s.input, minHeight: 70, resize: "vertical" }}
                value={form.remarks}
                onChange={set("remarks")}
                placeholder="Preferred flight time, hotel category, advance request..."
              />
            </Field>
          </div>

          {error && <div style={s.error}>{error}</div>}

          <div style={s.actions}>
            <button type="submit" style={s.primary}>Submit for Approval</button>
            <button type="reset" style={s.secondary}>Clear Form</button>
          </div>
        </form>
      </section>
    </div>
  );
}
