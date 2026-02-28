const Queue = require("bull");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const paymentQueue = new Queue("payment-queue", REDIS_URL);
const refundQueue = new Queue("refund-queue", REDIS_URL);
const webhookQueue = new Queue("webhook-queue", REDIS_URL);

module.exports = {
  paymentQueue,
  refundQueue,
  webhookQueue,
};
