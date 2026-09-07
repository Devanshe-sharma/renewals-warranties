import React, { useContext, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/navbar";
import Modal from "../../components/Modal";
import RaiseTicketForm from "./RaiseTicketForm";
import { UserContext } from "../../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const PENDING_STATUSES = ["Open", "In Progress"];
const SOLVED_STATUSES = ["Resolved", "Closed"];

const STATUS_COLORS = {
  Open: { bg: "#DBEAFE", color: "#1E40AF" },
  "In Progress": { bg: "#FEF3C7", color: "#92400E" },
  Resolved: { bg: "#D1FAE5", color: "#065F46" },
  Closed: { bg: "#E5E7EB", color: "#374151" },
};

const PRIORITY_COLORS = {
  Low: { bg: "#E5E7EB", color: "#374151" },
  Medium: { bg: "#DBEAFE", color: "#1E40AF" },
  High: { bg: "#FFEDD5", color: "#9A3412" },
  Urgent: { bg: "#FEE2E2", color: "#DC2626" },
};

export default function TicketsPage({ mineOnly = false }) {
  const { user, token } = useContext(UserContext);
  const isAdmin = user.role === "admin";

  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [statusGroup, setStatusGroup] = useState(""); // "", "pending", "solved"
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [drafts, setDrafts] = useState({});
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tickets${mineOnly ? "?mine=true" : ""}`, {
        headers: authHeaders,
      });
      const data = await res.json();

      if (data.success) {
        setTickets(data.data);
        const nextDrafts = {};
        data.data.forEach((t) => {
          nextDrafts[t._id] = {
            status: t.status,
            priority: t.priority,
            done_date: t.done_date ? t.done_date.split("T")[0] : "",
          };
        });
        setDrafts(nextDrafts);
      }
    } catch (err) {
      console.error("Fetch tickets error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => ({
    total: tickets.length,
    pending: tickets.filter((t) => PENDING_STATUSES.includes(t.status)).length,
    solved: tickets.filter((t) => SOLVED_STATUSES.includes(t.status)).length,
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusGroup === "pending" && !PENDING_STATUSES.includes(t.status)) return false;
      if (statusGroup === "solved" && !SOLVED_STATUSES.includes(t.status)) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (dateFrom && new Date(t.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(t.createdAt) > to) return false;
      }
      return true;
    });
  }, [tickets, statusGroup, priorityFilter, dateFrom, dateTo]);

  const selectedTicket = tickets.find((t) => t._id === selectedId) || null;

  const hasFilters = statusGroup || priorityFilter || dateFrom || dateTo;
  const clearFilters = () => {
    setStatusGroup("");
    setPriorityFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const setDraft = (ticketId, key, value) => {
    setDrafts((d) => ({ ...d, [ticketId]: { ...d[ticketId], [key]: value } }));
  };

  const handleManageSave = async (ticket) => {
    const draft = drafts[ticket._id];

    try {
      const res = await fetch(`${API}/api/tickets/${ticket._id}/manage`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          status: draft.status,
          priority: draft.priority,
          done_date: draft.done_date || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        fetchTickets();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (ticketId) => {
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`${API}/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ message: commentText.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setCommentText("");
        fetchTickets();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        title={mineOnly ? "My Tickets" : "Tickets"}
        subtitle={mineOnly ? "Tickets you've raised" : (isAdmin ? "Manage all raised tickets" : "Your raised tickets")}
        breadcrumb={[{ label: mineOnly ? "My Tickets" : "Tickets" }]}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button style={addBtn} onClick={() => setRaiseOpen(true)}>
            Raise Ticket
          </button>
        </div>

        {/* ── Filter cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
          <StatCard
            label="Total"
            value={counts.total}
            accent="#1976d2"
            active={statusGroup === ""}
            onClick={() => setStatusGroup("")}
          />
          <StatCard
            label="Pending"
            value={counts.pending}
            accent="#F59E0B"
            active={statusGroup === "pending"}
            onClick={() => setStatusGroup(statusGroup === "pending" ? "" : "pending")}
          />
          <StatCard
            label="Solved"
            value={counts.solved}
            accent="#10B981"
            active={statusGroup === "solved"}
            onClick={() => setStatusGroup(statusGroup === "solved" ? "" : "solved")}
          />
        </div>

        {/* ── Filters ── */}
        <div style={filterBar}>
          <div>
            <label style={labelStyle}>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={filterSelectStyle}>
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button style={clearBtn} onClick={clearFilters}>Clear Filters</button>
          )}
        </div>

        {loading && <div style={{ color: "#6B7280", marginBottom: 10 }}>Loading...</div>}

        {/* ── Table ── */}
        <div style={tableWrap}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <TH />
                  <TH>Ticket ID</TH>
                  <TH>Title</TH>
                  {!mineOnly && <TH>Raised By</TH>}
                  <TH>Priority</TH>
                  <TH>Status</TH>
                  <TH>Raised On</TH>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => setSelectedId(ticket._id)}
                    style={row}
                  >
                    <td style={{ ...cell, width: 24 }}>▶</td>
                    <td style={{ ...cell, fontWeight: 700, color: "#1976d2" }}>{ticket.ticket_id}</td>
                    <td style={cell}>{ticket.title}</td>
                    {!mineOnly && <td style={cell}>{ticket.raised_by_name}</td>}
                    <td style={cell}>
                      <span style={{ ...badge, ...(PRIORITY_COLORS[ticket.priority] || {}) }}>{ticket.priority}</span>
                    </td>
                    <td style={cell}>
                      <span style={{ ...badge, ...(STATUS_COLORS[ticket.status] || {}) }}>{ticket.status}</span>
                    </td>
                    <td style={cell}>{new Date(ticket.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && filteredTickets.length === 0 && (
            <div style={{ color: "#6B7280", textAlign: "center", padding: 40 }}>
              No tickets found.
            </div>
          )}
        </div>
      </div>

      <Modal open={!!selectedTicket} onClose={() => setSelectedId(null)} maxWidth={900}>
        {selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            draft={drafts[selectedTicket._id] || {}}
            isAdmin={isAdmin}
            canComment={isAdmin || selectedTicket.raised_by_id === user.id}
            commentText={commentText}
            setCommentText={setCommentText}
            setDraft={setDraft}
            onSaveManage={() => handleManageSave(selectedTicket)}
            onAddComment={() => handleAddComment(selectedTicket._id)}
          />
        )}
      </Modal>

      <Modal open={raiseOpen} onClose={() => setRaiseOpen(false)} maxWidth={720}>
        <RaiseTicketForm
          onSave={() => { setRaiseOpen(false); fetchTickets(); }}
          onCancel={() => setRaiseOpen(false)}
        />
      </Modal>
    </div>
  );
}

function TicketDetail({ ticket, draft, isAdmin, canComment, commentText, setCommentText, setDraft, onSaveManage, onAddComment }) {
  return (
    <div style={body}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span style={ticketIdStyle}>{ticket.ticket_id}</span>
        <span style={{ ...badge, ...(PRIORITY_COLORS[ticket.priority] || {}) }}>{ticket.priority}</span>
        <span style={{ ...badge, ...(STATUS_COLORS[ticket.status] || {}) }}>{ticket.status}</span>
      </div>
      <h3 style={{ margin: "4px 0 12px" }}>{ticket.title}</h3>
      <p style={{ margin: "0 0 12px", color: "#374151" }}>{ticket.description}</p>

      <div style={metaRow}>
        <span><b>Raised By:</b> {ticket.raised_by_name}</span>
        <span><b>Assigned To:</b> {ticket.assigned_to_name || "Unassigned"}</span>
        {ticket.plan_date && (
          <span><b>Plan Date:</b> {new Date(ticket.plan_date).toLocaleDateString("en-IN")}</span>
        )}
        {ticket.done_date && (
          <span><b>Done Date:</b> {new Date(ticket.done_date).toLocaleDateString("en-IN")}</span>
        )}
        {(ticket.attachment_link || ticket.attachment_file_url) && (
          <span>
            <b>Attachment:</b>{" "}
            <a
              href={ticket.attachment_link || `${API}${ticket.attachment_file_url}`}
              target="_blank"
              rel="noreferrer"
            >
              View
            </a>
          </span>
        )}
      </div>

      {isAdmin && (
        <div style={manageRow}>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={draft.status || ""}
              onChange={(e) => setDraft(ticket._id, "status", e.target.value)}
              style={inputStyle}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Priority</label>
            <select
              value={draft.priority || ""}
              onChange={(e) => setDraft(ticket._id, "priority", e.target.value)}
              style={inputStyle}
            >
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Done Date</label>
            <input
              type="date"
              value={draft.done_date || ""}
              onChange={(e) => setDraft(ticket._id, "done_date", e.target.value)}
              style={inputStyle}
            />
          </div>

          <button style={saveBtn} onClick={onSaveManage}>
            Save
          </button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={labelStyle}>Activity</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
          {(ticket.activity || []).map((a, i) => (
            <div key={i} style={activityRow}>
              <b>{a.author_name}</b>: {a.message}
              <span style={activityTime}>
                {new Date(a.created_at).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>

        {canComment && (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button style={saveBtn} onClick={onAddComment}>
              Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: active ? `${accent}14` : "#fff",
        borderRadius: 12,
        padding: "16px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        borderLeft: `3px solid ${accent}`,
        outline: active ? `1.5px solid ${accent}` : "none",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, color: "#111", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 6 }}>{label}</div>
    </div>
  );
}

function TH({ children }) {
  return (
    <th style={{ padding: "11px 16px", fontSize: 11, fontWeight: 700, color: "#6B7280", textAlign: "left", letterSpacing: 0.6, textTransform: "uppercase", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" }}>
      {children}
    </th>
  );
}

const tableWrap = {
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  overflow: "hidden",
};

const row = {
  cursor: "pointer",
  borderBottom: "1px solid #F3F4F6",
};

const cell = {
  padding: "13px 16px",
  fontSize: 13,
  color: "#374151",
};

const body = {
  padding: 16,
  background: "#FAFBFC",
};

const ticketIdStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: "#1976d2",
};

const badge = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const metaRow = {
  display: "flex",
  gap: 24,
  fontSize: 13,
  color: "#4B5563",
  flexWrap: "wrap",
  marginBottom: 12,
};

const manageRow = {
  display: "flex",
  gap: 14,
  alignItems: "flex-end",
  flexWrap: "wrap",
  padding: 12,
  background: "#F9FAFB",
  borderRadius: 8,
  marginBottom: 4,
};

const filterBar = {
  background: "#fff",
  borderRadius: 12,
  padding: "14px 18px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  marginBottom: 16,
  display: "flex",
  gap: 16,
  alignItems: "flex-end",
  flexWrap: "wrap",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: "#374151",
  display: "block",
  marginBottom: 4,
};

const inputStyle = {
  padding: "8px 10px",
  border: "1px solid #D1D5DB",
  borderRadius: 6,
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
};

const filterSelectStyle = {
  ...inputStyle,
  minWidth: 160,
};

const addBtn = {
  padding: "10px 18px",
  border: "none",
  borderRadius: 8,
  background: "#1976d2",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const clearBtn = {
  padding: "8px 16px",
  border: "1px solid #E5E7EB",
  borderRadius: 6,
  background: "#fff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
  height: 34,
};

const saveBtn = {
  padding: "8px 16px",
  border: "none",
  borderRadius: 6,
  background: "#1976d2",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
  height: 34,
};

const activityRow = {
  fontSize: 13,
  color: "#374151",
  background: "#F9FAFB",
  borderRadius: 6,
  padding: "8px 10px",
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
};

const activityTime = {
  fontSize: 11,
  color: "#9CA3AF",
  whiteSpace: "nowrap",
};
