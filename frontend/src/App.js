import React, { useState } from "react";
import Navbar from "./components/navbar";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/dashboard";
import NewForm from "./pages/newform";
import UpdateForm from "./pages/updateform";
import { useCategoriesStore } from "./pages/categories";
import "./App.css";

export default function App() {
  const [view,    setView]    = useState("dashboard");
  const [renewals, setRenewals] = useState([]);
  const [editing,  setEditing]  = useState(null);
  const [toast,    setToast]    = useState(null);

  const catStore = useCategoriesStore();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNav = (id) => {
    if (id === "new") {
      setEditing(null);
      setView("new");
    } else {
      setView("dashboard");
    }
  };

  const handleEdit = (renewal) => {
    setEditing(renewal);
    setView("update");
  };

  const handleCreate = (data) => {
    setRenewals((prev) => [...prev, data]);
    showToast(`"${data.itemName}" created!`);
    setView("dashboard");
  };

  const handleUpdate = (data) => {
    setRenewals((prev) => prev.map((r) => (r.id === data.id ? data : r)));
    showToast(`"${data.itemName}" updated!`);
    setEditing(null);
    setView("dashboard");
  };

  const handleCancel = () => {
    setEditing(null);
    setView("dashboard");
  };

  const activeNav = view === "new" ? "new" : "dashboard";

  const renderPage = () => {
    switch (view) {
      case "new":
        return (
          <NewForm
            categories={catStore.categories}
            onSave={handleCreate}
            onCancel={handleCancel}
          />
        );
      case "update":
        return (
          <UpdateForm
            renewal={editing}
            categories={catStore.categories}
            onSave={handleUpdate}
            onCancel={handleCancel}
          />
        );
      default:
        return (
          <Dashboard
            renewals={renewals}
            categories={catStore.categories}
            onNew={() => handleNav("new")}
            onEdit={handleEdit}
            onSelect={handleEdit}
          />
        );
    }
  };

  return (
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
      `}</style>
    </div>
  );
}