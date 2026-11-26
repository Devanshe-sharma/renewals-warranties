import React, { useMemo, useState } from "react";
import Navbar, { NavbarButton } from "../../components/navbar";
import { loadTrips } from "./travelStore";

const STATUSES = [
  "Pending Approval", "Clarification Required", "Approved", "Booking In Progress", "Booked",
  "Travel In Progress", "Completed", "Invoice Pending", "Rejected", "Cancelled",
];

const money = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_COLORS = {
  good: { background: "#DCFCE7", color: "#166534" },
  bad: { background: "#FEE2E2", color: "#991B1B" },
  pending: { background: "#FEF3C7", color: "#92400E" },
  info: { background: "#DBEAFE", color: "#1E40AF" },
};

function statusKind(s) {
  if (["Booked", "Completed", "Approved", "Confirmed"].includes(s)) return "good";
  if (["Rejected", "Cancelled"].includes(s)) return "bad";
  if (["Pending Approval", "Pending", "Clarification Required", "Invoice Pending"].includes(s)) return "pending";
  return "info";
}

function StatusBadge({ status }) {
  return (
    <span
      style={{
        ...STATUS_COLORS[statusKind(status)],
        display: "inline-block",
        borderRadius: 99,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {status || "Pending"}
    </span>
  );
}

const s = {
  page: { maxWidth: 1300, margin: "0 auto", padding: 20 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" },
  cardLabel: { fontSize: 12, color: "#6b7280" },
  cardNum: { fontSize: 24, fontWeight: 800, marginTop: 4, color: "#111827" },
  panel: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" },
  toolbar: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  input: { flex: 1, minWidth: 200, border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none" },
  tableWrap: { overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 10 },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 1150 },
  th: { textAlign: "left", padding: "10px 12px", background: "#f9fafb", color: "#4b5563", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" },
  td: { padding: "10px 12px", fontSize: 13, color: "#1f2937", borderBottom: "1px solid #f3f4f6", verticalAlign: "top" },
  sub: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  empty: { padding: 32, textAlign: "center", color: "#6b7280" },
};

export default function TravelManagementPage({ onNew }) {
  // Re-read on every visit: the form saves straight to storage and then
  // navigates back here, which remounts this page.
  const [trips] = useState(loadTrips);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trips.filter(
      (t) =>
        (status === "All Statuses" || t.status === status) &&
        (!q || [t.id, t.employee, t.empid, t.dept, t.from, t.to, t.manager].join(" ").toLowerCase().includes(q))
    );
  }, [trips, search, status]);

  const pending = trips.filter((t) => ["Pending Approval", "Clarification Required"].includes(t.status)).length;
  const approved = trips.filter((t) => ["Approved", "Booking In Progress", "Booked", "Travel In Progress"].includes(t.status)).length;
  const totalEstimate = trips.reduce((a, t) => a + (+t.estimate || 0), 0);

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        title="Travel Management"
        subtitle="All travel requests"
        breadcrumb={[{ label: "Travel Management" }]}
        actions={<NavbarButton onClick={onNew} icon="+" label="New Travel Request" />}
      />

      <div style={s.page}>
        <div style={s.cards}>
          <div style={s.card}><div style={s.cardLabel}>Total Requests</div><div style={s.cardNum}>{trips.length}</div></div>
          <div style={s.card}><div style={s.cardLabel}>Awaiting Approval</div><div style={s.cardNum}>{pending}</div></div>
          <div style={s.card}><div style={s.cardLabel}>Approved / In Progress</div><div style={s.cardNum}>{approved}</div></div>
          <div style={s.card}><div style={s.cardLabel}>Total Estimated Budget</div><div style={s.cardNum}>{money(totalEstimate)}</div></div>
        </div>

        <section style={s.panel}>
          <div style={s.toolbar}>
            <input
              style={s.input}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Travel ID, employee, department, city..."
            />
            <select style={{ ...s.input, flex: "0 0 220px" }} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All Statuses</option>
              {STATUSES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>

          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            Showing {list.length} of {trips.length} requests
          </div>

          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Travel ID", "Employee", "Category", "Department", "Route", "Departure", "Return", "Hotel", "Estimate", "Approving Manager", "Status", "Requested On"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td style={{ ...s.td, fontWeight: 700, whiteSpace: "nowrap" }}>{t.id}</td>
                    <td style={s.td}>
                      {t.employee}
                      {t.empid && <div style={s.sub}>{t.empid}</div>}
                    </td>
                    <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                      {t.category || "—"}
                      {t.designation && <div style={s.sub}>{t.designation}</div>}
                    </td>
                    <td style={s.td}>{t.dept}</td>
                    <td style={s.td}>
                      {t.from} → {t.to}
                      <div style={s.sub}>{t.outMode}</div>
                      {t.journeyType && (
                        <div style={s.sub}>
                          {t.journeyType}
                          {t.journeyType === "Unplanned" && t.unplannedApproved && ` · Approved: ${t.unplannedApproved}`}
                        </div>
                      )}
                    </td>
                    <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                      {fmtDate(t.outDate)}
                      {t.outTime && <div style={s.sub}>{t.outTime}</div>}
                    </td>
                    <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                      {t.returnRequired === "Yes" ? (
                        <>
                          {fmtDate(t.returnDate)}
                          <div style={s.sub}>{t.returnMode}</div>
                        </>
                      ) : (
                        <span style={s.sub}>Not required</span>
                      )}
                    </td>
                    <td style={s.td}>
                      {t.hotel === "Yes" ? (
                        <>
                          {t.hotelAddress || "—"}
                          <div style={s.sub}>
                            {fmtDate(t.checkin)} – {fmtDate(t.checkout)}
                          </div>
                        </>
                      ) : (
                        <span style={s.sub}>Not required</span>
                      )}
                    </td>
                    <td style={{ ...s.td, whiteSpace: "nowrap" }}>{money(t.estimate)}</td>
                    <td style={s.td}>{t.manager || "—"}</td>
                    <td style={s.td}><StatusBadge status={t.status} /></td>
                    <td style={{ ...s.td, whiteSpace: "nowrap" }}>{fmtDate(t.requestDate || t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && (
              <div style={s.empty}>
                {trips.length ? "No requests match the filters." : "No travel requests yet. Click “New Travel Request” to raise one."}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
