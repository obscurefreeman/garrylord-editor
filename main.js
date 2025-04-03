const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs-extra')

// 确保JSON目录存在
const jsonDir = path.join(app.getPath('userData'), 'json-files')
fs.ensureDirSync(jsonDir)

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
    },
    icon: path.join(__dirname, 'assets/favicon.ico')
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
ipcMain.handle('get-json-files', async () => {
  try {
    const files = await fs.readdir(jsonDir)
    return files.filter(file => file.endsWith('.json')).map(file => ({
      name: file.replace('.json', ''),
      path: path.join(jsonDir, file)
    }))
  } catch (err) {
    return []
  }
})

ipcMain.handle('save-json', async (event, { name, content, type }) => {
  const filePath = path.join(jsonDir, `${name}.json`)
  try {
    // 验证JSON格式
    JSON.parse(content);
    await fs.writeFile(filePath, content)
    return { success: true }
  } catch (err) {
    return { success: false, error: 'Invalid JSON format' }
  }
})

ipcMain.handle('load-json', async (event, name) => {
  const filePath = path.join(jsonDir, `${name}.json`)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return { success: true, content }
  } catch (err) {
    return { success: false }
  }
})

ipcMain.handle('delete-json', async (event, name) => {
  const filePath = path.join(jsonDir, `${name}.json`)
  try {
    await fs.remove(filePath)
    return { success: true }
  } catch (err) {
    return { success: false }
  }
})

ipcMain.handle('load-template', async (event, type) => {
  try {
    const templatePath = path.join(__dirname, 'templates', `${type}`)
    const data = await fs.promises.readFile(templatePath, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error(`Failed to load ${type} template:`, err)
    throw new Error(`Failed to load ${type} template: ${err.message}`)
  }
})

ipcMain.handle('get-templates', async () => {
  try {
    const templatesDir = path.join(__dirname, 'templates')
    await fs.ensureDir(templatesDir)
    const files = await fs.readdir(templatesDir)
    return files
      .filter(file => file.startsWith('template_') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(templatesDir, file)
      }))
  } catch (err) {
    console.error('Failed to get templates:', err)
    return []
  }
})

ipcMain.handle('get-available-themes', async () => {
  try {
    const stylesDir = path.join(__dirname, 'src', 'renderer', 'styles');
    await fs.ensureDir(stylesDir);
    const files = await fs.readdir(stylesDir);
    return files
      .filter(file => file.endsWith('.css'))
      .map(file => file.replace('.css', ''));
  } catch (err) {
    console.error('Failed to get available themes:', err);
    return ['default']; // 回退
  }
});