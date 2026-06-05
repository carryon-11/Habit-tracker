const { contextBridge, ipcRenderer } = require('electron');

// Exposes window.habitStore to the app. The renderer never touches the
// filesystem directly — it asks the main process via these channels.
contextBridge.exposeInMainWorld('habitStore', {
  load: () => ipcRenderer.invoke('habit:load'),
  save: (data) => ipcRenderer.invoke('habit:save', data),
});

// 수동 업데이트 확인용. check()=지금 확인 요청, onStatus(cb)=진행 상태 구독(해제 함수 반환).
contextBridge.exposeInMainWorld('habitUpdater', {
  check: () => ipcRenderer.invoke('update:check'),
  onStatus: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('update:status', handler);
    return () => ipcRenderer.removeListener('update:status', handler);
  },
});
