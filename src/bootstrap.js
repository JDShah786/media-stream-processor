'use strict';

const { app } = require('electron');
const path    = require('path');
const fs      = require('fs');
const https   = require('https');
const http    = require('http');

// yt-dlp is downloaded on first run because it updates frequently and is small.
// FFmpeg is bundled via the ffmpeg-static npm package (included in the installer
// via asarUnpack) — no network download needed for it.

const BIN_DIR   = path.join(app.getPath('userData'), 'bin');
const YTDLP_EXE = path.join(BIN_DIR, 'yt-dlp.exe');

const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

/**
 * Resolve the path to the bundled ffmpeg.exe from the ffmpeg-static package.
 * In a packaged Electron app, node_modules lives inside app.asar (a virtual
 * archive). Files listed under asarUnpack are extracted to app.asar.unpacked,
 * so we rewrite the path accordingly when running packaged.
 */
function getFfmpegPath() {
  const staticPath = require('ffmpeg-static');
  if (app.isPackaged) {
    return staticPath.replace('app.asar', 'app.asar.unpacked');
  }
  return staticPath;
}

/**
 * Returns true if yt-dlp is not yet available and the user hasn't configured
 * their own tool via .env. FFmpeg is always available (bundled).
 */
function needsSetup() {
  // Managed binary already present — nothing to do
  if (fs.existsSync(YTDLP_EXE)) return false;

  // Honour explicit .env overrides: anything that isn't the bare default
  // (e.g. "py -m yt_dlp", a full path) is treated as user-provided.
  const yt = (process.env.YTDLP_PATH || '').trim();
  const isCustom = (s, def) => s.length > 0 && s !== def;
  return !isCustom(yt, 'yt-dlp');
}

/**
 * Point YTDLP_PATH at the managed binary and FFMPEG_PATH at the bundled
 * ffmpeg-static binary. Called after setup and on every subsequent launch.
 */
function applyPaths() {
  if (fs.existsSync(YTDLP_EXE)) process.env.YTDLP_PATH = YTDLP_EXE;

  const ffPath = getFfmpegPath();
  if (ffPath && fs.existsSync(ffPath)) process.env.FFMPEG_PATH = ffPath;
}

/**
 * Stream-download `url` to `destPath`, following redirects correctly.
 * `onProgress(pct)` is called with 0-100 as bytes arrive.
 */
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const doRequest = (urlStr) => {
      const mod = urlStr.startsWith('https://') ? https : http;
      mod.get(urlStr, { headers: { 'User-Agent': 'Converto/1.0.1' } }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          // Drain the redirect response body so the socket is cleanly released,
          // then follow the new location. Do NOT call req.destroy() here — that
          // fires an 'error' event which would reject the Promise prematurely.
          res.resume();
          return doRequest(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${urlStr}`));
        }

        const total = parseInt(res.headers['content-length'] || '0', 10);
        let received = 0;
        const out = fs.createWriteStream(destPath);

        res.on('data', (chunk) => {
          received += chunk.length;
          if (total > 0 && onProgress) onProgress(Math.round(received / total * 100));
        });

        res.pipe(out);
        out.on('finish', () => { out.close(); resolve(); });
        out.on('error',  (e) => { fs.unlink(destPath, () => {}); reject(e); });
      }).on('error', (e) => { fs.unlink(destPath, () => {}); reject(e); });
    };
    doRequest(url);
  });
}

module.exports = {
  BIN_DIR,
  YTDLP_EXE,
  YTDLP_URL,
  getFfmpegPath,
  needsSetup,
  applyPaths,
  downloadFile,
};
