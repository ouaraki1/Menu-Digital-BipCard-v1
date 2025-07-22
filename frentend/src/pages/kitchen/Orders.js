import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import KitchenNav from '../../components/KitchenNav';
import { useToast } from '../../components/ToastContext';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function getNextStatus(status) {
  if (status === 'confirmed') return 'preparing';
  if (status === 'preparing') return 'ready';
  return null;
}

export default function KitchenOrders() {
  const [orders, setOrders] = useState([]);
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMenu();
    fetchOrders();
    // Socket.io connection
    const socket = io(SOCKET_URL);
    socket.on('new_order', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      showToast('Nouvelle commande reçue', 'info');
    });
    socket.on('order_updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    });
    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  async function fetchMenu() {
    try {
      const res = await api.get('/plats');
      setPlats(res.data);
    } catch (err) {
      // ignore menu error for now
    }
  }

  async function fetchOrders() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders');
      const filtered = res.data.filter(o => !['cancelled', 'delivered'].includes(o.status));
      // Trier par date de création, la plus récente en premier
      const sorted = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
      showToast('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderId, nextStatus) {
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}`, { status: nextStatus });
      await fetchOrders();
      showToast('Statut de la commande mis à jour', 'success');
    } catch (err) {
      showToast('Erreur lors du changement de statut', 'error');
    } finally {
      setUpdating(null);
    }
  }

  function getPlatName(dishId) {
    // Gère à la fois les objets populés (mises à jour socket) et les ID (chargement initial)
    if (typeof dishId === 'object' && dishId !== null) {
      return dishId.name || dishId._id || 'Plat supprimé';
    }
    const plat = plats.find(p => p._id === dishId);
    return plat ? plat.name : (dishId || 'Plat supprimé');
  }

  return (
    <div>
      <KitchenNav />
      <h1 className="text-2xl font-bold mb-4">Commandes à traiter</h1>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order._id} className="border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-bold">Commande #{order.orderNumber}</span> — Chambre: <span className="font-mono">{
                  typeof order.roomId === 'object'
                    ? (order.roomId.num || order.roomId._id)
                    : order.roomId
                }</span>
              </div>
              <div>
                Statut: <span className="font-semibold">{order.status}</span>
                {getNextStatus(order.status) && (
                  <button
                    className="ml-4 px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
                    disabled={updating === order._id}
                    onClick={() => handleStatusChange(order._id, getNextStatus(order.status))}
                  >
                    Passer à "{getNextStatus(order.status)}"
                  </button>
                )}
              </div>
            </div>
            <div className="mb-2 text-sm text-gray-600">Lancée le: {formatTime(order.createdAt)}</div>
            <table className="w-full text-sm mb-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 border">Plat</th>
                  <th className="p-1 border">Qté</th>
                  <th className="p-1 border">Ingrédients retirés</th>
                  <th className="p-1 border">Extras ajoutés</th>
                </tr>
              </thead>
              <tbody>
                {order.dishes.map((dish, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-1 border">
                      {getPlatName(dish.dishId)}
                    </td>
                    <td className="p-1 border">{dish.quantity}</td>
                    <td className="p-1 border">{dish.removedIngredients && dish.removedIngredients.length > 0 ? dish.removedIngredients.join(', ') : '-'}</td>
                    <td className="p-1 border">
                      {dish.addedExtras && dish.addedExtras.length > 0
                        ? dish.addedExtras
                            .filter(ex => ex && ex.name)
                            .map((ex, j) => `${ex.name} (x${ex.quantity || 1})`)
                            .join(', ') || '-'
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* <div className="text-right font-bold">Total: {order.totalPrice} MAD</div> */}
          </div>
        ))}
      </div>
    </div> 
  );
} 