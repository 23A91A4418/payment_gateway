const db = require('../db');

/**
 * Dummy merchant authentication for now.
 * Uses API key headers and attaches merchant to request.
 */
module.exports = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          description: 'API key missing'
        }
      });
    }

    // Simple lookup (matches your DB usage style)
    const result = await db.query(
      `
      SELECT id, email
      FROM merchants
      WHERE api_key = $1
      `,
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          description: 'Invalid API key'
        }
      });
    }

    // Attach merchant to request (used in order.routes.js)
    req.merchant = result.rows[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        description: 'Authentication failed'
      }
    });
  }
};
