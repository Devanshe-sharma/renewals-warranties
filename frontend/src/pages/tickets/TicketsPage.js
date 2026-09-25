import React, { useContext, useEffect, useMemo, useState } from "react";
import Navbar from "../../components/navbar";
import Modal from "../../components/Modal";
import RaiseTicketForm from "./RaiseTicketForm";
import { UserContext } from "../../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

const PRIORITY_COLORS = {
  Low: { bg: "#E5E7EB", color: "#374151" },
  Medium: { bg: "#DBEAFE", color: "#1E40AF" },
  High: { bg: "#FFEDD5", color: "#9A3412" },
  Urgent: { bg: "#FEE2E2", color: "#DC2626" },
};

const STATUS_COLORS = {
  Open: { bg: "#DBEAFE", color: "#1E40AF" },
  "In Progress": { bg: "#FEF3C7", color: "#92400E" },
  Resolved: { bg: "#D1FAE5", color: "#065F46" },
  Closed: { bg: "#E5E7EB", color: "#374151" },
};

const PENDING_STATUSES = ["Open", "In Progress"];
const DONE_STATUSES = ["Resolved", "Closed"];

// Ticket management is restricted to this one address — not just anyone
// HR-Forms happens to report as 'Admin'.
const TICKET_ADMIN_EMAIL = "admin@briskolive.com";

export default function TicketsPage({ mineOnly = false }) {
  const { user, token } = useContext(UserContext);
  const isAdmin = user.email === TICKET_ADMIN_EMAIL;
  const showAdminColumns = isAdmin && !mineOnly;

  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState("pending"); // "pending" | "done"
  const [selectedId, setSelectedId] = useState(null);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const [closeTicketId, setCloseTicketId] = useState(null);
  const [closeRemarks, setCloseRemarks] = useState("");
  const [closing, setClosing] = useState(false);

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
    pending: tickets.filter((t) => PENDING_STATUSES.includes(t.status)).length,
    done: tickets.filter((t) => DONE_STATUSES.includes(t.status)).length,
  }), [tickets]);

  const filteredTickets = useMemo(() => {
    const statuses = tab === "pending" ? PENDING_STATUSES : DONE_STATUSES;
    return tickets
      .filter((t) => statuses.includes(t.status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [tickets, tab]);

  const selectedTicket = tickets.find((t) => t._id === selectedId) || null;
  const closeTicket = tickets.find((t) => t._id === closeTicketId) || null;

  const openCloseConfirm = (ticket) => {
    setSelectedId(null);
    setCloseRemarks("");
    setCloseTicketId(ticket._id);
  };

  const handleConfirmClose = async () => {
    if (!closeTicket) return;
    setClosing(true);

    try {
      const res = await fetch(`${API}/api/tickets/${closeTicket._id}/manage`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({ status: "Closed", remarks: closeRemarks.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setCloseTicketId(null);
        fetchTickets();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(false);
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

        {/* ── Tabs ── */}
        <div style={tabBar}>
          <button
            style={tab === "pending" ? tabBtnActive : tabBtn}
            onClick={() => setTab("pending")}
          >
            Pending ({counts.pending})
          </button>
          <button
            style={tab === "done" ? tabBtnActive : tabBtn}
            onClick={() => setTab("done")}
          >
            Done ({counts.done})
          </button>
        </div>

        {loading && <div style={{ color: "#6B7280", marginBottom: 10 }}>Loading...</div>}

        {/* ── Table ── */}
        <div style={tableWrap}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <TH>Timestamp</TH>
                  <TH>Raised To</TH>
                  <TH>Description</TH>
                  <TH>Plan Date</TH>
                  {showAdminColumns && <TH>Action</TH>}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id} style={row}>
                    <td style={cell} onClick={() => setSelectedId(ticket._id)}>
                      {new Date(ticket.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td style={cell} onClick={() => setSelectedId(ticket._id)}>
                      {ticket.assigned_to_name || "Admin"}
                    </td>
                    <td style={{ ...cell, ...descCell }} onClick={() => setSelectedId(ticket._id)} title={ticket.description}>
                      {ticket.description}
                    </td>
                    <td style={cell} onClick={() => setSelectedId(ticket._id)}>
                      {ticket.plan_date ? new Date(ticket.plan_date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    {showAdminColumns && (
                      <td style={cell}>
                        {tab === "pending" ? (
                          <button style={closeBtn} onClick={() => openCloseConfirm(ticket)}>
                            Close?
                          </button>
                        ) : (
                          <span style={{ ...badge, ...(STATUS_COLORS.Closed) }}>Closed</span>
                        )}
                      </td>
                    )}
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
            isAdmin={isAdmin}
            canComment={isAdmin || selectedTicket.raised_by_id === user.id}
            commentText={commentText}
            setCommentText={setCommentText}
            onAddComment={() => handleAddComment(selectedTicket._id)}
            onCloseRequest={() => openCloseConfirm(selectedTicket)}
          />
        )}
      </Modal>

      <Modal open={raiseOpen} onClose={() => setRaiseOpen(false)} maxWidth={720}>
        <RaiseTicketForm
          onSave={() => { setRaiseOpen(false); fetchTickets(); }}
          onCancel={() => setRaiseOpen(false)}
        />
      </Modal>

      <Modal open={!!closeTicket} onClose={() => setCloseTicketId(null)} maxWidth={420}>
        {closeTicket && (
          <div style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 4px" }}>Close ticket {closeTicket.ticket_id}?</h3>
            <p style={{ margin: "0 0 14px", color: "#6B7280", fontSize: 13 }}>{closeTicket.title}</p>

            <label style={labelStyle}>Remarks (optional)</label>
            <textarea
              value={closeRemarks}
              onChange={(e) => setCloseRemarks(e.target.value)}
              rows={3}
              placeholder="Add a note for the person who raised this..."
              style={{ ...inputStyle, resize: "vertical" }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={saveBtn} onClick={handleConfirmClose} disabled={closing}>
                {closing ? "Closing..." : "Yes, close"}
              </button>
              <button style={cancelBtn} onClick={() => setCloseTicketId(null)} disabled={closing}>
                No, cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TicketDetail({ ticket, isAdmin, canComment, commentText, setCommentText, onAddComment, onCloseRequest }) {
  const isPending = PENDING_STATUSES.includes(ticket.status);

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
        <span><b>Raised To:</b> {ticket.assigned_to_name || "Admin"}</span>
        {ticket.cc?.length > 0 && (
          <span><b>CC:</b> {ticket.cc.join(", ")}</span>
        )}
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

      {ticket.remarks && (
        <div style={remarksBox}>
          <b>Doer Remarks:</b> {ticket.remarks}
        </div>
      )}

      {isAdmin && isPending && (
        <div style={{ marginBottom: 16 }}>
          <button style={closeBtn} onClick={onCloseRequest}>
            Close this ticket
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
  borderBottom: "1px solid #F3F4F6",
};

const cell = {
  padding: "13px 16px",
  fontSize: 13,
  color: "#374151",
  cursor: "pointer",
};

const descCell = {
  maxWidth: 320,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
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

const remarksBox = {
  fontSize: 13,
  color: "#374151",
  background: "#FFFBEB",
  border: "1px solid #FDE68A",
  borderRadius: 8,
  padding: "10px 12px",
  marginBottom: 16,
};

const tabBar = {
  display: "flex",
  gap: 10,
  marginBottom: 16,
};

const tabBtn = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  background: "#fff",
  color: "#374151",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const tabBtnActive = {
  ...tabBtn,
  border: "1px solid #1976d2",
  background: "#1976d214",
  color: "#1976d2",
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
  width: "100%",
  boxSizing: "border-box",
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

const closeBtn = {
  padding: "6px 14px",
  border: "none",
  borderRadius: 6,
  background: "#DC2626",
  color: "#fff",
  fontWeight: 600,
  fontSize: 12,
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

const cancelBtn = {
  padding: "8px 16px",
  border: "1px solid #E5E7EB",
  borderRadius: 6,
  background: "#fff",
  color: "#374151",
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
