const express = require('express');
const router = express.Router();
const { getTestMerchant, getJobsStatus } = require('../controllers/testController');

router.get('/merchant', getTestMerchant);
router.get('/jobs/status', getJobsStatus);

module.exports = router;
