const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getJsonFiles: () => ipcRenderer.invoke('get-json-files'),
  saveJsonFile: (name, content, type) => ipcRenderer.invoke('save-json', { name, content, type }),
  loadJsonFile: (name) => ipcRenderer.invoke('load-json', name),
  deleteJsonFile: (name) => ipcRenderer.invoke('delete-json', name),
  loadTemplate: (type) => ipcRenderer.invoke('load-template', type),
  // 添加窗口控制API
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
})