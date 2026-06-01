const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./loggerService');

// YTDLP_PATH may be a bare executable ("yt-dlp") or a command with leading
// args ("py -m yt_dlp"). spawn() treats its first argument as a single
// executable and won't split on spaces, so parse the command apart from any
// prefix args here.
const [YTDLP_CMD, ...YTDLP_PREFIX_ARGS] = (process.env.YTDLP_PATH || 'yt-dlp').trim().split(/\s+/);

class ConversionService {
  /**
   * Download and convert a YouTube URL to the requested format.
   * Uses yt-dlp's built-in extraction — no separate FFmpeg step needed.
   */
  async convert(streamUrl, format, quality, outputPath, customName, onProgress) {
    const jobId = `job_${Date.now()}`;
    // Use the caller's chosen name (sanitized) when given, else an auto name.
    // Dedupe so a custom name never silently overwrites an existing file.
    const sanitized = this._sanitizeName(customName);
    const baseName = this._uniqueName(outputPath, sanitized || this._baseName(), format);
    // Use %(ext)s so yt-dlp writes the correct extension itself
    const outputTemplate = path.join(outputPath, `${baseName}.%(ext)s`);
    const expectedFile  = path.join(outputPath, `${baseName}.${format}`);

    logger.info(`[${jobId}] Starting`, { streamUrl, format, quality, outputPath });

    // Reject over-length videos up front (before any download) with a clear
    // message. Thrown outside the try below so it isn't wrapped/obscured.
    await this._enforceDurationLimit(streamUrl, jobId);

    try {
      const args = this._buildArgs(streamUrl, format, quality, outputTemplate);
      await this._run(args, jobId, onProgress);

      // yt-dlp should have created the file; verify it exists
      if (!fs.existsSync(expectedFile)) {
        // Fallback: find any file matching the base name in case ext differed
        const match = fs.readdirSync(outputPath).find(f => f.startsWith(baseName));
        if (!match) throw new Error('Output file not found after conversion');
        return { outputFile: path.join(outputPath, match), filename: match, success: true };
      }

      logger.info(`[${jobId}] Done → ${expectedFile}`);
      return { outputFile: expectedFile, filename: path.basename(expectedFile), success: true };

    } catch (error) {
      logger.error(`[${jobId}] Failed: ${error.message}`);
      // Clean up any partial file
      try {
        fs.readdirSync(outputPath)
          .filter(f => f.startsWith(baseName))
          .forEach(f => fs.unlinkSync(path.join(outputPath, f)));
      } catch (_) {}
      throw new Error(`Conversion failed: ${error.message}`);
    }
  }

  _buildArgs(streamUrl, format, quality, outputTemplate) {
    const args = [
      '--no-playlist',  // only download the single video, not the whole list
      '--newline',      // one progress line per stdout line (easier to parse)
    ];

    if (format === 'mp3') {
      // VBR quality: 0 = best (~320kbps), 5 = medium (~128kbps)
      const vbr = { low: '5', medium: '2', high: '0' }[quality] ?? '2';
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', vbr);
    } else {
      // MP4: pick resolution tier. Prefer AAC (m4a) audio over YouTube's
      // "best" audio, which is Opus/WebM — Opus muxed into an MP4 container
      // plays on few players. Preferring m4a keeps the merge a lossless
      // stream-copy into MP4. Falls back to the old selector if unavailable.
      const fmt = {
        low:    'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best[height<=480]/best',
        medium: 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best[height<=720]/best',
        high:   'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
      }[quality] ?? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best';
      args.push('-f', fmt, '--merge-output-format', 'mp4');
    }

    args.push('-o', outputTemplate, '--', streamUrl);
    return args;
  }

  /**
   * Throw a clear error if the video exceeds MAX_VIDEO_DURATION (seconds).
   * A value of 0, a negative number, or an unset/invalid env disables the check.
   * If the duration can't be determined (live streams, network hiccup, missing
   * yt-dlp), we skip the check and let the real conversion surface any error —
   * we never block on uncertainty.
   */
  async _enforceDurationLimit(streamUrl, jobId) {
    const limit = parseInt(process.env.MAX_VIDEO_DURATION, 10);
    if (!Number.isFinite(limit) || limit <= 0) return; // unlimited / not configured

    const duration = await this._getDuration(streamUrl, jobId);
    if (duration == null) {
      logger.warn(`[${jobId}] Could not determine duration — skipping length check`);
      return;
    }

    if (duration > limit) {
      throw new Error(
        `Video is ${this._formatDuration(duration)}, which exceeds the ${this._formatDuration(limit)} limit.`
      );
    }
    logger.debug(`[${jobId}] Duration ${this._formatDuration(duration)} within ${this._formatDuration(limit)} limit`);
  }

  /**
   * Ask yt-dlp for just the video's duration in seconds (no download).
   * Resolves to a finite number, or null if it can't be determined.
   */
  _getDuration(streamUrl, jobId) {
    return new Promise((resolve) => {
      const args = [
        ...YTDLP_PREFIX_ARGS,
        '--no-playlist',
        '--skip-download',
        '--print', 'duration',
        '--', streamUrl,
      ];
      const proc = spawn(YTDLP_CMD, args, { windowsHide: true });

      let out = '';
      proc.stdout.on('data', (d) => { out += d.toString(); });
      proc.on('close', () => {
        const n = parseFloat(out.trim().split('\n')[0]);
        resolve(Number.isFinite(n) ? n : null);
      });
      proc.on('error', (err) => {
        logger.warn(`[${jobId}] duration probe failed: ${err.message}`);
        resolve(null);
      });
    });
  }

  /** Human-readable duration: 3600 → "1h", 6150 → "1h 42m", 45 → "45s". */
  _formatDuration(totalSeconds) {
    const s = Math.round(totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (!h && sec) parts.push(`${sec}s`);
    return parts.join(' ') || '0s';
  }

  _run(args, jobId, onProgress) {
    return new Promise((resolve, reject) => {
      const fullArgs = [...YTDLP_PREFIX_ARGS, ...args];
      logger.info(`[${jobId}] ${YTDLP_CMD} ${fullArgs.join(' ')}`);

      const proc = spawn(YTDLP_CMD, fullArgs, { windowsHide: true });

      const handleLine = (line) => {
        line = line.trim();
        if (!line) return;
        logger.debug(`[${jobId}] ${line}`);

        // yt-dlp emits:  [download]  45.3% of 8.23MiB at 1.20MiB/s ETA 00:05
        const m = line.match(/\[download\]\s+([\d.]+)%/);
        if (m && onProgress) {
          // Scale download progress to 0–90 so post-processing has room
          onProgress(Math.min(90, Math.round(parseFloat(m[1]))));
        }
      };

      let stderr = '';
      proc.stdout.on('data', d => d.toString().split('\n').forEach(handleLine));
      proc.stderr.on('data', d => {
        const chunk = d.toString();
        stderr += chunk;
        chunk.split('\n').forEach(handleLine);
      });

      proc.on('close', code => {
        if (code === 0) return resolve();
        // Surface a useful excerpt from stderr on failure
        const hint = stderr.split('\n').filter(l => l.includes('ERROR') || l.includes('error')).slice(-3).join(' | ');
        reject(new Error(`yt-dlp exited ${code}${hint ? ': ' + hint : ''}`));
      });

      proc.on('error', err =>
        reject(new Error(`yt-dlp could not start (is it installed and on PATH?): ${err.message}`))
      );
    });
  }

  _baseName() {
    const date = new Date().toISOString().split('T')[0];
    const rand = Math.random().toString(36).substring(2, 8);
    return `media_${date}_${rand}`;
  }

  /**
   * Turn user-supplied text into a safe base filename (no extension), or null
   * if nothing usable remains. Strips path separators and characters that are
   * illegal on Windows, guards against reserved device names, and caps length.
   */
  _sanitizeName(name) {
    if (!name) return null;
    let n = String(name)
      .trim()
      .replace(/\.(mp3|mp4)$/i, '')     // drop an extension the user may have typed
      .replace(/[\\/:*?"<>|]/g, '')     // characters illegal in Windows filenames
      .replace(/[\x00-\x1f]/g, '')      // control characters
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[. ]+$/, '');           // trailing dots/spaces are illegal on Windows
    // Reserved Windows device names
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(n)) n = '';
    return n.slice(0, 100) || null;
  }

  /**
   * Return a base name whose `.format` file does not yet exist in outputPath,
   * appending " (1)", " (2)", … on collision so we never overwrite.
   */
  _uniqueName(outputPath, baseName, format) {
    let candidate = baseName;
    let i = 1;
    while (fs.existsSync(path.join(outputPath, `${candidate}.${format}`))) {
      candidate = `${baseName} (${i++})`;
    }
    return candidate;
  }
}

module.exports = new ConversionService();
