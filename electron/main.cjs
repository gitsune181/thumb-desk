'use strict';

const { app, BrowserWindow, ipcMain, safeStorage, session, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const pkg = require('../package.json');

let mainWindow = null;
let installWhenReady = false;
let updateStatus = { phase: 'idle', version: null, percent: 0, message: '' };

function apiKeyPath() {
  return path.join(app.getPath('userData'), 'radar-api-key.dat');
}

function readApiKey() {
  try {
    const encrypted = Buffer.from(fs.readFileSync(apiKeyPath(), 'utf8'), 'base64');
    return safeStorage.decryptString(encrypted);
  } catch (_error) {
    return '';
  }
}

function saveApiKey(value) {
  const key = String(value || '').trim();
  if (!/^rdk_[A-Za-z0-9_-]{16,512}$/.test(key)) throw new Error('API key không đúng định dạng.');
  if (!safeStorage.isEncryptionAvailable()) return false;
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(apiKeyPath(), safeStorage.encryptString(key).toString('base64'), { encoding: 'utf8', mode: 0o600 });
  return true;
}

function clearApiKey() {
  try { fs.rmSync(apiKeyPath(), { force: true }); } catch (_error) {}
  return true;
}

function publishUpdateStatus(next) {
  updateStatus = { ...updateStatus, ...next };
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updater:status', updateStatus);
  return updateStatus;
}

async function checkForUpdates() {
  if (!app.isPackaged) return publishUpdateStatus({ phase: 'development', message: 'Bản phát triển', version: app.getVersion() });
  publishUpdateStatus({ phase: 'checking', message: 'Đang kiểm tra cập nhật…', percent: 0 });
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    publishUpdateStatus({ phase: 'error', message: error?.message || 'Không kiểm tra được cập nhật.' });
  }
  return updateStatus;
}

async function updateNow() {
  if (!app.isPackaged) return checkForUpdates();
  installWhenReady = true;
  if (updateStatus.phase === 'downloaded') {
    setTimeout(() => autoUpdater.quitAndInstall(false, true), 250);
    return updateStatus;
  }
  if (updateStatus.phase !== 'available') await checkForUpdates();
  if (updateStatus.phase === 'available') {
    publishUpdateStatus({ phase: 'downloading', message: 'Đang tải bản cập nhật…', percent: 0 });
    await autoUpdater.downloadUpdate();
  }
  return updateStatus;
}

function configureUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('update-available', (info) => publishUpdateStatus({ phase: 'available', version: info.version, message: `Có bản v${info.version}` }));
  autoUpdater.on('update-not-available', (info) => publishUpdateStatus({ phase: 'current', version: info.version || app.getVersion(), message: 'Đang dùng bản mới nhất', percent: 0 }));
  autoUpdater.on('download-progress', (progress) => publishUpdateStatus({ phase: 'downloading', percent: Math.round(progress.percent || 0), message: `Đang tải ${Math.round(progress.percent || 0)}%` }));
  autoUpdater.on('update-downloaded', (info) => {
    publishUpdateStatus({ phase: 'downloaded', version: info.version, percent: 100, message: 'Đã tải xong, đang cài đặt…' });
    if (installWhenReady) setTimeout(() => autoUpdater.quitAndInstall(false, true), 500);
  });
  autoUpdater.on('error', (error) => publishUpdateStatus({ phase: 'error', message: error?.message || 'Cập nhật thất bại.' }));
  setTimeout(checkForUpdates, 3000);
}

function configureIpc() {
  ipcMain.handle('api-key:get', () => readApiKey());
  ipcMain.handle('api-key:set', (_event, value) => saveApiKey(value));
  ipcMain.handle('api-key:clear', () => clearApiKey());
  ipcMain.handle('app:get-info', () => ({ version: app.getVersion(), tag: `v${app.getVersion()}`, releaseDate: pkg.releaseDate, packaged: app.isPackaged }));
  ipcMain.handle('updater:get-status', () => updateStatus);
  ipcMain.handle('updater:update-now', () => updateNow());
}

function createWindow() {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  const allowedUrl = pathToFileURL(indexPath).href;
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 980,
    minHeight: 680,
    show: false,
    title: 'Thumb Desk',
    backgroundColor: '#f5f7f4',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !app.isPackaged
    }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    if (targetUrl !== allowedUrl) event.preventDefault();
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.loadFile(indexPath);
}

const ownsLock = app.requestSingleInstanceLock();
if (!ownsLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    configureIpc();
    createWindow();
    configureUpdater();
  });
  app.on('window-all-closed', () => app.quit());
}
