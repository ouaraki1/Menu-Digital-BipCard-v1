// server.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket'); 
const Order = require('./models/Order');
dotenv.config();
const app = express();
const server = http.createServer(app);

const io = initSocket(server);
app.set('io', io); 

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/plats', require('./routes/menuRoutes'));
app.use('/api/categories', require('./routes/categorieRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analyse', require('./routes/analyseRoutes'));
app.use('/api/payment', require('./routes/PaymentRoutes'));


app.get('/success', (req, res) => {
  res.send('✅ Paiement réussi (Success)');
});

app.get('/cancel', (req, res) => {
  res.send('❌ Paiement annulé (Cancel)');
});



mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Erreur MongoDB:', err);
    process.exit(1);
  });

  setInterval(async () => {
  const now = new Date();
  const twentyMinutes = 20 * 60 * 1000;

  const ordersToHide = await Order.find({
    isPaid: true,
    confirmedAt: { $ne: null },
    isVisibleToClient: true
  });

  for (const order of ordersToHide) {
    const diff = now - new Date(order.confirmedAt);
    if (diff >= twentyMinutes) {
      order.isVisibleToClient = false;
      await order.save();
      console.log(`🕒 تم إخفاء الطلب رقم #${order.orderNumber} بعد مرور 20 دقيقة من تأكيده.`);
    }
  }
}, 60 * 1000); 
