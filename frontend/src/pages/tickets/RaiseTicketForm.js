import React, { useContext, useState } from "react";
import { UserContext } from "../../context/UserContext";
import CcPicker from "./CcPicker";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

const PRIORITIES = ["Low", "Medium", "Critical"];

// Earliest plan_date selectable per priority — Critical can be planned for
// today, Medium needs 2+ days out, Low needs 4+ days out. Mirrored
// server-side in backend/routes/ticketRoutes.js since <input min> alone
// can't be trusted.
const MIN_PLAN_DAYS_BY_PRIORITY = { Critical: 0, Medium: 2, Low: 4 };

const toISODate = (d) => d.toISOString().split("T")[0];

const minPlanDate = (priority) => {
  const d = new Date();
  d.setDate(d.getDate() + (MIN_PLAN_DAYS_BY_PRIORITY[priority] ?? 0));
  return toISODate(d);
};

const BLANK = { title: "", description: "", priority: "Medium", attachment_link: "", plan_date: "" };

export default function RaiseTicketForm({ onSave, onCancel }) {
  const { token } = useContext(UserContext);
  const [form, setForm] = useState(BLANK);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [cc, setCc] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setPriority = (priority) => {
    setForm((f) => {
      const min = minPlanDate(priority);
      // Bump an already-picked date up if it's no longer early enough
      // for the new priority, rather than silently submitting anyway.
      const plan_date = f.plan_date && f.plan_date < min ? min : f.plan_date;
      return { ...f, priority, plan_date };
    });
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

    if (form.plan_date && form.plan_date < minPlanDate(form.priority)) {
      setError(`For ${form.priority} priority, the plan date can't be earlier than ${minPlanDate(form.priority)}`);
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
            onChange={(e) => setPriority(e.target.value)}
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
            min={minPlanDate(form.priority)}
            onChange={(e) => set("plan_date", e.target.value)}
            style={inputStyle}
          />
          <span style={hintStyle}>
            {form.priority === "Critical"
              ? "Critical tickets can be planned for today."
              : `${form.priority} priority needs at least ${MIN_PLAN_DAYS_BY_PRIORITY[form.priority]} days' notice.`}
            {" "}Can't be changed once submitted.
          </span>

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

          <CcPicker value={cc} onChange={setCc} />

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
