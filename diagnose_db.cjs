const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: 'postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway',
});

async function run() {
    try {
        console.log("--- Webhook Endpoints ---");
        const endpoints = await pool.query("SELECT * FROM webhook_endpoints WHERE is_active = true ORDER BY created_at DESC");
        console.table(endpoints.rows);

        console.log("\n--- Webhook Logs (Latest 10) ---");
        const logs = await pool.query("SELECT id, event, status, attempts, response_code, last_attempt_at FROM webhook_logs ORDER BY created_at DESC LIMIT 10");
        console.table(logs.rows);

        console.log("\n--- Merchant Table Excerpt ---");
        const merchant = await pool.query("SELECT id, name, webhook_url FROM merchants LIMIT 1");
        console.table(merchant.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
