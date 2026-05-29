const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const logger = require('./loggerService');

const execAsync = promisify(exec);

/**
 * Conversion Service
 * Orchestrates media extraction and format conversion using yt-dlp and FFmpeg
 */
class ConversionService {
  /**
   * Convert a media stream URL to desired format
   * @param {string} streamUrl - The URL of the media stream
   * @param {string} format - Target format ('mp3' or 'mp4')
   * @param {string} quality - Quality level ('low', 'medium', 'high')
   * @param {string} outputPath - Directory where output file will be saved
   * @param {Function} onProgress - Callback for progress updates (optional)
   * @returns {Promise<{outputFile: string, success: boolean}>}
   */
  async convert(streamUrl, format, quality, outputPath, onProgress) {
    const jobId = `job_${Date.now()}`;
    let tempFile = null;
    let finalFile = null;

    try {
      logger.info(`[${jobId}] Starting conversion`, {
        streamUrl,
        format,
        quality,
        outputPath,
      });

      // Step 1: Extract media stream using yt-dlp
      tempFile = path.join(outputPath, `.temp_${jobId}_download`);
      await this._extractStream(streamUrl, tempFile, jobId, onProgress);

      if (onProgress) onProgress(50);

      // Step 2: Convert to target format using FFmpeg
      const filename = this._generateFileName(streamUrl, format);
      finalFile = path.join(outputPath, filename);
      await this._convertWithFFmpeg(tempFile, finalFile, format, quality, jobId, onProgress);

      if (onProgress) onProgress(100);

      logger.info(`[${jobId}] Conversion completed successfully`, { finalFile });

      return {
        outputFile: finalFile,
        filename: filename,
        success: true,
      };
    } catch (error) {
      logger.error(`[${jobId}] Conversion failed`, error);

      // Cleanup on error
      if (tempFile && fs.existsSync(tempFile)) {
        try {
          fs.unlinkSync(tempFile);
          logger.info(`[${jobId}] Cleaned up temp file: ${tempFile}`);
        } catch (cleanupError) {
          logger.warn(`[${jobId}] Failed to cleanup temp file`, cleanupError);
        }
      }

      if (finalFile && fs.existsSync(finalFile)) {
        try {
          fs.unlinkSync(finalFile);
          logger.info(`[${jobId}] Cleaned up partial output file: ${finalFile}`);
        } catch (cleanupError) {
          logger.warn(`[${jobId}] Failed to cleanup output file`, cleanupError);
        }
      }

      throw new Error(`Conversion failed: ${error.message}`);
    }
  }

  /**
   * Extract media stream from URL using yt-dlp
   * @private
   */
  async _extractStream(streamUrl, outputPath, jobId, onProgress) {
    return new Promise((resolve, reject) => {
      // yt-dlp command: extract best audio format
      const command = `yt-dlp -f "best" -o "${outputPath}" "${streamUrl}"`;

      logger.info(`[${jobId}] Running yt-dlp extraction`, { command });

      const process = exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error(`[${jobId}] yt-dlp extraction failed`, {
            error: error.message,
            stderr,
          });
          return reject(new Error(`Stream extraction failed: ${error.message}`));
        }

        logger.info(`[${jobId}] yt-dlp extraction completed`, { stdout });
        resolve();
      });

      // Parse progress from yt-dlp output
      if (process.stderr) {
        process.stderr.on('data', (data) => {
          const output = data.toString();
          logger.debug(`[${jobId}] yt-dlp output: ${output}`);

          // yt-dlp outputs progress info we could parse here if needed
          if (onProgress) {
            // Report progress between 0-50 for extraction phase
            onProgress(25);
          }
        });
      }
    });
  }

  /**
   * Convert extracted media to target format using FFmpeg
   * @private
   */
  async _convertWithFFmpeg(inputFile, outputFile, format, quality, jobId, onProgress) {
    return new Promise((resolve, reject) => {
      let command;

      if (format === 'mp3') {
        // MP3 conversion with quality presets
        const bitrates = {
          low: '128k',
          medium: '192k',
          high: '320k',
        };
        const bitrate = bitrates[quality] || bitrates.medium;
        command = `ffmpeg -i "${inputFile}" -q:a 0 -map a -b:a ${bitrate} "${outputFile}"`;
      } else if (format === 'mp4') {
        // MP4 video conversion with quality presets
        const presets = {
          low: 'fast',
          medium: 'medium',
          high: 'slow',
        };
        const preset = presets[quality] || presets.medium;
        command = `ffmpeg -i "${inputFile}" -c:v libx264 -preset ${preset} -crf 23 -c:a aac "${outputFile}"`;
      } else {
        return reject(new Error(`Unsupported format: ${format}`));
      }

      logger.info(`[${jobId}] Running FFmpeg conversion`, { command, format, quality });

      const process = exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error(`[${jobId}] FFmpeg conversion failed`, {
            error: error.message,
            stderr,
          });
          return reject(new Error(`Conversion to ${format} failed: ${error.message}`));
        }

        logger.info(`[${jobId}] FFmpeg conversion completed`);
        resolve();
      });

      // Parse FFmpeg progress output
      if (process.stderr) {
        process.stderr.on('data', (data) => {
          const output = data.toString();
          logger.debug(`[${jobId}] FFmpeg output: ${output.substring(0, 100)}`);

          // FFmpeg outputs "frame=..." which we can use for progress
          // Progress goes from 50-100 during conversion
          if (output.includes('frame=') && onProgress) {
            // Simple progress estimation
            onProgress(75);
          }
        });
      }
    });
  }

  /**
   * Generate a clean filename from URL title
   * @private
   */
  _generateFileName(streamUrl, format) {
    // Extract a safe filename from URL or generate from timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const random = Math.random().toString(36).substring(7);
    return `media_${timestamp}_${random}.${format}`;
  }
}

module.exports = new ConversionService();
