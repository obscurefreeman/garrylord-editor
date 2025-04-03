// 窗口控制按钮
const minimizeBtn = document.getElementById('minimize-btn')
const maximizeBtn = document.getElementById('maximize-btn')
const closeBtn = document.getElementById('close-btn')

minimizeBtn.addEventListener('click', () => window.electronAPI.minimizeWindow())
maximizeBtn.addEventListener('click', () => window.electronAPI.maximizeWindow())
closeBtn.addEventListener('click', () => window.electronAPI.closeWindow())

document.addEventListener('DOMContentLoaded', async () => {
    // DOM 元素
    const filesList = document.getElementById('files-list')
    const fileName = document.getElementById('file-name')
    const jsonContent = document.getElementById('json-content')
    const saveBtn = document.getElementById('save-btn')
    const deleteBtn = document.getElementById('delete-btn')
    const formatBtn = document.getElementById('format-btn')
    const newNameBtn = document.getElementById('new-name-btn')
    const newDialogueBtn = document.getElementById('new-dialogue-btn')
    const themeSelect = document.getElementById('theme-select')
    const jsonError = document.getElementById('json-error')
  
    let currentFile = null
  
    // 初始化
    await loadFiles()
    setupTheme()
  
    // 事件监听
    saveBtn.addEventListener('click', saveCurrentFile)
    deleteBtn.addEventListener('click', deleteCurrentFile)
    formatBtn.addEventListener('click', formatJson)
    newNameBtn.addEventListener('click', createNewNameFile)
    newDialogueBtn.addEventListener('click', createNewDialogueFile)
    themeSelect.addEventListener('change', changeTheme)
  
    // 加载文件列表
    async function loadFiles() {
      const files = await window.electronAPI.getJsonFiles()
      renderFilesList(files)
      
      if (files.length > 0 && !currentFile) {
        loadFile(files[0].name)
      }
    }
  
    // 渲染文件列表
    function renderFilesList(files) {
      filesList.innerHTML = ''
      files.forEach(file => {
        const fileElement = document.createElement('div')
        fileElement.className = 'file-item'
        if (currentFile && file.name === currentFile.name) {
          fileElement.classList.add('active')
        }
        fileElement.textContent = file.name
        fileElement.addEventListener('click', () => loadFile(file.name))
        filesList.appendChild(fileElement)
      })
    }
  
    // 加载文件内容
    async function loadFile(fileName) {
      const response = await window.electronAPI.loadJsonFile(fileName)
      if (response.success) {
        currentFile = { name: fileName }
        document.getElementById('file-name').value = fileName
        jsonContent.value = response.content
        await loadFiles() // 刷新列表以更新活动状态
        validateJson()
      }
    }
  
    // 保存当前文件
    async function saveCurrentFile() {
      const name = fileName.value.trim()
      if (!name) return
  
      const content = jsonContent.value
      if (!validateJson()) return
      
      const response = await window.electronAPI.saveJsonFile(name, content, getFileType(content))
      
      if (response.success) {
        // 如果是重命名文件，需要删除旧文件
        if (currentFile && currentFile.name !== name) {
          await window.electronAPI.deleteJsonFile(currentFile.name)
        }
        
        currentFile = { name: name }
        await loadFiles()
      } else {
        showJsonError(response.error || 'Failed to save file')
      }
    }
  
    // 删除当前文件
    async function deleteCurrentFile() {
      if (!currentFile) return
      
      if (confirm(`Are you sure you want to delete "${currentFile.name}"?`)) {
        await window.electronAPI.deleteJsonFile(currentFile.name)
        currentFile = null
        fileName.value = ''
        jsonContent.value = ''
        await loadFiles()
      }
    }
  
    // 创建新的名称数据文件
    async function createNewNameFile() {
      currentFile = null
      fileName.value = ''
      try {
        const template = await window.electronAPI.loadTemplate('name')
        jsonContent.value = JSON.stringify(template, null, 2)
        fileName.focus()
      } catch (err) {
        showJsonError('Failed to load name template: ' + err.message)
      }
    }
  
    // 创建新的对话数据文件
    async function createNewDialogueFile() {
      currentFile = null
      fileName.value = ''
      try {
        const template = await window.electronAPI.loadTemplate('dialogue')
        jsonContent.value = JSON.stringify(template, null, 2)
        fileName.focus()
      } catch (err) {
        showJsonError('Failed to load dialogue template: ' + err.message)
      }
    }
  
    // 格式化JSON
    function formatJson() {
      try {
        const obj = JSON.parse(jsonContent.value)
        jsonContent.value = JSON.stringify(obj, null, 2)
        clearJsonError()
      } catch (err) {
        showJsonError('Invalid JSON: ' + err.message)
      }
    }
  
    // 验证JSON
    function validateJson() {
      try {
        JSON.parse(jsonContent.value)
        clearJsonError()
        return true
      } catch (err) {
        showJsonError('Invalid JSON: ' + err.message)
        return false
      }
    }
  
    // 显示JSON错误
    function showJsonError(message) {
      jsonError.textContent = message
      jsonError.style.display = 'block'
    }
  
    // 清除JSON错误
    function clearJsonError() {
      jsonError.textContent = ''
      jsonError.style.display = 'none'
    }
  
    // 获取文件类型
    function getFileType(content) {
      try {
        const json = JSON.parse(content)
        if (json.name && json.name.male && json.name.female) {
          return 'name'
        } else if (json.player && json.npc) {
          return 'dialogue'
        }
        return 'unknown'
      } catch {
        return 'unknown'
      }
    }
  
    // 主题功能
    function setupTheme() {
      const savedTheme = localStorage.getItem('theme') || 'default'
      themeSelect.value = savedTheme
      changeTheme()
    }
  
    function changeTheme() {
      const theme = themeSelect.value
      const themeLink = document.getElementById('theme-style')
      themeLink.href = `styles/${theme}.css`
      localStorage.setItem('theme', theme)
    }
  
    // 实时JSON验证
    jsonContent.addEventListener('input', () => {
      validateJson()
    })
})