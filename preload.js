const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNote: (name, content) => ipcRenderer.invoke('save-note', { name, content }),
  loadNote: (name) => ipcRenderer.invoke('load-note', name),
  deleteNote: (name) => ipcRenderer.invoke('delete-note', name),
  // 添加窗口控制API
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close')
})