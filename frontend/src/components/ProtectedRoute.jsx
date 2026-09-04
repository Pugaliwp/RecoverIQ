import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }) {
  const { authenticated } = useAuth();
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
