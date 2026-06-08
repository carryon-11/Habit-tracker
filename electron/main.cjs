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

// 렌더러(헤더 버튼)로 업데이트 진행 상태를 흘려보냄
function sendUpdateStatus(payload) {
  const win = BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    try { win.webContents.send('update:status', payload); } catch (e) {}
  }
}

// 헤더 '업데이트 확인' 버튼 → 지금 즉시 확인. 미서명 맥은 동작 안 하므로 안내만.
ipcMain.handle('update:check', async () => {
  if (process.platform === 'darwin') return { ok: false, mac: true };
  try {
    const r = await autoUpdater.checkForUpdates();
    return { ok: true, version: r && r.updateInfo ? r.updateInfo.version : null };
  } catch (e) {
    return { ok: false, error: e ? String(e.message || e) : 'unknown' };
  }
});

// 소셜 로그인: 앱 내부 창에서 OAuth 진행 → redirectBase 로 돌아오는 URL의 ?code 를 가로채 반환.
// 별도 창은 preload 없이(3rd-party 로그인 페이지에 앱 API 노출 방지). 취소/실패 시 null.
ipcMain.handle('oauth:start', async (_event, { authUrl, redirectBase }) => {
  return new Promise((resolve) => {
    let win;
    try {
      win = new BrowserWindow({
        width: 480, height: 760, title: '로그인', autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      });
    } catch (e) { resolve(null); return; }
    let done = false;
    const finish = (code) => { if (done) return; done = true; resolve(code || null); try { if (!win.isDestroyed()) win.destroy(); } catch (e) {} };
    const onNav = (ev, url) => {
      if (!url || url.indexOf(redirectBase) !== 0) return; // 우리 복귀 주소로 오는 순간만 처리
      try { ev.preventDefault(); } catch (e) {} // 그 페이지를 실제로 띄우지 않음(코드 소모 방지)
      try { const u = new URL(url); finish(u.searchParams.get('code')); } catch (e) { finish(null); }
    };
    win.webContents.on('will-redirect', onNav);
    win.webContents.on('will-navigate', onNav);
    win.on('closed', () => { if (!done) { done = true; resolve(null); } });
    win.loadURL(authUrl).catch(() => finish(null));
  });
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
  let updateTimer = null;
  autoUpdater.on('error', (err) => {
    console.error('autoUpdater:', err ? (err.stack || err).toString() : 'unknown error');
    sendUpdateStatus({ state: 'error', message: err ? String(err.message || err) : 'unknown' });
  });
  // 진행 상태를 렌더러(헤더 버튼)로 전달
  autoUpdater.on('checking-for-update', () => sendUpdateStatus({ state: 'checking' }));
  autoUpdater.on('update-available', (info) => sendUpdateStatus({ state: 'available', version: info && info.version }));
  autoUpdater.on('update-not-available', (info) => sendUpdateStatus({ state: 'latest', version: info && info.version }));
  autoUpdater.on('download-progress', (p) => sendUpdateStatus({ state: 'downloading', percent: p ? Math.round(p.percent) : 0 }));
  // 다운로드가 끝나면 눈에 띄는 안내 + 즉시 재시작 옵션 (조용히 끝나 사용자가 못 알아채는 문제 방지)
  autoUpdater.on('update-downloaded', (info) => {
    if (updateTimer) { clearInterval(updateTimer); updateTimer = null; } // 이미 받았으면 반복 확인 중단
    sendUpdateStatus({ state: 'downloaded', version: info && info.version });
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
  // 실행 중에도 1시간마다 자동 확인 (앱을 안 꺼도 새 버전이 제때 감지됨)
  updateTimer = setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
