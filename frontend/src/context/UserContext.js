import React, { createContext, useState, useCallback } from 'react';

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    id: localStorage.getItem('userId') || 'user-' + Date.now(),
    name: localStorage.getItem('userName') || 'Guest User',
    role: localStorage.getItem('userRole') || 'user'
  });

  const updateUser = useCallback((newUser) => {
    setUser(newUser);
    localStorage.setItem('userId', newUser.id);
    localStorage.setItem('userName', newUser.name);
    localStorage.setItem('userRole', newUser.role);
  }, []);

  const setAsAdmin = useCallback(() => {
    const adminUser = {
      id: 'admin-' + Date.now(),
      name: 'Admin User',
      role: 'admin'
    };
    updateUser(adminUser);
  }, [updateUser]);

  const setAsUser = useCallback(() => {
    const regularUser = {
      id: 'user-' + Date.now(),
      name: 'Regular User',
      role: 'user'
    };
    updateUser(regularUser);
  }, [updateUser]);

  return (
    <UserContext.Provider value={{ user, updateUser, setAsAdmin, setAsUser }}>
      {children}
    </UserContext.Provider>
  );
}
