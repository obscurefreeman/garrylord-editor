const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs-extra')

// 确保笔记目录存在
const notesDir = path.join(app.getPath('userData'), 'notes')
fs.ensureDirSync(notesDir)

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  })

  mainWindow.loadFile('src/renderer/index.html')

  // 开发模式下打开开发者工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }

  // 添加窗口控制IPC通信
  ipcMain.on('window-minimize', () => mainWindow.minimize())
  ipcMain.on('window-maximize', () => {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  })
  ipcMain.on('window-close', () => mainWindow.close())
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC 通信处理
ipcMain.handle('get-notes', async () => {
  try {
    const files = await fs.readdir(notesDir)
    return files.filter(file => file.endsWith('.md')).map(file => ({
      name: file.replace('.md', ''),
      path: path.join(notesDir, file)
    }))
  } catch (err) {
    return []
  }
})

ipcMain.handle('save-note', async (event, { name, content }) => {
  const filePath = path.join(notesDir, `${name}.md`)
  await fs.writeFile(filePath, content)
  return { success: true }
})

ipcMain.handle('load-note', async (event, name) => {
  const filePath = path.join(notesDir, `${name}.md`)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, content }
  } catch (err) {
    return { success: false }
  }
})

ipcMain.handle('delete-note', async (event, name) => {
  const filePath = path.join(notesDir, `${name}.md`)
  try {
    await fs.remove(filePath)
    return { success: true }
  } catch (err) {
    return { success: false }
  }
})
