import React, { useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";

const HR_SSO_AUTHORIZE_URL =
  process.env.REACT_APP_HR_SSO_AUTHORIZE_URL || "https://hr.briskolive.com/sso-authorize";

function randomState() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Gates the whole app behind HR-Forms login. Not logged in here yet? Send
// the browser to HR-Forms's /sso-authorize — if the user is already logged
// in there, it bounces straight back with a code and no login form is ever
// shown here.
export default function AuthGate({ children }) {
  const { isAuthenticated } = useContext(UserContext);

  useEffect(() => {
    if (isAuthenticated) return;

    const redirectUri = `${window.location.origin}/sso-callback`;
    const state = randomState();
    const url = new URL(HR_SSO_AUTHORIZE_URL);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    window.location.href = url.toString();
  }, [isAuthenticated]);

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
