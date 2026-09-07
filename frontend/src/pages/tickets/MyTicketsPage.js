import React, { useContext, useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { UserContext } from "../../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

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

export default function MyTicketsPage({ onRaiseTicket }) {
  const { token } = useContext(UserContext);

  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/tickets?mine=true`, {
        headers: authHeaders,
      });
      const data = await res.json();

      if (data.success) {
        setTickets(data.data);
      }
    } catch (err) {
      console.error("Fetch my tickets error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const statuses = tab === "pending" ? PENDING_STATUSES : SOLVED_STATUSES;
  const visibleTickets = tickets.filter((t) => statuses.includes(t.status));

  return (
    <div style={{ paddingTop: 56 }}>
      <Navbar
        title="My Tickets"
        subtitle="Tickets you've raised"
        breadcrumb={[{ label: "My Tickets" }]}
      />

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={tab === "pending" ? tabBtnActive : tabBtn}
              onClick={() => setTab("pending")}
            >
              Pending ({tickets.filter((t) => PENDING_STATUSES.includes(t.status)).length})
            </button>
            <button
              style={tab === "solved" ? tabBtnActive : tabBtn}
              onClick={() => setTab("solved")}
            >
              Solved ({tickets.filter((t) => SOLVED_STATUSES.includes(t.status)).length})
            </button>
          </div>

          <button style={addBtn} onClick={onRaiseTicket}>
            Raise Ticket
          </button>
        </div>

        {loading && <div style={{ color: "#6B7280" }}>Loading...</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {visibleTickets.map((ticket) => {
            const expanded = expandedId === ticket._id;

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
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!loading && visibleTickets.length === 0 && (
            <div style={{ color: "#6B7280", textAlign: "center", padding: 40 }}>
              No {tab} tickets.
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

const tabBtn = {
  padding: "8px 18px",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  background: "#fff",
  color: "#374151",
  fontWeight: 600,
  cursor: "pointer",
};

const tabBtnActive = {
  ...tabBtn,
  background: "#1976d2",
  color: "#fff",
  border: "1px solid #1976d2",
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
