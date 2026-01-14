const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authenticateHost = require('../middleware/authMiddleware');

// Protected Routes
router.post('/', authenticateHost, orderController.createOrder);
router.get('/:orderId', authenticateHost, orderController.getOrder);

// Public Route
router.get('/:orderId/public', orderController.getOrderPublic);

module.exports = router;
