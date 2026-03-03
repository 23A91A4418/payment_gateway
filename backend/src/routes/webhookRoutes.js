const express = require("express");
const router = express.Router();

const { listWebhooks, retryWebhook, getConfig, updateConfig, sendTestWebhook } = require("../controllers/webhookController");

// ... (rest of middleware import)
const authMiddleware = require("../middleware/authMiddleware");

// GET config
router.get("/config", authMiddleware, getConfig);

// UPDATE config
router.post("/config", authMiddleware, updateConfig);

// GET logs
router.get("/", authMiddleware, listWebhooks);

// manual retry
router.post("/:id/retry", authMiddleware, retryWebhook);

// test webhook
router.post("/test-webhook", authMiddleware, sendTestWebhook);

module.exports = router;
