import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";

const API  = process.env.REACT_APP_API_URL;
const LIME = "#1976d2";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const STATUS_COLOURS = {
  done:         { bg: "#D1FAE5", text: "#065F46" },
  done_delayed: { bg: "#FEF9C3", text: "#854D0E" },
  due:          { bg: "#E5E7EB", text: "#374151" },
  overdue:      { bg: "#FEE2E2", text: "#991B1B" },
  not_yet_due:  { bg: "#F9FAFB", text: "#6B7280" },
};

const STATUSES = [
  {
    key: "done", label: "Done", emoji: "✅",
    logic: [
      { label: "Grace period after expiry date still counts as Done", key: "done_grace_days", type: "number", help: "0 = must renew on or before expiry. E.g. 3 = 3 days after still counts.", default: 0 },
    ],
  },
  {
    key: "done_delayed", label: "Done Delayed", emoji: "🟡",
    logic: [
      { label: "Triggered when", key: null, type: "locked", help: "Renewal recorded after expiry date (beyond grace period)." },
    ],
  },
  {
    key: "due", label: "Due", emoji: "🔘",
    logic: [
      { label: "Starts after 2nd reminder date", key: null, type: "locked", help: "Automatically uses reminder2_date from the renewal item." },
      { label: "Ends on", key: null, type: "locked", help: "Expiry date (deadline)." },
    ],
  },
  {
    key: "overdue", label: "Overdue", emoji: "🔴",
    logic: [
      { label: "Triggered when", key: null, type: "locked", help: "Today is past the expiry date and item has not been renewed." },
    ],
  },
  {
    key: "not_yet_due", label: "Not Yet Due", emoji: "⚪",
    logic: [
      { label: "Applies when", key: null, type: "locked", help: "From start date up to (but not including) the 2nd reminder date." },
    ],
  },
];

export default function StatusRulesPage({ onBack }) {
  const [rules,   setRules]   = useState(null);
  const [preview, setPreview] = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    fetch(`${API}/api/status-rules`)
      .then(r => r.json())
      .then(d => { if (d.success) setRules(d.data); })
      .catch(console.error);

    fetch(`${API}/api/status-rules/preview`)
      .then(r => r.json())
      .then(d => { if (d.success) setPreview(d.data); })
      .catch(console.error);
  }, []);

  const set = (k, v) => setRules(r => ({ ...r, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/status-rules`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });
      const data = await res.json();
      if (data.success) { setRules(data.data); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (!rules) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #E5E7EB", borderTop: `3px solid ${LIME}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const counts = preview.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <div>
      <Navbar
        title="Status Rules"
        subtitle="Define when each renewal status applies"
        breadcrumb={[{ label: "Dashboard", onClick: onBack }, { label: "Status Rules" }]}
        actions={
          <button onClick={handleSave} disabled={saving}
            style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: LIME, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
            {saved ? "✓ Saved" : saving ? "Saving…" : "💾 Save"}
          </button>
        }
      />

      {/* Count pills */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {STATUSES.map(s => {
          const c = STATUS_COLOURS[s.key];
          return (
            <div key={s.key} style={{ background: c.bg, color: c.text, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.text }} />
              {s.emoji} {s.label} — {counts[s.key] || 0}
            </div>
          );
        })}
      </div>

      {/* Rule cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
        {STATUSES.map(s => {
          const c = STATUS_COLOURS[s.key];
          return (
            <div key={s.key} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: `4px solid ${c.bg}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ background: c.bg, color: c.text, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.text }} />
                  {s.emoji} {s.label}
                </span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{counts[s.key] || 0} items</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {s.logic.map((lf, i) => (
                  <div key={i}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{lf.label}</label>
                    {lf.type === "locked" ? (
                      <div style={{ background: "#F9FAFB", border: "1px dashed #E5E7EB", borderRadius: 8, padding: "9px 14px", fontSize: 13, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 6 }}>
                        🔒 {lf.help}
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <input
                          type="number" min="0"
                          value={rules[lf.key] ?? lf.default}
                          onChange={e => set(lf.key, +e.target.value)}
                          style={{ border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 14px", fontSize: 14, color: "#111", outline: "none", width: 100, fontFamily: "inherit", textAlign: "center" }}
                        />
                        <span style={{ fontSize: 13, color: "#6B7280" }}>{lf.help}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live preview */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #F3F4F6", fontSize: 13, fontWeight: 700, color: "#111" }}>Live Preview</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["ID", "Item Name", "End Date", "2nd Reminder", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#6B7280", textAlign: "left", letterSpacing: 0.5, textTransform: "uppercase", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map(r => {
                const s = STATUSES.find(k => k.key === r.status) || STATUSES[4];
                const c = STATUS_COLOURS[r.status] || STATUS_COLOURS.not_yet_due;
                return (
                  <tr key={r.item_id} style={{ borderBottom: "1px solid #F9FAFB" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{r.item_id}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600, color: "#111" }}>{r.item_name}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>{fmtDate(r.end_date)}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, color: "#374151" }}>{fmtDate(r.reminder2_date)}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ background: c.bg, color: c.text, padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.text }} />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {preview.length === 0 && <div style={{ padding: "32px 0", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>No active renewals</div>}
        </div>
      </div>
    </div>
  );
}