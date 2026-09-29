import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

// Route guard: renders children only if `check(user)` passes, otherwise
// redirects — stops direct URL navigation, not just hiding the nav link.
export default function RequireAccess({ check, redirectTo = "/tickets", children }) {
  const { user } = useContext(UserContext);

  if (!check(user)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
