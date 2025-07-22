import React from 'react';
import AdminNav from '../../components/AdminNav';

export default function Dashboard() {
  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold mb-4">Bienvenue sur le Dashboard Admin</h1>
      <p>Utilisez la navigation pour accéder aux différentes sections.</p>
    </div>
  );
} 