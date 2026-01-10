const express = require('express');
const router = express.Router();
const authenticateMerchant = require('../middleware/auth.middleware');
const db = require('../db');

/**
 * =====================================================
 * PUBLIC CHECKOUT ENDPOINT (NO AUTH)
 * =====================================================
 */
router.get('/:orderId/public', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await db.query(
      `
      SELECT id, amount, currency, status
      FROM orders
      WHERE id = $1
      `,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Order not found'
        }
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Failed to fetch order'
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
 * POST /api/v1/orders
 */
router.post('/', async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        error: {
          code: 'BAD_REQUEST_ERROR',
          description: 'amount and currency are required'
        }
      });
    }

    const orderId =
      'order_' + Math.random().toString(36).substring(2, 18);

    const result = await db.query(
      `
      INSERT INTO orders (
        id,
        merchant_id,
        amount,
        currency,
        receipt,
        notes,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'created')
      RETURNING id, amount, currency, status
      `,
      [
        orderId,
        req.merchant.id,
        amount,
        currency,
        receipt || null,
        notes || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Failed to create order'
      }
    });
  }
});

/**
 * GET /api/v1/orders/:orderId
 * Authenticated order fetch
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await db.query(
      `
      SELECT id, amount, currency, status, created_at
      FROM orders
      WHERE id = $1 AND merchant_id = $2
      `,
      [orderId, req.merchant.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND_ERROR',
          description: 'Order not found'
        }
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Failed to fetch order'
      }
    });
  }
});

module.exports = router;
