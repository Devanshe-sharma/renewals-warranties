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

  // Called by the /sso-callback page once it's exchanged HR-Forms's code
  // for a local session — this is the only way to become logged in here.
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, token, isAuthenticated: !!user && !!token, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
