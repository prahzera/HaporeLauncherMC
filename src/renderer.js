const { ipcRenderer, shell } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')

const profilesFile = path.join(os.homedir(), '.haporelauncher', 'ui_profiles.json')
const versionsDir = path.join(os.homedir(), '.haporelauncher', 'instances')

let active = null
let profiles = {}
let currentMainTab = 'profiles'

// Funciones para manejar pestañas principales
function switchMainTab(tabName) {
    // Remover clase active de todas las pestañas principales y contenidos
    document.querySelectorAll('.main-tab-btn').forEach(btn => btn.classList.remove('active'))
    document.querySelectorAll('.main-tab-content').forEach(content => content.classList.remove('active'))
    
    // Activar la pestaña seleccionada
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
    document.getElementById(`tab-${tabName}-content`).classList.add('active')
    
    currentMainTab = tabName
    
    // Actualizar el contenido según la pestaña
    updateTabContent(tabName)
}

function updateTabContent(tabName) {
    switch(tabName) {
        case 'profiles':
            updateProfileStatus()
            break
        case 'news':
            loadNews()
            break
        case 'logs':
            // Los logs se actualizan automáticamente
            break
        case 'settings':
            loadSettings()
            break
    }
}

function updateProfileStatus() {
    const profileStatus = $('#profile-status')
    const profileStats = $('#profile-stats')
    const profileHeadline = $('#profile-headline')
    const launchBtn = $('#btn-launch')
    const editBtn = $('#btn-edit-profile')
    
    if (active && profiles[active]) {
        const profile = profiles[active]
        profileStatus.textContent = `Perfil activo: ${active}`
        profileHeadline.textContent = active
        
        // Mostrar información sobre la versión
        const versionInfo = profile.version ? ` | Versión: ${profile.version}` : ''
        
        profileStatus.textContent = `Perfil activo: ${active}${versionInfo}`
        profileHeadline.textContent = active
        launchBtn.disabled = false
        editBtn.disabled = false
        
        // Calcular estadísticas
        const totalProfiles = Object.keys(profiles).length
        const playTime = profile.lastPlayed ? '2h 30m' : '0h' // Ejemplo
        profileStats.textContent = `Perfiles: ${totalProfiles} | Tiempo jugado: ${playTime}`
    } else {
        profileStatus.textContent = 'No hay perfil seleccionado'
        profileHeadline.textContent = 'Selecciona un perfil'
        profileStats.textContent = `Perfiles: ${Object.keys(profiles).length} | Tiempo jugado: 0h`
        launchBtn.disabled = true
        editBtn.disabled = true
    }
}

function loadNews() {
    const newsContent = $('#news-content')
    // Simular carga de noticias
    newsContent.innerHTML = `
        <div class="news-item">
            <h4>🎮 Minecraft 1.21 - Actualización disponible</h4>
            <p>Nueva actualización con mejoras de rendimiento y nuevas características...</p>
            <small>Hace 2 días</small>
        </div>
        <div class="news-item">
            <h4>🔧 Mejoras en el launcher</h4>
            <p>Nueva interfaz con pestañas y mejor experiencia de usuario...</p>
            <small>Hace 1 semana</small>
        </div>
    `
}

function loadSettings() {
    // Cargar configuración guardada
    const settings = getSettings()
    
    $('#ram-selector').value = settings.ram || '2'
    $('#resolution-selector').value = settings.resolution || '1280x720'
    $('#theme-selector').value = settings.theme || 'dark'
    $('#animations-toggle').checked = settings.animations !== false
    $('#auto-update-toggle').checked = settings.autoUpdate !== false
    $('#auto-logs-toggle').checked = settings.autoLogs || false
}

function getSettings() {
    try {
        const settingsFile = path.join(os.homedir(), '.haporelauncher', 'settings.json')
        return JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
    } catch {
        return {}
    }
}

function saveSettings() {
    try {
        const settingsFile = path.join(os.homedir(), '.haporelauncher', 'settings.json')
        const settings = {
            ram: $('#ram-selector').value,
            resolution: $('#resolution-selector').value,
            theme: $('#theme-selector').value,
            animations: $('#animations-toggle').checked,
            autoUpdate: $('#auto-update-toggle').checked,
            autoLogs: $('#auto-logs-toggle').checked
        }
        
        // Asegurar que el directorio existe
        const settingsDir = path.dirname(settingsFile)
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true })
        }
        
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2))
    } catch (error) {
        console.error('Error guardando configuración:', error)
    }
}

// Funciones para manejar logs
function showLogs() {
    switchMainTab('logs')
}

function hideLogs() {
    // Los logs ahora están en una pestaña separada
}

function addLogEntry(message, type = 'info', timestamp = null) {
    const logsContent = $('#logs-content')
    const placeholder = logsContent.querySelector('.logs__placeholder')
    
    // Remover placeholder si existe
    if (placeholder) {
        placeholder.remove()
    }
    
    const logTimestamp = timestamp || new Date().toLocaleTimeString()
    const logEntry = document.createElement('div')
    logEntry.className = `log-entry ${type}`
    
    logEntry.innerHTML = `
        <span class="log-timestamp">[${logTimestamp}]</span>
        <span class="log-message">${message}</span>
    `
    
    logsContent.appendChild(logEntry)
    
    // Auto-scroll al final
    logsContent.scrollTop = logsContent.scrollHeight
    
    // Si los logs automáticos están habilitados, mostrar la pestaña de logs
    const settings = getSettings()
    if (settings.autoLogs && currentMainTab !== 'logs') {
        switchMainTab('logs')
    }
}

function addAssetLogEntry(message, timestamp = null) {
    const assetsContent = $('#assets-content')
    const placeholder = assetsContent.querySelector('.logs__placeholder')
    
    // Remover placeholder si existe
    if (placeholder) {
        placeholder.remove()
    }
    
    const logTimestamp = timestamp || new Date().toLocaleTimeString()
    const logEntry = document.createElement('div')
    logEntry.className = 'log-entry assets'
    
    logEntry.innerHTML = `
        <span class="log-timestamp">[${logTimestamp}]</span>
        <span class="log-message">${message}</span>
    `
    
    assetsContent.appendChild(logEntry)
    
    // Auto-scroll al final
    assetsContent.scrollTop = assetsContent.scrollHeight
}

function updateAssetProgress(current, total, percentage) {
    const progressFill = $('#assets-progress-fill')
    const progressText = $('#assets-progress-text')
    
    progressFill.style.width = `${percentage}%`
    progressText.textContent = `${percentage}% (${current}/${total})`
}

function clearLogs() {
    const logsContent = $('#logs-content')
    const assetsContent = $('#assets-content')
    const progressFill = $('#assets-progress-fill')
    const progressText = $('#assets-progress-text')
    
    logsContent.innerHTML = '<p class="logs__placeholder">ℹ️ Los logs generales aparecerán aquí cuando lances Minecraft…</p>'
    assetsContent.innerHTML = '<p class="logs__placeholder">ℹ️ El progreso de assets aparecerá aquí…</p>'
    progressFill.style.width = '0%'
    progressText.textContent = '0% (0/0)'
}

// Funciones para manejar pestañas secundarias
function switchTab(tabName) {
    // Remover clase active de todas las pestañas y contenidos
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'))
    
    // Activar la pestaña seleccionada
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
    document.getElementById(`tab-${tabName}-content`).classList.add('active')
}

function $(sel) { return document.querySelector(sel) }

async function ensureNodeBackend() {
  try {
    // Verificar que las funciones IPC estén disponibles
    if (!ipcRenderer) {
      throw new Error('IPC no disponible');
    }
    
    return true;
  } catch (error) {
    await showModal({
      title: 'Error en el backend',
      html: `
        No se pudo inicializar el backend.<br>
        Error: <code>${error.message}</code><br><br>
        Asegúrate de que todas las dependencias estén instaladas:<br>
        <code>npm install</code>
      `,
      buttons: [{ label: 'OK', value: null }]
    });
    return false;
  }
}

function showModal({ title, html, buttons }) {
    return new Promise(resolve => {
        const overlay = document.getElementById('modal-overlay')
        const box = document.getElementById('modal-box')
        const t = document.getElementById('modal-title')
        const c = document.getElementById('modal-content')
        const bwrap = document.getElementById('modal-buttons')

        t.textContent = title
        c.innerHTML = html
        bwrap.innerHTML = ''

        buttons.forEach(btn => {
            const b = document.createElement('button')
            b.textContent = btn.label
            b.className = 'modal-btn ' + (btn.className || '')
            b.onclick = () => {
                overlay.classList.add('hidden')
                resolve(btn.value)
            }
            bwrap.appendChild(b)
        })

        overlay.classList.remove('hidden')
    })
}

function loadProfiles() {
    try {
        return JSON.parse(fs.readFileSync(profilesFile, 'utf8'))
    } catch {
        return {}
    }
}

function renderProfileList() {
    const ul = $('#profile-list')
    ul.innerHTML = ''

    for (const [name, data] of Object.entries(profiles)) {
        const li = document.createElement('li')
        li.dataset.name = name
        li.onclick = () => {
            active = name
            renderProfileList()
            updateProfileStatus()
        }
        if (name === active) li.classList.add('active')

        const folder = document.createElement('img')
        folder.src = '../assets/folder.webp'
        folder.classList.add('folder-btn')
        folder.title = 'Abrir carpeta del juego'
        folder.onclick = e => {
            e.stopPropagation()
            openGameFolder(name, data)
        }
        li.append(folder)

        const span = document.createElement('span')
        span.textContent = name
        li.append(span)

        const del = document.createElement('img')
        del.src = '../assets/trash.webp'
        del.classList.add('delete-btn')
        del.onclick = e => {
            e.stopPropagation()
            ipcRenderer.send('open-delete-confirm', name)
        }
        li.append(del)

        ul.append(li)
    }
}

// Función para abrir la carpeta del juego
function openGameFolder(profileName, profileData) {
    try {
        // Usar la versión del perfil para crear la ruta correcta
        const version = profileData.version || 'unknown'
        const gameDir = path.join(os.homedir(), '.haporelauncher', 'instances', version)
        
        // Crear la carpeta si no existe
        if (!fs.existsSync(gameDir)) {
            fs.mkdirSync(gameDir, { recursive: true })
            addLogEntry(`Carpeta del juego creada para ${profileName}`, 'info')
        }
        
        shell.openPath(gameDir)
        addLogEntry(`Carpeta del juego abierta para ${profileName}`, 'info')
    } catch (error) {
        console.error('Error abriendo carpeta del juego:', error)
        addLogEntry(`Error abriendo carpeta del juego: ${error.message}`, 'error')
    }
}

function getParticleImage() {
  const images = [
    '../assets/leaf.webp',
    '../assets/snow.webp',
    '../assets/sunflower.webp'
  ]
  return images[Math.floor(Math.random() * images.length)]
}

function renderParticles() {
  const container = $('.particle-container')
  const particleCount = 15

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('img')
    particle.src = getParticleImage()
    particle.className = 'particle'
    particle.style.setProperty('--rotate', `${Math.random() * 360}deg`)
    particle.style.left = `${Math.random() * 100}%`
    particle.style.animationDelay = `${Math.random() * 15}s`
    particle.style.animationDuration = `${15 + Math.random() * 10}s`
    container.appendChild(particle)
  }
}

async function launch() {
  if (!active) {
    await showModal({
      title: 'Error',
      html: 'Por favor selecciona un perfil antes de lanzar Minecraft.',
      buttons: [{ label: 'OK', value: null }]
    })
    return
  }

  const profile = profiles[active]
  if (!profile) {
    await showModal({
      title: 'Error',
      html: 'Perfil no encontrado.',
      buttons: [{ label: 'OK', value: null }]
    })
    return
  }

  const settings = getSettings()
  
  try {
    addLogEntry('Iniciando Minecraft...', 'info')
    showLogs() // Cambiar a la pestaña de logs
    
    // Pasar los parámetros individuales como espera el handler
    const result = await ipcRenderer.invoke('launch-minecraft', 
      profile.version,           // version
      profile.username,          // username
      {                         // options
        ram: profile.ram || 2048, // Usar 2048 MB (2GB) por defecto
        resolution: settings.resolution || '1280x720',
        jvmArgs: profile.jvmFlags || [],
        optimize: true
      }
    )
    
    if (result.success) {
      addLogEntry('Minecraft iniciado correctamente', 'success')
    } else {
      addLogEntry(`Error al iniciar Minecraft: ${result.error}`, 'error')
    }
  } catch (error) {
    addLogEntry(`Error inesperado: ${error.message}`, 'error')
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  if (!(await ensureNodeBackend())) return

  profiles = loadProfiles()
  renderProfileList()
  renderParticles()
  updateProfileStatus()
  loadSettings()

  // Event listeners para pestañas principales
  document.querySelectorAll('.main-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab
      switchMainTab(tabName)
    })
  })

  // Event listeners para pestañas secundarias
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab
      switchTab(tabName)
    })
  })

  // Event listeners para configuración
  document.querySelectorAll('#ram-selector, #resolution-selector, #theme-selector, #animations-toggle, #auto-update-toggle, #auto-logs-toggle').forEach(element => {
    element.addEventListener('change', saveSettings)
  })

  // Event listeners existentes
  $('#btn-launch').onclick = launch
  $('#btn-new-profile').onclick = () => ipcRenderer.send('open-profile-editor')
  $('#btn-edit-profile').onclick = () => {
    if (active) ipcRenderer.send('open-profile-editor', active)
  }
  $('#btn-clear-logs').onclick = clearLogs
  $('#minimize-btn').onclick = () => ipcRenderer.send('minimize-window')
  $('#maximize-btn').onclick = () => {
    ipcRenderer.send('maximize-window')
    // Actualizar el icono después de un breve delay
    setTimeout(updateMaximizeIcon, 100)
  }
  $('#close-btn').onclick = () => ipcRenderer.send('close-window')
  
  // Función para actualizar el icono de maximizar
  async function updateMaximizeIcon() {
    try {
      const isMaximized = await ipcRenderer.invoke('is-maximized')
      const maximizeBtn = $('#maximize-btn')
      if (isMaximized) {
        maximizeBtn.textContent = '❐'
        maximizeBtn.title = 'Restaurar'
      } else {
        maximizeBtn.textContent = '□'
        maximizeBtn.title = 'Maximizar'
      }
    } catch (error) {
      console.error('Error actualizando icono de maximizar:', error)
    }
  }
  
  // Actualizar icono inicial
  updateMaximizeIcon()
  
  // Nuevos event listeners para acciones rápidas
  $('#btn-refresh').onclick = () => {
    profiles = loadProfiles()
    renderProfileList()
    updateProfileStatus()
    addLogEntry('Perfiles actualizados', 'info')
  }
  
  $('#btn-folder').onclick = () => {
    if (fs.existsSync(versionsDir)) shell.openPath(versionsDir)
    else alert('Aún no se ha iniciado ninguna versión de Minecraft')
  }
  
  $('#btn-help').onclick = async () => {
    await showModal({
      title: 'Ayuda',
      html: `
        <h4>🎮 Cómo usar HaporeLauncher</h4>
        <p><strong>1. Perfiles:</strong> Crea y gestiona tus perfiles de Minecraft</p>
        <p><strong>2. Noticias:</strong> Mantente al día con las últimas actualizaciones</p>
        <p><strong>3. Logs:</strong> Monitorea el progreso y estado del launcher</p>
        <p><strong>4. Configuración:</strong> Personaliza tu experiencia de juego</p>
        <br>
        <p>Para más ayuda, visita nuestra documentación.</p>
      `,
      buttons: [{ label: 'Entendido', value: null }]
    })
  }

  // IPC listeners
  ipcRenderer.on('profiles-updated', () => {
    profiles = loadProfiles()
    renderProfileList()
    updateProfileStatus()
  })

  ipcRenderer.on('add-log', (event, { message, type, timestamp }) => {
    addLogEntry(message, type, timestamp)
  })

  ipcRenderer.on('add-asset-log', (event, { message, timestamp }) => {
    addAssetLogEntry(message, timestamp)
  })

  ipcRenderer.on('update-asset-progress', (event, { current, total, percentage }) => {
    updateAssetProgress(current, total, percentage)
  })

  ipcRenderer.on('show-logs', () => {
    showLogs()
  })
  
  // Event listener para cambios de estado de la ventana
  ipcRenderer.on('window-state-changed', (event, { isMaximized }) => {
    const maximizeBtn = $('#maximize-btn')
    if (isMaximized) {
      maximizeBtn.textContent = '❐'
      maximizeBtn.title = 'Restaurar'
    } else {
      maximizeBtn.textContent = '□'
      maximizeBtn.title = 'Maximizar'
    }
  })
  
  // Manejador para cuando se guarda un perfil
  ipcRenderer.on('profile-saved', (event, profileName) => {
    // Recargar perfiles
    profiles = loadProfiles()
    renderProfileList()
    updateProfileStatus()
    
    // Mostrar notificación
    addLogEntry(`Perfil "${profileName}" guardado correctamente`, 'success')
  })
  
  // Manejador para cuando se elimina un perfil
  ipcRenderer.on('profile-deleted', (event, profileName) => {
    // Recargar perfiles
    profiles = loadProfiles()
    renderProfileList()
    updateProfileStatus()
    
    // Mostrar notificación
    addLogEntry(`Perfil "${profileName}" eliminado correctamente`, 'info')
  })
})
