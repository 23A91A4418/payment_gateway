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
       FROM webhook_logs
       WHERE merchant_id=$1`,
      [merchantId]
    );

    const rowsRes = await pool.query(
      `SELECT id, event, status, attempts, response_code, response_body, next_retry_at, created_at
       FROM webhook_logs
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
       FROM webhook_logs
       WHERE id=$1`,
      [webhookId]
    );

    if (findRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND_ERROR", description: "Webhook log not found" },
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
      `UPDATE webhook_logs
       SET status='pending',
           response_body=NULL,
           next_retry_at=NULL
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
      `SELECT url as webhook_url, secret as webhook_secret 
       FROM webhook_endpoints 
       WHERE merchant_id = $1 AND is_active = true 
       ORDER BY created_at DESC LIMIT 1`,
      [merchantId]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ webhook_url: "", webhook_secret: "" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("getConfig error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

async function updateConfig(req, res) {
  const client = await pool.connect();
  try {
    const merchantId = req.merchant.id;
    const { url, regenerate_secret } = req.body;

    await client.query("BEGIN");

    // Get current endpoint
    const currentRes = await client.query(
      "SELECT url, secret FROM webhook_endpoints WHERE merchant_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1",
      [merchantId]
    );

    const current = currentRes.rows[0] || { url: "", secret: "" };
    const newUrl = url !== undefined ? url : current.url;
    let newSecret = current.secret;

    if (regenerate_secret || !newSecret) {
      newSecret = "whsec_" + crypto.randomBytes(16).toString("hex");
    }

    // Inactivate old endpoints
    await client.query(
      "UPDATE webhook_endpoints SET is_active = false WHERE merchant_id = $1",
      [merchantId]
    );

    // Insert new endpoint
    const insertRes = await client.query(
      `INSERT INTO webhook_endpoints (merchant_id, url, secret, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING url as webhook_url, secret as webhook_secret`,
      [merchantId, newUrl, newSecret]
    );

    await client.query("COMMIT");
    return res.status(200).json(insertRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateConfig error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}

module.exports = {
  listWebhooks,
  retryWebhook,
  getConfig,
  updateConfig,
};
