const express = require('express');
const router = express.Router();
const validator = require('../middleware/validator');
const conversionController = require('../controllers/conversionController');

/**
 * POST /api/convert
 * Start a new media stream conversion job
 * Body: { streamUrl, format, quality, outputPath? }
 */
router.post('/convert', validator.validateConversionRequest, conversionController.startConversion);

/**
 * GET /api/status/:jobId
 * Get the status of a conversion job
 */
router.get('/status/:jobId', conversionController.getStatus);

/**
 * GET /api/jobs
 * Get list of all active jobs
 */
router.get('/jobs', conversionController.getJobs);

module.exports = router;
