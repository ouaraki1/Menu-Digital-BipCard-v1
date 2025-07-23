import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import AdminNav from '../../components/AdminNav';
import { useToast } from '../../components/ToastContext';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchMenu();
    fetchOrders();

    // Connexion Socket.io
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
      // ignore
    }
  }

  async function fetchOrders() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/orders');
      // Trier par date de création, la plus récente en premier
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment(orderId) {
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}/pay`);
      showToast('Paiement confirmé', 'success');
      fetchOrders();
    } catch (err) {
      showToast('Erreur lors de la confirmation du paiement', 'error');
    } finally {
      setUpdating(null);
    }
  }

  async function handleStatusChange(orderId, nextStatus) {
    setUpdating(orderId);
    try {
      await api.put(`/orders/${orderId}`, { status: nextStatus });
      showToast('Statut de la commande mis à jour', 'success');
      fetchOrders();
    } catch (err) {
      showToast('Erreur lors du changement de statut', 'error');
    } finally {
      setUpdating(null);
    }
  }

  function getNextStatus(status) {
    if (status === 'preparing') return 'ready';
    if (status === 'ready') return 'delivered';
    return null;
  }

  function getPlatName(dishId) {
    const plat = plats.find(p => p._id === dishId);
    return plat ? plat.name : dishId;
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  return (
    <div>
      <AdminNav />
      <h1 className="text-2xl font-bold mb-4">Commandes</h1>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order._id} className="border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-bold">Commande #{order.orderNumber}</span> — Chambre: <span className="font-mono">
                  {typeof order.roomId === 'object'
                    ? (order.roomId.num || order.roomId._id)
                    : order.roomId}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span>Statut: <span className="font-semibold">{order.status}</span></span><br />
                <span>Méthode de paiement: <span className="font-semibold">{order.paymentMethod || '-'}</span></span><br/>  
                <span>Payé: <span className="font-semibold">{order.isPaid ? 'Oui' : 'Non'}</span></span>&nbsp;&nbsp;
                {/* Bouton confirmer paiement cash */}
                {order.paymentMethod === 'cash' && !order.isPaid && (
                  <button
                    className="mt-1 px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                    disabled={updating === order._id}
                    onClick={() => handleConfirmPayment(order._id)}
                  >
                    Confirmer paiement cash
                  </button>
                )}&nbsp;&nbsp;&nbsp;&nbsp;
                {/* Bouton changer statut */}
                {getNextStatus(order.status) && (
                  <button
                    className="mt-1 px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
                    disabled={updating === order._id}
                    onClick={() => handleStatusChange(order._id, getNextStatus(order.status))}
                  >
                    Passer à "{getNextStatus(order.status)}"
                  </button>
                )}&nbsp;&nbsp;&nbsp;&nbsp;
                {/* Bouton Annuler */}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <button
                    className="mt-1 px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                    disabled={updating === order._id}
                    onClick={async () => {
                      setUpdating(order._id);
                      try {
                        await api.post(`/orders/${order._id}/cancel`);
                        showToast('Commande annulée', 'success');
                        fetchOrders();
                      } catch (err) {
                        showToast('Erreur lors de l\'annulation', 'error');
                      } finally {
                        setUpdating(null);
                      }
                    }}
                  >
                    Annuler
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
                      {dish.dishId && typeof dish.dishId === 'object'
                        ? (dish.dishId.name || dish.dishId._id || 'Plat supprimé')
                        : (dish.dishId ? getPlatName(dish.dishId) : 'Plat supprimé')}
                    </td>
                    <td className="p-1 border">{dish.quantity}</td>
                    <td className="p-1 border">{dish.removedIngredients && dish.removedIngredients.length > 0 ? dish.removedIngredients.join(', ') : '-'}</td>
                    <td className="p-1 border">
                      {dish.addedExtras && dish.addedExtras.length > 0
                        ? dish.addedExtras.filter(ex => ex && ex.name).map((ex, j) => `${ex.name} (x${ex.quantity || 1})`).join(', ') || '-'
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right font-bold"><b >Total: {order.totalPrice} MAD</b></div><br/><br/>
          </div>
        ))}
      </div>
    </div>
  );
} 