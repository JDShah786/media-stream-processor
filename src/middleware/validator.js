/**
 * Input validation middleware
 */

const validateConversionRequest = (req, res, next) => {
  const { streamUrl, format, quality } = req.body;

  // Validate stream URL
  if (!streamUrl) {
    const error = new Error('streamUrl is required');
    error.name = 'ValidationError';
    error.statusCode = 400;
    return next(error);
  }

  // Basic URL validation (http/https)
  const urlRegex = /^(https?:\/\/).+/;
  if (!urlRegex.test(streamUrl)) {
    const error = new Error('Invalid stream URL format. Must be http:// or https://');
    error.name = 'ValidationError';
    error.statusCode = 400;
    return next(error);
  }

  // Validate format
  const validFormats = ['mp3', 'mp4'];
  if (!format || !validFormats.includes(format)) {
    const error = new Error(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    error.name = 'ValidationError';
    error.statusCode = 400;
    return next(error);
  }

  // Validate quality
  const validQualities = ['low', 'medium', 'high'];
  if (!quality || !validQualities.includes(quality)) {
    const error = new Error(`Invalid quality. Must be one of: ${validQualities.join(', ')}`);
    error.name = 'ValidationError';
    error.statusCode = 400;
    return next(error);
  }

  next();
};

module.exports = {
  validateConversionRequest,
};
