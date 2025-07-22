import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function AdminNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <nav className="flex gap-4 bg-gray-200 p-4 mb-6">
      <Link to="/admin/dashboard">Dashboard</Link>
      <Link to="/admin/menu">Menu</Link>
      <Link to="/admin/categories">Catégories</Link>
      <Link to="/admin/orders">Commandes</Link>
      <button onClick={handleLogout} className="ml-auto text-red-600">Déconnexion</button>
      <div className="text-right text-sm text-gray-600">
        {user?.name && <>Connecté en tant que <span className="font-bold">{user.name}</span></>}
      </div>
    </nav>
  );
} 


