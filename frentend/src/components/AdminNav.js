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
      <div className="text-right text-sm text-gray-600">
        {user?.name && <>Connecté en tant que <span className="font-bold">{user.name}</span></>}
      </div>
      <Link to="/admin/dashboard">Dashboard</Link>&nbsp;&nbsp;
      <Link to="/admin/menu">Menu</Link>&nbsp;&nbsp;
      <Link to="/admin/categories">Catégories</Link>&nbsp;&nbsp;
      <Link to="/admin/orders">Commandes</Link>&nbsp;&nbsp;
      <button onClick={handleLogout} className="ml-auto text-red-600">Déconnexion</button>

    </nav>
  );
}


