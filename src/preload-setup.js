'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('setupAPI', {
  onUpdate: (cb) => ipcRenderer.on('setup:update', (_e, d)  => cb(d)),
  onError:  (cb) => ipcRenderer.on('setup:error',  (_e, d)  => cb(d)),
  onDone:   (cb) => ipcRenderer.once('setup:done',  ()       => cb()),
  retry: () => ipcRenderer.send('setup:retry'),
  skip:  () => ipcRenderer.send('setup:skip'),
});
