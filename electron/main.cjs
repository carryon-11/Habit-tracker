const { app, BrowserWindow, ipcMain } = require('electron');
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
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
