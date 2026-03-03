const { pool } = require('../config/db');
const { paymentQueue, refundQueue, webhookQueue } = require('../config/queues');

const getTestMerchant = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM merchants WHERE email = 'test@example.com'");
        if (result.rows.length === 0) {
            return res.status(404).json({ error: { code: 'NOT_FOUND_ERROR', description: 'Test merchant not found' } });
        }

        const merchant = result.rows[0];
        // Return only specific fields as requested
        res.status(200).json({
            id: merchant.id,
            email: merchant.email,
            api_key: merchant.api_key,
            api_secret: merchant.api_secret, // Exposed only for test verification endpoint
            seeded: true
        });
    } catch (err) {
        console.error('Get Test Merchant Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getJobsStatus = async (req, res) => {
    try {
        const [paymentStats, refundStats, webhookStats] = await Promise.all([
            paymentQueue.getJobCounts(),
            refundQueue.getJobCounts(),
            webhookQueue.getJobCounts()
        ]);

        // Flatten and aggregate stats
        res.status(200).json({
            pending: (paymentStats.waiting || 0) + (paymentStats.delayed || 0) +
                (refundStats.waiting || 0) + (refundStats.delayed || 0) +
                (webhookStats.waiting || 0) + (webhookStats.delayed || 0),
            processing: (paymentStats.active || 0) + (refundStats.active || 0) + (webhookStats.active || 0),
            completed: (paymentStats.completed || 0) + (refundStats.completed || 0) + (webhookStats.completed || 0),
            failed: (paymentStats.failed || 0) + (refundStats.failed || 0) + (webhookStats.failed || 0),
            worker_status: 'online'
        });
    } catch (err) {
        console.error('Get Jobs Status Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getTestMerchant,
    getJobsStatus
};
