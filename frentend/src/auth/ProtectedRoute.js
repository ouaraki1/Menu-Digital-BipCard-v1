import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from '../components/ToastContext';
import { jwtDecode } from 'jwt-decode';

function isTokenValid(token) {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    if (!decoded.exp) return true;
    const now = Date.now() / 1000;
    return decoded.exp > now;
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  useEffect(() => {
    if (token && !isTokenValid(token)) {
      logout();
      showToast('Session expirée, veuillez vous reconnecter', 'error');
    }
    // eslint-disable-next-line
  }, [token]);

  if (!token || !user) {
    // Redirection selon le chemin
    if (location.pathname.startsWith('/admin')) return <Navigate to="/admin/login" />;
    if (location.pathname.startsWith('/kitchen')) return <Navigate to="/kitchen/login" />;
    if (location.pathname.startsWith('/client')) return <Navigate to="/client/entry" />;
    return <Navigate to="/admin/login" />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (user.role && !allowedRoles.includes(user.role)) {
      return <Navigate to="/admin/login" />;
    }
    if (!user.role && !allowedRoles.includes('client')) {
      return <Navigate to="/client/entry" />;
    }
  }

  return children;
} 