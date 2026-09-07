import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { UserContext } from "../../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

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

export default function TicketsPage({ onRaiseTicket }) {
  const { user, token } = useContext(UserContext);
  const isAdmin = user.role === "admin";

  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
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
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);

      const res = await fetch(`${API}/api/tickets?${params.toString()}`, {
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
            assigned_to_emp_id: t.assigned_to_emp_id || "",
            plan_date: t.plan_date ? t.plan_date.split("T")[0] : "",
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
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`${API}/api/employee`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Fetch employees error:", err));
  }, [isAdmin, token]);

  const setDraft = (ticketId, key, value) => {
    setDrafts((d) => ({ ...d, [ticketId]: { ...d[ticketId], [key]: value } }));
  };

  const handleManageSave = async (ticket) => {
    const draft = drafts[ticket._id];
    const assignedEmp = employees.find((e) => e.Emp_id === draft.assigned_to_emp_id);

    try {
      const res = await fetch(`${API}/api/tickets/${ticket._id}/manage`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          status: draft.status,
          priority: draft.priority,
          assigned_to_emp_id: draft.assigned_to_emp_id || null,
          assigned_to_name: assignedEmp ? assignedEmp.Emp_name : null,
          plan_date: draft.plan_date || null,
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
        title="Tickets"
        subtitle={isAdmin ? "Manage all raised tickets" : "Your raised tickets"}
        breadcrumb={[{ label: "Tickets" }]}
      />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {isAdmin && (
              <>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={filterStyle}>
                  <option value="">All Statuses</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={filterStyle}>
                  <option value="">All Priorities</option>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </>
            )}
          </div>

          <button style={addBtn} onClick={onRaiseTicket}>
            Raise Ticket
          </button>
        </div>

        {loading && <div style={{ color: "#6B7280" }}>Loading...</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {tickets.map((ticket) => {
            const draft = drafts[ticket._id] || {};
            const expanded = expandedId === ticket._id;
            const canComment = isAdmin || ticket.raised_by_id === user.id;

            return (
              <div key={ticket._id} style={card}>
                <div style={header} onClick={() => setExpandedId(expanded ? null : ticket._id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span>{expanded ? "▼" : "▶"}</span>
                    <span style={ticketIdStyle}>{ticket.ticket_id}</span>
                    <span style={titleStyle}>{ticket.title}</span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ ...badge, ...(PRIORITY_COLORS[ticket.priority] || {}) }}>{ticket.priority}</span>
                    <span style={{ ...badge, ...(STATUS_COLORS[ticket.status] || {}) }}>{ticket.status}</span>
                  </div>
                </div>

                {expanded && (
                  <div style={body} onClick={(e) => e.stopPropagation()}>
                    <p style={{ margin: "0 0 12px", color: "#374151" }}>{ticket.description}</p>

                    <div style={metaRow}>
                      <span><b>Raised By:</b> {ticket.raised_by_name}</span>
                      <span><b>Assigned To:</b> {ticket.assigned_to_name || "Unassigned"}</span>
                      {ticket.plan_date && (
                        <span><b>Plan Date:</b> {new Date(ticket.plan_date).toLocaleDateString("en-IN")}</span>
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
                          <label style={labelStyle}>Assign To</label>
                          <select
                            value={draft.assigned_to_emp_id || ""}
                            onChange={(e) => setDraft(ticket._id, "assigned_to_emp_id", e.target.value)}
                            style={inputStyle}
                          >
                            <option value="">Unassigned</option>
                            {employees.map((emp) => (
                              <option key={emp.Emp_id} value={emp.Emp_id}>{emp.Emp_name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>Plan Date</label>
                          <input
                            type="date"
                            value={draft.plan_date || ""}
                            onChange={(e) => setDraft(ticket._id, "plan_date", e.target.value)}
                            style={inputStyle}
                          />
                        </div>

                        <button style={saveBtn} onClick={() => handleManageSave(ticket)}>
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
                            value={expanded ? commentText : ""}
                            onChange={(e) => setCommentText(e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button style={saveBtn} onClick={() => handleAddComment(ticket._id)}>
                            Post
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!loading && tickets.length === 0 && (
            <div style={{ color: "#6B7280", textAlign: "center", padding: 40 }}>
              No tickets found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const card = {
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  overflow: "hidden",
  background: "#fff",
};

const header = {
  padding: "16px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#F9FAFB",
  cursor: "pointer",
};

const body = {
  padding: 16,
};

const titleStyle = {
  fontSize: 15,
  fontWeight: 600,
  color: "#111827",
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

const filterStyle = {
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
