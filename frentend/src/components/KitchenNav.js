import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function KitchenNav() {

  const { logout } = useAuth();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/kitchen/login');
  };

  return (
    <nav className="flex gap-4 bg-green-100 p-4 mb-6">
      <div className="text-right text-sm text-gray-600">
        {user?.name && <>Connecté en tant que <span className="font-bold">{user.name}</span></>}
      </div>
      <Link to="/kitchen/orders">Commandes</Link>&nbsp;&nbsp;
      <button onClick={handleLogout} className="ml-auto text-red-600">Déconnexion</button>
    </nav>
  );
}



