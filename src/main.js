require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

let mainWindow;
let httpServer;

function getDefaultOutputDir() {
  try {
    if (fs.existsSync('D:\\')) return 'D:\\';
  } catch (_) {}
  return app.getPath('downloads');
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
  const logger     = require('./services/loggerService');
  const PORT       = process.env.PORT || 3000;

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

// ── Bootstrap: ensure yt-dlp + FFmpeg are available ──────────────────────

/**
 * Show a frameless setup window and run the bootstrap downloads.
 * Resolves once setup is complete (or the user chose to skip).
 * On unrecoverable failure the window stays open; the user can retry or skip.
 */
async function runSetupWindow(bootstrap) {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 500,
      height: 330,
      resizable: false,
      frame: false,
      backgroundColor: '#84cdf7',
      icon: path.join(__dirname, 'ui', 'assets', 'icon.ico'),
      webPreferences: {
        preload: path.join(__dirname, 'preload-setup.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    win.loadFile(path.join(__dirname, 'ui', 'setup.html'));

    // Let the user skip (run without managed deps — falls back to PATH)
    ipcMain.once('setup:skip', () => {
      win.close();
      resolve();
    });

    const runDownloads = async () => {
      try {
        fs.mkdirSync(bootstrap.BIN_DIR, { recursive: true });

        const send = (data) => {
          if (!win.isDestroyed()) win.webContents.send('setup:update', data);
        };

        // FFmpeg is bundled via ffmpeg-static — mark it done immediately.
        send({ dep: 'ffmpeg', phase: 'done', pct: 100 });

        // ── yt-dlp ──────────────────────────────────────────────────────
        if (!fs.existsSync(bootstrap.YTDLP_EXE)) {
          await bootstrap.downloadFile(bootstrap.YTDLP_URL, bootstrap.YTDLP_EXE, (pct) => {
            send({ dep: 'ytdlp', phase: 'downloading', pct });
          });
        }
        send({ dep: 'ytdlp', phase: 'done', pct: 100 });

        bootstrap.applyPaths();

        if (!win.isDestroyed()) win.webContents.send('setup:done');
        // Brief pause so the user can see the "All set!" message
        await new Promise(r => setTimeout(r, 1200));
        if (!win.isDestroyed()) win.close();
        resolve();

      } catch (err) {
        if (!win.isDestroyed()) {
          win.webContents.send('setup:error', { message: err.message });
        }
        // Wait for retry or skip
        ipcMain.once('setup:retry', () => runDownloads());
      }
    };

    win.webContents.once('did-finish-load', () => runDownloads());
  });
}

async function ensureDependencies() {
  const bootstrap = require('./bootstrap');

  if (bootstrap.needsSetup()) {
    await runSetupWindow(bootstrap);
  } else {
    // Managed binaries already present (or user has explicit .env paths) — just wire the env vars.
    bootstrap.applyPaths();
  }
}

// ── Auto-update ───────────────────────────────────────────────────────────

function scheduleUpdateCheck() {
  if (!app.isPackaged) return; // dev mode — never check

  const { autoUpdater } = require('electron-updater');

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update ready',
      message: 'A new version of Converto has been downloaded.',
      detail: 'Restart the app to apply the update.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  // Check once on launch; silence network / no-release errors
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
}

// ── App lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // Bootstrap must run before startBackend() because conversionService.js
  // parses YTDLP_PATH once at require()-time; env vars must be set first.
  await ensureDependencies();
  await startBackend();
  createWindow();
  scheduleUpdateCheck();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (httpServer) httpServer.close();
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC handlers ─────────────────────────────────────────────────────────

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
