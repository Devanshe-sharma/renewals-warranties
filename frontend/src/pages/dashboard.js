import React, { useState } from "react";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";

// ── Local constants ───────────────────────────────────────
const LIME      = "#ADE80A";
const LIME_PALE = "#F4FFD6";

const STATUS_META = {
  active:   { label: "Active",        bg: "#DCFCE7", text: "#166534", dot: "#22C55E" },
  expiring: { label: "Expiring Soon", bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  critical: { label: "Critical",      bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
  expired:  { label: "Expired",       bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
};

// ── Pure helpers ─────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export function getStatus(endDate) {
  const d = daysBetween(new Date(), new Date(endDate));
  if (d < 0)   return "expired";
  if (d <= 7)  return "critical";
  if (d <= 30) return "expiring";
  return "active";
}

// ── Reusable atoms ───────────────────────────────────────
export function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.active;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: m.bg, color: m.text,
        padding: "3px 10px", borderRadius: 20,
        fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function DaysChip({ endDate }) {
  const d = daysBetween(new Date(), new Date(endDate));
  if (d < 0) return <span style={{ color: "#9CA3AF", fontSize: 12 }}>{Math.abs(d)}d overdue</span>;
  return (
    <span style={{ color: d <= 7 ? "#EF4444" : d <= 30 ? "#F59E0B" : "#9CA3AF", fontSize: 12, fontWeight: 600 }}>
      in {d}d
    </span>
  );
}

function StatsCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 12,
        padding: "20px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        borderLeft: `3px solid ${accent || LIME}`,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 800, color: "#111", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function TH({ children }) {
  return (
    <th
      style={{
        padding: "11px 16px", fontSize: 11, fontWeight: 700,
        color: "#6B7280", textAlign: "left",
        letterSpacing: 0.6, textTransform: "uppercase",
        borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

// ────────────────────────────────────────────────────────
// DASHBOARD
// Props:
//   renewals   {Array}  – list of renewal objects
//   categories {Array}  – [{ id, name, subcategories:[{id,name}] }]
//   onSelect   {fn}     – called with renewal when row is clicked
//   onNew      {fn}     – called when "New Renewal" is clicked
//   onEdit     {fn}     – called with renewal when Edit button is clicked
// ────────────────────────────────────────────────────────
export default function Dashboard({ renewals = [], categories = [], onSelect, onNew, onEdit }) {
  const [search,  setSearch]  = useState("");
  const [statusF, setStatusF] = useState("all");
  const [catF,    setCatF]    = useState("all");

  const counts = renewals.reduce(
    (acc, r) => { acc[getStatus(r.endDate)]++; return acc; },
    { active: 0, expiring: 0, critical: 0, expired: 0 }
  );

  const visible = renewals.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q || r.itemName.toLowerCase().includes(q) || r.vendor.toLowerCase().includes(q) || r.responsible.toLowerCase().includes(q)) &&
      (statusF === "all" || getStatus(r.endDate) === statusF) &&
      (catF    === "all" || r.category === catF)
    );
  });

  return (
    <div>
      {/* ── Navbar ── */}
      <Navbar
        title="Renewals Dashboard"
        subtitle="Track and manage all renewals & warranties"
        actions={
  <button
    onClick={onNew}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "#ADE80A",
      border: "none",
      borderRadius: 8,
      padding: "8px 14px",
      fontWeight: 700,
      cursor: "pointer",
    }}
  >
    + New Renewal
  </button>
}
      />

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        <StatsCard label="Total Renewals" value={renewals.length}                       sub="All items"        accent={LIME}     />
        <StatsCard label="Active"         value={counts.active}                         sub="In good standing" accent="#22C55E"  />
        <StatsCard label="Expiring Soon"  value={counts.expiring + counts.critical}     sub="Within 30 days"   accent="#F59E0B"  />
        <StatsCard label="Overdue"        value={counts.expired}                        sub="Needs attention"  accent="#EF4444"  />
      </div>

      {/* ── Filters ── */}
      <div
        style={{
          background: "#fff", borderRadius: 12,
          padding: "14px 18px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          marginBottom: 16,
          display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
        }}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, vendor, person…"
          style={inputStyle}
        />

        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={selectStyle}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring Soon</option>
          <option value="critical">Critical</option>
          <option value="expired">Expired</option>
        </select>

        <select value={catF} onChange={(e) => setCatF(e.target.value)} style={selectStyle}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {(search || statusF !== "all" || catF !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusF("all"); setCatF("all"); }}
            style={clearBtnStyle}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                <TH>ID</TH>
                <TH>Item</TH>
                <TH>Category</TH>
                <TH>Vendor</TH>
                <TH>Responsible</TH>
                <TH>Renewal Date</TH>
                <TH>Cost</TH>
                <TH>Status</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r)}
                  style={{ borderBottom: "1px solid #F9FAFB", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{r.id}</td>

                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{r.itemName}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{r.subcategory}</div>
                  </td>

                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.category}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.vendor}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.responsible}</td>

                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontSize: 13, color: "#374151" }}>{fmtDate(r.endDate)}</div>
                    <DaysChip endDate={r.endDate} />
                  </td>

                  <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                    {r.currency} {Number(r.cost).toLocaleString("en-IN")}
                  </td>

                  <td style={{ padding: "13px 16px" }}>
                    <StatusBadge status={getStatus(r.endDate)} />
                  </td>

                  <td style={{ padding: "13px 16px" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(r); }}
                      style={{
                        background: LIME_PALE, color: "#4B5320",
                        border: `1px solid ${LIME}`,
                        borderRadius: 7, padding: "5px 14px",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visible.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
            No renewals found
          </div>
        )}

        <div style={{ padding: "12px 18px", borderTop: "1px solid #F3F4F6", color: "#9CA3AF", fontSize: 12 }}>
          Showing {visible.length} of {renewals.length} items
        </div>
      </div>
    </div>
  );
}

// ── Shared local styles ───────────────────────────────────
const inputStyle = {
  flex: 1, minWidth: 200,
  border: "1.5px solid #E5E7EB", borderRadius: 8,
  padding: "8px 14px", fontSize: 14, outline: "none",
  color: "#111", fontFamily: "inherit",
};

const selectStyle = {
  border: "1.5px solid #E5E7EB", borderRadius: 8,
  padding: "8px 14px", fontSize: 14,
  color: "#374151", cursor: "pointer",
  fontFamily: "inherit", background: "#fff", outline: "none",
};

const clearBtnStyle = {
  border: "none", background: "#F3F4F6", borderRadius: 8,
  padding: "8px 14px", fontSize: 13,
  color: "#6B7280", cursor: "pointer",
  fontWeight: 600, fontFamily: "inherit",
};