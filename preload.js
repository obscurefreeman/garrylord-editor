const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getJsonFiles: () => ipcRenderer.invoke('get-json-files'),
  saveJsonFile: (name, content, type) => ipcRenderer.invoke('save-json', { name, content, type }),
  loadJsonFile: (name) => ipcRenderer.invoke('load-json', name),
  deleteJsonFile: (name) => ipcRenderer.invoke('delete-json', name),
  loadTemplate: (type) => ipcRenderer.invoke('load-template', type),
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  getAvailableThemes: () => ipcRenderer.invoke('get-available-themes'),
  loadTheme: (themeName) => ipcRenderer.invoke('load-theme', themeName)
})