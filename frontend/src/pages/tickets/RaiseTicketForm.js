import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const BLANK = { title: "", description: "", priority: "Medium", attachment_link: "", plan_date: "" };

export default function RaiseTicketForm({ onSave, onCancel }) {
  const { token } = useContext(UserContext);
  const [form, setForm] = useState(BLANK);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeesError, setEmployeesError] = useState("");
  const [cc, setCc] = useState([]);
  const [manualCc, setManualCc] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
    (e) => !cc.some((c) => c.email === e.email)
  );

  const addCc = (email) => {
    const emp = employees.find((e) => e.email === email);
    if (!emp) return;
    setCc((list) => (list.some((c) => c.email === emp.email) ? list : [...list, emp]));
  };

  const removeCc = (email) => {
    setCc((list) => list.filter((c) => c.email !== email));
  };

  const addManualCc = () => {
    const email = manualCc.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid CC email address");
      return;
    }
    setCc((list) => (list.some((c) => c.email === email) ? list : [...list, { name: email, email }]));
    setManualCc("");
  };

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setUploading(true);
    setError("");

    try {
      const body = new FormData();
      body.append("file", selected);

      const res = await fetch(`${API}/api/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json();

      if (data.success) {
        setFile({ name: data.name, url: data.url });
      } else {
        setError(data.message || "File upload failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          cc: cc.map((c) => c.email),
          attachment_file_url: file ? file.url : "",
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSave && onSave(data.data);
      } else {
        setError(data.message || "Failed to raise ticket");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 28 }}>
      <h2 style={titleStyle}>Raise Ticket</h2>
      <p style={subtitleStyle}>Submit a new support ticket</p>

      <div style={card}>
          <label style={labelStyle}>Raised To</label>
          <input
            type="text"
            value="Admin (admin@briskolive.com)"
            disabled
            style={{ ...inputStyle, background: "#F3F4F6", color: "#6B7280" }}
          />

          <label style={labelStyle}>Title</label>
          <input
            type="text"
            placeholder="Short summary of the issue"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>Description</label>
          <textarea
            placeholder="Describe the issue in detail..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <label style={labelStyle}>Priority</label>
          <select
            value={form.priority}
            onChange={(e) => set("priority", e.target.value)}
            style={inputStyle}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <label style={labelStyle}>Plan Date (optional)</label>
          <input
            type="date"
            value={form.plan_date}
            onChange={(e) => set("plan_date", e.target.value)}
            style={inputStyle}
          />
          <span style={hintStyle}>When you'd like this resolved by. Can't be changed once submitted.</span>

          <label style={labelStyle}>Attachment Link (optional)</label>
          <input
            type="text"
            placeholder="Paste a link (Drive, SharePoint, etc.)"
            value={form.attachment_link}
            onChange={(e) => set("attachment_link", e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>Or Upload a File (optional)</label>
          <input type="file" onChange={handleFileChange} disabled={uploading} style={{ marginTop: 4 }} />
          {uploading && <span style={hintStyle}>Uploading...</span>}
          {file && !uploading && (
            <span style={hintStyle}>
              Attached: {file.name}{" "}
              <button style={removeFileBtn} onClick={() => setFile(null)}>Remove</button>
            </span>
          )}

          <label style={labelStyle}>Keep in CC (optional)</label>
          {cc.length > 0 && (
            <div style={ccChipsWrap}>
              {cc.map((c) => (
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

          <span style={hintStyle}>They'll be CC'd on all emails for this ticket.</span>

          {error && <div style={errorStyle}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button style={saveBtn} onClick={handleSubmit} disabled={saving}>
              {saving ? "Submitting..." : "Submit Ticket"}
            </button>
            <button style={cancelBtn} onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
    </div>
  );
}

const titleStyle = {
  margin: 0,
  fontSize: 20,
  fontWeight: 700,
  color: "#111827",
};

const subtitleStyle = {
  margin: "4px 0 18px",
  fontSize: 13,
  color: "#6B7280",
};

const card = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
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

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginTop: 10,
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
};

const hintStyle = {
  fontSize: 13,
  color: "#4B5563",
  marginTop: 4,
};

const removeFileBtn = {
  border: "none",
  background: "none",
  color: "#DC2626",
  cursor: "pointer",
  fontSize: 12,
  textDecoration: "underline",
};

const errorStyle = {
  color: "#DC2626",
  fontSize: 13,
  marginTop: 10,
};

const saveBtn = {
  padding: "10px 20px",
  border: "none",
  borderRadius: 8,
  background: "#1976d2",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const cancelBtn = {
  padding: "10px 20px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
};
