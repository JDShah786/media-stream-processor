const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:showInFolder', filePath),
  getDownloadsPath: () => ipcRenderer.invoke('app:getDownloadsPath'),
});
