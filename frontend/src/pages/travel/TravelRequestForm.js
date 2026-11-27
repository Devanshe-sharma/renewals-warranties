import React, { useContext, useEffect, useMemo, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { UserContext } from "../../context/UserContext";
import Navbar, { NavbarButton } from "../../components/navbar";
import {
  travelApi, errorMessage, departureAt, eventLag, fmtDate, fmtDateTime, MIN_NOTICE_HOURS, EVENT_GRACE_DAYS,
} from "./travelStore";

const DEPARTMENTS = ["Admin", "Engineering", "Production", "Sales", "HR", "Accounts", "IT", "Management"];
const MODES = ["Flight", "Train", "Bus", "Company Car", "Hired Cab", "Own Vehicle", "Multiple Modes", "Other"];
// Category A: every mode, no approval question. Everyone else: planned trips
// can't go by flight; unplanned trips may, but must say whether it's approved.
const isTopManagement = (f) => f.category === "Category A";
const modesFor = (f) =>
  isTopManagement(f) || f.journeyType === "Unplanned" ? MODES : MODES.filter((m) => m !== "Flight");
const needsApproval = (f) => f.journeyType === "Unplanned" && !isTopManagement(f);

// Keep the mode selections and approval answer valid after the category or
// journey type changes (e.g. Flight picked as Category A, then switched to B).
function normalizeTravelRules(f) {
  const allowed = modesFor(f);
  return {
    ...f,
    outMode: allowed.includes(f.outMode) ? f.outMode : "Train",
    returnMode: allowed.includes(f.returnMode) ? f.returnMode : "Train",
    unplannedApproved: needsApproval(f) ? f.unplannedApproved : "",
  };
}
const ROOM_TYPES = ["Single", "Double", "Twin", "Other"];

const TIME_SLOTS = [
  "Early Morning (12 AM – 6 AM)",
  "Morning (6 AM – 12 PM)",
  "Afternoon (12 PM – 4 PM)",
  "Evening (4 PM – 8 PM)",
  "Night (8 PM – 12 AM)",
];

// Travel entitlement categories by designation, with each category's rail
// class entitlement.
const CATEGORIES = [
  {
    value: "Category A",
    label: "Category A – Top Management",
    rail: "AC I Tier / Executive Class",
    designations: ["Managing Director", "CEO", "Director"],
  },
  {
    value: "Category B",
    label: "Category B – Senior Management / Department Heads",
    rail: "AC II Tier",
    designations: ["Department Head", "Functional Head", "Manager", "Deputy Manager"],
  },
  {
    value: "Category C",
    label: "Category C – Executives & Operational Staff",
    rail: "AC III Tier / Chair Car",
    designations: ["Executive", "Assistant Manager", "Officer", "Engineer", "Coordinator", "Technician", "Trainee", "Operator", "Supervisor"],
  },
];
const railEntitlement = (category) => CATEGORIES.find((c) => c.value === category)?.rail || "";

// Best guess at the category from an HR designation such as "Senior
// Executive - Sales". More specific titles are checked first so "Assistant
// Manager" lands in C and "Managing Director" in A, not B via "Manager".
function categoryForDesignation(designation) {
  const d = String(designation || "").toLowerCase();
  if (!d) return "";
  if (d.includes("assistant manager")) return "Category C";
  if (d.includes("managing director") || /\bceo\b/.test(d) || d.includes("director")) return "Category A";
  if (d.includes("head") || d.includes("manager")) return "Category B";
  const c = CATEGORIES[2].designations.some((x) => d.includes(x.toLowerCase()));
  return c ? "Category C" : "";
}

const BRAND_BLUE = "#1976d2";

const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const blankForm = () => ({
  requestDate: todayISO(),
  employee: "",
  employeeEmail: "",
  empid: "",
  designation: "",
  category: "",
  dept: "Admin",
  manager: "",
  managerEmail: "",
  purpose: "",
  eventId: "",
  from: "",
  to: "",
  journeyType: "Planned",
  unplannedApproved: "",
  bookingType: "Normal",
  outDate: "",
  outTime: "",
  outMode: "Train",
  returnRequired: "Yes",
  returnFrom: "",
  returnTo: "",
  returnDate: "",
  returnTime: "",
  returnMode: "Train",
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
// The manager is looked up by name in the same list so the approval email
// has an address to go to.
const employeeFields = (emp, form, employees = []) => {
  const mgr = employees.find((e) => e.name.toLowerCase() === (emp.reportingHead || "").toLowerCase());
  return {
    employee: emp.name,
    employeeEmail: emp.email,
    empid: emp.empId || "",
    designation: emp.designation || "",
    category: categoryForDesignation(emp.designation) || form.category,
    dept: emp.dept || "Admin",
    manager: emp.reportingHead || "",
    managerEmail: mgr?.email || "",
    from: form.from || emp.location || "",
  };
};

// Earliest departure date the date picker offers for a booking type.
const minDepartureDate = (bookingType) => {
  const d = new Date(Date.now() + (MIN_NOTICE_HOURS[bookingType] || 48) * 3600000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const s = {
  page: { maxWidth: 1100, margin: "0 auto", padding: 20 },
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
  requestDate: {
    textAlign: "right",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "8px 14px",
  },
  note: {
    marginTop: 12,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1e3a8a",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
  },
  warn: {
    marginTop: 8,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
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

export default function TravelRequestForm({ onSave, onCancel }) {
  const { user, token } = useContext(UserContext);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState("");

  const [events, setEvents] = useState([]);
  const [eventsError, setEventsError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Picking an employee fills in everything HR-Forms knows about them; the
  // fields stay editable since some HR records have no ID / reporting head.
  const pickEmployee = (emp) =>
    setForm((f) =>
      normalizeTravelRules({
        ...f,
        ...(emp
          ? employeeFields(emp, f, employees)
          : { employee: "", employeeEmail: "", empid: "", designation: "", category: "", manager: "", managerEmail: "" }),
      })
    );

  const pickManager = (emp) =>
    setForm((f) => ({ ...f, manager: emp?.name || "", managerEmail: emp?.email || "" }));

  // Category and journey type decide which modes are allowed and whether the
  // approval question is asked, so re-check those whenever either changes.
  const setRuleField = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => normalizeTravelRules({ ...f, [k]: value }));
  };

  useEffect(() => {
    let cancelled = false;
    travelApi(token, "/employees").then((r) => {
      if (cancelled) return;
      setLoadingEmployees(false);
      if (!r.ok) {
        setEmployeesError(errorMessage(r, "Could not load employee list"));
        return;
      }
      const list = r.data.data;
      setEmployees(list);
      // Default to the logged-in user, like most requests will be.
      const me = list.find((e) => e.email === (user?.email || "").toLowerCase());
      if (me) setForm((f) => (f.employee ? f : normalizeTravelRules({ ...f, ...employeeFields(me, f, list) })));
    });
    travelApi(token, "/events").then((r) => {
      if (cancelled) return;
      if (r.ok) setEvents(r.data.data);
      else setEventsError(errorMessage(r, "Could not load events"));
    });
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
  const selectedManager = employees.find((e) => e.email && e.email === form.managerEmail) || null;
  const selectedEvent = events.find((e) => e.id === form.eventId) || null;
  const lag = selectedEvent ? eventLag(selectedEvent.createdAt) : null;

  const input = (k, type = "text", extra = {}) => (
    <input style={s.input} type={type} value={form[k]} onChange={set(k)} {...extra} />
  );
  // options: strings, or { value, label }; placeholder adds an empty first option.
  const select = (k, options, { onChange, placeholder } = {}) => (
    <select style={s.input} value={form[k]} onChange={onChange || set(k)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const value = typeof o === "string" ? o : o.value;
        return <option key={value} value={value}>{typeof o === "string" ? o : o.label}</option>;
      })}
    </select>
  );

  const returnOn = form.returnRequired === "Yes";
  const hotelOn = form.hotel === "Yes";
  const modes = modesFor(form);
  const askApproval = needsApproval(form);
  const rail = railEntitlement(form.category);
  const byTrain = form.outMode === "Train" || (returnOn && form.returnMode === "Train");

  const railNote = (
    <div style={s.note}>
      🚆 Rail entitlement: <b>{rail || "select a category in section 1"}</b>
      {rail && ` (${form.category})`}
    </div>
  );

  // Searchable HR-Forms employee dropdown, used for the employee and the manager.
  const employeePicker = (value, onPick, placeholder) => (
    <Autocomplete
      size="small"
      options={employees}
      loading={loadingEmployees}
      value={value}
      onChange={(_, emp) => onPick(emp)}
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
          placeholder={loadingEmployees ? "Loading employees..." : placeholder}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 14, background: "#fff" } }}
        />
      )}
    />
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const required = [
      ["employee", "Employee Name"],
      ["category", "Category"],
      ["manager", "Approving Manager"],
      ["purpose", "Business Purpose"],
      ["from", "Origin"],
      ["to", "Destination"],
      ["outDate", "Departure Date"],
      ["estimate", "Estimated Total Budget"],
    ];
    if (askApproval) required.push(["unplannedApproved", "Is this approved?"]);
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

    // Admin needs 2 days to arrange tickets (24h for Tatkal). The backend
    // enforces this too.
    const dep = departureAt(form.outDate, form.outTime);
    const needHours = MIN_NOTICE_HOURS[form.bookingType] || 48;
    if (!dep || dep.getTime() - Date.now() < needHours * 3600000) {
      setError(
        form.bookingType === "Tatkal"
          ? "Tatkal requests must be raised at least 24 hours before departure."
          : "Travel requests must be raised at least 2 days before departure so Admin can arrange tickets. For a Tatkal booking, choose Booking Type “Tatkal” (minimum 24 hours)."
      );
      return;
    }

    setSaving(true);
    const r = await travelApi(token, "/requests", {
      method: "POST",
      body: {
        ...form,
        railEntitlement: byTrain ? rail : "",
        returnFrom: returnOn ? form.returnFrom || form.to : "",
        returnTo: returnOn ? form.returnTo || form.from : "",
      },
    });
    setSaving(false);
    if (!r.ok) {
      setError(errorMessage(r, "Could not submit the request"));
      return;
    }

    setForm(blankForm());
    onSave && onSave(r.data.data);
  };

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        title="Travel Request"
        subtitle="Raise a new travel request for approval"
        breadcrumb={[{ label: "Travel Management", onClick: onCancel }, { label: "Travel Request" }]}
        actions={onCancel && <NavbarButton onClick={onCancel} label="← Back to Travel Management" variant="secondary" />}
      />
    <div style={s.page}>
      <section style={s.panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={s.h2}>New Travel Request</h2>
            <div style={s.muted}>
              Complete all applicable details. Outbound, return and hotel bookings are tracked independently.
            </div>
          </div>
          <div style={s.requestDate}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3 }}>
              Request Date
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginTop: 2 }}>
              {new Date(form.requestDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} onReset={(e) => { e.preventDefault(); setForm(blankForm()); setError(""); }}>
          <h3 style={s.h3}>1. Employee &amp; Purpose</h3>
          <div style={s.grid}>
            <Field label="Employee Name *">
              {employeesError
                ? input("employee", "text", { placeholder: "Type employee name" })
                : employeePicker(selectedEmployee, pickEmployee, "Search employee")}
              {employeesError && (
                <span style={{ fontSize: 11, color: "#b91c1c" }}>
                  {employeesError} — type the name instead.
                </span>
              )}
            </Field>
            <Field label="Employee ID">{input("empid", "text", { placeholder: "Auto-filled from employee" })}</Field>
            <Field label="Designation">{input("designation", "text", { placeholder: "Auto-filled from employee" })}</Field>
            <Field label="Category *">
              {select("category", CATEGORIES, { placeholder: "Select category", onChange: setRuleField("category") })}
              {form.category && (
                <span style={{ fontSize: 11, color: "#6b7280" }}>
                  {CATEGORIES.find((c) => c.value === form.category).designations.join(", ")}
                </span>
              )}
            </Field>
            <Field label="Department *">{select("dept", departments)}</Field>
            <Field label="Approving Manager *">
              {employeesError
                ? input("manager", "text", { placeholder: "Type manager name" })
                : employeePicker(selectedManager, pickManager, form.manager || "Auto-filled from reporting head")}
              {!employeesError && form.manager && !form.managerEmail && (
                <span style={{ fontSize: 11, color: "#b45309" }}>
                  “{form.manager}” isn't in the employee list — pick the manager so the approval email reaches them.
                </span>
              )}
            </Field>
            <Field label="Related Event (HR-Forms Outing)" full>
              <select style={s.input} value={form.eventId} onChange={set("eventId")}>
                <option value="">Not linked to an event</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                    {ev.date ? ` — ${fmtDate(ev.date)}` : ""}
                    {ev.place ? ` · ${ev.place}` : ""}
                  </option>
                ))}
              </select>
              {eventsError && <span style={{ fontSize: 11, color: "#b91c1c" }}>{eventsError}</span>}
              {selectedEvent && lag && (
                <div style={lag.score < 0 ? s.warn : s.note}>
                  Event created on <b>{fmtDateTime(selectedEvent.createdAt)}</b> · travel request raised{" "}
                  <b>{lag.days === 0 ? "the same day" : `${lag.days} day${lag.days === 1 ? "" : "s"} later`}</b>.{" "}
                  {lag.score < 0
                    ? <>Raised after the {EVENT_GRACE_DAYS}-day grace period — late score <b>{lag.score}</b>. Your manager will see this.</>
                    : <>Within the {EVENT_GRACE_DAYS}-day grace period — no late score.</>}
                </div>
              )}
            </Field>
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
            <Field label="Planned or Unplanned? *">
              {select("journeyType", ["Planned", "Unplanned"], { onChange: setRuleField("journeyType") })}
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                {isTopManagement(form)
                  ? "Category A: all travel modes available, no approval needed."
                  : form.journeyType === "Planned"
                    ? "Flight is not available for planned travel."
                    : "Unplanned travel needs approval."}
              </span>
            </Field>
            {askApproval && (
              <Field label="Is this approved? *">{select("unplannedApproved", ["Yes", "No"], { placeholder: "Select" })}</Field>
            )}
            <Field label="Origin *">{input("from")}</Field>
            <Field label="Destination *">{input("to")}</Field>
            <Field label="Booking Type *">
              {select("bookingType", ["Normal", "Tatkal"])}
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                {form.bookingType === "Tatkal"
                  ? "Tatkal: raise at least 24 hours before departure."
                  : "Raise at least 2 days before departure so Admin can arrange tickets."}
              </span>
            </Field>
            <Field label="Departure Date *">{input("outDate", "date", { min: minDepartureDate(form.bookingType) })}</Field>
            <Field label="Departure Time Slot">{select("outTime", TIME_SLOTS, { placeholder: "Select time slot" })}</Field>
            <Field label="Onward Mode">{select("outMode", modes)}</Field>
          </div>
          {form.outMode === "Train" && railNote}

          <hr style={s.hr} />
          <h3 style={s.h3}>3. Return Journey</h3>
          <div style={s.grid}>
            <Field label="Return Journey Required?">{select("returnRequired", ["Yes", "No"])}</Field>
            {returnOn && (
              <>
                <Field label="Return From">{input("returnFrom", "text", { placeholder: form.to || "Defaults to destination" })}</Field>
                <Field label="Return To">{input("returnTo", "text", { placeholder: form.from || "Defaults to origin" })}</Field>
                <Field label="Return Date">{input("returnDate", "date", { min: form.outDate || undefined })}</Field>
                <Field label="Return Time Slot">{select("returnTime", TIME_SLOTS, { placeholder: "Select time slot" })}</Field>
                <Field label="Return Mode">{select("returnMode", modes)}</Field>
              </>
            )}
          </div>
          {returnOn && form.returnMode === "Train" && railNote}

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
            <button type="submit" style={{ ...s.primary, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? "Submitting..." : "Submit for Approval"}
            </button>
            <button type="reset" style={s.secondary}>Clear Form</button>
          </div>
        </form>
      </section>
    </div>
    </div>
  );
}
