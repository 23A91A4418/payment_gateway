const express = require('express');
const router = express.Router();
const authenticateMerchant = require('../middleware/auth.middleware');
const db = require('../db');

/**
 * =====================================================
 * PUBLIC PAYMENT ENDPOINT (NO AUTH)
 * Used by checkout page
 * =====================================================
 */
router.post('/public', async (req, res) => {
  try {
    const { order_id, method } = req.body;

    if (!order_id || !method) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'order_id and method are required'
        }
      });
    }

    const paymentId =
      'pay_' + Math.random().toString(36).substring(2, 18);

    const result = await db.query(
      `
      INSERT INTO payments (
        id,
        order_id,
        method,
        status
      )
      VALUES ($1, $2, $3, 'captured')
      RETURNING id, order_id, method, status
      `,
      [paymentId, order_id, method]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Failed to create payment'
      }
    });
  }
});

/**
 * =====================================================
 * AUTHENTICATED MERCHANT ENDPOINTS
 * =====================================================
 */
router.use(authenticateMerchant);

/**
 * POST /api/v1/payments
 * Create payment for authenticated merchant
 */
router.post('/', async (req, res) => {
  try {
    const { order_id, method } = req.body;

    if (!order_id || !method) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'order_id and method are required'
        }
      });
    }

    const paymentId =
      'pay_' + Math.random().toString(36).substring(2, 18);

    const result = await db.query(
      `
      INSERT INTO payments (
        id,
        order_id,
        merchant_id,
        method,
        status
      )
      VALUES ($1, $2, $3, $4, 'captured')
      RETURNING id, order_id, method, status
      `,
      [
        paymentId,
        order_id,
        req.merchant.id,
        method
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Failed to create payment'
      }
    });
  }
});

/**
 * GET /api/v1/payments/:paymentId
 * Fetch payment for authenticated merchant
 */
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await db.query(
      `
      SELECT id, order_id, method, status, created_at
      FROM payments
      WHERE id = $1 AND merchant_id = $2
      `,
      [paymentId, req.merchant.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Payment not found'
        }
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Failed to fetch payment'
      }
    });
  }
});

module.exports = router;
