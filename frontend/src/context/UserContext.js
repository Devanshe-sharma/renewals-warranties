import React, { createContext, useState, useCallback } from 'react';

export const UserContext = createContext();

function readStoredUser() {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(readStoredUser());
  const [token, setToken] = useState(localStorage.getItem('authToken') || null);
  // Set by logout() so AuthGate shows a real "logged out" screen instead of
  // silently bouncing straight back through HR-Forms's still-active session
  // (there's no HR-Forms logout URL to end that session from here — see
  // AuthGate.js). Cleared by login(), so a fresh sign-in always resets it.
  const [loggedOut, setLoggedOut] = useState(localStorage.getItem('loggedOut') === 'true');

  // Called by the /sso-callback page once it's exchanged HR-Forms's code
  // for a local session — this is the only way to become logged in here.
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
    localStorage.removeItem('loggedOut');
    setToken(newToken);
    setUser(newUser);
    setLoggedOut(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.setItem('loggedOut', 'true');
    setToken(null);
    setUser(null);
    setLoggedOut(true);
  }, []);

  return (
    <UserContext.Provider value={{ user, token, isAuthenticated: !!user && !!token, loggedOut, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
