import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar, { NavbarButton } from "../../components/navbar";
import Modal from "../../components/Modal";
import { UserContext } from "../../context/UserContext";
import { travelApi, errorMessage, fmtDate, fmtDateTime } from "./travelStore";

const STATUSES = ["Pending Manager Approval", "Rejected by Manager", "Pending Admin Booking", "Booked", "Cancelled by Admin"];

const money = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

const STATUS_COLORS = {
  good: { background: "#DCFCE7", color: "#166534" },
  bad: { background: "#FEE2E2", color: "#991B1B" },
  pending: { background: "#FEF3C7", color: "#92400E" },
  info: { background: "#DBEAFE", color: "#1E40AF" },
};
const statusKind = (s) =>
  s === "Booked" ? "good" : s?.startsWith("Rejected") || s?.startsWith("Cancelled") ? "bad" : s === "Pending Manager Approval" ? "pending" : "info";

function Badge({ children, kind }) {
  return (
    <span style={{ ...STATUS_COLORS[kind], display: "inline-block", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

const Score = ({ value }) =>
  value < 0 ? <b style={{ color: "#b91c1c" }}>{value}</b> : <span style={{ color: "#6b7280" }}>0</span>;

const s = {
  page: { maxWidth: 1400, margin: "0 auto", padding: 20 },
  tabs: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, borderBottom: "1px solid #e5e7eb" },
  tab: (active) => ({
    border: 0, background: "none", padding: "10px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
    color: active ? "#1976d2" : "#4b5563", borderBottom: `2px solid ${active ? "#1976d2" : "transparent"}`, marginBottom: -1,
  }),
  count: { marginLeft: 6, background: "#ef4444", color: "#fff", borderRadius: 99, padding: "1px 7px", fontSize: 11 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" },
  cardLabel: { fontSize: 12, color: "#6b7280" },
  cardNum: { fontSize: 24, fontWeight: 800, marginTop: 4, color: "#111827" },
  panel: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" },
  toolbar: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  input: { flex: 1, minWidth: 200, border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 11px", fontSize: 14, fontFamily: "inherit", background: "#fff", outline: "none", width: "100%" },
  tableWrap: { overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 10 },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 1300 },
  th: { textAlign: "left", padding: "10px 12px", background: "#f9fafb", color: "#4b5563", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" },
  td: { padding: "10px 12px", fontSize: 13, color: "#1f2937", borderBottom: "1px solid #f3f4f6", verticalAlign: "top" },
  sub: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  empty: { padding: 32, textAlign: "center", color: "#6b7280" },
  error: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 13 },
  btn: (bg, color = "#fff") => ({ background: bg, color, border: 0, borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }),
  label: { fontSize: 12, fontWeight: 700, color: "#374151", display: "block", margin: "12px 0 5px" },
};

const TAB_LABELS = {
  mine: "My Requests",
  approvals: "Pending My Approval",
  admin: "Admin Booking Queue",
  all: "All Requests",
  scores: "Scores",
};

export default function TravelManagementPage({ onNew }) {
  const { token } = useContext(UserContext);
  const [params, setParams] = useSearchParams();
  const tab = TAB_LABELS[params.get("tab")] ? params.get("tab") : "mine";
  const setTab = (t) => setParams({ tab: t });

  const [rows, setRows] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All Statuses");
  const [pendingCounts, setPendingCounts] = useState({ approvals: 0, admin: 0 });
  const [scores, setScores] = useState(null);
  const [action, setAction] = useState(null); // { kind: 'manager'|'admin', trip }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (tab === "scores") {
      const r = await travelApi(token, "/scores");
      if (r.ok) setScores(r.data.data);
      else setError(errorMessage(r, "Could not load scores"));
    } else {
      const r = await travelApi(token, `/requests?tab=${tab}`);
      if (r.ok) {
        setRows(r.data.data);
        setIsAdmin(r.data.isAdmin);
      } else setError(errorMessage(r, "Could not load travel requests"));
    }
    // Badge counts for the action tabs.
    const [a, b] = await Promise.all([travelApi(token, "/requests?tab=approvals"), travelApi(token, "/requests?tab=admin")]);
    if (a.ok) setIsAdmin(a.data.isAdmin);
    setPendingCounts({
      approvals: a.ok ? a.data.data.filter((t) => t.status === "Pending Manager Approval").length : 0,
      admin: b.ok ? b.data.data.filter((t) => t.status === "Pending Admin Booking").length : 0,
    });
    setLoading(false);
  }, [tab, token]);

  useEffect(() => { load(); }, [load]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (t) =>
        (status === "All Statuses" || t.status === status) &&
        (!q || [t.travel_id, t.employee, t.empid, t.dept, t.from, t.to, t.manager, t.eventName].join(" ").toLowerCase().includes(q))
    );
  }, [rows, search, status]);

  const pendingMgr = rows.filter((t) => t.status === "Pending Manager Approval").length;
  const pendingAdm = rows.filter((t) => t.status === "Pending Admin Booking").length;
  const overdueAdm = rows.filter((t) => t.status === "Pending Admin Booking" && t.adminDelayDays > 0).length;
  const totalEstimate = rows.reduce((a, t) => a + (+t.estimate || 0), 0);

  const visibleTabs = ["mine", "approvals", ...(isAdmin ? ["admin", "all"] : []), "scores"];

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        title="Travel Management"
        subtitle="Travel requests, approvals and bookings"
        breadcrumb={[{ label: "Travel Management" }]}
        actions={<NavbarButton onClick={onNew} icon="+" label="New Travel Request" />}
      />

      <div style={s.page}>
        <div style={s.tabs}>
          {visibleTabs.map((t) => (
            <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
              {t === "approvals" && pendingCounts.approvals > 0 && <span style={s.count}>{pendingCounts.approvals}</span>}
              {t === "admin" && pendingCounts.admin > 0 && <span style={s.count}>{pendingCounts.admin}</span>}
            </button>
          ))}
        </div>

        {error && <div style={s.error}>{error}</div>}

        {tab === "scores" ? (
          <ScoresView scores={scores} loading={loading} />
        ) : (
          <>
            <div style={s.cards}>
              <div style={s.card}><div style={s.cardLabel}>Requests</div><div style={s.cardNum}>{rows.length}</div></div>
              <div style={s.card}><div style={s.cardLabel}>Awaiting Manager</div><div style={s.cardNum}>{pendingMgr}</div></div>
              <div style={s.card}><div style={s.cardLabel}>Awaiting Admin Booking</div><div style={s.cardNum}>{pendingAdm}</div></div>
              <div style={s.card}><div style={s.cardLabel}>Booking Overdue</div><div style={{ ...s.cardNum, color: overdueAdm ? "#b91c1c" : "#111827" }}>{overdueAdm}</div></div>
              <div style={s.card}><div style={s.cardLabel}>Total Estimated Budget</div><div style={s.cardNum}>{money(totalEstimate)}</div></div>
            </div>

            <section style={s.panel}>
              <div style={s.toolbar}>
                <input style={{ ...s.input, width: "auto" }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Travel ID, employee, department, city, event..." />
                <select style={{ ...s.input, flex: "0 0 240px", width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>All Statuses</option>
                  {STATUSES.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>

              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                {loading ? "Loading..." : `Showing ${list.length} of ${rows.length} requests`}
              </div>

              <div style={s.tableWrap}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Travel ID", "Employee", "Category", "Department", "Route", "Departure", "Return", "Hotel", "Estimate", "Event → Request", "Approving Manager", "Status", "Admin Booking", "Requested On", "Action"].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t) => (
                      <tr key={t._id}>
                        <td style={{ ...s.td, fontWeight: 700, whiteSpace: "nowrap" }}>{t.travel_id}</td>
                        <td style={s.td}>{t.employee}{t.empid && <div style={s.sub}>{t.empid}</div>}</td>
                        <td style={{ ...s.td, whiteSpace: "nowrap" }}>{t.category || "—"}{t.designation && <div style={s.sub}>{t.designation}</div>}</td>
                        <td style={s.td}>{t.dept}</td>
                        <td style={s.td}>{t.from} → {t.to}</td>
                        <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                          {fmtDate(t.outDate)}
                          {t.outTime && <div style={s.sub}>{t.outTime}</div>}
                          {t.bookingType === "Tatkal" && <div style={s.sub}>Tatkal</div>}
                        </td>
                        <td style={{ ...s.td, whiteSpace: "nowrap" }}>
                          {t.returnRequired === "Yes" ? <>{fmtDate(t.returnDate)}<div style={s.sub}>{t.returnMode}</div></> : <span style={s.sub}>Not required</span>}
                        </td>
                        <td style={s.td}>
                          {t.hotel === "Yes" ? <>{t.hotelAddress || "—"}<div style={s.sub}>{fmtDate(t.checkin)} – {fmtDate(t.checkout)}</div></> : <span style={s.sub}>Not required</span>}
                        </td>
                        <td style={{ ...s.td, whiteSpace: "nowrap" }}>{money(t.estimate)}</td>
                        <td style={s.td}>
                          {t.eventName ? (
                            <>
                              <div style={{ whiteSpace: "nowrap" }}>{t.eventLagDays === 0 ? "Same day" : `${t.eventLagDays} day(s)`}</div>
                              <div style={s.sub}>{t.eventName}</div>
                              <div style={s.sub}>Score: <Score value={t.employeeScore} /></div>
                            </>
                          ) : <span style={s.sub}>No event</span>}
                        </td>
                        <td style={s.td}>
                          {t.manager || "—"}
                          {t.managerActionAt && <div style={s.sub}>{t.status === "Rejected by Manager" ? "Rejected" : "Approved"} {fmtDateTime(t.managerActionAt)}</div>}
                          {t.managerRemarks && <div style={s.sub}>“{t.managerRemarks}”</div>}
                          {t.managerEscalatedAt && <div style={{ ...s.sub, color: "#b91c1c" }}>Escalated</div>}
                        </td>
                        <td style={s.td}><Badge kind={statusKind(t.status)}>{t.status}</Badge></td>
                        <td style={s.td}>
                          {t.adminDueAt ? (
                            <>
                              <div style={{ whiteSpace: "nowrap" }}>Due {fmtDateTime(t.adminDueAt)}</div>
                              {t.adminActionAt && <div style={s.sub}>{t.status === "Booked" ? "Booked" : "Closed"} {fmtDateTime(t.adminActionAt)}</div>}
                              {t.adminDelayDays > 0 && <div style={{ ...s.sub, color: "#b91c1c" }}>{t.adminDelayDays} day(s) late · score {t.adminScore}</div>}
                              {t.adminEscalatedAt && <div style={{ ...s.sub, color: "#b91c1c" }}>Escalated</div>}
                              {t.bookingDetails && <div style={s.sub}>{t.bookingDetails}</div>}
                            </>
                          ) : <span style={s.sub}>—</span>}
                        </td>
                        <td style={{ ...s.td, whiteSpace: "nowrap" }}>{fmtDate(t.createdAt)}</td>
                        <td style={s.td}>
                          {t.status === "Pending Manager Approval" && tab === "approvals" && (
                            <button style={s.btn("#1976d2")} onClick={() => setAction({ kind: "manager", trip: t })}>Approve / Reject</button>
                          )}
                          {t.status === "Pending Admin Booking" && isAdmin && tab !== "mine" && (
                            <button style={s.btn("#16a34a")} onClick={() => setAction({ kind: "admin", trip: t })}>Book / Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!loading && !list.length && (
                  <div style={s.empty}>
                    {rows.length
                      ? "No requests match the filters."
                      : tab === "approvals"
                        ? "Nothing waiting for your approval."
                        : tab === "mine"
                          ? "No travel requests yet. Click “New Travel Request” to raise one."
                          : "No requests here yet."}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>

      {action && (
        <ActionModal
          action={action}
          token={token}
          onClose={() => setAction(null)}
          onDone={() => { setAction(null); load(); }}
        />
      )}
    </div>
  );
}

function ActionModal({ action, token, onClose, onDone }) {
  const { kind, trip: t } = action;
  const [remarks, setRemarks] = useState("");
  const [bookingDetails, setBookingDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (choice) => {
    setBusy(true);
    setError("");
    const r =
      kind === "manager"
        ? await travelApi(token, `/requests/${t._id}/manager-decision`, { method: "POST", body: { decision: choice, remarks } })
        : await travelApi(token, `/requests/${t._id}/admin-action`, { method: "POST", body: { action: choice, bookingDetails, remarks } });
    setBusy(false);
    if (r.ok) onDone();
    else setError(errorMessage(r, "Could not save"));
  };

  return (
    <Modal open onClose={onClose} maxWidth={560}>
      <div style={{ padding: 24 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>{kind === "manager" ? "Approve or Reject" : "Book or Cancel"} · {t.travel_id}</h3>
        <div style={{ fontSize: 13, color: "#4b5563" }}>
          {t.employee} · {t.from} → {t.to} · {fmtDate(t.outDate)} {t.outTime && `(${t.outTime})`} · {money(t.estimate)}
        </div>
        {t.eventName && (
          <div style={{ marginTop: 10, fontSize: 13, background: t.employeeScore < 0 ? "#fef2f2" : "#eff6ff", borderRadius: 8, padding: "8px 12px" }}>
            Event “{t.eventName}” created {fmtDateTime(t.eventCreatedAt)} · request raised {fmtDateTime(t.createdAt)} ·{" "}
            <b>{t.eventLagDays === 0 ? "same day" : `${t.eventLagDays} day(s) later`}</b> · late score <b>{t.employeeScore || 0}</b>
          </div>
        )}
        {kind === "admin" && t.adminDueAt && (
          <div style={{ marginTop: 10, fontSize: 13, background: t.adminDelayDays > 0 ? "#fef2f2" : "#f0fdf4", borderRadius: 8, padding: "8px 12px" }}>
            Booking due by <b>{fmtDateTime(t.adminDueAt)}</b>
            {t.adminDelayDays > 0 && <> — <b>{t.adminDelayDays} day(s) late</b>, admin score {t.adminScore}</>}
          </div>
        )}

        {kind === "admin" && (
          <>
            <label style={s.label}>Booking details (PNR / ticket / hotel confirmation) — required to book</label>
            <textarea style={{ ...s.input, minHeight: 80 }} value={bookingDetails} onChange={(e) => setBookingDetails(e.target.value)} />
          </>
        )}
        <label style={s.label}>Remarks {kind === "manager" ? "(required to reject)" : "(required to cancel)"}</label>
        <textarea style={{ ...s.input, minHeight: 70 }} value={remarks} onChange={(e) => setRemarks(e.target.value)} />

        {error && <div style={{ ...s.error, marginTop: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          {kind === "manager" ? (
            <>
              <button disabled={busy} style={s.btn("#dc2626")} onClick={() => submit("reject")}>Reject</button>
              <button disabled={busy} style={s.btn("#16a34a")} onClick={() => submit("approve")}>Approve → send to Admin</button>
            </>
          ) : (
            <>
              <button disabled={busy} style={s.btn("#dc2626")} onClick={() => submit("cancelled")}>Cancel Request</button>
              <button disabled={busy} style={s.btn("#16a34a")} onClick={() => submit("booked")}>Mark Booked</button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ScoresView({ scores, loading }) {
  if (loading && !scores) return <div style={s.empty}>Loading...</div>;
  if (!scores) return null;
  const table = (title, note, rows, cols) => (
    <section style={{ ...s.panel, marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 4px" }}>{title}</h3>
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>{note}</div>
      <div style={s.tableWrap}>
        <table style={{ ...s.table, minWidth: 600 }}>
          <thead><tr>{cols.map(([h]) => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.email || r.name}>{cols.map(([h, f]) => <td key={h} style={s.td}>{f(r)}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div style={s.empty}>No scores yet.</div>}
      </div>
    </section>
  );
  return (
    <>
      {table(
        "Employee — late travel requests",
        "−1 point for each day a travel request is raised after its event was created, beyond a 2-day grace period.",
        scores.employees,
        [["Employee", (r) => <>{r.name}<div style={s.sub}>{r.email}</div></>], ["Requests", (r) => r.requests], ["Late Requests", (r) => r.lateRequests], ["Score", (r) => <Score value={r.score} />]]
      )}
      {table(
        "Admin — late bookings",
        "−1 point for each day tickets are arranged after the 2-day booking window (counted live while still pending).",
        scores.admins,
        [["Admin", (r) => <>{r.name}<div style={s.sub}>{r.email}</div></>], ["Handled", (r) => r.handled], ["Late", (r) => r.late], ["Score", (r) => <Score value={r.score} />]]
      )}
    </>
  );
}
