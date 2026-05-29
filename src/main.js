require('dotenv').config();
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');

let mainWindow;
let httpServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 860,
    height: 720,
    minWidth: 720,
    minHeight: 580,
    frame: false,
    backgroundColor: '#0a0a0a',
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
    defaultPath: 'D:\\',
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('shell:showInFolder', (_event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('app:getDownloadsPath', () => {
  return 'D:\\';
});
