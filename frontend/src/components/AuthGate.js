import React, { useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";

const HR_SSO_AUTHORIZE_URL =
  process.env.REACT_APP_HR_SSO_AUTHORIZE_URL || "https://hr.briskolive.com/sso-authorize";

function randomState() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function redirectToSso() {
  const redirectUri = `${window.location.origin}/sso-callback`;
  const state = randomState();
  const url = new URL(HR_SSO_AUTHORIZE_URL);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  window.location.href = url.toString();
}

// Gates the whole app behind HR-Forms login. Not logged in here yet? Send
// the browser to HR-Forms's /sso-authorize — if the user is already logged
// in there, it bounces straight back with a code and no login form is ever
// shown here.
//
// Exception: right after the user clicks Logout (loggedOut flag, see
// UserContext.js), we deliberately do NOT auto-redirect. This app has no
// HR-Forms logout URL, so HR-Forms's own session is still active — an
// automatic redirect would silently re-authorize and log the user right
// back in, making Logout look like it does nothing. Instead we show a real
// "you're logged out" screen; only a click sends them back to HR-Forms.
export default function AuthGate({ children }) {
  const { isAuthenticated, loggedOut } = useContext(UserContext);

  useEffect(() => {
    if (isAuthenticated || loggedOut) return;
    redirectToSso();
  }, [isAuthenticated, loggedOut]);

  if (loggedOut) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", gap: 16,
        alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", color: "#374151",
      }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>You've been logged out</div>
        <div style={{ fontSize: 13, color: "#6B7280", maxWidth: 360, textAlign: "center" }}>
          You're still signed in to the HR portal itself, so this only ends your session here.
          Log out of HR-Forms separately if you want to end that too.
        </div>
        <button
          onClick={redirectToSso}
          style={{
            padding: "10px 22px", borderRadius: 8, border: "none",
            background: "#1976d2", color: "#fff", fontWeight: 600,
            fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Log back in
        </button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'Outfit', sans-serif", color: "#6B7280",
      }}>
        Redirecting to sign in…
      </div>
    );
  }

  return children;
}
