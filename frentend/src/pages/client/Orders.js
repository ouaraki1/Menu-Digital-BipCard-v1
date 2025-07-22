import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function ClientOrders() {
  const { roomNum } = useParams();
  const [orders, setOrders] = useState([]);
  const [plats, setPlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMenu();
    fetchOrders();
    // Socket.io connection
    const socket = io(SOCKET_URL);
    socket.on('order_updated', (updatedOrder) => {
      // Only update if the order is for this room
      if (updatedOrder.roomId === roomNum) {
        setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      }
    });
    socket.on('new_order', (newOrder) => {
      if (newOrder.roomId === roomNum) {
        setOrders(prev => [newOrder, ...prev]);
      }
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
      setOrders(res.data.filter(o => o.roomId === roomNum));
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }

  function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function getPlatName(dishId) {
    const plat = plats.find(p => p._id === dishId);
    return plat ? plat.name : dishId;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Suivi de vos commandes</h1>
      {loading && <div>Chargement...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {orders.length === 0 && !loading && <div>Aucune commande trouvée.</div>}
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order._id} className="border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="font-bold">Commande #{order.orderNumber}</span>
              </div>
              <div>
                Statut: <span className="font-semibold">{order.status}</span>
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
                    <td className="p-1 border">{getPlatName(dish.dishId)}</td>
                    <td className="p-1 border">{dish.quantity}</td>
                    <td className="p-1 border">{dish.removedIngredients && dish.removedIngredients.length > 0 ? dish.removedIngredients.join(', ') : '-'}</td>
                    <td className="p-1 border">
                      {dish.addedExtras && dish.addedExtras.length > 0
                        ? dish.addedExtras.map((ex, j) => `${ex.name} (x${ex.quantity || 1})`).join(', ')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right font-bold">Total: {order.totalPrice} MAD</div>
          </div>
        ))}
      </div>
    </div>
  );
} 