/**
 * Input validation middleware
 */

const MAX_URL_LENGTH = 2048; // guard against absurdly long input

const validationError = (message) => {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 400;
  return error;
};

/**
 * Detect a YouTube *playlist-only* URL (e.g. youtube.com/playlist?list=…).
 * A single-video URL that merely carries a &list= param (watch?v=…&list=…)
 * is NOT playlist-only — yt-dlp's --no-playlist grabs just that video, so we
 * allow it. Returns true only when there is a list but no resolvable video.
 */
const isPlaylistOnlyUrl = (parsed) => {
  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
  if (!/(^|\.)youtube\.com$/.test(host) && host !== 'youtu.be') return false;

  const hasList = parsed.searchParams.has('list');
  if (!hasList) return false;

  // A single video is identified by ?v=, /shorts/<id>, or the youtu.be/<id> path.
  const hasVideo =
    parsed.searchParams.has('v') ||
    /^\/shorts\/[\w-]+/.test(parsed.pathname) ||
    (host === 'youtu.be' && /^\/[\w-]+/.test(parsed.pathname));

  return !hasVideo;
};

const validateConversionRequest = (req, res, next) => {
  const { streamUrl, format, quality } = req.body;

  // Validate stream URL presence
  if (!streamUrl || typeof streamUrl !== 'string' || !streamUrl.trim()) {
    return next(validationError('streamUrl is required'));
  }

  const trimmedUrl = streamUrl.trim();

  if (trimmedUrl.length > MAX_URL_LENGTH) {
    return next(validationError(`streamUrl is too long (max ${MAX_URL_LENGTH} characters)`));
  }

  // Parse the URL strictly; reject anything that isn't a well-formed http(s) URL.
  let parsed;
  try {
    parsed = new URL(trimmedUrl);
  } catch (_) {
    return next(validationError('Invalid stream URL format. Must be a valid http:// or https:// URL'));
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return next(validationError('Invalid stream URL format. Must be http:// or https://'));
  }

  // Reject playlist-only YouTube URLs — we convert one video at a time.
  if (isPlaylistOnlyUrl(parsed)) {
    return next(validationError('Playlist URLs are not supported. Paste a link to a single video.'));
  }

  // Validate format
  const validFormats = ['mp3', 'mp4'];
  if (!format || !validFormats.includes(format)) {
    return next(validationError(`Invalid format. Must be one of: ${validFormats.join(', ')}`));
  }

  // Validate quality
  const validQualities = ['low', 'medium', 'high'];
  if (!quality || !validQualities.includes(quality)) {
    return next(validationError(`Invalid quality. Must be one of: ${validQualities.join(', ')}`));
  }

  next();
};

module.exports = {
  validateConversionRequest,
  isPlaylistOnlyUrl,
};
