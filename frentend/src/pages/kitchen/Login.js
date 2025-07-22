import React, { useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function KitchenLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.token) {
        login(res.data.user, res.data.token);
        navigate('/kitchen/orders');
      }
    } catch (err) {
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Kitchen Login</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Se connecter</button>
      </form>
    </div>
  );
} 