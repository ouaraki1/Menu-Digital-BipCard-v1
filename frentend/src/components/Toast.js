import React from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white font-bold">×</button>
      </div>
    </div>
  );
} 