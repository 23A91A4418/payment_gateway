const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authenticateHost = require('../middleware/authMiddleware');

// Public Routes
router.post('/public', paymentController.createPaymentPublic);
router.get('/:paymentId/public', paymentController.getPaymentPublic);

// Dashboard Stats (Explicitly placed at top with inline auth to ensure priority)
router.get('/dashboard-stats', authenticateHost, paymentController.getDashboardStats);



// Protected Routes
router.use(authenticateHost);
router.post('/', paymentController.createPayment);
router.get('/', paymentController.listPayments);
router.get('/:paymentId', paymentController.getPayment);

module.exports = router;
