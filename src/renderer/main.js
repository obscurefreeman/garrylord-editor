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
    const newBtn = document.getElementById('new-btn')
    const templateModal = document.getElementById('template-modal')
    const templateList = document.getElementById('template-list')
    const closeModal = document.querySelector('.close-modal')
    const themeSelect = document.getElementById('theme-select')
    const jsonError = document.getElementById('json-error')
  
    let currentFile = null
  
    // 初始化
    await loadFiles()
    await setupTheme()
  
    // 事件监听
    saveBtn.addEventListener('click', saveCurrentFile)
    deleteBtn.addEventListener('click', deleteCurrentFile)
    formatBtn.addEventListener('click', formatJson)
    newBtn.addEventListener('click', showTemplateModal)
    closeModal.addEventListener('click', () => templateModal.style.display = 'none')
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
  
    // 显示模板选择模态框
    async function showTemplateModal() {
      templateList.innerHTML = ''
      const templates = await window.electronAPI.getTemplates()
      
      if (templates.length === 0) {
        templateList.innerHTML = '<p>No templates found</p>'
      } else {
        templates.forEach(template => {
          const templateBtn = document.createElement('button')
          templateBtn.className = 'template-btn'
          templateBtn.textContent = template.name
          templateBtn.addEventListener('click', () => {
            createFromTemplate(template.name)
            templateModal.style.display = 'none'
          })
          templateList.appendChild(templateBtn)
        })
      }
      
      templateModal.style.display = 'block'
    }
  
    // 从模板创建新文件
    async function createFromTemplate(templateName) {
      currentFile = null
      fileName.value = ''
      try {
        const template = await window.electronAPI.loadTemplate(templateName)
        jsonContent.value = JSON.stringify(template, null, 2)
        fileName.focus()
      } catch (err) {
        showJsonError(`Failed to load ${templateName} template: ${err.message}`)
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
    async function setupTheme() {
      // 从styles目录获取可用主题
      const themes = await window.electronAPI.getAvailableThemes();
      
      // 清空并填充主题选择器
      themeSelect.innerHTML = '';
      themes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
        themeSelect.appendChild(option);
      });

      // 设置保存的主题或第一个可用主题
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && themes.includes(savedTheme)) {
        themeSelect.value = savedTheme;
      } else if (themes.length > 0) {
        themeSelect.value = themes[0];
        localStorage.setItem('theme', themes[0]);
      }
      
      changeTheme();
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