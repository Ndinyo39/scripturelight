import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isLoggedIn, user, loading } = useAuth();
  const location = useLocation();

  // Always wait until auth has fully loaded (including the /api/auth/me sync)
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #e9c46a', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // Must be logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin-only pages: robust check (case-insensitive, handles undefined)
  if (adminOnly) {
    const userRole = (user?.role || '').toString().toLowerCase().trim();
    if (userRole !== 'admin') {
      console.warn('ProtectedRoute: Access denied. User role:', user?.role);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
