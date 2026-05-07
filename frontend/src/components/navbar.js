import React from "react";
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const drawerWidth = 260;

const pageTitles = {
  '/': 'Dashboard',
  '/renewal-events': 'Renewal Events',
  '/update-form': 'Record Event',
};

const TOOLBAR_H = 56;

export default function Navbar({ title, subtitle, breadcrumb = [], actions }) {
  const nav = useNavigate();
  const loc = useLocation();
  
  const pageTitle = pageTitles[loc.pathname] || title || 'Renewals & Warranties';

  return (
    <>
      {/* Blue AppBar */}
      <AppBar position="fixed" sx={{
        width: `calc(100% - ${drawerWidth}px)`, 
        ml: `${drawerWidth}px`,
        backgroundColor: '#1976d2', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: TOOLBAR_H,
      }}>
        <Toolbar sx={{ 
          px: 4, 
          minHeight: `${TOOLBAR_H}px !important`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {breadcrumb.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {breadcrumb.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>›</span>}
                    <button
                      onClick={crumb.onClick}
                      style={{
                        background: "none", 
                        border: "none", 
                        padding: 0,
                        cursor: crumb.onClick ? "pointer" : "default",
                        fontSize: 13,
                        color: crumb.onClick ? 'rgba(255,255,255,0.7)' : '#ffffff',
                        fontWeight: crumb.onClick ? 400 : 600,
                        textDecoration: crumb.onClick ? "underline" : "none",
                        textDecorationColor: "rgba(255,255,255,0.7)",
                        fontFamily: "inherit",
                      }}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </Box>
            )}
            <Typography variant="h6" fontWeight={700} color="white">
              {pageTitle}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="rgba(255,255,255,0.8)" sx={{ ml: 2 }}>
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Right side actions */}
          {actions && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {actions}
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </>
  );
}

/**
 * NavbarButton – convenience button for Navbar actions slot
 * Props:
 *   onClick  {fn}
 *   icon     {string}  – emoji / character
 *   label    {string}
 *   variant  "primary" | "secondary" | "danger"
 */
export function NavbarButton({ onClick, icon, label, variant = "primary" }) {
  const variants = {
    primary:   { background: "#fff", color: "#1976d2", border: "none" },
    secondary: { background: "rgba(255,255,255,0.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)" },
    danger:    { background: "#FEE2E2", color: "#991B1B", border: "1.5px solid #FECACA" },
  };
  
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", 
        alignItems: "center", 
        gap: 8,
        borderRadius: 8,
        padding: "10px 20px",
        fontWeight: 600, 
        fontSize: 14,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.2s ease",
        ...variants[variant],
      }}
      onMouseEnter={(e) => {
        if (variant === "primary") {
          e.target.style.background = "rgba(255,255,255,0.9)";
        }
      }}
      onMouseLeave={(e) => {
        if (variant === "primary") {
          e.target.style.background = "#fff";
        }
      }}
    >
      {icon && <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>}
      {label}
    </button>
  );
}