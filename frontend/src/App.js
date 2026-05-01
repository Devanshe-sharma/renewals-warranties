import React, { useState } from "react";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/dashboard";
import NewForm from "./pages/newform";
import UpdateForm from "./pages/updateform";
import RenewalEventsPage from "./pages/Renewaleventspage";
import { useCategoriesStore, CategoriesPage } from "./pages/categories";
import { UserProvider } from "./context/UserContext";
import "./App.css";

// ── View map ──────────────────────────────────────────────
// "dashboard"    → Renewal List table      (sidebar: Renewal List)
// "new"          → New Renewal form
// "update"       → Renewal Events table    (sidebar: Update Renewal)
// "record-event" → Record Renewal Event form

export default function App() {
  const [view,  setView]  = useState("dashboard");
  const [toast, setToast] = useState(null);

  const catStore = useCategoriesStore();

  // ── Toast ─────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Sidebar nav handler ───────────────────────────────
  // "dashboard" → renewal list  |  "update" → events table
  const handleNav = (id) => setView(id);

  // ── Active nav highlight ──────────────────────────────
  const activeNav =
    view === "dashboard" || view === "new"          ? "dashboard" :
    view === "update"    || view === "record-event" ? "update"    :
    view === "categories"                           ? "categories" :
    "dashboard";

  // ── Page renderer ─────────────────────────────────────
  const renderPage = () => {
    switch (view) {

      // ── Renewal List ──────────────────────────────────
      case "new":
        return (
          <NewForm
            categories={catStore.categories}
            onSave={(data) => {
              showToast(`"${data.item_name}" created!`);
              setView("dashboard");
            }}
            onCancel={() => setView("dashboard")}
          />
        );

      // ── Update Renewal ────────────────────────────────
      case "update":
        return (
          <RenewalEventsPage
            onRecord={() => setView("record-event")}
            onBack={() => setView("update")}
          />
        );

      case "record-event":
        return (
          <UpdateForm
            onSave={(data) => {
              showToast(`Event ${data.event_id} recorded!`);
              setView("update");
            }}
            onCancel={() => setView("update")}
          />
        );

      case "categories":
        return (
          <CategoriesPage store={catStore} />
        );

      // ── Default: Renewal List dashboard ───────────────
      default:
        return (
          <Dashboard
            categories={catStore.categories}
            onNew={() => setView("new")}
            onNavigateUpdateForm={() => setView("update")}
          />
        );
    }
  };

  return (
    <UserProvider>
      <div style={{ fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif", background: "#F3F4F6", minHeight: "100vh" }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

        <Sidebar activeNav={activeNav} onNav={handleNav} />

        <main style={{ marginLeft: 220, padding: "32px 36px", minHeight: "100vh", boxSizing: "border-box" }}>
          {renderPage()}
        </main>

        {toast && (
          <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: toast.type === "success" ? "#111827" : "#EF4444",
            color: "#fff", padding: "12px 20px", borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
            display: "flex", alignItems: "center", gap: 10,
            animation: "toastIn 0.2s ease",
          }}>
            <span>{toast.type === "success" ? "✓" : "✗"}</span>
            {toast.msg}
          </div>
        )}

        <style>{`
          * { box-sizing: border-box; }
          input:focus, select:focus, textarea:focus {
            border-color: #ADE80A !important;
            box-shadow: 0 0 0 3px #ADE80A40 !important;
          }
          ::-webkit-scrollbar { width: 5px; height: 5px; }
          ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
          ::-webkit-scrollbar-track { background: transparent; }
          @keyframes toastIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
      </div>
    </UserProvider>
  );
}