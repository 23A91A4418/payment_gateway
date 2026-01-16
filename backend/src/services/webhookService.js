const crypto = require("crypto");
const axios = require("axios");
const { pool } = require("../config/db");

function signPayload(payload, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(payload))
    .digest("hex");
}

async function queueWebhookEvent(merchantId, eventType, payload) {
  await pool.query(
    `INSERT INTO webhook_events (merchant_id, event_type, payload, status, attempts)
     VALUES ($1,$2,$3,'pending',0)`,
    [merchantId, eventType, payload]
  );
}

async function deliverWebhook(eventRow) {
  const { id, merchant_id, event_type, payload } = eventRow;

  const endpointRes = await pool.query(
    `SELECT url, secret
     FROM webhook_endpoints
     WHERE merchant_id=$1 AND is_active=true
     ORDER BY created_at DESC
     LIMIT 1`,
    [merchant_id]
  );

  if (endpointRes.rows.length === 0) {
    await pool.query(
      `UPDATE webhook_events
       SET status='failed',
           last_error='No active webhook endpoint'
       WHERE id=$1`,
      [id]
    );
    return;
  }

  const endpoint = endpointRes.rows[0];
  const signature = signPayload(payload, endpoint.secret);

  // ✅ Increment attempts at start of delivery (NO last_attempt_at)
  const attemptRes = await pool.query(
    `UPDATE webhook_events
     SET attempts = COALESCE(attempts,0) + 1
     WHERE id=$1
     RETURNING attempts`,
    [id]
  );

  const currentAttempt = attemptRes.rows[0].attempts;

  try {
    await axios.post(endpoint.url, payload, {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event_type,
      },
    });

    await pool.query(
      `UPDATE webhook_events
       SET status='delivered',
           delivered_at=CURRENT_TIMESTAMP,
           last_error=NULL,
           next_retry_at=NULL
       WHERE id=$1`,
      [id]
    );
  } catch (err) {
    // retry schedule: 5s, 30s, 2m, 10m, 30m
    const delays = [5, 30, 120, 600, 1800];
    const delaySeconds = delays[Math.min(currentAttempt - 1, delays.length - 1)];

    await pool.query(
      `UPDATE webhook_events
       SET status='pending',
           next_retry_at=CURRENT_TIMESTAMP + ($2 || ' seconds')::interval,
           last_error=$3
       WHERE id=$1`,
      [id, delaySeconds, err.message]
    );
  }
}

module.exports = { queueWebhookEvent, deliverWebhook };
