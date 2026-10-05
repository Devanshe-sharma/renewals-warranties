import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Shared "Keep in CC" control: an HR-Forms employee dropdown (with a
// manual-email fallback if that lookup fails) plus removable chips. Used by
// both RaiseTicketForm (cc at creation) and TicketsPage's close-ticket
// modal (cc added on closing).
export default function CcPicker({ value, onChange, label = "Keep in CC (optional)", hint = "They'll be CC'd on all emails for this ticket." }) {
  const { token } = useContext(UserContext);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState("");
  const [manualCc, setManualCc] = useState("");
  const [manualError, setManualError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(`${API}/api/tickets/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setEmployees(data.data);
        } else {
          setEmployeesError(data.message || "Could not load employee list");
        }
      })
      .catch(() => {
        if (!cancelled) setEmployeesError("Could not load employee list");
      })
      .finally(() => {
        if (!cancelled) setLoadingEmployees(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const availableEmployees = employees.filter(
    (e) => !value.some((c) => c.email === e.email)
  );

  const addCc = (email) => {
    const emp = employees.find((e) => e.email === email);
    if (!emp) return;
    onChange(value.some((c) => c.email === emp.email) ? value : [...value, emp]);
  };

  const removeCc = (email) => {
    onChange(value.filter((c) => c.email !== email));
  };

  const addManualCc = () => {
    const email = manualCc.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      setManualError("Enter a valid CC email address");
      return;
    }
    onChange(value.some((c) => c.email === email) ? value : [...value, { name: email, email }]);
    setManualCc("");
    setManualError("");
  };

  return (
    <>
      <label style={labelStyle}>{label}</label>
      {value.length > 0 && (
        <div style={ccChipsWrap}>
          {value.map((c) => (
            <span key={c.email} style={ccChip}>
              {c.name || c.email}
              <button type="button" style={ccChipRemove} onClick={() => removeCc(c.email)}>×</button>
            </span>
          ))}
        </div>
      )}
      <select
        value=""
        onChange={(e) => addCc(e.target.value)}
        disabled={loadingEmployees || availableEmployees.length === 0}
        style={inputStyle}
      >
        <option value="" disabled>
          {loadingEmployees ? "Loading employees..." : "+ Add someone to CC"}
        </option>
        {availableEmployees.map((e) => (
          <option key={e.email} value={e.email}>
            {e.name}{e.designation ? ` — ${e.designation}` : ""}
          </option>
        ))}
      </select>

      {employeesError && (
        <>
          <span style={{ ...hintStyle, color: "#DC2626" }}>
            {employeesError} — you can still add someone by email.
          </span>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              type="text"
              placeholder="name@briskolive.com"
              value={manualCc}
              onChange={(e) => setManualCc(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="button" style={cancelBtn} onClick={addManualCc}>Add</button>
          </div>
        </>
      )}

      {manualError && <span style={{ ...hintStyle, color: "#DC2626" }}>{manualError}</span>}

      {hint && <span style={hintStyle}>{hint}</span>}
    </>
  );
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginTop: 10,
  display: "block",
};

const ccChipsWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginTop: 2,
};

const ccChip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "4px 6px 4px 10px",
  borderRadius: 999,
  background: "#EFF6FF",
  color: "#1E40AF",
  fontSize: 12,
  fontWeight: 600,
};

const ccChipRemove = {
  border: "none",
  background: "none",
  color: "#1E40AF",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
  padding: 2,
};

const inputStyle = {
  padding: "10px 14px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 4,
};

const hintStyle = {
  fontSize: 13,
  color: "#4B5563",
  marginTop: 4,
  display: "block",
};

const cancelBtn = {
  padding: "10px 20px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
};
