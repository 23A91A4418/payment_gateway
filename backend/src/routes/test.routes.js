const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/merchant', async (req, res) => {
  const result = await db.query(
    `
    SELECT id, email, api_key, api_secret
    FROM merchants
    WHERE email = $1
    `,
    ['test@example.com']
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND_ERROR',
        description: 'Test merchant not found'
      }
    });
  }

  res.status(200).json({
    id: result.rows[0].id,
    email: result.rows[0].email,
    api_key: result.rows[0].api_key,
    api_secret: result.rows[0].api_secret,
    seeded: true
  });
});

module.exports = router;
