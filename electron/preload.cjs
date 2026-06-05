const { contextBridge, ipcRenderer } = require('electron');

// Exposes window.habitStore to the app. The renderer never touches the
// filesystem directly — it asks the main process via these channels.
contextBridge.exposeInMainWorld('habitStore', {
  load: () => ipcRenderer.invoke('habit:load'),
  save: (data) => ipcRenderer.invoke('habit:save', data),
});
