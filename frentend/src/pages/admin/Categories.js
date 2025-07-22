import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import AdminNav from '../../components/AdminNav';
import { useToast } from '../../components/ToastContext';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [newImage, setNewImage] = useState('');
  const [editId, setEditId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchCategories();
    const socket = io(SOCKET_URL);
    socket.on('categories_updated', fetchCategories);
    return () => socket.disconnect();
  }, []);

  async function fetchCategories() {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      showToast('Erreur lors du chargement des catégories', 'error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newCat.trim()) return;

const payload = { name: newCat.trim(), image: newImage }; // حتى لو فارغة


    try {
      if (editId) {
        await api.put(`/categories/${editId}`, payload);
        showToast('Catégorie modifiée avec succès', 'success');
      } else {
        await api.post('/categories', payload);
        showToast('Catégorie ajoutée avec succès', 'success');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  }

  function resetForm() {
    setNewCat('');
    setNewImage('');
    setEditId(null);
  }

  function handleEdit(cat) {
    setNewCat(cat.name);
    setNewImage(cat.image || '');
    setEditId(cat._id);
  }

  async function handleDeleteCategory(id) {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      showToast('Catégorie supprimée', 'success');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  }

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold mb-4">Gestion des catégories</h1>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <input
          type="text"
          placeholder="Nom de la catégorie"
          value={newCat}
          onChange={e => setNewCat(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        />
        <input
          type="text"
          placeholder="Lien image (optionnel)"
          value={newImage}
          onChange={e => setNewImage(e.target.value)}
          className="border rounded px-2 py-1 w-full"
        />
        <div className="flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
            {editId ? 'Modifier' : 'Ajouter'}
          </button>
          {editId && (
            <button type="button" onClick={resetForm} className="bg-gray-400 text-white px-4 py-1 rounded">
              Annuler
            </button>
          )}
        </div>
      </form>

      <ul className="space-y-2">
        {categories.map(cat => (
          <li key={cat._id} className="flex items-center gap-4 border p-2 rounded">
            {cat.image && <img src={cat.image} alt="" className="w-10 h-10 object-cover rounded" />}
            <span className="flex-1">{cat.name}</span>
            <button
              onClick={() => handleEdit(cat)}
              className="bg-yellow-500 text-white px-2 py-1 rounded"
            >
              Éditer
            </button>
            <button
              onClick={() => handleDeleteCategory(cat._id)}
              className="bg-red-600 text-white px-2 py-1 rounded"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
