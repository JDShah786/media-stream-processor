require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let httpServer;

/**
 * Default output directory. Prefers D:\ when present (the author's setup), but
 * falls back to the OS Downloads folder so a packaged build works on any machine.
 */
function getDefaultOutputDir() {
  try {
    if (fs.existsSync('D:\\')) return 'D:\\';
  } catch (_) {}
  return app.getPath('downloads');
}

/** Resolve true if `cmd` runs and exits 0 for the given version flag. */
function commandAvailable(cmd, prefixArgs, versionArg) {
  return new Promise((resolve) => {
    let proc;
    try {
      proc = spawn(cmd, [...prefixArgs, versionArg], { windowsHide: true });
    } catch (_) {
      return resolve(false);
    }
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

/**
 * The packaged app bundles neither Python/yt-dlp nor FFmpeg. Probe for them on
 * launch and warn (non-fatally) so the user gets actionable guidance instead of
 * a silent conversion failure later.
 */
async function checkDependencies() {
  const missing = [];

  const [ytCmd, ...ytPrefix] = (process.env.YTDLP_PATH || 'yt-dlp').trim().split(/\s+/);
  if (!(await commandAvailable(ytCmd, ytPrefix, '--version'))) {
    missing.push('• yt-dlp — the download engine. Install Python 3, then: pip install -U yt-dlp');
  }

  const ffmpegCmd = process.env.FFMPEG_PATH || 'ffmpeg';
  if (!(await commandAvailable(ffmpegCmd, [], '-version'))) {
    missing.push('• FFmpeg — required to convert and merge media. https://ffmpeg.org/download.html');
  }

  if (missing.length && mainWindow) {
    dialog.showMessageBox(mainWindow, {
      type: 'warning',
      title: 'Missing dependencies',
      message: 'Converto needs these tools installed to convert videos:',
      detail: `${missing.join('\n')}\n\nConversions will fail until these are available on your system.`,
      buttons: ['OK'],
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 740,
    minWidth: 560,
    minHeight: 560,
    frame: false,
    backgroundColor: '#1a1c2e',
    icon: path.join(__dirname, 'ui', 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function startBackend() {
  const expressApp = require('./app');
  const logger = require('./services/loggerService');
  const PORT = process.env.PORT || 3000;

  return new Promise((resolve) => {
    httpServer = expressApp.listen(PORT, () => {
      logger.info(`Backend running on port ${PORT}`);
      resolve();
    });

    httpServer.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${PORT} already in use — continuing`);
        resolve();
      }
    });
  });
}

app.whenReady().then(async () => {
  await startBackend();
  createWindow();
  checkDependencies(); // non-blocking; warns if yt-dlp/ffmpeg are missing

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (httpServer) httpServer.close();
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.handle('window:close', () => mainWindow.close());

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Output Folder',
    defaultPath: getDefaultOutputDir(),
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('shell:showInFolder', (_event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('app:getDownloadsPath', () => {
  return getDefaultOutputDir();
});
