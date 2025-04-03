// 在DOMContentLoaded事件监听器开头添加：
const minimizeBtn = document.getElementById('minimize-btn')
const maximizeBtn = document.getElementById('maximize-btn')
const closeBtn = document.getElementById('close-btn')

// 添加事件监听器
minimizeBtn.addEventListener('click', () => window.electronAPI.minimizeWindow())
maximizeBtn.addEventListener('click', () => window.electronAPI.maximizeWindow())
closeBtn.addEventListener('click', () => window.electronAPI.closeWindow())

document.addEventListener('DOMContentLoaded', async () => {
    // DOM 元素
    const notesList = document.getElementById('notes-list')
    const noteTitle = document.getElementById('note-title')
    const noteContent = document.getElementById('note-content')
    const saveBtn = document.getElementById('save-btn')
    const deleteBtn = document.getElementById('delete-btn')
    const newNoteBtn = document.getElementById('new-note-btn')
    const themeSelect = document.getElementById('theme-select')
  
    let currentNote = null
  
    // 初始化
    await loadNotes()
    setupTheme()
  
    // 事件监听
    saveBtn.addEventListener('click', saveCurrentNote)
    deleteBtn.addEventListener('click', deleteCurrentNote)
    newNoteBtn.addEventListener('click', createNewNote)
    themeSelect.addEventListener('change', changeTheme)
  
    // 加载笔记列表
    async function loadNotes() {
      const notes = await window.electronAPI.getNotes()
      renderNotesList(notes)
      
      if (notes.length > 0 && !currentNote) {
        loadNote(notes[0].name)
      }
    }
  
    // 渲染笔记列表
    function renderNotesList(notes) {
      notesList.innerHTML = ''
      notes.forEach(note => {
        const noteElement = document.createElement('div')
        noteElement.className = 'note-item'
        if (currentNote && note.name === currentNote.name) {
          noteElement.classList.add('active')
        }
        noteElement.textContent = note.name
        noteElement.addEventListener('click', () => loadNote(note.name))
        notesList.appendChild(noteElement)
      })
    }
  
    // 加载笔记内容
    async function loadNote(noteName) {
      const response = await window.electronAPI.loadNote(noteName)
      if (response.success) {
        currentNote = { name: noteName }
        noteTitle.value = noteName
        noteContent.value = response.content
        await loadNotes() // 刷新列表以更新活动状态
      }
    }
  
    // 保存当前笔记
    async function saveCurrentNote() {
      const title = noteTitle.value.trim()
      if (!title) return
  
      const content = noteContent.value
      await window.electronAPI.saveNote(title, content)
      
      // 如果是重命名笔记，需要删除旧文件
      if (currentNote && currentNote.name !== title) {
        await window.electronAPI.deleteNote(currentNote.name)
      }
      
      currentNote = { name: title }
      await loadNotes()
    }
  
    // 删除当前笔记
    async function deleteCurrentNote() {
      if (!currentNote) return
      
      if (confirm(`确定要删除笔记 "${currentNote.name}" 吗?`)) {
        await window.electronAPI.deleteNote(currentNote.name)
        currentNote = null
        noteTitle.value = ''
        noteContent.value = ''
        await loadNotes()
      }
    }
  
    // 创建新笔记
    function createNewNote() {
      currentNote = null
      noteTitle.value = ''
      noteContent.value = ''
      noteTitle.focus()
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
  })