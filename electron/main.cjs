const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

// Data is stored in the app's own folder — independent of any browser.
// macOS:   ~/Library/Application Support/Habit Game/habit-data.json
// Windows: %APPDATA%/Habit Game/habit-data.json
// Linux:   ~/.config/Habit Game/habit-data.json
const dataFile = () => path.join(app.getPath('userData'), 'habit-data.json');

ipcMain.handle('habit:load', async () => {
  try {
    const raw = await fsp.readFile(dataFile(), 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return null; // no file yet
  }
});

ipcMain.handle('habit:save', async (_event, data) => {
  const file = dataFile();
  const tmp = file + '.tmp';
  // write to temp then rename = safer against corruption on crash
  await fsp.writeFile(tmp, JSON.stringify(data));
  await fsp.rename(tmp, file);
  return true;
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#e7eae1',
    title: 'Habit Game',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // 자동 업데이트: 새 버전이 릴리스되면 백그라운드로 받아 다음 실행 때 적용.
  // 개발 모드나 미서명 맥에서는 자동으로 건너뜀(에러는 로그만 남기고 무시).
  autoUpdater.on('error', (err) => console.error('autoUpdater:', err ? (err.stack || err).toString() : 'unknown error'));
  // 다운로드가 끝나면 눈에 띄는 안내 + 즉시 재시작 옵션 (조용히 끝나 사용자가 못 알아채는 문제 방지)
  autoUpdater.on('update-downloaded', (info) => {
    const win = BrowserWindow.getAllWindows()[0];
    const opts = {
      type: 'info',
      buttons: ['지금 재시작', '나중에'],
      defaultId: 0,
      cancelId: 1,
      title: '업데이트 준비 완료',
      message: `새 버전${info && info.version ? ' v' + info.version : ''}이 준비됐어요.`,
      detail: '지금 재시작하면 바로 적용됩니다. ("나중에"를 누르면 앱을 완전히 종료할 때 자동으로 적용돼요.)',
    };
    (win ? dialog.showMessageBox(win, opts) : dialog.showMessageBox(opts))
      .then((r) => { if (r.response === 0) autoUpdater.quitAndInstall(); else if (win) win.focus(); })
      .catch(() => {});
  });
  autoUpdater.checkForUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
