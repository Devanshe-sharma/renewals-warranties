import React, { useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";

// Loaded in a hidden iframe by HR-Forms's AuthContext.logout() — the only
// job here is to clear this app's own session so logging out of HR-Forms
// also logs out here. Never shown to the user directly.
export default function SsoLogout() {
  const { logout } = useContext(UserContext);

  useEffect(() => {
    logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
