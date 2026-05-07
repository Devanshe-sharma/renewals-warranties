import React, { useState, useEffect, useCallback } from "react";
import Navbar, { NavbarButton } from "../components/navbar";

const API  = process.env.REACT_APP_API_URL;
const LIME = "#1976d2";

const DEFAULT_STATUS_RULES = {
  color_done: "#D1FAE5",
  color_done_delayed: "#FEF9C3",
  color_overdue: "#FEE2E2",
  color_not_yet_due: "#F9FAFB",
  text_done: "#065F46",
  text_done_delayed: "#854D0E",
  text_overdue: "#991B1B",
  text_not_yet_due: "#6B7280",
};

const STATUS_META = {
  done:         { label: "Done",         colorKey: "color_done",         textKey: "text_done" },
  done_delayed: { label: "Done Delayed", colorKey: "color_done_delayed", textKey: "text_done_delayed" },
  overdue:      { label: "Overdue",      colorKey: "color_overdue",      textKey: "text_overdue" },
  not_yet_due:  { label: "Not Yet Due",  colorKey: "color_not_yet_due",  textKey: "text_not_yet_due" },
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const fmtCurrency = (n) =>
  n != null && n !== "" ? `₹ ${Number(n).toLocaleString("en-IN")}` : "—";

const DECISION_META = {
  Yes: { bg: "#DCFCE7", text: "#166534", dot: "#22C55E", label: "Renewed" },
  No:  { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", label: "Closed"  },
};

function DecisionBadge({ value }) {
  const m = DECISION_META[value] || { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF", label: value || "—" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: m.bg, color: m.text, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function computeEventStatus(event) {
  if (event.renewal_required === "Yes") {
    const renewedOn = event.new_renewal_date || event.createdAt;
    const deadline = event.prev_expiry_date;

    if (renewedOn && deadline) {
      const renewedDate = new Date(renewedOn);
      const deadlineDate = new Date(deadline);
      renewedDate.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);
      return renewedDate > deadlineDate ? "done_delayed" : "done";
    }

    return "done";
  }

  if (event.renewal_required === "No") return "overdue";

  return "not_yet_due";
}

function StatusRuleBadge({ event, rules }) {
  const status = computeEventStatus(event);
  const meta = STATUS_META[status] || STATUS_META.not_yet_due;
  const bg = rules?.[meta.colorKey] || DEFAULT_STATUS_RULES[meta.colorKey];
  const text = rules?.[meta.textKey] || DEFAULT_STATUS_RULES[meta.textKey];

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color: text, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: text, flexShrink: 0 }} />
      {meta.label}
    </span>
  );
}

function TH({ children }) {
  return (
    <th style={{ padding: "11px 16px", fontSize: 11, fontWeight: 700, color: "#6B7280", textAlign: "left", letterSpacing: 0.6, textTransform: "uppercase", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

function StatsCard({ label, value, accent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: `3px solid ${accent || LIME}` }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#111", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Map archived renewal DB → frontend ───────────────────
const mapArchived = (r) => ({
  id:          r.item_id,
  itemName:    r.item_name     || "",
  category:    r.category      || "",
  subcategory: r.subcategory   || "",
  vendor:      r.vendor        || "",
  empName:     r.emp_name      || "",
  department:  r.department    || "",
  startDate:   r.start_date    ? r.start_date.split("T")[0]  : "",
  endDate:     r.end_date      ? r.end_date.split("T")[0]    : "",
  frequency:   r.frequency     || "",
  closedAt:    r.closed_at     || null,
  remarks:     r.remarks       || "",
});

// ── Event detail side drawer ──────────────────────────────
function EventDrawer({ event, onClose, statusRules }) {
  if (!event) return null;

  const Row = ({ label, value }) => (
    <div style={{ display: "flex", padding: "9px 0", borderBottom: "1px solid #F9FAFB" }}>
      <span style={{ width: 180, fontSize: 12, color: "#9CA3AF", fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111", fontWeight: 500, wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, background: "#fff", height: "100%", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: LIME, padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>{event.event_id}</div>
            <div style={{ fontSize: 12, color: "#333", marginTop: 2 }}>{event.item_name}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.1)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: 22, flex: 1 }}>
          <DrawerSection title="Item Information">
            <Row label="Event ID"         value={event.event_id} />
            <Row label="Item ID"          value={event.item_id} />
            <Row label="Item Name"        value={event.item_name} />
            <Row label="Category"         value={event.category} />
            <Row label="Sub-Category"     value={event.subcategory} />
            <Row label="Renewal Required" value={<DecisionBadge value={event.renewal_required} />} />
            <Row label="Status"           value={<StatusRuleBadge event={event} rules={statusRules} />} />
          </DrawerSection>

          <DrawerSection title="Dates" style={{ marginTop: 16 }}>
            <Row label="Prev Start Date"  value={fmtDate(event.prev_start_date)} />
            <Row label="Prev Expiry Date" value={fmtDate(event.prev_expiry_date)} />
            <Row label="New Renewal Date" value={fmtDate(event.new_renewal_date)} />
            <Row label="Frequency"        value={event.frequency} />
            <Row label="New Expiry Date"  value={fmtDate(event.new_expiry_date)} />
            <Row label="Next Due Date"    value={fmtDate(event.next_due_date)} />
          </DrawerSection>

          {event.renewal_required === "Yes" && (
            <DrawerSection title="Payment Details" style={{ marginTop: 16 }}>
              <Row label="Amount"        value={fmtCurrency(event.renewal_amount)} />
              <Row label="Payment Mode"  value={event.payment_mode} />
              <Row label="Card Holder"   value={event.card_holder} />
              <Row label="Invoice / Ref" value={event.invoice_ref} />
              <Row label="Renewed By"    value={event.renewed_by} />
              <Row label="Proof Link"    value={event.proof_link
                ? <a href={event.proof_link} target="_blank" rel="noreferrer" style={{ color: "#059669" }}>{event.proof_link}</a>
                : "—"} />
            </DrawerSection>
          )}

          <DrawerSection title="Additional" style={{ marginTop: 16 }}>
            <Row label="Remarks"    value={event.remarks} />
            <Row label="Email Sent" value={event.email_sent} />
            {event.category === "Warranty" && (
              <>
                <Row label="User"            value={event.user_person} />
                <Row label="User Department" value={event.user_department} />
              </>
            )}
            <Row label="Recorded On" value={event.createdAt ? fmtDate(event.createdAt) : "—"} />
          </DrawerSection>
        </div>
      </div>
    </div>
  );
}

function DrawerSection({ title, children, style: s }) {
  return (
    <div style={{ border: "1px solid #F3F4F6", borderRadius: 10, overflow: "hidden", ...s }}>
      <div style={{ background: "#F9FAFB", padding: "8px 14px", fontSize: 11, fontWeight: 700, color: "#374151", letterSpacing: 0.5, textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>{title}</div>
      <div style={{ padding: "4px 14px" }}>{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// RENEWAL EVENTS PAGE
// ────────────────────────────────────────────────────────
export default function RenewalEventsPage({ onRecord, onBack }) {
  const [events,     setEvents]     = useState([]);
  const [archived,   setArchived]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [archLoad,   setArchLoad]   = useState(true);
  const [tab,        setTab]        = useState("events");
  const [search,     setSearch]     = useState("");
  const [statusF,   setStatusF]   = useState("all");
  const [catF,       setCatF]       = useState("all");
  const [selected,   setSelected]   = useState(null);
  const [statusRules, setStatusRules] = useState(DEFAULT_STATUS_RULES);

  // ── Fetch events ──────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API}/api/renewal-events`);
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch (err) {
      console.error("Failed to fetch renewal events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch archived renewals ───────────────────────────
  const fetchArchived = useCallback(async () => {
    try {
      setArchLoad(true);
      const res  = await fetch(`${API}/api/renewals/archived/list`);
      const data = await res.json();
      if (data.success) setArchived(data.data.map(mapArchived));
    } catch (err) {
      console.error("Failed to fetch archived:", err);
    } finally {
      setArchLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchArchived();
  }, [fetchEvents, fetchArchived]);

  useEffect(() => {
    fetch(`${API}/api/status-rules`)
      .then((res) => res.ok ? res.json() : Promise.reject(new Error(`Status rules API returned ${res.status}`)))
      .then((data) => {
        if (data.success) setStatusRules(data.data);
      })
      .catch((err) => console.error("Failed to fetch status rules:", err));
  }, []);

  // ── Stats ─────────────────────────────────────────────
  const totalRenewed = events.filter((e) => e.renewal_required === "Yes").length;
  const totalClosed  = events.filter((e) => e.renewal_required === "No").length;
  const cats = [...new Set(events.map((e) => e.category).filter(Boolean))].sort();

  // ── Filter events ─────────────────────────────────────
  const visibleEvents = events.filter((e) => {
    const q = search.toLowerCase();
    return (
      (!q ||
        (e.item_name  || "").toLowerCase().includes(q) ||
        (e.event_id   || "").toLowerCase().includes(q) ||
        (e.renewed_by || "").toLowerCase().includes(q)) &&
      (statusF === "all" || computeEventStatus(e) === statusF) &&
      (catF   === "all" || e.category === catF)
    );
  });

  // ── Filter archived ───────────────────────────────────
  const visibleArchived = archived.filter((r) => {
    const q = search.toLowerCase();
    return !q ||
      (r.itemName   || "").toLowerCase().includes(q) ||
      (r.id         || "").toLowerCase().includes(q) ||
      (r.department || "").toLowerCase().includes(q);
  });

  // ── Tab switcher ──────────────────────────────────────
  const TabBtn = ({ tKey, label }) => (
    <button
      onClick={() => { setTab(tKey); setSearch(""); setStatusF("all"); setCatF("all"); }}
      style={{
        padding: "12px 20px", border: "none", background: "transparent",
        fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        color: tab === tKey ? "#111" : "#9CA3AF",
        borderBottom: tab === tKey ? `3px solid ${LIME}` : "3px solid transparent",
        marginBottom: "-2px",
      }}
    >
      {label}
    </button>
  );

  if (loading && archLoad) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #E5E7EB", borderTop: `3px solid ${LIME}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#9CA3AF", fontSize: 14 }}>Loading…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 56 }}>
      {/* ── Navbar ── */}
      <Navbar
        title="Renewal Events"
        subtitle="All recorded renewal events across items"
        breadcrumb={[{ label: "Dashboard", onClick: onBack }, { label: "Renewal Events" }]}
        actions={<NavbarButton onClick={onRecord} icon="✏️" label="Update Renewals" />}
      />

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        <StatsCard label="Total Events"  value={events.length}  accent={LIME}     />
        <StatsCard label="Renewed"       value={totalRenewed}   accent="#22C55E"  />
        <StatsCard label="Closed"        value={totalClosed}    accent="#EF4444"  />
        <StatsCard label="Archived Items" value={archived.length} accent="#6366F1" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", marginBottom: 16, borderBottom: "2px solid #F3F4F6" }}>
        <TabBtn tKey="events"  label={`📋 Renewal Events (${events.length})`}   />
        <TabBtn tKey="archive" label={`📦 Archive (${archived.length})`}         />
      </div>

      {/* ── Filters ── */}
      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "events" ? "Search by item name, event ID, renewed by…" : "Search archived renewals…"}
          style={inputStyle}
        />
        {tab === "events" && (
          <>
            <select value={statusF} onChange={(e) => setStatusF(e.target.value)} style={selectStyle}>
              <option value="all">All Status</option>
              <option value="done">Done</option>
              <option value="done_delayed">Done Delayed</option>
              <option value="overdue">Overdue</option>
              <option value="not_yet_due">Not Yet Due</option>
            </select>
            <select value={catF} onChange={(e) => setCatF(e.target.value)} style={selectStyle}>
              <option value="all">All Categories</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}
        {(search || statusF !== "all" || catF !== "all") && (
          <button onClick={() => { setSearch(""); setStatusF("all"); setCatF("all"); }} style={clearBtnStyle}>Clear</button>
        )}
      </div>

      {/* ── Events Table ── */}
      {tab === "events" && (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <TH>Event ID</TH><TH>Item Name</TH><TH>Category</TH>
                  <TH>Prev Expiry</TH><TH>New Renewal Date</TH>
                  <TH>New Expiry</TH><TH>Amount</TH><TH>Renewed By</TH><TH>Status</TH><TH>Recorded On</TH>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((ev) => (
                  <tr key={ev._id} onClick={() => setSelected(ev)}
                    style={{ borderBottom: "1px solid #F9FAFB", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 16px", fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{ev.event_id}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{ev.item_name}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{ev.item_id}</div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>
                      <div>{ev.category}</div>
                      {ev.subcategory && <div style={{ fontSize: 11, color: "#9CA3AF" }}>{ev.subcategory}</div>}
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{fmtDate(ev.prev_expiry_date)}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: ev.new_renewal_date ? "#374151" : "#D1D5DB" }}>{fmtDate(ev.new_renewal_date)}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: ev.new_expiry_date ? "#059669" : "#D1D5DB", fontWeight: ev.new_expiry_date ? 600 : 400 }}>{fmtDate(ev.new_expiry_date)}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>{fmtCurrency(ev.renewal_amount)}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{ev.renewed_by || "—"}</td>
                    <td style={{ padding: "13px 16px" }}><StatusRuleBadge event={ev} rules={statusRules} /></td>
                    <td style={{ padding: "13px 16px", fontSize: 12, color: "#9CA3AF" }}>{fmtDate(ev.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleEvents.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
              {events.length === 0 ? "No renewal events recorded yet" : "No events match your filters"}
            </div>
          )}
          <div style={{ padding: "12px 18px", borderTop: "1px solid #F3F4F6", color: "#9CA3AF", fontSize: 12 }}>
            Showing {visibleEvents.length} of {events.length} events
          </div>
        </div>
      )}

      {/* ── Archive Table ── */}
      {tab === "archive" && (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          {archLoad ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Loading archive...</div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB" }}>
                      <TH>Item ID</TH><TH>Item Name</TH><TH>Category</TH>
                      <TH>Vendor</TH><TH>Department</TH><TH>Frequency</TH>
                      <TH>Last End Date</TH><TH>Closed On</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleArchived.map((r) => (
                      <tr key={r.id}
                        style={{ borderBottom: "1px solid #F9FAFB", transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "13px 16px", fontSize: 12, color: "#9CA3AF", fontFamily: "monospace" }}>{r.id}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{r.itemName}</div>
                          {r.subcategory && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{r.subcategory}</div>}
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.category}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.vendor || "—"}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.department || "—"}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{r.frequency || "—"}</td>
                        <td style={{ padding: "13px 16px", fontSize: 13, color: "#374151" }}>{fmtDate(r.endDate)}</td>
                        <td style={{ padding: "13px 16px" }}>
                          <span style={{ background: "#F3F4F6", color: "#6B7280", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                            📦 {fmtDate(r.closedAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visibleArchived.length === 0 && (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                  No archived renewals yet
                </div>
              )}
              <div style={{ padding: "12px 18px", borderTop: "1px solid #F3F4F6", color: "#9CA3AF", fontSize: 12 }}>
                {archived.length} archived items
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Event detail drawer ── */}
      {selected && (
        <EventDrawer event={selected} statusRules={statusRules} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

const inputStyle    = { flex: 1, minWidth: 220, border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 14px", fontSize: 14, outline: "none", color: "#111", fontFamily: "inherit" };
const selectStyle   = { border: "1.5px solid #E5E7EB", borderRadius: 8, padding: "8px 14px", fontSize: 14, color: "#374151", cursor: "pointer", fontFamily: "inherit", background: "#fff", outline: "none" };
const clearBtnStyle = { border: "none", background: "#F3F4F6", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "#6B7280", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" };
