const { pool } = require("../config/db");
const { webhookQueue } = require("../config/queues");
const crypto = require("crypto");

// GET /api/v1/webhooks?limit=10&offset=0
// Auth required (merchant)
async function listWebhooks(req, res) {
  try {
    const merchantId = req.merchant.id;

    const limit = Math.min(parseInt(req.query.limit || "10", 10), 50);
    const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);

    const totalRes = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM webhook_events
       WHERE merchant_id=$1`,
      [merchantId]
    );

    const rowsRes = await pool.query(
      `SELECT id, event_type, status, attempts, last_error, next_retry_at, created_at, delivered_at
       FROM webhook_events
       WHERE merchant_id=$1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [merchantId, limit, offset]
    );

    return res.status(200).json({
      data: rowsRes.rows,
      total: totalRes.rows[0].count,
      limit,
      offset,
    });
  } catch (err) {
    console.error("listWebhooks error:", err);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        description: "Failed to fetch webhook logs",
      },
    });
  }
}

// POST /api/v1/webhooks/:id/retry
// Auth required (merchant)
async function retryWebhook(req, res) {
  try {
    const merchantId = req.merchant.id;
    const webhookId = req.params.id;

    const findRes = await pool.query(
      `SELECT id, merchant_id, status, attempts
       FROM webhook_events
       WHERE id=$1`,
      [webhookId]
    );

    if (findRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND_ERROR", description: "Webhook event not found" },
      });
    }

    const row = findRes.rows[0];

    // ensure merchant can retry only their own webhook
    if (row.merchant_id !== merchantId) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_ERROR",
          description: "Not allowed to retry this webhook",
        },
      });
    }

    // ✅ DO NOT reset attempts
    // just schedule it again
    await pool.query(
      `UPDATE webhook_events
       SET status='pending',
           last_error=NULL,
           next_retry_at=NULL,
           delivered_at=NULL
       WHERE id=$1`,
      [webhookId]
    );

    // enqueue webhook delivery for this merchant
    await webhookQueue.add({ merchantId });

    return res.status(200).json({
      id: webhookId,
      status: "pending",
      message: "Webhook retry scheduled",
    });
  } catch (err) {
    console.error("retryWebhook error:", err);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", description: "Failed to retry webhook" },
    });
  }
}

async function getConfig(req, res) {
  try {
    const merchantId = req.merchant.id;
    const result = await pool.query(
      "SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1",
      [merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Merchant not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("getConfig error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateConfig(req, res) {
  try {
    const merchantId = req.merchant.id;
    const { url, regenerate_secret } = req.body;

    let query = "UPDATE merchants SET updated_at = CURRENT_TIMESTAMP";
    const params = [merchantId];

    if (url !== undefined) {
      query += ", webhook_url = $" + (params.length + 1);
      params.push(url);
    }

    if (regenerate_secret) {
      const newSecret = "whsec_" + crypto.randomBytes(16).toString("hex");
      query += ", webhook_secret = $" + (params.length + 1);
      params.push(newSecret);
    }

    query += " WHERE id = $1 RETURNING webhook_url, webhook_secret";

    const result = await pool.query(query, params);
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("updateConfig error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  listWebhooks,
  retryWebhook,
  getConfig,
  updateConfig,
};
