// routes/analyseRoutes.js
const express = require('express');
const router = express.Router();

const {
  getTodayStats,
  getStatsByPeriod,
  compareTwoPeriods,
  getStatsByRoom,
  exportStatsPDF,
  exportStatsExcel
} = require('../controllers/analyseController');

router.get('/today', getTodayStats);
router.get('/period', getStatsByPeriod);
router.get('/compare', compareTwoPeriods);
router.get('/room/:roomId', getStatsByRoom);
router.get('/export/pdf', exportStatsPDF);
router.get('/export/excel', exportStatsExcel);

module.exports = router;