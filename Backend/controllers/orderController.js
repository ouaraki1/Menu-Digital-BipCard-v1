// controllers/orderController.js
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Counter = require('../models/Counter');
const Plat = require('../models/Plat');


// dans orders pas afficher paymentmethode / ispaid | et afficher plats ... et mbr room | 
//problem with the code de pas afficher les orders de cette chambre par exemple  chambre 2 afficher les order afficher 
// const getAllOrders = asyncHandler(async (req, res) => {
//   const userRole = req.user.role;
//   let orders = await Order.find()
//     .populate('roomId')
//     .populate('dishes.dishId');

//   const now = new Date();

//   if (userRole === 'client') {
//     const clientRoomId = req.user.roomId;
//     orders = orders.filter(order => {
//       if (!order.roomId || order.roomId.toString() !== clientRoomId.toString()) return false;
//       if (!order.isVisibleToClient) return false;

//       if (order.status === 'confirmed' && order.isPaid && order.confirmedAt) {
//         const diff = now - new Date(order.confirmedAt);
//         return diff < 20 * 60 * 1000;
//       }

//       return true;
//     });
//   }

//   if (userRole === 'kitchen') {
//     orders = orders.map(order => {
//       const filteredDishes = order.dishes.map(dish => {
//         const plat = dish.dishId;
//         return {
//           dishId: plat._id,
//           name: plat.name,
//           quantity: dish.quantity,
//           removedIngredients: dish.removedIngredients,
//           addedExtras: dish.addedExtras,
//         };
//       });
//       return {
//         _id: order._id,
//         roomId: order.roomId,
//         orderNumber: order.orderNumber,
//         paymentMethod: order.paymentMethod,
//         status: order.status,
//         isPaid: order.isPaid,
//         dishes: filteredDishes,
//         createdAt: order.createdAt,
//         confirmedAt: order.confirmedAt
//       };
//     });
//   }

//   res.json(orders);
// });


const getAllOrders = asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const now = new Date();

  // ✅ الزبون
  if (userRole === 'client') {
    const clientRoomId = req.user.roomId?.toString(); // تأكد أنه string

    let orders = await Order.find({
      roomId: clientRoomId,
      isVisibleToClient: true,
    }).populate('roomId').populate('dishes.dishId');

    // ✅ فلترة الطلبات المؤكدة المنتهية بعد 20 دقيقة
    orders = orders.filter(order => {
      if (order.status === 'confirmed' && order.isPaid && order.confirmedAt) {
        const diff = now - new Date(order.confirmedAt);
        return diff < 20 * 60 * 1000; // فقط الطلبات خلال آخر 20 دقيقة
      }
      // ✅ إخفاء الطلبات الملغاة بعد 10 دقائق
      if (order.status === 'cancelled' && order.updatedAt) {
        const diff = now - new Date(order.updatedAt);
        return diff < 10 * 60 * 1000; // 10 دقائق
      }

      return true; // باقي الحالات تظهر
    });

    return res.json(orders);
  }

  // ✅ الادمين والمطبخ
  let orders = await Order.find()
    .populate('roomId')
    .populate('dishes.dishId');

  if (userRole === 'kitchen') {
    // Pour chaque commande, on s'assure de ne garder que les plats qui existent encore
    // (au cas où un plat aurait été supprimé de la base de données)
    orders.forEach(order => {
      order.dishes = order.dishes.filter(dish => dish.dishId);
    });
  }

  res.json(orders);
});




const addOrder = asyncHandler(async (req, res) => {
  const { roomId, dishes, paymentMethod } = req.body;

  if (!roomId || !dishes || dishes.length === 0) {
    res.status(400);
    throw new Error('Room ID and dishes are required');
  }

  let totalPrice = 0;
  for (const item of dishes) {
    const plat = await Plat.findById(item.dishId);
    if (!plat) {
      res.status(400);
      throw new Error(`الطبق بمعرف ${item.dishId} غير موجود`);
    }

    let extraTotal = 0;
    if (item.addedExtras && Array.isArray(item.addedExtras)) {
      for (const extra of item.addedExtras) {
        const qty = extra.quantity || 1;
        const match = plat.extraIngredients.find(e => e.name === extra.name);
        if (match) extraTotal += match.price * qty;
        else extraTotal += (extra.price || 0) * qty;
      }
    }

    totalPrice += (plat.price * item.quantity) + extraTotal;
  }

  const counter = await Counter.findOneAndUpdate(
    { name: 'orderNumber' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const order = new Order({
    roomId,
    dishes,
    paymentMethod,
    orderNumber: counter.value,
    totalPrice,
    status: paymentMethod === 'online' ? 'confirmed' : 'pending',
    isPaid: paymentMethod === 'online',
    confirmedAt: paymentMethod === 'online' ? new Date() : null,
    createdAt: new Date(),
  });

  const createdOrder = await order.save();

  const populatedOrder = await Order.findById(createdOrder._id).populate('roomId').populate('dishes.dishId');

  const notifAdmin = new Notification({
    to: 'admin',
    orderId: createdOrder._id,
    message: `طلب جديد رقم #${createdOrder.orderNumber} من الغرفة ${roomId}`,
  });

  const notifKitchen = new Notification({
    to: 'kitchen',
    orderId: createdOrder._id,
    message: `طلب جديد رقم #${createdOrder.orderNumber} من الغرفة ${roomId}`,
  });

  await Promise.all([notifAdmin.save(), notifKitchen.save()]);

  const io = req.app.get('io');
  if (io) {
    io.emit('new_order', populatedOrder);
    io.emit('new_notification', notifAdmin);
    io.emit('new_notification', notifKitchen);
  }


  if (paymentMethod === 'online') {
    return res.status(200).json({ message: 'الدفع سيتم عبر Stripe فقط' });
  }

  if (paymentMethod === 'cash') {
    setTimeout(async () => {
      let latestOrder = await Order.findById(createdOrder._id);
      if (latestOrder && latestOrder.status === 'pending') {
        latestOrder.status = 'confirmed';
        latestOrder.confirmedAt = new Date();
        await latestOrder.save();

        latestOrder = await Order.findById(latestOrder._id).populate('roomId').populate('dishes.dishId');

        const autoNotifAdmin = new Notification({
          to: 'admin',
          orderId: latestOrder._id,
          message: `تم تأكيد الطلب رقم #${latestOrder.orderNumber} تلقائيًا من الغرفة ${roomId}`,
        });

        const autoNotifKitchen = new Notification({
          to: 'kitchen',
          orderId: latestOrder._id,
          message: `تم تأكيد الطلب رقم #${latestOrder.orderNumber} تلقائيًا من الغرفة ${roomId}`,
        });

        const autoNotifClient = new Notification({
          to: 'client',
          orderId: latestOrder._id,
          message: `تم تأكيد طلبك رقم #${latestOrder.orderNumber} تلقائيًا`,
        });

        await Promise.all([
          autoNotifAdmin.save(),
          autoNotifKitchen.save(),
          autoNotifClient.save(),
        ]);

        if (io) {
          io.emit('order_updated', latestOrder);
          io.emit('new_notification', autoNotifAdmin);
          io.emit('new_notification', autoNotifKitchen);
          io.emit('new_notification', autoNotifClient);
        }
      }
    }, 2 * 60 * 1000);
  }

  res.status(201).json(populatedOrder);
});

const confirmOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || order.status !== 'pending') {
    return res.status(400).json({ message: 'لا يمكن تأكيد هذا الطلب' });
  }

  order.status = 'confirmed';
  order.confirmedAt = new Date();
  await order.save();

  const populatedOrder = await Order.findById(order._id).populate('roomId').populate('dishes.dishId');

  const notifAdmin = new Notification({
    to: 'admin',
    orderId: order._id,
    message: `تم تأكيد الطلب رقم #${order.orderNumber} يدويًا من الغرفة ${order.roomId}`,
  });

  const notifKitchen = new Notification({
    to: 'kitchen',
    orderId: order._id,
    message: `تم تأكيد الطلب رقم #${order.orderNumber} يدويًا من الغرفة ${order.roomId}`,
  });

  const notifClient = new Notification({
    to: 'client',
    orderId: order._id,
    message: `تم تأكيد طلبك رقم #${order.orderNumber} بنجاح`,
  });

  await Promise.all([
    notifAdmin.save(),
    notifKitchen.save(),
    notifClient.save(),
  ]);

  const io = req.app.get('io');
  io.emit('order_updated', populatedOrder);
  io.emit('new_notification', notifAdmin);
  io.emit('new_notification', notifKitchen);
  io.emit('new_notification', notifClient);

  res.json({ message: 'تم تأكيد الطلب', order: populatedOrder });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'الطلب غير موجود' });
  }

  const userRole = req.user.role;

  // Admin : peut annuler à tout moment sauf si déjà annulée ou livrée
  if (userRole === 'admin') {
    if (order.status === 'cancelled' || order.status === 'delivered') {
      return res.status(400).json({ message: 'Impossible d\'annuler cette commande.' });
    }
  } else if (userRole === 'client') {
    // Client : seulement si pending
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'لا يمكن إلغاء هذا الطلب' });
    }
  } else {
    return res.status(403).json({ message: 'ليس لديك صلاحية لإلغاء هذا الطلب' });
  }

  order.status = 'cancelled';
  await order.save();

  const populatedOrder = await Order.findById(order._id).populate('roomId').populate('dishes.dishId');

  const notifAdmin = new Notification({
    to: 'admin',
    orderId: order._id,
    message: `تم إلغاء الطلب رقم #${order.orderNumber} من الغرفة ${order.roomId}`,
  });

  const notifKitchen = new Notification({
    to: 'kitchen',
    orderId: order._id,
    message: `تم إلغاء الطلب رقم #${order.orderNumber} من الغرفة ${order.roomId}`,
  });

  const notifClient = new Notification({
    to: 'client',
    orderId: order._id,
    message: `تم إلغاء طلبك رقم #${order.orderNumber} بنجاح`,
  });

  await Promise.all([
    notifAdmin.save(),
    notifKitchen.save(),
    notifClient.save(),
  ]);

  const io = req.app.get('io');
  io.emit('order_updated', populatedOrder);
  io.emit('new_notification', notifAdmin);
  io.emit('new_notification', notifKitchen);
  io.emit('new_notification', notifClient);

  res.json({ message: 'تم إلغاء الطلب', order: populatedOrder });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, isPaid } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });

  const userRole = req.user.role;
  if (userRole === 'kitchen') {
    const allowedTransitions = {
      confirmed: 'preparing',
      preparing: 'ready'
    };
    const currentStatus = order.status;
    if (!allowedTransitions[currentStatus] || allowedTransitions[currentStatus] !== status) {
      return res.status(403).json({ message: `المطبخ لا يمكنه تغيير الحالة من ${currentStatus} إلى ${status}` });
    }
    order.status = status;
  } else if (userRole === 'admin') {
    if (status) order.status = status;
    if (typeof isPaid === 'boolean') order.isPaid = isPaid;
  } else {
    return res.status(403).json({ message: 'ليس لديك صلاحية لتحديث هذا الطلب' });
  }

  await order.save();

  const populatedOrder = await Order.findById(order._id).populate('roomId').populate('dishes.dishId');

  const notifClient = new Notification({
    to: 'client',
    orderId: order._id,
    message: `تم تغيير حالة طلبك رقم #${order.orderNumber} إلى "${order.status}"`,
  });

  const notifAdmin = new Notification({
    to: 'admin',
    orderId: order._id,
    message: `تم تحديث حالة الطلب رقم #${order.orderNumber} إلى "${order.status}"`,
  });

  const notifKitchen = new Notification({
    to: 'kitchen',
    orderId: order._id,
    message: `تم تحديث حالة الطلب رقم #${order.orderNumber} إلى "${order.status}"`,
  });

  await Promise.all([
    notifClient.save(),
    notifAdmin.save(),
    notifKitchen.save(),
  ]);

  const io = req.app.get('io');
  io.emit('order_updated', populatedOrder);
  io.emit('new_notification', notifClient);
  io.emit('new_notification', notifAdmin);
  io.emit('new_notification', notifKitchen);

  res.json(populatedOrder);
});

const confirmPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({ message: 'الطلب غير موجود' });
  }

  if (order.isPaid) {
    return res.status(400).json({ message: 'تم تأكيد الدفع سابقًا' });
  }

  const userRole = req.user.role;
  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'فقط الادمين يمكنه تأكيد الدفع' });
  }

  order.isPaid = true;
  await order.save();

  const populatedOrder = await Order.findById(order._id).populate('roomId').populate('dishes.dishId');

  const notifClient = new Notification({
    to: 'client',
    orderId: order._id,
    message: `valider payment de number d'order #${order.orderNumber} pour adminstration`,
  });

  await notifClient.save();

  const io = req.app.get('io');
  io.emit('order_paid', populatedOrder);
  io.emit('new_notification', notifClient);

  res.json({ message: ' valider payment ', order: populatedOrder });
});

module.exports = {
  getAllOrders,
  addOrder,
  updateOrderStatus,
  confirmOrder,
  cancelOrder,
  confirmPayment
};