import React, { useState } from 'react';
import api from '../../api/api';
import { useAuth } from '../../auth/AuthContext';

export default function RoomEntry() {
  const [roomNum, setRoomNum] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/rooms/auth-room', { num: roomNum, code });
      if (res.data && res.data.token) {
        login({ roomNum }, res.data.token);
        window.location.href = `/client/${roomNum}/menu`;
      }
    } catch (err) {
      setError('Code ou numéro de chambre invalide');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Entrer dans la chambre</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <input
          type="text"
          placeholder="Numéro de chambre"
          value={roomNum}
          onChange={e => setRoomNum(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Code d'accès"
          value={code}
          onChange={e => setCode(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Entrer</button>
      </form>
    </div>
  );
} 