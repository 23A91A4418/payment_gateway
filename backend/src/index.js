require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDb, pool } = require('./config/db');
const { createClient } = require('redis');

const app = express();
const port = process.env.PORT || 8000;

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.on('error', (err) => console.log('Redis Client Error', err));

app.use(cors());
app.use(bodyParser.json());

// Health Check
app.get('/health', async (req, res) => {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';

    try {
        await pool.query('SELECT 1');
        dbStatus = 'connected';
    } catch (err) {
        console.error('Health Check DB Error:', err);
    }

    try {
        if (redisClient.isOpen) {
            await redisClient.ping();
            redisStatus = 'connected';
        }
    } catch (err) {
        console.error('Health Check Redis Error:', err);
    }

    res.status(200).json({
        status: (dbStatus === 'connected' && redisStatus === 'connected') ? 'healthy' : 'unhealthy',
        database: dbStatus,
        redis: redisStatus,
        worker: 'running',
        timestamp: new Date().toISOString()
    });
});

const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);

const testRoutes = require('./routes/testRoutes');
app.use('/api/v1/test', testRoutes);

// Start Server and Init DB
// Start Server and Init DB
const startServer = async () => {
    await initDb(); // Ensure DB is ready before listening
    await redisClient.connect(); // Connect to Redis
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
};

startServer();
