import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  onMenuAction: (cb: (action: string) => void) =>
    ipcRenderer.on('menu-action', (_event, action) => cb(action)),
});
