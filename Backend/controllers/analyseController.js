// controllers/analysecontroller.js
const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Plat = require('../models/Plat');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const isInRange = (date, start, end) => date >= start && date <= end;

const getStatsForPeriod = async (startDate, endDate, roomId = null) => {
  const matchStage = {
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
    },
    status: { $in: ['confirmed', 'preparing', 'ready', 'delivered'] }
  };

  if (roomId) {
    matchStage.roomId = new mongoose.Types.ObjectId(roomId);
  }

  const stats = await Order.aggregate([
    { $match: matchStage },

    {
      $lookup: {
        from: 'plats',
        localField: 'dishes.dishId',
        foreignField: '_id',
        as: 'platDetails'
      }
    },

    { $unwind: '$dishes' },

    {
      $lookup: {
        from: 'plats',
        localField: 'dishes.dishId',
        foreignField: '_id',
        as: 'dishInfo'
      }
    },

    { $unwind: '$dishInfo' },

    {
      $addFields: {
        preparationTime: {
          $cond: [
            { $and: [{ $ifNull: ['$confirmedAt', false] }, { $ifNull: ['$readyAt', false] }] },
            { $divide: [{ $subtract: ['$readyAt', '$confirmedAt'] }, 60000] },
            null
          ]
        }
      }
    },

    {
      $group: {
        _id: null,
        orderIds: { $addToSet: '$_id' },
        totalDishesSold: { $sum: '$dishes.quantity' },
        totalRevenue: {
          $sum: {
            $multiply: ['$dishes.quantity', '$dishInfo.price']
          }
        },
        cashPayments: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, 1, 0] }
        },
        onlinePayments: {
          $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, 1, 0] }
        },
        ordersPerHour: { $push: { $hour: '$createdAt' } },
        dishes: {
          $push: {
            name: '$dishInfo.name',
            price: '$dishInfo.price',
            quantity: '$dishes.quantity'
          }
        },
        totalPreparationTime: { $sum: { $ifNull: ['$preparationTime', 0] } },
        preparationCount: {
          $sum: { $cond: [{ $ifNull: ['$preparationTime', false] }, 1, 0] }
        }
      }
    },

    {
      $project: {
        numberOfOrders: { $size: '$orderIds' },
        totalDishesSold: 1,
        totalRevenue: 1,
        cashPayments: 1,
        onlinePayments: 1,
        ordersPerHour: 1,
        dishes: 1,
        avgPreparationTime: {
          $cond: [
            { $eq: ['$preparationCount', 0] },
            0,
            { $divide: ['$totalPreparationTime', '$preparationCount'] }
          ]
        }
      }
    }
  ]);

  if (!stats.length) {
    return {
      date: 'لا توجد بيانات',
      numberOfOrders: 0,
      totalDishesSold: 0,
      totalRevenue: 0,
      paymentStats: {
        cash: 0,
        online: 0,
        cashPercentage: '0',
        onlinePercentage: '0'
      },
      avgPreparationTime: 0,
      peakHour: null,
      ordersPerHour: Array(24).fill(0),
      topDishes: [],
      allDishesSorted: []
    };
  }

  const s = stats[0];

  const ordersPerHour = Array(24).fill(0);
  s.ordersPerHour.forEach(h => ordersPerHour[h]++);

  const dishMap = new Map();
  s.dishes.forEach(d => {
    if (!dishMap.has(d.name)) {
      dishMap.set(d.name, { name: d.name, quantity: 0, totalRevenue: 0 });
    }
    const plat = dishMap.get(d.name);
    plat.quantity += d.quantity;
    plat.totalRevenue += d.quantity * d.price;
  });

  const allDishesSorted = Array.from(dishMap.values()).sort((a, b) => b.quantity - a.quantity);
  const totalPayments = s.cashPayments + s.onlinePayments;

  return {
    date:
      new Date(startDate).toLocaleDateString('ar-MA') +
      ' - ' +
      new Date(endDate).toLocaleDateString('ar-MA'),
    numberOfOrders: s.numberOfOrders,
    totalDishesSold: s.totalDishesSold,
    totalRevenue: s.totalRevenue,
    paymentStats: {
      cash: s.cashPayments,
      online: s.onlinePayments,
      cashPercentage: totalPayments ? ((s.cashPayments / totalPayments) * 100).toFixed(1) : '0',
      onlinePercentage: totalPayments ? ((s.onlinePayments / totalPayments) * 100).toFixed(1) : '0'
    },
    avgPreparationTime: s.avgPreparationTime.toFixed(1),
    peakHour: ordersPerHour.indexOf(Math.max(...ordersPerHour)),
    ordersPerHour,
    topDishes: allDishesSorted.slice(0, 5),
    allDishesSorted
  };
};

const getTodayStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const data = await getStatsForPeriod(today, today);
  res.json(data);
});

const getStatsByPeriod = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) throw new Error('يرجى تحديد تاريخ البداية والنهاية');
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data = await getStatsForPeriod(start, end);
  res.json(data);
});

const compareTwoPeriods = asyncHandler(async (req, res) => {
  const { start1, end1, start2, end2 } = req.query;
  if (!start1 || !end1 || !start2 || !end2) throw new Error('يرجى تحديد الفترات كاملة');

  const stats1 = await getStatsForPeriod(new Date(start1), new Date(end1));
  const stats2 = await getStatsForPeriod(new Date(start2), new Date(end2));

  const calcGrowth = (val1, val2) => {
    if (val1 === 0) return 'N/A';
    return ((val2 - val1) / val1 * 100).toFixed(1);
  };

  res.json({
    period1: stats1,
    period2: stats2,
    comparison: {
      revenueGrowth: calcGrowth(stats1.totalRevenue, stats2.totalRevenue) + '%',
      ordersGrowth: calcGrowth(stats1.numberOfOrders, stats2.numberOfOrders) + '%',
      dishesSoldGrowth: calcGrowth(stats1.totalDishesSold, stats2.totalDishesSold) + '%'
    }
  });
});

const getStatsByRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();
  const data = await getStatsForPeriod(start, end, roomId);
  res.json(data);
});

const exportStatsPDF = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) throw new Error('يرجى تحديد التاريخ');

  const stats = await getStatsForPeriod(new Date(startDate), new Date(endDate));

  const doc = new PDFDocument({ margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="rapport-statistiques.pdf"`);

  doc.pipe(res);
  doc.fontSize(18).text('📊 تقرير الإحصائيات', { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text(`📅 الفترة: ${stats.date}`);
  doc.text(`عدد الطلبات: ${stats.numberOfOrders}`);
  doc.text(`عدد الأطباق المباعة: ${stats.totalDishesSold}`);
  doc.text(`إجمالي الأرباح: ${stats.totalRevenue.toFixed(2)} درهم`);
  doc.text(`نقدًا: ${stats.paymentStats.cash} (${stats.paymentStats.cashPercentage}%)`);
  doc.text(`أونلاين: ${stats.paymentStats.online} (${stats.paymentStats.onlinePercentage}%)`);
  doc.text(`⏱ متوسط مدة التحضير: ${stats.avgPreparationTime} دقيقة`);
  doc.text(`⏰ وقت الذروة: ${stats.peakHour}:00`);

  doc.moveDown().fontSize(14).text('🍽 الأطباق الأكثر مبيعًا:');
  stats.topDishes.forEach((dish, i) => {
    doc.fontSize(12).text(`${i + 1}. ${dish.name} - ${dish.quantity} مبيعات`);
  });

  doc.end();
});


const exportStatsExcel = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) throw new Error('يرجى تحديد التاريخ');

  const stats = await getStatsForPeriod(new Date(startDate), new Date(endDate));

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Rapport');

  sheet.addRow(['📊 Rapport Statistiques']);
  sheet.addRow([]);
  sheet.addRow(['📅 Période', stats.date]);
  sheet.addRow(['Nombre de commandes', stats.numberOfOrders]);
  sheet.addRow(['Plats vendus', stats.totalDishesSold]);
  sheet.addRow(['Revenu total (MAD)', stats.totalRevenue]);
  sheet.addRow(['Paiement en espèces', `${stats.paymentStats.cash} (${stats.paymentStats.cashPercentage}%)`]);
  sheet.addRow(['Paiement en ligne', `${stats.paymentStats.online} (${stats.paymentStats.onlinePercentage}%)`]);
  sheet.addRow(['Temps moyen de préparation (min)', stats.avgPreparationTime]);
  sheet.addRow(['Heure de pic', `${stats.peakHour}:00`]);
  sheet.addRow([]);

  const dishSheet = workbook.addWorksheet('Top Plats');
  dishSheet.columns = [
    { header: 'Nom du plat', key: 'name', width: 30 },
    { header: 'Quantité vendue', key: 'quantity', width: 20 },
    { header: 'Revenu généré (MAD)', key: 'totalRevenue', width: 25 }
  ];
  dishSheet.addRows(stats.topDishes);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=rapport-statistiques.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  getTodayStats,
  getStatsByPeriod,
  compareTwoPeriods,
  getStatsByRoom,
  exportStatsPDF,
  exportStatsExcel
};
