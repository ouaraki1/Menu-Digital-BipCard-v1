import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import AdminNav from '../../components/AdminNav';
import { useToast } from '../../components/ToastContext';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchCategories();

    const socket = io(SOCKET_URL);
    socket.on('categories_updated', fetchCategories);

    return () => socket.disconnect();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
      showToast('Erreur lors du chargement des catégories', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      await api.post('/categories', { name: newCat });
      setNewCat('');
      fetchCategories();
      showToast('Catégorie ajoutée avec succès', 'success');
    } catch (err) {
      setError('Erreur lors de l\'ajout de la catégorie');
      showToast('Erreur lors de l\'ajout de la catégorie', 'error');
    }
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      showToast('Catégorie supprimée', 'success');
    } catch (err) {
      setError('Erreur lors de la suppression');
      showToast('Erreur lors de la suppression', 'error');
    }
  }

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold mb-4">Gestion des catégories</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Nouvelle catégorie"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <button className="bg-blue-600 text-white px-4 py-1 rounded" type="submit">Ajouter</button>
      </form>
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <ul className="space-y-2">
          {categories.map(cat => (
            <li key={cat._id} className="flex items-center gap-2 border p-2 rounded">
              <span className="flex-1">{cat.name}</span>
              <button
                className="bg-red-600 text-white px-2 py-1 rounded"
                onClick={() => handleDeleteCategory(cat._id)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 