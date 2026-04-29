import React from "react";

const LIME = "#ADE80A";

/**
 * Navbar
 * Props:
 *   title      {string}   – page heading
 *   subtitle   {string}   – secondary description line (optional)
 *   breadcrumb {Array}    – [{ label, onClick? }]  (optional)
 *   actions    {ReactNode} – right-side buttons slot (optional)
 */
export default function Navbar({ title, subtitle, breadcrumb = [], actions }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 28,
      }}
    >
      {/* Left */}
      <div>
        {breadcrumb.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: "#D1D5DB", fontSize: 13 }}>›</span>}
                <button
                  onClick={crumb.onClick}
                  style={{
                    background: "none", border: "none", padding: 0,
                    cursor: crumb.onClick ? "pointer" : "default",
                    fontSize: 13,
                    color: crumb.onClick ? "#6B7280" : "#374151",
                    fontWeight: crumb.onClick ? 400 : 600,
                    textDecoration: crumb.onClick ? "underline" : "none",
                    textDecorationColor: "#D1D5DB",
                    fontFamily: "inherit",
                  }}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: 0, lineHeight: 1.2 }}>
          {title}
        </h1>

        {subtitle && (
          <p style={{ color: "#6B7280", fontSize: 14, margin: "5px 0 0" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right – action slot */}
      {actions && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * NavbarButton – convenience button for the Navbar actions slot
 * Props:
 *   onClick  {fn}
 *   icon     {string}  – emoji / character
 *   label    {string}
 *   variant  "primary" | "secondary" | "danger"
 */
export function NavbarButton({ onClick, icon, label, variant = "primary" }) {
  const variants = {
    primary:   { background: LIME,       color: "#000",    border: "none" },
    secondary: { background: "#fff",     color: "#374151", border: "1.5px solid #E5E7EB" },
    danger:    { background: "#FEE2E2",  color: "#991B1B", border: "1.5px solid #FECACA" },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        borderRadius: 10,
        padding: "11px 22px",
        fontWeight: 700, fontSize: 14,
        cursor: "pointer",
        fontFamily: "inherit",
        ...variants[variant],
      }}
    >
      {icon && <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>}
      {label}
    </button>
  );
}