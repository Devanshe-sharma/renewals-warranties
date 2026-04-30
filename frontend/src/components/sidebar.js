import React from "react";

const LIME    = "#ADE80A";
const SIDEBAR = "#0F1923";

const NAV_ITEMS = [
  { id: "dashboard", icon: "▦", label: "Create Renewal List"  },
];

export default function Sidebar({ activeNav, onNav }) {
  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: SIDEBAR,
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0, top: 0, bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34, height: 34,
              background: LIME,
              borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 17, fontWeight: 900, color: "#000" }}>B</span>
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>Brisk Olive</div>
            <div style={{ color: "#4B5563", fontSize: 11 }}>Renewals &amp; Warranty</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "14px 10px" }}>
        {NAV_ITEMS.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 11,
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8, border: "none",
                cursor: "pointer",
                background: active ? LIME : "transparent",
                color: active ? "#000" : "#9CA3AF",
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                marginBottom: 3,
                textAlign: "left",
                transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              <span style={{ width: 22, fontSize: 18, textAlign: "center", fontWeight: 300, lineHeight: 1 }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", color: "#374151", fontSize: 11 }}>
        © 2025 Brisk Olive
      </div>
    </aside>
  );
}