/**
 * Input validation middleware
 */

const validateConversionRequest = (req, res, next) => {
  const { url, format, quality } = req.body;

  // Validate URL
  if (!url) {
    const error = new Error('URL is required');
    error.name = 'ValidationError';
    error.statusCode = 400;
    return next(error);
  }

  // Basic YouTube URL validation
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  if (!youtubeRegex.test(url)) {
    const error = new Error('Invalid YouTube URL');
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
