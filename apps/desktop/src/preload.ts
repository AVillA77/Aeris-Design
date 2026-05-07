import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
  invoke: (channel: string, ...args: any[]) => {
    // Placeholder for IPC communication
  },
})
