import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/api';

const AuthContext = createContext();

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && isTokenValid(storedToken)) {
      setToken(storedToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.role === 'client') {
          setUser({ roomNum: decoded.roomId, role: 'client' });
        } else {
          setUser({ ...decoded });
        }
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    }
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 