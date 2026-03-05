const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/predictions/:product_id', analyticsController.getPrediction);
router.get('/forecast/:product_id', analyticsController.getForecast);
router.get('/classifications', analyticsController.getClassifications);
router.get('/dead-stock', analyticsController.getDeadStock);

module.exports = router;
