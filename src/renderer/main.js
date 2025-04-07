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
    const toggleViewBtn = document.getElementById('toggle-view-btn')
    const structuredView = document.getElementById('structured-view')
    const publishBtn = document.getElementById('publish-btn')
    const publishModal = document.getElementById('publish-modal')
  
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
    toggleViewBtn.addEventListener('click', toggleView)
    publishBtn.addEventListener('click', showPublishModal)
  
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
        await loadFiles()
        validateJson()
        
        try {
          const jsonData = JSON.parse(response.content)
          renderStructuredView(jsonData)
          structuredView.style.display = 'block'
          jsonContent.style.display = 'none'
          toggleViewBtn.textContent = 'Raw JSON'
        } catch (err) {
          // 如果 JSON 无效，回退到原始视图
          structuredView.style.display = 'none'
          jsonContent.style.display = 'block'
          toggleViewBtn.textContent = 'Structured View'
          showJsonError('Invalid JSON: ' + err.message)
        }
      }
    }
  
    // 切换视图
    function toggleView() {
      if (jsonContent.style.display === 'none') {
        // 当前在结构化视图中，切换到原始视图
        structuredView.style.display = 'none'
        jsonContent.style.display = 'block'
        toggleViewBtn.textContent = 'Structured View'
      } else {
        // 当前在原始视图中，切换到结构化视图
        try {
          const jsonData = JSON.parse(jsonContent.value)
          renderStructuredView(jsonData)
          structuredView.style.display = 'block'
          jsonContent.style.display = 'none'
          toggleViewBtn.textContent = 'Raw JSON'
        } catch (err) {
          showJsonError('Cannot switch view: ' + err.message)
        }
      }
    }
  
    // 渲染结构化视图
    function renderStructuredView(data, parentKey = '') {
      structuredView.innerHTML = ''
      
      if (typeof data !== 'object' || data === null) {
        structuredView.innerHTML = '<p>This JSON structure is not suitable for structured view</p>'
        return
      }
      
      for (const key in data) {
        const value = data[key]
        const fullKey = parentKey ? `${parentKey}.${key}` : key
        
        if (Array.isArray(value)) {
          const section = document.createElement('div')
          section.className = 'json-section'
          
          const heading = document.createElement('h2')
          heading.textContent = key
          section.appendChild(heading)
          
          const textarea = document.createElement('textarea')
          textarea.className = 'json-textarea'
          textarea.value = value.join('\n')
          textarea.dataset.key = fullKey
          
          // 添加自适应高度功能
          const adjustHeight = (e) => {
            e.target.style.height = 'auto'
            e.target.style.height = e.target.scrollHeight + 'px'
          }
          
          textarea.addEventListener('input', (e) => {
            const newValue = e.target.value.split('\n').filter(line => line.trim() !== '')
            updateStructuredData(fullKey, newValue)
            adjustHeight(e)
          })
          
          // 添加点击事件来调整高度
          textarea.addEventListener('click', adjustHeight)
          
          section.appendChild(textarea)
          structuredView.appendChild(section)
        } else if (typeof value === 'object' && value !== null) {
          const section = document.createElement('div')
          section.className = 'json-section'
          
          const heading = document.createElement('h1')
          heading.textContent = key
          section.appendChild(heading)
          
          const nestedContainer = document.createElement('div')
          nestedContainer.className = 'nested-container'
          renderNestedStructure(value, nestedContainer, fullKey)
          section.appendChild(nestedContainer)
          
          structuredView.appendChild(section)
        } else {
          const section = document.createElement('div')
          section.className = 'json-section'
          
          const label = document.createElement('label')
          label.textContent = key
          section.appendChild(label)
          
          const input = document.createElement('input')
          input.type = 'text'
          input.value = value
          input.dataset.key = fullKey
          input.addEventListener('input', (e) => {
            updateStructuredData(fullKey, e.target.value)
          })
          
          section.appendChild(input)
          structuredView.appendChild(section)
        }
      }
    }
  
    // 渲染嵌套结构
    function renderNestedStructure(data, container, parentKey) {
      for (const key in data) {
        const value = data[key]
        const fullKey = parentKey ? `${parentKey}.${key}` : key
        
        if (Array.isArray(value)) {
          const section = document.createElement('div')
          section.className = 'json-subsection'
          
          const heading = document.createElement('h2')
          heading.textContent = key
          section.appendChild(heading)
          
          const textarea = document.createElement('textarea')
          textarea.className = 'json-textarea'
          textarea.value = value.join('\n')
          textarea.dataset.key = fullKey
          
          // 添加自适应高度功能
          const adjustHeight = (e) => {
            e.target.style.height = 'auto'
            e.target.style.height = e.target.scrollHeight + 'px'
          }
          
          textarea.addEventListener('input', (e) => {
            const newValue = e.target.value.split('\n').filter(line => line.trim() !== '')
            updateStructuredData(fullKey, newValue)
            adjustHeight(e)
          })
          
          // 添加点击事件来调整高度
          textarea.addEventListener('click', adjustHeight)
          
          section.appendChild(textarea)
          container.appendChild(section)
        } else if (typeof value === 'object' && value !== null) {
          const section = document.createElement('div')
          section.className = 'json-subsection'
          
          const heading = document.createElement('h2')
          heading.textContent = key
          section.appendChild(heading)
          
          const nestedContainer = document.createElement('div')
          nestedContainer.className = 'nested-container'
          renderNestedStructure(value, nestedContainer, fullKey)
          section.appendChild(nestedContainer)
          
          container.appendChild(section)
        } else {
          const section = document.createElement('div')
          section.className = 'json-subsection'
          
          const label = document.createElement('label')
          label.textContent = key
          section.appendChild(label)
          
          const input = document.createElement('input')
          input.type = 'text'
          input.value = value
          input.dataset.key = fullKey
          input.addEventListener('input', (e) => {
            updateStructuredData(fullKey, e.target.value)
          })
          
          section.appendChild(input)
          container.appendChild(section)
        }
      }
    }
  
    // 更新结构化数据
    function updateStructuredData(keyPath, value) {
      const keys = keyPath.split('.')
      let current = JSON.parse(jsonContent.value)
      let temp = current
      
      for (let i = 0; i < keys.length - 1; i++) {
        temp = temp[keys[i]]
      }
      
      temp[keys[keys.length - 1]] = value
      jsonContent.value = JSON.stringify(current, null, 2)
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
      
      // 创建自定义确认弹窗
      const confirmModal = document.createElement('div')
      confirmModal.className = 'modal'
      confirmModal.innerHTML = `
        <div class="modal-content">
          <h2>Confirm Deletion</h2>
          <p>Are you sure you want to delete "${currentFile.name}"?</p>
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button id="confirm-delete-btn">Delete</button>
            <button id="cancel-delete-btn">Cancel</button>
          </div>
        </div>
      `
      
      document.body.appendChild(confirmModal)
      
      // 等待用户选择
      return new Promise((resolve) => {
        document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
          await window.electronAPI.deleteJsonFile(currentFile.name)
          currentFile = null
          fileName.value = ''
          jsonContent.value = ''
          await loadFiles()
          confirmModal.remove()
          resolve(true)
        })
        
        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
          confirmModal.remove()
          resolve(false)
        })
      })
    }
  
    // 显示模板选择模态框
    async function showTemplateModal() {
      templateList.innerHTML = ''
      const templates = await window.electronAPI.getTemplates()
      
      if (templates.length === 0) {
        templateList.innerHTML = '<p>No templates found</p>'
      } else {
        for (const template of templates) {
          try {
            const templateContent = await window.electronAPI.loadTemplate(template.name)
            const templateBtn = document.createElement('button')
            templateBtn.className = 'template-btn'
            
            // 创建模板名称元素
            const nameElement = document.createElement('div')
            nameElement.className = 'template-name'
            // 使用模板内容中的info.name作为显示名称，如果不存在则使用默认名称
            const displayName = templateContent.info?.name || 'Unnamed Template'
            nameElement.textContent = displayName
            
            // 创建描述元素
            const descElement = document.createElement('div')
            descElement.className = 'template-description'
            descElement.textContent = templateContent.info?.description || 'No description available.'
            
            templateBtn.appendChild(nameElement)
            templateBtn.appendChild(descElement)
            
            templateBtn.addEventListener('click', () => {
              createFromTemplate(template.name)
              templateModal.style.display = 'none'
            })
            templateList.appendChild(templateBtn)
          } catch (err) {
            console.error(`Failed to load template ${template.name}:`, err)
          }
        }
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
        
        // 默认显示结构化视图
        try {
          renderStructuredView(template)
          structuredView.style.display = 'block'
          jsonContent.style.display = 'none'
          toggleViewBtn.textContent = 'Raw JSON'
        } catch (err) {
          // 如果有错误，回退到原始视图
          structuredView.style.display = 'none'
          jsonContent.style.display = 'block'
          toggleViewBtn.textContent = 'Structured View'
        }
        
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
      const themes = await window.electronAPI.getAvailableThemes();
      const themePreviewContainer = document.getElementById('theme-preview-container');
      const themeModal = document.getElementById('theme-modal');
      
      // 打开主题选择弹窗
      document.getElementById('theme-select').addEventListener('click', () => {
        themeModal.style.display = 'block';
      });

      // 关闭主题选择弹窗
      document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
          e.target.closest('.modal').style.display = 'none';
        });
      });

      // 生成主题预览
      themePreviewContainer.innerHTML = '';
      
      for (const theme of themes) {
        try {
          const themeContent = await window.electronAPI.loadTheme(theme);
          const colorVars = extractColorVariables(themeContent);
          addThemePreview(theme, colorVars);
        } catch (err) {
          console.error(`Failed to load ${theme} theme:`, err);
        }
      }

      // 设置当前主题
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && themes.includes(savedTheme)) {
        changeTheme(savedTheme);
      } else {
        changeTheme('default');
      }
    }
  
    // 从CSS内容中提取颜色变量
    function extractColorVariables(cssContent) {
      const varRegex = /(--[a-z-]+):\s*(#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)|[a-z]+);/g;
      const colorVars = {};
      let match;
      
      while ((match = varRegex.exec(cssContent)) !== null) {
        const varName = match[1];
        const varValue = match[2];
        
        // 只收集颜色相关的变量
        if (varName.includes('color') || varName.includes('bg') || varName.includes('theme')) {
          colorVars[varName] = varValue;
        }
      }
      
      return colorVars;
    }
  
    // 添加主题预览
    function addThemePreview(themeName, colorVars) {
      const themePreviewContainer = document.getElementById('theme-preview-container');
      const preview = document.createElement('div');
      preview.className = 'theme-preview';
      preview.dataset.theme = themeName;
      
      // 预览标题
      const title = document.createElement('div');
      title.textContent = themeName.charAt(0).toUpperCase() + themeName.slice(1);
      preview.appendChild(title);

      // 颜色预览
      const colors = document.createElement('div');
      colors.className = 'theme-preview-colors';
      
      // 添加主要颜色预览
      const importantColors = [
        colorVars['--theme-color'] || '#ff9900',
        colorVars['--bg-color'] || '#1e1e1e',
        colorVars['--text-color'] || '#d4d4d4',
        colorVars['--sidebar-bg'] || '#252526',
        colorVars['--heading1-color'] || colorVars['--theme-color'] || '#ff9900'
      ].slice(0, 3); // 只显示前3种颜色
      
      importantColors.forEach(color => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'theme-preview-color';
        colorDiv.style.backgroundColor = color;
        colors.appendChild(colorDiv);
      });

      preview.appendChild(colors);
      
      // 选择主题
      preview.addEventListener('click', () => {
        changeTheme(themeName);
        document.getElementById('theme-modal').style.display = 'none';
      });

      themePreviewContainer.appendChild(preview);
    }
  
    function changeTheme(theme) {
      const themeVarsLink = document.getElementById('theme-vars');
      
      if (theme === 'default') {
        themeVarsLink.textContent = '';
      } else {
        // 使用data URL方式加载主题
        window.electronAPI.loadTheme(theme).then(cssContent => {
          themeVarsLink.textContent = cssContent;
        }).catch(err => {
          console.error(`Failed to load ${theme} theme:`, err);
        });
      }
      
      localStorage.setItem('theme', theme);
    }
  
    // 实时JSON验证
    jsonContent.addEventListener('input', () => {
      validateJson()
    })

    // 更新切换按钮的初始文本
    toggleViewBtn.textContent = 'Raw JSON'

    function showPublishModal() {
      const publishModal = document.getElementById('publish-modal');
      publishModal.style.display = 'block';

      const publishIframe = document.getElementById('publish-iframe');
      publishIframe.src = 'https://obscurefreeman.github.io/npc_complex_chat/';
      document.querySelector('#publish-modal .close-modal').addEventListener('click', () => {
        publishIframe.src = ''; // 清空iframe内容
        publishModal.style.display = 'none';
      });
    }
})