import express from 'express';
import dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

router.get('/stats', dashboardController.getDashboardStats);
router.get('/fraud-shops', dashboardController.getFraudShops);
router.get('/price-disputes', dashboardController.getPriceDisputes);
router.get('/gap-analysis', dashboardController.getGapAnalysis);
router.get('/top-shops', dashboardController.getTopShops);
router.get('/trending-today', dashboardController.getTrendingToday);
router.get('/recent-activity', dashboardController.getRecentActivity);

export default router;