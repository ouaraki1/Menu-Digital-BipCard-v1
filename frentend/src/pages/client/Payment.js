import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ToastContext';

export default function ClientPayment() {
  const { roomNum } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [timer, setTimer] = useState(120); // 2 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef();
  const { showToast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    if (paymentMethod === 'cash' && timerActive && timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [paymentMethod, timerActive, timer]);

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      if (paymentMethod === 'cash') {
        setTimerActive(true);
      } else if (paymentMethod === 'online') {
        // Paiement Stripe
        const res = await api.post('/payment/create-checkout-session', {
          dishes: cart.map(item => ({ dishId: item.dishId, quantity: item.quantity })),
          roomId: roomNum
        });
        if (res.data && res.data.url) {
          window.location.href = res.data.url;
        } else {
          setError('Erreur lors de la création de la session de paiement.');
          showToast('Erreur lors de la création de la session de paiement.', 'error');
        }
      }
    } catch (err) {
      setError('Erreur lors du paiement.');
      showToast('Erreur lors du paiement.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmCashOrder = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/orders', {
        roomId: roomNum,
        dishes: cart.map(item => ({
          dishId: item.dishId,
          quantity: item.quantity,
          removedIngredients: item.removedIngredients || [],
          addedExtras: item.addedExtras || []
        })),
        paymentMethod: 'cash'
      });
      localStorage.removeItem('cart');
      showToast('Commande envoyée avec succès', 'success');
      navigate(`/client/${roomNum}/orders`);
    } catch (err) {
      setError('Erreur lors de la création de la commande.');
      showToast('Erreur lors de la création de la commande.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cancelCashOrder = () => {
    setTimerActive(false);
    setTimer(120);
    setError('Commande annulée.');
    showToast('Commande annulée.', 'info');
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Paiement</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4">
        <label className="mr-4">
          <input
            type="radio"
            name="payment"
            value="cash"
            checked={paymentMethod === 'cash'}
            onChange={() => setPaymentMethod('cash')}
            disabled={timerActive}
          />{' '}
          Paiement en espèces (cash)
        </label>
        <label>
          <input
            type="radio"
            name="payment"
            value="online"
            checked={paymentMethod === 'online'}
            onChange={() => setPaymentMethod('online')}
            disabled={timerActive}
          />{' '}
          Paiement en ligne (Stripe)
        </label>
      </div>
      <div className="mb-6">
        <h2 className="font-bold mb-2">Récapitulatif</h2>
        <ul className="mb-2">
          {cart.map(item => (
            <li key={item.dishId}>
              {item.name} x {item.quantity}
            </li>
          ))}
        </ul>
        <div className="font-bold">Total: {cart.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0)} MAD</div>
      </div>
      {paymentMethod === 'cash' && timerActive ? (
        <div className="mb-4">
          <div className="mb-2">Merci de patienter <span className="font-bold">{timer}s</span> ou confirmer/annuler la commande :</div>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            onClick={confirmCashOrder}
            disabled={loading}
          >
            Confirmer la commande
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={cancelCashOrder}
            disabled={loading}
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handlePayment}
          disabled={loading || cart.length === 0}
        >
          Payer
        </button>
      )}
    </div>
  );
} 



