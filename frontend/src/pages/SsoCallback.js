import React, { useContext, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3003";

// Landing point after HR-Forms redirects back with a one-time code
// (see /sso-authorize on the HR-Forms side). Exchanges it for a local
// session via our own backend, then drops the user at the dashboard.
export default function SsoCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useContext(UserContext);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Missing sign-in code.");
      return;
    }

    fetch(`${API}/api/auth/sso-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          login(data.token, data.user);
          navigate("/", { replace: true });
        } else {
          setError(data.error || "Sign-in failed.");
        }
      })
      .catch(() => setError("Sign-in failed."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      fontFamily: "'Outfit', sans-serif", color: error ? "#DC2626" : "#6B7280",
    }}>
      {error || "Signing you in…"}
    </div>
  );
}
