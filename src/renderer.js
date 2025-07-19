const { ipcRenderer, shell } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')

const profilesFile = path.join(os.homedir(), '.haporelauncher', 'ui_profiles.json')
const versionsDir = path.join(os.homedir(), '.haporelauncher', 'instances')

let active = null
let profiles = {}

// Funciones para manejar logs
function showLogs() {
    const logsSection = $('#logs')
    logsSection.classList.remove('hidden')
}

function hideLogs() {
    const logsSection = $('#logs')
    logsSection.classList.add('hidden')
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

// Funciones para manejar pestañas
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
        }
        if (name === active) li.classList.add('active')

        const folder = document.createElement('img')
        folder.src = '../assets/folder.webp'
        folder.classList.add('folder-btn')
        folder.onclick = e => {
            e.stopPropagation()
            if (fs.existsSync(versionsDir)) shell.openPath(versionsDir)
            else alert('Aún no se ha iniciado ninguna versión de Minecraft')
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

    $('#btn-edit-profile').disabled = !active
    $('#btn-launch').disabled = !active
    $('#profile-headline').textContent =
        active ? `Perfil: ${active}` : 'Selecciona un perfil'
}

function getParticleImage() {
    const date = new Date()
    const month = date.getMonth() + 1
    const day = date.getDate()

    if ((month === 9 && day >= 21) || month === 10 || month === 11 || (month === 12 && day <= 20)) {
        return '../assets/leaf.webp'
    } else if ((month === 12 && day >= 21) || month === 1 || month === 2 || (month === 3 && day <= 20)) {
        return '../assets/sunflower.webp'
    } else if ((month === 3 && day >= 21) || month === 4 || month === 5 || (month === 6 && day <= 20)) {
        return '../assets/leaf.webp'
    } else {
        return '../assets/snow.webp'
    }
}

function renderParticles() {
    const container = document.querySelector('.particle-container')
    const particleCount = 15
    const particleImage = getParticleImage()

    const redLine = document.querySelector('.red-line')
    const containerTop = container.getBoundingClientRect().top
    const redY = redLine
        ? redLine.getBoundingClientRect().top - containerTop
        : 0

    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('img')
        p.src = particleImage
        p.classList.add('particle')
        p.style.left = `${Math.random() * 100}%`
        p.style.top = `${redY}px`
        p.style.animationDelay = `${Math.random() * 5}s`
        p.style.animationDuration = `${8 + Math.random() * 4}s`

        const swayAmount = (Math.random() - 0.5) * 50
        const rotateAmount = Math.random() * 360
        p.style.setProperty('--sway', `${swayAmount}px`)
        p.style.setProperty('--rotate', `${rotateAmount}deg`)

        container.appendChild(p)
    }
}

async function launch() {
    if (!active) return
    const p = profiles[active]
    if (!p) return

    const ok = await ensureNodeBackend()
    if (!ok) return

    try {
        // Deshabilitar el botón de lanzar y cambiar el texto
        const launchBtn = $('#btn-launch')
        launchBtn.disabled = true
        launchBtn.textContent = '🚀 Iniciando...'
        
        // Mostrar área de logs y cambiar a pestaña general
        showLogs()
        switchTab('general')
        clearLogs()
        
        const options = {
            ram: p.ram ? parseInt(p.ram) : null,
            loader: p.modloader || 'vanilla',
            jvmArgs: p.jvmFlags || [],
            optimize: true
        }

        // Lanzar Minecraft usando las funciones IPC del proceso principal
        const success = await ipcRenderer.invoke('launch-minecraft', p.version, p.username, options)
        
        if (!success) {
            await showModal({
                title: 'Error al lanzar Minecraft',
                html: `
                    No se pudo lanzar Minecraft.<br>
                    Verifica que la versión esté instalada y que Java esté disponible.
                `,
                buttons: [{ label: 'OK', value: null }]
            })
        }
        
        // Rehabilitar el botón después del lanzamiento
        launchBtn.disabled = false
        launchBtn.textContent = '🚀 ¡JUGAR!'
        
    } catch (error) {
        // Rehabilitar el botón en caso de error
        const launchBtn = $('#btn-launch')
        launchBtn.disabled = false
        launchBtn.textContent = '🚀 ¡JUGAR!'
        
        await showModal({
            title: 'Error al lanzar Minecraft',
            html: `
                Error: <code>${error.message}</code><br><br>
                Verifica la configuración del perfil y que todas las dependencias estén instaladas.
            `,
            buttons: [{ label: 'OK', value: null }]
        })
    }
}

window.addEventListener('DOMContentLoaded', () => {
    profiles = loadProfiles()
    renderProfileList()
    renderParticles()

    $('#btn-new-profile').onclick = () => ipcRenderer.send('open-editor', null)
    $('#btn-edit-profile').onclick = () => ipcRenderer.send('open-editor', active)
    $('#btn-launch').onclick = launch
    $('#btn-clear-logs').onclick = clearLogs

    $('#minimize-btn').onclick = () => ipcRenderer.send('window-minimize');
    $('#close-btn').onclick = () => ipcRenderer.send('close-launcher');

    // Event listeners para pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab')
            switchTab(tabName)
        })
    })

    // Escuchar logs del main process
    ipcRenderer.on('launcher-log', (event, data) => {
        addLogEntry(data.message, data.type || 'info', data.timestamp)
    })

    // Escuchar logs de assets
    ipcRenderer.on('asset-progress', (event, data) => {
        updateAssetProgress(data.current, data.total, data.percentage)
        addAssetLogEntry(`📦 Progreso: ${data.current}/${data.total} (${data.percentage}%)`, data.timestamp)
    })

    // Escuchar cuando Minecraft se cierre
    ipcRenderer.on('minecraft-closed', () => {
        const launchBtn = $('#btn-launch')
        launchBtn.disabled = false
        launchBtn.textContent = '🚀 ¡JUGAR!'
        addLogEntry('🎮 Minecraft se ha cerrado', 'info')
    })

    ipcRenderer.on('profile-saved', (_e, name) => {
        profiles = loadProfiles()
        active = name
        renderProfileList()
    })
    ipcRenderer.on('profile-deleted', (_e, name) => {
        profiles = loadProfiles()
        if (active === name) active = null
        renderProfileList()
    })
})
