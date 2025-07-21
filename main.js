const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { spawn } = require('child_process')
const { v3: uuidv3 } = require('uuid')
const axios = require('axios')
const AdmZip = require('adm-zip')
const fetch = require('node-fetch')

// Importar minecraft-launcher-core (versión 3.x)
const { Client, Authenticator } = require('minecraft-launcher-core')

// Configuración de rutas
const HAPORE_DIR = path.join(os.homedir(), '.haporelauncher')
const VERSIONS_DIR = path.join(HAPORE_DIR, 'versions')
const INSTANCES_DIR = path.join(HAPORE_DIR, 'instances')
const JAVA_DIR = path.join(HAPORE_DIR, 'java')
const PROFILES_FILE = path.join(HAPORE_DIR, 'ui_profiles.json')
const VERSION_CACHE_FILE = path.join(HAPORE_DIR, 'version-cache.json')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'src', 'icon.ico'),
        titleBarStyle: 'hidden',
        frame: false,
        show: false,
        backgroundColor: '#0a0a1a'
    })

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

    mainWindow.on('closed', () => {
        mainWindow = null
    })
    
    // Event listeners para cambios de estado de la ventana
    mainWindow.on('maximize', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window-state-changed', { isMaximized: true })
        }
    })
    
    mainWindow.on('unmaximize', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('window-state-changed', { isMaximized: false })
        }
    })
}

// Asegurar que los directorios existan
function ensureDirectories() {
    const dirs = [HAPORE_DIR, VERSIONS_DIR, INSTANCES_DIR, JAVA_DIR]
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    })
}

// Obtener versión de Java requerida para una versión de Minecraft
function getRequiredJavaVersion(minecraftVersion) {
    const parts = minecraftVersion.split('.')
    const versionNums = []
    
    for (const p of parts) {
        const num = parseInt(p)
        if (isNaN(num)) break
        versionNums.push(num)
    }

    if (versionNums.length === 0) return 8

    const major = versionNums[0]
    const minor = versionNums[1] || 0

    if (major === 1) {
        if (minor >= 8 && minor <= 12) return 8
        if (minor >= 13 && minor <= 19) return 17
        if (minor >= 20) return 21
    }
    
    return 21
}

// Descargar Java Runtime
async function downloadJavaRuntime(javaVersion) {
    const system = os.platform()
    
    // Primero intentar usar Java del sistema
    try {
        const { execSync } = require('child_process')
        const javaPaths = execSync('where java', { encoding: 'utf8' }).trim().split('\n')
        sendLog(`Java del sistema encontrado: ${javaPaths.join(', ')}`)
        
        // Probar cada instalación de Java
        for (const javaPath of javaPaths) {
            try {
                sendLog(`Probando Java: ${javaPath}`)
                const versionOutput = execSync(`"${javaPath}" -version`, { encoding: 'utf8', stderr: 'pipe' })
                sendLog(`Versión de Java: ${versionOutput}`)
                
                // Extraer versión mayor
                const versionMatch = versionOutput.match(/version "(\d+)\.(\d+)\.(\d+)/)
                if (versionMatch) {
                    const majorVersion = parseInt(versionMatch[1])
                    sendLog(`Java ${javaPath} es versión ${majorVersion}`)
                    
                    // Verificar compatibilidad - Java superior es compatible
                    if (javaVersion === 8 && majorVersion >= 8) {
                        sendLog('Java del sistema es compatible (versión 8+)')
                        return javaPath
                    } else if (javaVersion === 17 && majorVersion >= 17) {
                        sendLog('Java del sistema es compatible (versión 17+)')
                        return javaPath
                    } else if (javaVersion === 21 && majorVersion >= 21) {
                        sendLog('Java del sistema es compatible (versión 21+)')
                        return javaPath
                    } else if (majorVersion > javaVersion) {
                        sendLog(`Java del sistema (${majorVersion}) es superior a la requerida (${javaVersion}), usando Java del sistema`)
                        return javaPath
                    } else {
                        sendLog(`Java ${javaPath} (${majorVersion}) no es compatible con la versión requerida (${javaVersion})`)
                    }
                }
            } catch (versionError) {
                sendLog(`No se pudo verificar la versión de Java en ${javaPath}`)
            }
        }
        
        sendLog('Ningún Java del sistema es compatible, intentando descargar...')
    } catch (error) {
        sendLog('Java del sistema no encontrado, intentando descargar...')
    }
    
    // Si no se puede usar Java del sistema, descargar
    let platform, packageType, javaUrl
    
    if (system === 'win32') {
        platform = 'windows'
        packageType = 'zip'
    } else if (system === 'darwin') {
        platform = 'macos'
        packageType = 'tar.gz'
    } else {
        platform = 'linux'
        packageType = 'tar.gz'
    }

    const javaPath = path.join(JAVA_DIR, `java_${javaVersion}`)
    
    // Verificar si ya está instalado
    const javaExecutable = path.join(javaPath, 'bin', system === 'win32' ? 'java.exe' : 'java')
    if (fs.existsSync(javaExecutable)) {
        console.log(`Java ${javaVersion} ya está instalado en ${javaExecutable}`)
        return javaExecutable
    }

    console.log(`Descargando Java ${javaVersion} para ${platform}...`)
    
    // URLs de descarga de Java (usando Adoptium/Eclipse Temurin)
    if (javaVersion === 8) {
        javaUrl = `https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u392-b08/OpenJDK8U-jdk_x64_${platform}_hotspot_8u392b08.${packageType}`
    } else if (javaVersion === 17) {
        javaUrl = `https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.9%2B9/OpenJDK17U-jdk_x64_${platform}_hotspot_17.0.9_9.${packageType}`
    } else if (javaVersion === 21) {
        javaUrl = `https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.1%2B12/OpenJDK21U-jdk_x64_${platform}_hotspot_21.0.1_12.${packageType}`
    } else {
        // Fallback para otras versiones
        javaUrl = `https://github.com/adoptium/temurin${javaVersion}-binaries/releases/latest/download/OpenJDK${javaVersion}U-jdk_x64_${platform}_hotspot_${javaVersion}.0.0_${packageType === 'zip' ? 'windows' : platform}.${packageType}`
    }
    
    try {
        console.log(`Descargando desde: ${javaUrl}`)
        const response = await fetch(javaUrl)
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const tempFile = path.join(JAVA_DIR, `java_${javaVersion}.${packageType}`)
        const fileStream = fs.createWriteStream(tempFile)
        
        await new Promise((resolve, reject) => {
            response.body.pipe(fileStream)
            response.body.on('error', reject)
            fileStream.on('finish', resolve)
        })

        console.log('Archivo descargado, extrayendo...')

        // Extraer archivo
        const extractPath = path.join(JAVA_DIR, `java_${javaVersion}_temp`)
        if (!fs.existsSync(extractPath)) {
            fs.mkdirSync(extractPath, { recursive: true })
        }

        if (packageType === 'zip') {
            const zip = new AdmZip(tempFile)
            zip.extractAllTo(extractPath, true)
        } else {
            // Para tar.gz necesitaríamos una librería adicional
            throw new Error('Extract tar.gz not implemented yet')
        }

        // Mover archivos extraídos
        const extractedDirs = fs.readdirSync(extractPath)
        if (extractedDirs.length > 0) {
            const extractedDir = path.join(extractPath, extractedDirs[0])
            if (fs.existsSync(javaPath)) {
                fs.rmSync(javaPath, { recursive: true, force: true })
            }
            fs.renameSync(extractedDir, javaPath)
        }

        // Limpiar archivos temporales
        fs.unlinkSync(tempFile)
        fs.rmSync(extractPath, { recursive: true, force: true })

        console.log(`Java ${javaVersion} instalado correctamente en ${javaExecutable}`)
        return javaExecutable
    } catch (error) {
        console.error(`Error descargando Java ${javaVersion}:`, error.message)
        throw new Error(`No se pudo instalar Java ${javaVersion} ni encontrar Java del sistema`)
    }
}

// Obtener versiones disponibles de Minecraft
async function getAvailableVersions(forceRefresh = false) {
    // Si no se fuerza la actualización, intentar cargar desde caché
    if (!forceRefresh) {
        try {
            if (fs.existsSync(VERSION_CACHE_FILE)) {
                const cache = JSON.parse(fs.readFileSync(VERSION_CACHE_FILE, 'utf8'))
                const now = Date.now()
                
                // Verificar si el caché no ha expirado (1 hora)
                if (now - cache.timestamp < 3600000) {
                    console.log('Cargando versiones desde caché...')
                    return cache.versions
                }
            }
        } catch (error) {
            console.error('Error cargando caché de versiones:', error.message)
        }
    }
    
    try {
        console.log('Obteniendo versiones desde Mojang...')
        const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json', {
            timeout: 10000
        })
        
        const versions = response.data.versions
        
        // Filtrar solo versiones release y ordenarlas
        const releaseVersions = versions
            .filter(v => v.type === 'release')
            .map(v => v.id)
            .sort((a, b) => {
                const aParts = a.split('.').map(Number)
                const bParts = b.split('.').map(Number)
                
                for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                    const aPart = aParts[i] || 0
                    const bPart = bParts[i] || 0
                    if (aPart !== bPart) {
                        return bPart - aPart // Orden descendente
                    }
                }
                return 0
            })
        
        // Guardar en caché
        try {
            const cacheDir = path.dirname(VERSION_CACHE_FILE)
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true })
            }
            
            const cache = {
                timestamp: Date.now(),
                versions: releaseVersions
            }
            
            fs.writeFileSync(VERSION_CACHE_FILE, JSON.stringify(cache, null, 2))
            console.log('Versiones guardadas en caché')
        } catch (error) {
            console.error('Error guardando caché de versiones:', error.message)
        }
        
        return releaseVersions
    } catch (error) {
        console.error('Error obteniendo versiones desde Mojang:', error.message)
        // Si no se pudieron obtener versiones, devolver versiones básicas
        console.warn('No se pudieron obtener versiones, usando lista básica')
        return [
            '1.21.2', '1.21.1', '1.21',
            '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
            '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
            '1.18.2', '1.18.1', '1.18',
            '1.17.1', '1.17',
            '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
            '1.15.2', '1.15.1', '1.15',
            '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
            '1.13.2', '1.13.1', '1.13',
            '1.12.2', '1.12.1', '1.12',
            '1.11.2', '1.11.1', '1.11',
            '1.10.2', '1.10.1', '1.10',
            '1.9.4', '1.9.3', '1.9.2', '1.9.1', '1.9',
            '1.8.9', '1.8.8', '1.8.7', '1.8.6', '1.8.5', '1.8.4', '1.8.3', '1.8.2', '1.8.1', '1.8',
            '1.7.10'
        ]
    }
}

// Instalar versión de Minecraft
async function installVersion(version) {
    ensureDirectories()
    
    try {
        sendLog(`Verificando instalación de Minecraft ${version}...`)
        
        // Verificar si la versión ya está instalada en nuestro directorio
        const versionPath = path.join(VERSIONS_DIR, version)
        const versionJson = path.join(versionPath, `${version}.json`)
        const versionJar = path.join(versionPath, `${version}.jar`)
        
        if (fs.existsSync(versionJson) && fs.existsSync(versionJar)) {
            sendLog(`Minecraft ${version} ya está instalado en nuestro directorio`)
            return true
        }
        
        // Verificar si existe en el directorio .minecraft del usuario
        const userMinecraftDir = path.join(os.homedir(), 'AppData', 'Roaming', '.minecraft', 'versions', version)
        const userVersionJson = path.join(userMinecraftDir, `${version}.json`)
        const userVersionJar = path.join(userMinecraftDir, `${version}.jar`)
        
        if (fs.existsSync(userVersionJson) && fs.existsSync(userVersionJar)) {
            sendLog(`Copiando Minecraft ${version} desde el launcher oficial...`)
            
            // Copiar la versión desde el directorio del usuario
            if (!fs.existsSync(versionPath)) {
                fs.mkdirSync(versionPath, { recursive: true })
            }
            
            // Copiar archivos
            const files = fs.readdirSync(userMinecraftDir)
            files.forEach(file => {
                const sourceFile = path.join(userMinecraftDir, file)
                const destFile = path.join(versionPath, file)
                if (fs.statSync(sourceFile).isFile()) {
                    fs.copyFileSync(sourceFile, destFile)
                }
            })
            
            sendLog(`Minecraft ${version} copiado correctamente`)
            return true
        }
        
        // Si no está instalada, descargarla automáticamente
        sendLog(`Descargando Minecraft ${version} automáticamente...`)
        return await downloadMinecraftVersion(version)
        
    } catch (error) {
        sendLog(`Error verificando/instalando Minecraft ${version}: ${error.message}`, 'error')
        return false
    }
}

// Función para descargar versiones de Minecraft
async function downloadMinecraftVersion(version) {
    try {
        sendLog(`Iniciando descarga de Minecraft ${version}...`)
        
        // Obtener información de la versión desde Mojang
        const manifestResponse = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest.json')
        const versionInfo = manifestResponse.data.versions.find(v => v.id === version)
        
        if (!versionInfo) {
            throw new Error(`Versión ${version} no encontrada en el manifiesto de Mojang`)
        }
        
        sendLog(`Información de versión obtenida: ${versionInfo.url}`)
        
        // Obtener detalles específicos de la versión
        const versionDetailsResponse = await axios.get(versionInfo.url)
        const versionDetails = versionDetailsResponse.data
        
        // Crear directorio de la versión
        const versionPath = path.join(VERSIONS_DIR, version)
        if (!fs.existsSync(versionPath)) {
            fs.mkdirSync(versionPath, { recursive: true })
        }
        
        // Guardar archivo JSON de la versión
        const versionJsonPath = path.join(versionPath, `${version}.json`)
        fs.writeFileSync(versionJsonPath, JSON.stringify(versionDetails, null, 2))
        
        // Descargar cliente JAR
        const clientJarUrl = versionDetails.downloads.client.url
        const clientJarPath = path.join(versionPath, `${version}.jar`)
        
        sendLog(`Descargando cliente JAR desde: ${clientJarUrl}`)
        const clientResponse = await fetch(clientJarUrl)
        if (!clientResponse.ok) {
            throw new Error(`Error descargando cliente JAR: ${clientResponse.status}`)
        }
        
        const clientStream = fs.createWriteStream(clientJarPath)
        await new Promise((resolve, reject) => {
            clientResponse.body.pipe(clientStream)
            clientResponse.body.on('error', reject)
            clientStream.on('finish', resolve)
        })
        
        // Descargar librerías si es necesario
        if (versionDetails.libraries) {
            sendLog('Descargando librerías...')
            await downloadLibraries(versionDetails.libraries, versionPath)
        }
        
        sendLog(`Minecraft ${version} descargado correctamente`)
        return true
        
    } catch (error) {
        sendLog(`Error descargando Minecraft ${version}: ${error.message}`, 'error')
        return false
    }
}

// Función para descargar librerías
async function downloadLibraries(libraries, versionPath) {
    const librariesDir = path.join(VERSIONS_DIR, 'libraries')
    if (!fs.existsSync(librariesDir)) {
        fs.mkdirSync(librariesDir, { recursive: true })
    }
    
    for (const library of libraries) {
        if (library.downloads && library.downloads.artifact) {
            const artifact = library.downloads.artifact
            const libraryPath = path.join(librariesDir, artifact.path)
            
            // Crear directorio si no existe
            const libraryDir = path.dirname(libraryPath)
            if (!fs.existsSync(libraryDir)) {
                fs.mkdirSync(libraryDir, { recursive: true })
            }
            
            // Descargar si no existe
            if (!fs.existsSync(libraryPath)) {
                try {
                    sendLog(`Descargando librería: ${artifact.path}`)
                    const response = await fetch(artifact.url)
                    if (response.ok) {
                        const stream = fs.createWriteStream(libraryPath)
                        await new Promise((resolve, reject) => {
                            response.body.pipe(stream)
                            response.body.on('error', reject)
                            stream.on('finish', resolve)
                        })
                    }
                } catch (error) {
                    sendLog(`Error descargando librería ${artifact.path}: ${error.message}`, 'warning')
                }
            }
        }
    }
}

// Argumentos JVM optimizados
function getOptimizedJvmArgs(javaVersion) {
    if (javaVersion >= 17) {
        return [
            '-XX:+UseG1GC',
            '-XX:G1NewSizePercent=30',
            '-XX:G1MaxNewSizePercent=40',
            '-XX:G1HeapRegionSize=16M',
            '-XX:G1ReservePercent=20',
            '-XX:MaxGCPauseMillis=50',
            '-XX:G1HeapWastePercent=5',
            '-XX:G1MixedGCCountTarget=4',
            '-XX:+PerfDisableSharedMem',
            '-XX:+AlwaysPreTouch'
        ]
    } else {
        return [
            '-XX:+UseConcMarkSweepGC',
            '-XX:+CMSIncrementalMode',
            '-XX:-UseAdaptiveSizePolicy',
            '-Xmn128M'
        ]
    }
}

// Lanzar Minecraft
async function launchMinecraft(version, username, options = {}) {
    const {
        ram,
        jvmArgs = [],
        optimize = false
    } = options

    try {
        sendLog(`🎮 Iniciando lanzamiento de Minecraft ${version}...`)
        
        // Verificar que el usuario esté especificado
        if (!username || username.trim() === '') {
            throw new Error('El nombre de usuario es obligatorio')
        }
        
        sendLog(`👤 Usuario: ${username}`)
        sendLog(`📦 Versión: ${version}`)
        sendLog(`💾 RAM: ${ram || '2GB'} (máxima)`)
        
        // Instalar versión si es necesario
        sendLog(`\n📥 Verificando instalación de la versión...`)
        const versionInstalled = await installVersion(version)
        if (!versionInstalled) {
            throw new Error(`No se pudo instalar la versión ${version}. Verifica tu conexión a internet.`)
        }
        
        // Crear directorio del juego
        const gameDir = path.join(INSTANCES_DIR, version)
        if (!fs.existsSync(gameDir)) {
            fs.mkdirSync(gameDir, { recursive: true })
        }
        sendLog(`📁 Directorio del juego: ${gameDir}`)

        // Generar UUID offline
        const uuid = uuidv3(username, uuidv3.DNS)
        sendLog(`🆔 UUID generado: ${uuid}`)
        
        // Obtener Java
        const javaVersion = getRequiredJavaVersion(version)
        sendLog(`\n☕ Java requerido para ${version}: ${javaVersion}`)
        
        const javaExecutable = await downloadJavaRuntime(javaVersion)
        sendLog(`✅ Java encontrado: ${javaExecutable}`)

        // Argumentos JVM optimizados
        const optimizedArgs = optimize ? getOptimizedJvmArgs(javaVersion) : []
        
        // Configurar memoria (asegurar que min <= max)
        const maxRam = ram ? ram : 2048  // Usar 2048 MB (2GB) por defecto
        const minRam = Math.min(maxRam / 2, 1024) // La mitad del máximo o 1GB, lo que sea menor
        
        // Combinar argumentos
        const finalJvmArgs = [...optimizedArgs, ...jvmArgs]
        
        // Configuración del cliente
        const client = new Client()
        
        // Verificar que el archivo JAR existe
        const versionJarPath = path.join(VERSIONS_DIR, version, `${version}.jar`)
        if (!fs.existsSync(versionJarPath)) {
            throw new Error(`Archivo JAR de Minecraft no encontrado: ${versionJarPath}`)
        }
        
        sendLog(`Verificando archivo JAR: ${versionJarPath}`)
        
        // Opciones de lanzamiento
        const launchOptions = {
            clientPackage: null,
            authorization: Authenticator.getAuth(username),
            root: VERSIONS_DIR,
            version: {
                number: version,
                type: "release"
            },
            memory: {
                max: `${maxRam}M`,
                min: `${minRam}M`
            },
            customLaunchArgs: finalJvmArgs,
            javaPath: javaExecutable,
            gamePath: gameDir
        }

        sendLog(`\n🚀 Lanzando Minecraft...`)
        sendLog(`📋 Configuración:`, JSON.stringify(launchOptions, null, 2))
        
        // Lanzar Minecraft
        client.launch(launchOptions)
        
        // Eventos del cliente con logs asíncronos
        client.on('debug', (e) => {
            if (typeof e === 'string' && e.trim()) {
                sendLog(`🐛 Debug: ${e}`, 'debug')
            }
        })
        
        client.on('data', (e) => {
            if (typeof e === 'string' && e.trim()) {
                // Separar logs de assets de otros logs
                if (e.includes('assets') || e.includes('Progress: assets') || e.includes('Downloaded assets')) {
                    // Extraer información de progreso de assets
                    const assetMatch = e.match(/Progress: assets - (\d+)/)
                    if (assetMatch) {
                        const current = parseInt(assetMatch[1])
                        // Asumir un total aproximado basado en la versión
                        const total = version.includes('1.21') ? 5000 : 4000
                        const percentage = Math.round((current / total) * 100)
                        sendAssetProgress(current, total, percentage)
                    } else if (e.includes('Downloaded assets')) {
                        sendAssetProgress(5000, 5000, 100) // Assets completados
                        sendLog(`📦 Assets completados`, 'assets')
                    } else {
                        sendLog(`📦 Assets: ${e}`, 'assets')
                    }
                } else {
                    sendLog(`📊 Data: ${e}`, 'info')
                }
            }
        })
        
        client.on('progress', (e) => {
            if (e && e.type && e.task) {
                if (e.type === 'assets') {
                    // Manejar progreso de assets de forma especial
                    const current = e.task || 0
                    const total = e.total || 5000
                    const percentage = Math.round((current / total) * 100)
                    sendAssetProgress(current, total, percentage)
                } else {
                    sendLog(`📈 Progress: ${e.type} - ${e.task}`, 'info')
                }
            }
        })
        
        client.on('download-status', (e) => {
            if (e && e.fileName) {
                if (e.fileName.includes('assets')) {
                    sendLog(`📦 Asset: ${e.fileName}`, 'assets')
                } else {
                    sendLog(`⬇️ Download: ${e.fileName}`, 'info')
                }
            }
        })
        
        client.on('launcher', (e) => {
            sendLog(`🎮 Launcher event: ${JSON.stringify(e)}`, 'info')
        })
        
        client.on('game', (e) => {
            sendLog(`🎯 Game event: ${JSON.stringify(e)}`, 'info')
        })
        
        client.on('close', (e) => {
            sendLog(`🔚 Minecraft cerrado`, 'info')
            // Notificar al renderer que Minecraft se cerró
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('minecraft-closed')
            }
        })
        
        client.on('error', (e) => {
            sendLog(`❌ Error en Minecraft: ${e}`, 'error')
        })
        
        sendLog(`\n✅ Minecraft lanzado correctamente!`)
        sendLog(`🎉 ¡Disfruta tu juego!`)
        sendLog(`💡 El launcher permanecerá abierto para monitorear el juego`, 'info')
        return true
    } catch (error) {
        console.error('❌ Error lanzando Minecraft:', error.message)
        
        // Proporcionar información más detallada del error
        if (error.message.includes('Java')) {
            throw new Error(`Error con Java: ${error.message}. Asegúrate de tener Java instalado.`)
        } else if (error.message.includes('versión')) {
            throw new Error(`Error con la versión: ${error.message}`)
        } else if (error.message.includes('usuario')) {
            throw new Error(`Error con el usuario: ${error.message}`)
        } else if (error.message.includes('conexión')) {
            throw new Error(`Error de conexión: ${error.message}`)
        } else {
            throw new Error(`Error inesperado: ${error.message}`)
        }
    }
}

// Obtener versiones instaladas
function getInstalledVersions() {
    try {
        if (!fs.existsSync(VERSIONS_DIR)) {
            return []
        }
        
        const versions = fs.readdirSync(VERSIONS_DIR)
            .filter(dir => {
                const versionPath = path.join(VERSIONS_DIR, dir)
                return fs.statSync(versionPath).isDirectory() && 
                       fs.existsSync(path.join(versionPath, `${dir}.json`))
            })
            .map(dir => dir.replace('.json', ''))
        
        return versions.sort()
    } catch (error) {
        console.error('Error obteniendo versiones instaladas:', error.message)
        return []
    }
}

// Lanzar proceso desacoplado
function launchDetached(command, cwd) {
    const isWin = os.platform() === 'win32'
    
    const options = {
        cwd,
        detached: true,
        stdio: 'ignore'
    }

    if (isWin) {
        options.creationFlags = 0x00000008 | 0x00000008 // DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
    }

    const child = spawn(command[0], command.slice(1), options)
    child.unref()
    
    return child
}

// Función para enviar logs al renderer de forma asíncrona
function sendLog(message, type = 'info') {
    console.log(message) // Mantener en consola también
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('launcher-log', { 
            message, 
            type,
            timestamp: new Date().toLocaleTimeString()
        })
    }
}

// Función para enviar logs de progreso de assets
function sendAssetProgress(current, total, percentage) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('asset-progress', {
            current: current,
            total: total,
            percentage: percentage,
            timestamp: new Date().toLocaleTimeString()
        })
    }
}

// IPC Handlers
ipcMain.handle('get-available-versions', async (event, forceRefresh = false) => {
    return await getAvailableVersions(forceRefresh)
})

ipcMain.handle('get-installed-versions', () => {
    return getInstalledVersions()
})

ipcMain.handle('install-version', async (event, version) => {
    return await installVersion(version)
})

ipcMain.handle('launch-minecraft', async (event, version, username, options) => {
    try {
        const result = await launchMinecraft(version, username, options)
        return { success: true, message: 'Minecraft iniciado correctamente' }
    } catch (error) {
        console.error('Error en launch-minecraft handler:', error)
        return { success: false, error: error.message }
    }
})

ipcMain.handle('download-java', async (event, javaVersion) => {
    return await downloadJavaRuntime(javaVersion)
})

ipcMain.handle('get-required-java-version', (event, minecraftVersion) => {
    return getRequiredJavaVersion(minecraftVersion)
})

ipcMain.handle('install-fabric', async (event, minecraftVersion) => {
    return { success: false, error: 'La instalación automática de modloaders ha sido desactivada. Por favor, instala los modloaders manualmente.' }
})

ipcMain.handle('clear-version-cache', () => {
    try {
        if (fs.existsSync(VERSION_CACHE_FILE)) {
            fs.unlinkSync(VERSION_CACHE_FILE)
            console.log('Caché de versiones limpiado')
            return true
        }
        return false
    } catch (error) {
        console.error('Error limpiando caché de versiones:', error.message)
        return false
    }
})

ipcMain.on('close-launcher', () => {
    app.quit()
})

ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url)
})

// Handlers para el editor de perfiles
ipcMain.on('open-editor', (event, profileName) => {
    const editorWindow = new BrowserWindow({
        width: 600,
        height: 800,
        minWidth: 500,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'src', 'icon.ico'),
        titleBarStyle: 'hidden',
        frame: false,
        resizable: true,
        modal: true,
        parent: mainWindow,
        backgroundColor: '#0a0a1a'
    })

    const url = profileName 
        ? `file://${path.join(__dirname, 'src', 'editor', 'profile-editor.html')}?name=${encodeURIComponent(profileName)}`
        : `file://${path.join(__dirname, 'src', 'editor', 'profile-editor.html')}`

    editorWindow.loadURL(url)

    editorWindow.on('closed', () => {
        // El editor se cierra automáticamente
    })
})

// Handler para el nuevo nombre del evento
ipcMain.on('open-profile-editor', (event, profileName) => {
    const editorWindow = new BrowserWindow({
        width: 600,
        height: 800,
        minWidth: 500,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'src', 'icon.ico'),
        titleBarStyle: 'hidden',
        frame: false,
        resizable: true,
        modal: true,
        parent: mainWindow,
        backgroundColor: '#0a0a1a'
    })

    const url = profileName 
        ? `file://${path.join(__dirname, 'src', 'editor', 'profile-editor.html')}?name=${encodeURIComponent(profileName)}`
        : `file://${path.join(__dirname, 'src', 'editor', 'profile-editor.html')}`

    editorWindow.loadURL(url)

    editorWindow.on('closed', () => {
        // El editor se cierra automáticamente
    })
})

ipcMain.on('window-minimize', () => {
    if (mainWindow) {
        mainWindow.minimize()
    }
})

ipcMain.on('profile-saved', (event, profileName) => {
    // Notificar al renderer que el perfil fue guardado
    if (mainWindow) {
        mainWindow.webContents.send('profile-saved', profileName)
    }
})

ipcMain.on('open-delete-confirm', (event, profileName) => {
    // Mostrar confirmación de eliminación
    const { dialog } = require('electron')
    
  dialog.showMessageBox(mainWindow, {
    type: 'question',
        buttons: ['Eliminar', 'Cancelar'],
    defaultId: 1,
        title: 'Confirmar eliminación',
        message: `¿Estás seguro de que quieres eliminar el perfil "${profileName}"?`,
        detail: 'Esta acción no se puede deshacer.'
    }).then((result) => {
        if (result.response === 0) {
            // Eliminar el perfil
            try {
                const profiles = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'))
                delete profiles[profileName]
                fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2))
                
                // Notificar al renderer
                if (mainWindow) {
                    mainWindow.webContents.send('profile-deleted', profileName)
                }
            } catch (error) {
                console.error('Error eliminando perfil:', error)
            }
    }
  })
})

// Handlers para controles de ventana
ipcMain.on('minimize-window', () => {
    if (mainWindow) {
        mainWindow.minimize()
    }
})

ipcMain.on('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize()
        } else {
            mainWindow.maximize()
        }
    }
})

ipcMain.on('close-window', () => {
    if (mainWindow) {
        mainWindow.close()
    }
})

// Handler para obtener el estado de maximización
ipcMain.handle('is-maximized', () => {
    if (mainWindow) {
        return mainWindow.isMaximized()
    }
    return false
})

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