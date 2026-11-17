'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('thumbDeskNative', {
  getApiKey: () => ipcRenderer.invoke('api-key:get'),
  setApiKey: (value) => ipcRenderer.invoke('api-key:set', value),
  clearApiKey: () => ipcRenderer.invoke('api-key:clear'),
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  getUpdateStatus: () => ipcRenderer.invoke('updater:get-status'),
  updateNow: () => ipcRenderer.invoke('updater:update-now'),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('updater:status', listener);
    return () => ipcRenderer.removeListener('updater:status', listener);
  }
});
