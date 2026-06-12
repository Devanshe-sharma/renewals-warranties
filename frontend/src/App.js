import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import Sidebar from "./components/sidebar";

import Dashboard from "./pages/dashboard";
import NewForm from "./pages/newform";
import UpdateForm from "./pages/updateform";
import RenewalEventsPage from "./pages/Renewaleventspage";

import CategoriesPage from "./pages/categories";

import StatusRulesPage from "./pages/StatusRulesPage";

import { UserProvider } from "./context/UserContext";

import "./App.css";

function AppContent() {
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);

  const showToast = (
    msg,
    type = "success"
  ) => {
    setToast({ msg, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return (
    <>
      <Sidebar />

      <main
        style={{
          marginLeft: 200,
          padding: "2px 0px",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                onNew={() =>
                  navigate("/new")
                }
                onNavigateUpdateForm={() =>
                  navigate(
                    "/updaterenewal"
                  )
                }
              />
            }
          />

          <Route
            path="/renewals"
            element={
              <Dashboard
                onNew={() =>
                  navigate("/new")
                }
                onNavigateUpdateForm={() =>
                  navigate("/updaterenewal")
                }
              />
            }
          />

          <Route
            path="/new"
            element={
              <NewForm
                onSave={(data) => {
                  showToast(
                    `"${data.item_name}" created!`
                  );

                  navigate("/");
                }}
                onCancel={() =>
                  navigate("/")
                }
              />
            }
          />

          <Route
            path="/updaterenewal"
            element={
              <RenewalEventsPage
                onRecord={() =>
                  navigate(
                    "/updaterenewal/record"
                  )
                }
                onBack={() =>
                  navigate("/")
                }
              />
            }
          />

          <Route
            path="/updaterenewal/record"
            element={
              <UpdateForm
                onSave={(data) => {
                  showToast(
                    `Event ${data.event_id} recorded!`
                  );

                  navigate(
                    "/updaterenewal"
                  );
                }}
                onCancel={() =>
                  navigate(
                    "/updaterenewal"
                  )
                }
              />
            }
          />

          <Route
            path="/categories"
            element={<CategoriesPage />}
          />

          <Route
            path="/statusrules"
            element={
              <StatusRulesPage
                onBack={() =>
                  navigate("/")
                }
              />
            }
          />
        </Routes>
      </main>

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,

            background:
              toast.type ===
              "success"
                ? "#111827"
                : "#EF4444",

            color: "#fff",

            padding: "12px 20px",

            borderRadius: 10,

            fontSize: 14,
            fontWeight: 600,

            boxShadow:
              "0 4px 20px rgba(0,0,0,0.18)",

            display: "flex",
            alignItems: "center",
            gap: 10,

            animation:
              "toastIn 0.2s ease",
          }}
        >
          <span>
            {toast.type ===
            "success"
              ? "✓"
              : "✗"}
          </span>

          {toast.msg}
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #1976d2 !important;

          box-shadow:
            0 0 0 3px #1976d240 !important;
        }

        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }

        ::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        @keyframes toastIn {
          from {
            transform: translateY(10px);
            opacity: 0;
          }

          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div
          style={{
            fontFamily:
              "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",

            background: "#F3F4F6",

            minHeight: "100vh",
          }}
        >
          <link
            href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap"
            rel="stylesheet"
          />

          <AppContent />
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}