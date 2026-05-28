const { v4: uuidv4 } = require('uuid');
const logger = require('../services/loggerService');

// In-memory job store (will be replaced with database in production)
const jobStore = new Map();

/**
 * Start a new conversion job
 */
const startConversion = async (req, res, next) => {
  try {
    const { url, format, quality } = req.body;
    const jobId = uuidv4();

    // Create job object
    const job = {
      id: jobId,
      url,
      format,
      quality,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      error: null,
      outputPath: null,
    };

    // Store job
    jobStore.set(jobId, job);
    logger.info(`Conversion job created: ${jobId}`, { url, format, quality });

    res.status(202).json({
      jobId,
      status: 'accepted',
      message: 'Conversion job queued successfully',
    });

    // Simulate async processing (will be replaced with actual conversion logic)
    processConversion(jobId).catch((error) => {
      logger.error(`Error processing job ${jobId}:`, error);
      const job = jobStore.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        job.updatedAt = new Date();
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the status of a conversion job
 */
const getStatus = (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = jobStore.get(jobId);

    if (!job) {
      const error = new Error(`Job not found: ${jobId}`);
      error.name = 'NotFoundError';
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of all jobs
 */
const getJobs = (req, res, next) => {
  try {
    const jobs = Array.from(jobStore.values());
    res.status(200).json({
      total: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Simulate async conversion processing
 * This will be replaced with actual conversion logic in Phase 2
 */
const processConversion = async (jobId) => {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.status = 'processing';
  job.updatedAt = new Date();
  logger.info(`Starting conversion for job: ${jobId}`);

  // Simulate processing steps
  for (let i = 0; i <= 100; i += 10) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    job.progress = i;
    job.updatedAt = new Date();
  }

  job.status = 'completed';
  job.progress = 100;
  job.outputPath = `/downloads/${job.id}.${job.format}`;
  job.updatedAt = new Date();
  logger.info(`Conversion completed for job: ${jobId}`);
};

module.exports = {
  startConversion,
  getStatus,
  getJobs,
};
