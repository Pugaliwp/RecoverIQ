import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEMO_CREDENTIALS = {
  email: 'admin@recoveriq.demo',
  password: 'RecoverIQ@2026',
  name: 'Admin User',
  role: 'Recovery Agent'
};

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    const saved = localStorage.getItem('recoveriq_auth');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      authenticated: false,
      user: null,
      demoPassword: DEMO_CREDENTIALS.password,
      demoName: DEMO_CREDENTIALS.name,
      demoEmail: DEMO_CREDENTIALS.email
    };
  });

  useEffect(() => {
    localStorage.setItem('recoveriq_auth', JSON.stringify(authState));
  }, [authState]);

  const login = (email, password) => {
    if (email === authState.demoEmail && password === authState.demoPassword) {
      setAuthState(prev => ({
        ...prev,
        authenticated: true,
        user: {
          name: prev.demoName,
          email: prev.demoEmail,
          role: DEMO_CREDENTIALS.role // Immutable demo role
        }
      }));
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState(prev => ({
      ...prev,
      authenticated: false,
      user: null
    }));
  };

  const updateProfile = (name, email) => {
    setAuthState(prev => ({
      ...prev,
      demoName: name,
      demoEmail: email,
      user: {
        ...prev.user,
        name,
        email
      }
    }));
  };

  const changePassword = (currentPassword, newPassword) => {
    if (currentPassword !== authState.demoPassword) {
      return false;
    }
    setAuthState(prev => ({
      ...prev,
      demoPassword: newPassword
    }));
    return true;
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
