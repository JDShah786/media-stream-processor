const fs = require('fs');
const path = require('path');
const logger = require('./loggerService');

/**
 * File Service
 * Manages file operations, directory setup, and cleanup
 */
class FileService {
  constructor() {
    this.downloadsDir = path.join(process.cwd(), 'downloads');
    this.tempDir = path.join(process.cwd(), '.temp');
  }

  /**
   * Initialize required directories
   */
  initializeDirectories() {
    try {
      if (!fs.existsSync(this.downloadsDir)) {
        fs.mkdirSync(this.downloadsDir, { recursive: true });
        logger.info(`Created downloads directory: ${this.downloadsDir}`);
      }

      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
        logger.info(`Created temp directory: ${this.tempDir}`);
      }
    } catch (error) {
      logger.error('Failed to initialize directories', error);
      throw error;
    }
  }

  /**
   * Get the downloads directory path
   */
  getDownloadsDirectory() {
    return this.downloadsDir;
  }

  /**
   * Get the temp directory path
   */
  getTempDirectory() {
    return this.tempDir;
  }

  /**
   * Check if sufficient disk space is available
   * @param {number} requiredBytes - Bytes needed
   */
  hasSufficientSpace(requiredBytes) {
    try {
      // For now, just check if directory is writable
      // In production, implement actual disk space checking
      const stats = fs.statSync(this.downloadsDir);
      return true;
    } catch (error) {
      logger.error('Failed to check disk space', error);
      return false;
    }
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      logger.warn(`Could not get file size for ${filePath}`, error);
      return 0;
    }
  }

  /**
   * List all downloaded media files in a directory
   * @param {string} [dir] - Directory to list; defaults to downloadsDir
   */
  listDownloads(dir) {
    const targetDir = dir || this.downloadsDir;
    try {
      if (!fs.existsSync(targetDir)) {
        return [];
      }

      const files = fs.readdirSync(targetDir);
      return files
        .filter((file) => /\.(mp3|mp4|webm|m4a|opus)$/i.test(file))
        .map((file) => ({
          name: file,
          path: path.join(targetDir, file),
          size: this.getFileSize(path.join(targetDir, file)),
          createdAt: fs.statSync(path.join(targetDir, file)).birthtime,
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      logger.error('Failed to list downloads', error);
      return [];
    }
  }

  /**
   * Delete a file
   */
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted file: ${filePath}`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to delete file ${filePath}`, error);
      return false;
    }
  }

  /**
   * Clean up old temporary files
   */
  cleanupTempFiles() {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return;
      }

      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      files.forEach((file) => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          try {
            fs.unlinkSync(filePath);
            logger.info(`Cleaned up old temp file: ${filePath}`);
          } catch (error) {
            logger.warn(`Failed to cleanup temp file ${filePath}`, error);
          }
        }
      });
    } catch (error) {
      logger.error('Failed to cleanup temp files', error);
    }
  }
}

module.exports = new FileService();
