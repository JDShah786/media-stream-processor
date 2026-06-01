'use strict';

const { app } = require('electron');
const path    = require('path');
const fs      = require('fs');
const https   = require('https');
const http    = require('http');

const BIN_DIR   = path.join(app.getPath('userData'), 'bin');
const YTDLP_EXE = path.join(BIN_DIR, 'yt-dlp.exe');
const FFMPEG_EXE = path.join(BIN_DIR, 'ffmpeg.exe');

const YTDLP_URL       = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
const FFMPEG_API_URL  = 'https://api.github.com/repos/yt-dlp/FFmpeg-Builds/releases/latest';
const FFMPEG_ZIP_RE   = /ffmpeg-master-latest-win64-gpl-essentials\.zip$/;
// Entry path inside the zip is like: ffmpeg-master-latest-win64-gpl-essentials/bin/ffmpeg.exe
const FFMPEG_ENTRY_RE = /\/bin\/ffmpeg\.exe$/;

/**
 * Returns true if the managed binaries are missing AND the user has not
 * configured their own tools in .env.
 *
 * "User-configured" means the env var differs from its bare default name
 * (e.g. "py -m yt_dlp", a full path, or any custom string).  This lets
 * developers who already have the tools keep using them without triggering
 * a 75 MB first-run download.
 */
function needsSetup() {
  const hasManagedYt = fs.existsSync(YTDLP_EXE);
  const hasManagedFf = fs.existsSync(FFMPEG_EXE);
  if (hasManagedYt && hasManagedFf) return false;

  const yt = (process.env.YTDLP_PATH  || '').trim();
  const ff = (process.env.FFMPEG_PATH || '').trim();

  // Anything that isn't the bare default is treated as a user-provided command.
  const isCustom = (s, def) => s.length > 0 && s !== def;

  const ytOk = hasManagedYt || isCustom(yt, 'yt-dlp');
  const ffOk = hasManagedFf || isCustom(ff, 'ffmpeg');
  return !(ytOk && ffOk);
}

/**
 * Point the process env vars at the managed binaries (if they exist).
 * Called immediately after setup completes, and on every subsequent launch.
 */
function applyPaths() {
  if (fs.existsSync(YTDLP_EXE))  process.env.YTDLP_PATH  = YTDLP_EXE;
  if (fs.existsSync(FFMPEG_EXE)) process.env.FFMPEG_PATH = FFMPEG_EXE;
}

/**
 * Stream-download `url` to `destPath`, following redirects.
 * `onProgress(pct)` is called with 0-100 as bytes arrive.
 */
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const doRequest = (urlStr) => {
      const mod = urlStr.startsWith('https://') ? https : http;
      const req = mod.get(urlStr, { headers: { 'User-Agent': 'Converto/1.0.1' } }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          req.destroy();
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
      });
      req.on('error', (e) => { fs.unlink(destPath, () => {}); reject(e); });
    };
    doRequest(url);
  });
}

/**
 * Ask the GitHub Releases API for the browser_download_url of the
 * ffmpeg-master-latest-win64-gpl-essentials.zip asset.
 */
function getFFmpegZipUrl() {
  return new Promise((resolve, reject) => {
    https.get(FFMPEG_API_URL, { headers: { 'User-Agent': 'Converto/1.0.1' } }, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        try {
          const json   = JSON.parse(body);
          const asset  = (json.assets || []).find(a => FFMPEG_ZIP_RE.test(a.name));
          if (!asset) throw new Error('FFmpeg essentials asset not found in latest release');
          resolve(asset.browser_download_url);
        } catch (e) { reject(e); }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Extract ffmpeg.exe from the downloaded zip and write it to FFMPEG_EXE.
 * Uses adm-zip (pure-JS, no native module needed).
 */
function extractFfmpegFromZip(zipPath) {
  const AdmZip = require('adm-zip');
  const zip   = new AdmZip(zipPath);
  const entry = zip.getEntries().find(e => FFMPEG_ENTRY_RE.test(e.entryName));
  if (!entry) throw new Error('ffmpeg.exe not found inside the downloaded archive');
  fs.writeFileSync(FFMPEG_EXE, entry.getData());
}

module.exports = {
  BIN_DIR,
  YTDLP_EXE,
  FFMPEG_EXE,
  YTDLP_URL,
  needsSetup,
  applyPaths,
  downloadFile,
  getFFmpegZipUrl,
  extractFfmpegFromZip,
};
