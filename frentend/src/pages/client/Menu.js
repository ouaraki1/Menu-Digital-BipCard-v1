import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function ClientMenu() {
  const { roomNum } = useParams();
  const navigate = useNavigate();
  const [plats, setPlats] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'category'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlat, setSelectedPlat] = useState(null);
  const [removedIngredients, setRemovedIngredients] = useState([]);
  const [addedExtras, setAddedExtras] = useState([]);
  const [extraQty, setExtraQty] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchMenu();

    const socket = io(SOCKET_URL);
    socket.on('menu_updated', () => fetchMenu(selectedCategory));
    socket.on('categories_updated', fetchCategories);

    return () => socket.disconnect();
  }, [selectedCategory]); // Re-run effect if selectedCategory changes

  async function fetchCategories() {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      // ignore
    }
  }

  async function fetchMenu(categoryId) {
    setLoading(true);
    setError('');
    try {
      let res;
      if (filterMode === 'category' && categoryId) {
        res = await api.get(`/plats/category/${categoryId}`);
      } else {
        res = await api.get('/plats');
      }
      setPlats(res.data);
    } catch (err) {
      setError('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  }

  function handleCategoryChange(e) {
    const catId = e.target.value;
    setSelectedCategory(catId);
    fetchMenu(catId);
  }

  function handleFilterMode(mode) {
    setFilterMode(mode);
    setSelectedCategory('');
    if (mode === 'all') {
      fetchMenu();
    }
  }

  function openCustomize(plat) {
    setSelectedPlat(plat);
    setRemovedIngredients([]);
    setAddedExtras([]);
    setExtraQty({});
    setShowModal(true);
  }

  function handleRemoveIngredient(ingredient) {
    setRemovedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  }

  function handleAddExtra(extra) {
    setAddedExtras(prev =>
      prev.find(e => e.name === extra.name)
        ? prev.filter(e => e.name !== extra.name)
        : [...prev, { name: extra.name, price: extra.price, quantity: extraQty[extra.name] || 1 }]
    );
  }

  function handleExtraQtyChange(extra, qty) {
    setExtraQty(prev => ({ ...prev, [extra.name]: qty }));
    setAddedExtras(prev =>
      prev.map(e =>
        e.name === extra.name ? { ...e, quantity: qty } : e
      )
    );
  }

  function addToCartWithCustomization() {
    setCart(prev => {
      const found = prev.find(item =>
        item.dishId === selectedPlat._id &&
        JSON.stringify(item.removedIngredients) === JSON.stringify(removedIngredients) &&
        JSON.stringify(item.addedExtras) === JSON.stringify(addedExtras)
      );
      if (found) {
        return prev.map(item =>
          item.dishId === selectedPlat._id &&
          JSON.stringify(item.removedIngredients) === JSON.stringify(removedIngredients) &&
          JSON.stringify(item.addedExtras) === JSON.stringify(addedExtras)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            dishId: selectedPlat._id,
            name: selectedPlat.name,
            price: selectedPlat.price,
            quantity: 1,
            removedIngredients: [...removedIngredients],
            addedExtras: [...addedExtras]
          }
        ];
      }
    });
    setShowModal(false);
  }

  function removeFromCart(item) {
    setCart(prev => {
      if (item.quantity > 1) {
        return prev.map(i =>
          i === item ? { ...i, quantity: i.quantity - 1 } : i
        );
      } else {
        return prev.filter(i => i !== item);
      }
    });
  }

  function goToPayment() {
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate(`/client/${roomNum}/payment`);
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Menu</h1>
      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-1 rounded ${filterMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleFilterMode('all')}
        >
          Tous les plats
        </button>
        <button
          className={`px-3 py-1 rounded ${filterMode === 'category' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          onClick={() => handleFilterMode('category')}
        >
          Par catégorie
        </button>
        {filterMode === 'category' && (
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="border rounded px-2 py-1 ml-2"
          >
            <option value="">Choisir une catégorie</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        )}
      </div>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-1 gap-4">
        {plats.map(plat => (
          <div key={plat._id} className="border rounded p-4 bg-white shadow flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{plat.name}</div>
              <div className="text-gray-600">{plat.price} MAD</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openCustomize(plat)} className="px-2 py-1 bg-yellow-400 text-white rounded">Personnaliser</button>
            </div>
          </div>
        ))}
      </div>
      <h2 className="text-xl font-bold mt-8 mb-2">Votre commande</h2>
      <div className="space-y-2">
        {cart.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between border p-2 rounded bg-gray-50">
            <div>
              <span className="font-bold">{item.name}</span> x{item.quantity}
              {item.removedIngredients.length > 0 && (
                <div className="text-xs text-gray-600">Sans: {item.removedIngredients.join(', ')}</div>
              )}
              {item.addedExtras.length > 0 && (
                <div className="text-xs text-gray-600">Extras: {item.addedExtras.map(e => `${e.name} (x${e.quantity})`).join(', ')}</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => removeFromCart(item)} className="px-2 py-1 bg-gray-200 rounded">-</button>
              <span>{item.quantity}</span>
              {/* Pas de bouton + ici, repasser par personnaliser pour ajouter */}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div className="font-bold">Total: {cart.reduce((sum, item) => sum + (item.quantity * (item.price || 0) + item.addedExtras.reduce((s, e) => s + (e.price * e.quantity), 0) * item.quantity), 0)} MAD</div>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={cart.length === 0}
          onClick={goToPayment}
        >
          Commander
        </button>
      </div>
      {/* Modal de personnalisation */}
      {showModal && selectedPlat && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Personnaliser {selectedPlat.name}</h2>
            <div className="mb-4">
              <div className="font-semibold mb-1">Retirer des ingrédients :</div>
              {selectedPlat.ingredients && selectedPlat.ingredients.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedPlat.ingredients.map(ing => (
                    <button
                      key={ing}
                      className={`px-2 py-1 rounded border ${removedIngredients.includes(ing) ? 'bg-red-400 text-white' : 'bg-gray-100'}`}
                      onClick={() => handleRemoveIngredient(ing)}
                    >
                      {ing}
                    </button>
                  ))}
                </div>
              ) : <div className="text-gray-500">Aucun ingrédient personnalisable</div>}
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-1">Ajouter des extras :</div>
              {selectedPlat.extraIngredients && selectedPlat.extraIngredients.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {selectedPlat.extraIngredients.map(extra => (
                    <div key={extra.name} className="flex items-center gap-2">
                      <button
                        className={`px-2 py-1 rounded border ${addedExtras.find(e => e.name === extra.name) ? 'bg-green-400 text-white' : 'bg-gray-100'}`}
                        onClick={() => handleAddExtra(extra)}
                      >
                        {extra.name} (+{extra.price} MAD)
                      </button>
                      {addedExtras.find(e => e.name === extra.name) && (
                        <input
                          type="number"
                          min={1}
                          value={extraQty[extra.name] || 1}
                          onChange={e => handleExtraQtyChange(extra, Number(e.target.value))}
                          className="w-16 border rounded px-1 py-0.5"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : <div className="text-gray-500">Aucun extra disponible</div>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded">Annuler</button>
              <button onClick={addToCartWithCustomization} className="px-4 py-2 bg-blue-600 text-white rounded">Ajouter au panier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 