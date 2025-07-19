// HaporeLauncher - Configuración centralizada
const config = {
  // Información del launcher
  app: {
    name: 'HaporeLauncher',
    version: '1.0.0',
    description: 'Minecraft No-Premium and Premium Launcher',
    author: 'HaporeLauncher Team'
  },

  // Configuración de archivos
  paths: {
    profilesDir: '.haporelauncher',
    profilesFile: 'ui_profiles.json',
    instancesDir: 'instances',
    logsDir: 'logs'
  },

  // Configuración de la interfaz
  ui: {
    theme: {
      primary: '#6366f1',
      primaryHover: '#7c3aed',
      accent: '#06b6d4',
      accentHover: '#0891b2',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      background: '#0a0a1a',
      cardBackground: 'rgba(26, 28, 60, 0.8)',
      sidebarBackground: 'rgba(13, 15, 44, 0.95)',
      foreground: '#f0f4ff',
      foregroundSecondary: '#b8c5e6'
    },
    animations: {
      duration: '0.3s',
      easing: 'ease',
      particleCount: 50,
      particleSpeed: 15
    },
    responsive: {
      mobileBreakpoint: 700,
      tabletBreakpoint: 1024
    }
  },

  // Configuración de Minecraft
  minecraft: {
    defaultRam: 2048, // MB
    maxRam: 8192, // MB
    javaArgs: [
      '-XX:+UseConcMarkSweepGC',
      '-XX:+CMSIncrementalMode',
      '-XX:-UseAdaptiveSizePolicy',
      '-Xmn128M'
    ],
    supportedVersions: [], // Se obtendrán automáticamente
    modloaders: ['vanilla', 'forge', 'fabric', 'neoforge'],
    autoFetchVersions: true, // Obtener versiones automáticamente
    versionCacheTime: 3600000 // 1 hora en ms
  },

  // Configuración de desarrollo
  development: {
    debug: false,
    logLevel: 'info',
    autoReload: false
  },

  // Configuración de actualizaciones
  updates: {
    checkOnStartup: true,
    updateUrl: 'https://api.github.com/repos/haporelauncher/hapore-launcher/releases/latest',
    downloadUrl: 'https://github.com/haporelauncher/hapore-launcher/releases'
  },

  // Configuración de noticias
  news: {
    enabled: true,
    source: 'https://www.minecraft.net/es-es',
    refreshInterval: 3600000 // 1 hora en ms
  },

  // Configuración de rendimiento
  performance: {
    maxConcurrentDownloads: 3,
    downloadTimeout: 300000, // 5 minutos
    memoryLimit: 512 // MB para el proceso principal
  }
};

// Función para obtener configuración
function getConfig(path = '') {
  if (!path) return config;
  
  const keys = path.split('.');
  let value = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

// Función para establecer configuración
function setConfig(path, value) {
  const keys = path.split('.');
  let current = config;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { config, getConfig, setConfig };
} else if (typeof window !== 'undefined') {
  window.HaporeConfig = { config, getConfig, setConfig };
} 