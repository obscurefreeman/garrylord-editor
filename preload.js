const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getNotes: () => ipcRenderer.invoke('get-notes'),
  saveNote: (name, content) => ipcRenderer.invoke('save-note', { name, content }),
  loadNote: (name) => ipcRenderer.invoke('load-note', name),
  deleteNote: (name) => ipcRenderer.invoke('delete-note', name)
})