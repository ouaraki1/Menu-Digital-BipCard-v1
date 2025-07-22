// controllers/PaymentController.js
const asyncHandler = require('express-async-handler');
const Stripe = require('stripe');
const Order = require('../models/Order');
const Plat = require('../models/Plat');
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');
const Payment = require('../models/Payment');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = asyncHandler(async (req, res) => {
  const { dishes, roomId } = req.body;

  if (!dishes || dishes.length === 0 || !roomId) {
    res.status(400);
    throw new Error('الطلب غير صالح. يرجى اختيار الأطباق ورقم الغرفة.');
  }

  const platIds = dishes.map((d) => d.dishId);
  const plats = await Plat.find({ _id: { $in: platIds } });

  const lineItems = dishes.map((dish) => {
    const plat = plats.find((p) => p._id.toString() === dish.dishId);
    return {
      price_data: {
        currency: 'mad',
        product_data: {
          name: plat.name,
        },
        unit_amount: plat.price * 100,
      },
      quantity: dish.quantity,
    };
  });

  const totalPrice = dishes.reduce((sum, dish) => {
    const plat = plats.find((p) => p._id.toString() === dish.dishId);
    return sum + plat.price * dish.quantity;
  }, 0);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,
    metadata: {
      roomId,
      totalPrice,
      dishes: JSON.stringify(dishes),
    },
  });

  res.json({ url: session.url });
});

const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const dishes = JSON.parse(session.metadata.dishes);
    const totalPrice = session.metadata.totalPrice;
    const roomId = session.metadata.roomId;

    const counter = await Counter.findOneAndUpdate(
      { name: 'orderNumber' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const newOrder = await Order.create({
      dishes,
      totalPrice,
      roomId,
      status: 'confirmed',
      paymentMethod: 'online',
      isPaid: true,
      paidAt: new Date(),
      confirmedAt: new Date(),
      createdAt: new Date(),
    });

    await Payment.create({
      orderId: newOrder._id,
      stripePaymentIntentId: session.payment_intent,
      amount: session.amount_total / 100,
      currency: session.currency || 'mad',
      paymentMethod: 'card',
      status: 'paid',
    });

    const populatedOrder = await Order.findById(newOrder._id).populate('roomId').populate('dishes.dishId');

    const notifAdmin = new Notification({
      to: 'admin',
      orderId: newOrder._id,
      message: `طلب جديد رقم #${newOrder.orderNumber} تم دفعه بنجاح من الغرفة ${roomId}`,
    });

    const notifKitchen = new Notification({
      to: 'kitchen',
      orderId: newOrder._id,
      message: `طلب جديد رقم #${newOrder.orderNumber} تم دفعه بنجاح من الغرفة ${roomId}`,
    });

    const notifClient = new Notification({
      to: 'client',
      orderId: newOrder._id,
      message: `تم تأكيد طلبك رقم #${newOrder.orderNumber} بعد الدفع بنجاح`,
    });

    await Promise.all([
      notifAdmin.save(),
      notifKitchen.save(),
      notifClient.save(),
    ]);

    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', populatedOrder);
      io.emit('new_notification', notifAdmin);
      io.emit('new_notification', notifKitchen);
      io.emit('new_notification', notifClient);
    }

    console.log('✅ تم إنشاء الطلب بعد الدفع:', newOrder._id);
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const roomId = session.metadata?.roomId;

    const notifClient = new Notification({
      to: 'client',
      orderId: null,
      message: `⚠️ لم يتم إتمام الدفع بنجاح. يرجى المحاولة مجددًا من الغرفة ${roomId || ''}`,
    });

    await notifClient.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('new_notification', notifClient);
    }

    console.log('⚠️ جلسة Stripe منتهية بدون دفع للغرفة:', roomId);
  }

  res.status(200).json({ received: true });
});

module.exports = {
  createCheckoutSession,
  stripeWebhook,
};
