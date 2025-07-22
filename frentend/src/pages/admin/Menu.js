import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import AdminNav from '../../components/AdminNav';
import { useToast } from '../../components/ToastContext';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function AdminMenu() {
  const [plats, setPlats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '',
    ingredients: '', // comma separated
    extraIngredients: '', // format: name:price,name:price
  });
  const [editId, setEditId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMenu();
    fetchCategories();

    const socket = io(SOCKET_URL);
    socket.on('menu_updated', fetchMenu);

    return () => socket.disconnect();
  }, []);

  async function fetchMenu() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/plats');
      setPlats(res.data);
    } catch (err) {
      setError('Erreur lors du chargement du menu');
      showToast('Erreur lors du chargement du menu', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      // ignore
    }
  }

  function parseIngredients(str) {
    return str.split(',').map(i => i.trim()).filter(Boolean);
  }
  function parseExtras(str) {
    return str.split(',').map(e => {
      const [name, price] = e.split(':');
      return name && price ? { name: name.trim(), price: Number(price) } : null;
    }).filter(Boolean);
  }

  async function handleAddPlat(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.price || !form.category || form.category.length !== 24) {
      showToast('Tous les champs sont obligatoires et la catégorie doit être sélectionnée.', 'error');
      return;
    }
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category,
        description: form.description,
        image: form.image,
        ingredients: parseIngredients(form.ingredients),
        extraIngredients: parseExtras(form.extraIngredients)
      };
      console.log('Payload envoyé:', payload); // Pour debug
      if (editId) {
        await api.put(`/plats/${editId}`, payload);
        showToast('Plat modifié avec succès', 'success');
      } else {
        await api.post('/plats', payload);
        showToast('Plat ajouté avec succès', 'success');
      }
      setForm({ name: '', price: '', category: '', description: '', image: '', ingredients: '', extraIngredients: '' });
      setEditId(null);
      fetchMenu();
    } catch (err) {
      setError('Erreur lors de l\'ajout/modification du plat');
      showToast('Erreur lors de l\'ajout/modification du plat', 'error');
    }
  }

  function handleEditPlat(plat) {
    setEditId(plat._id);
    setForm({
      name: plat.name,
      price: plat.price,
      category: typeof plat.category === 'object' ? plat.category._id : plat.category,
      description: plat.description || '',
      image: plat.image || '',
      ingredients: plat.ingredients ? plat.ingredients.join(', ') : '',
      extraIngredients: plat.extraIngredients ? plat.extraIngredients.map(e => `${e.name}:${e.price}`).join(', ') : ''
    });
  }

  async function handleDeletePlat(id) {
    if (!window.confirm('Supprimer ce plat ?')) return;
    try {
      await api.delete(`/plats/${id}`);
      fetchMenu();
      showToast('Plat supprimé', 'success');
    } catch (err) {
      setError('Erreur lors de la suppression');
      showToast('Erreur lors de la suppression', 'error');
    }
  }

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold mb-4">Gestion du menu</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleAddPlat} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Nom du plat"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="border rounded px-2 py-1"
        />
        <input
          type="number"
          placeholder="Prix"
          value={form.price}
          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          className="border rounded px-2 py-1"
        />
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="border rounded px-2 py-1"
          required
        >
          <option value="">Catégorie</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Image"
          value={form.image}
          onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
          className="border rounded px-2 py-1"
        />
        {form.image && (
          <div className="md:col-span-2 flex items-center gap-2">
            <span className="text-sm text-gray-500">Aperçu&nbsp;:</span>
            <img src={form.image} alt="aperçu" className="h-16 max-w-xs object-contain border" onError={e => e.target.style.display='none'} />
          </div>
        )}
        <input
          type="text"
          placeholder="Ingrédients (séparés par des virgules)"
          value={form.ingredients}
          onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Extras (nom:prix,nom:prix)"
          value={form.extraIngredients}
          onChange={e => setForm(f => ({ ...f, extraIngredients: e.target.value }))}
          className="border rounded px-2 py-1 md:col-span-2"
        />
        <button className="bg-blue-600 text-white px-4 py-1 rounded md:col-span-2" type="submit">
          {editId ? 'Modifier' : 'Ajouter'}
        </button>
        {editId && (
          <button type="button" className="bg-gray-400 text-white px-4 py-1 rounded md:col-span-2" onClick={() => { setEditId(null); setForm({ name: '', price: '', category: '', description: '', image: '', ingredients: '', extraIngredients: '' }); }}>
            Annuler la modification
          </button>
        )}
      </form>
      {loading ? (
        
        <div>Chargement...</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Nom</th>
              <th className="p-2 border">Prix</th>
              <th className="p-2 border">Catégorie</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Image</th>
              <th className="p-2 border">Ingrédients</th>
              <th className="p-2 border">Extras</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plats.map(plat => (
              <tr key={plat._id} className="border-b">
                <td className="p-2 border">{plat.name}</td>
                <td className="p-2 border">{plat.price} MAD</td>
                <td className="p-2 border">
                  {typeof plat.category === 'object'
                    ? plat.category.name
                    : (categories.find(c => c._id === plat.category)?.name || plat.category)}
                </td>
                <td className="p-2 border">{plat.description}</td>
                <td className="p-2 border">
                  {plat.image ? (
                    <img src={plat.image} alt={plat.name} className="h-12 max-w-[80px] object-contain border" onError={e => e.target.style.display='none'} />
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </td>
                <td className="p-2 border">{plat.ingredients?.join(', ')}</td>
                <td className="p-2 border">{plat.extraIngredients?.map(e => `${e.name} (${e.price} MAD)`).join(', ')}</td>
                <td className="p-2 border">
                  <button
                    className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                    onClick={() => handleEditPlat(plat)}
                  >
                    Éditer
                  </button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded"
                    onClick={() => handleDeletePlat(plat._id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 