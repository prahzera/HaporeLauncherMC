# Changelog - HaporeLauncher

## [2.0.0] - 2024-12-21

### 🚀 Arquitectura simplificada - Todo en un proceso

**Cambio importante**: HaporeLauncher ahora ejecuta toda la lógica directamente en el proceso principal de Electron, eliminando la necesidad de un backend separado.

#### ✨ Nuevas características

- **Arquitectura unificada**: Toda la lógica del launcher integrada en `main.js`
- **Comunicación IPC optimizada**: Intercambio eficiente de datos entre procesos
- **Obtención automática de versiones**: Las versiones de Minecraft se obtienen automáticamente desde la API de Mojang
- **Sistema de caché de versiones**: Las versiones se almacenan en caché local para mejorar el rendimiento
- **Gestión automática de Java**: Descarga automática de Java Runtime Environment según la versión de Minecraft
- **Proceso simplificado**: Eliminación de la complejidad de múltiples procesos

#### 🔧 Mejoras técnicas

- **Rendimiento mejorado**: Menos overhead de comunicación entre procesos
- **Código más simple**: Una sola ubicación para toda la lógica del launcher
- **Debugging más fácil**: Todo el código en un solo lugar
- **Mejor manejo de errores**: Sistema de errores más robusto y descriptivo
- **Compatibilidad mejorada**: Mejor soporte multiplataforma

#### 📦 Dependencias simplificadas

```json
{
  "minecraft-launcher-core": "^3.18.2",
  "axios": "^1.6.0", 
  "adm-zip": "^0.5.10",
  "node-fetch": "^2.7.0",
  "uuid": "^9.0.1"
}
```

#### 🗂️ Estructura de archivos simplificada

```
HaporeLauncher/
├── main.js                 # Proceso principal con toda la lógica del launcher
├── package.json            # Configuración del proyecto y dependencias
├── src/
│   ├── index.html          # Interfaz principal
│   ├── styles.css          # Estilos modernos con glassmorphism
│   ├── animations.css      # Animaciones y efectos visuales
│   ├── renderer.js         # Lógica del renderer (comunicación IPC)
│   ├── config.js           # Configuración centralizada
│   ├── icon.ico            # Icono de la aplicación
│   └── editor/
│       ├── profile-editor.html  # Editor de perfiles
│       └── editor.js            # Lógica del editor
├── assets/                 # Recursos gráficos
├── README.md               # Documentación actualizada
└── CHANGELOG.md            # Este archivo
```

#### 🔄 Funciones IPC integradas

- **`get-available-versions`**: Obtiene versiones desde Mojang con caché
- **`get-installed-versions`**: Lista versiones instaladas localmente
- **`install-version`**: Instala versiones de Minecraft
- **`launch-minecraft`**: Lanza Minecraft con configuración completa
- **`download-java`**: Descarga Java automáticamente
- **`get-required-java-version`**: Determina versión de Java necesaria
- **`clear-version-cache`**: Limpia caché de versiones

#### 🎮 Funcionalidades completas

- ✅ **Descarga automática de versiones** desde la API de Mojang
- ✅ **Instalación de modloaders** (Forge, Fabric, Vanilla)
- ✅ **Gestión automática de Java** según versión de Minecraft
- ✅ **Configuración de memoria** y argumentos JVM
- ✅ **Sistema de perfiles** con persistencia
- ✅ **Interfaz moderna** con efectos visuales
- ✅ **Comunicación eficiente** entre procesos

#### 🗑️ Eliminado

- `src/backend/minecraft-backend.js` - Backend separado
- `src/backend/cli.js` - CLI separado
- `src/backend/version-manager.js` - Gestor de versiones separado
- `requirements.txt` - Dependencias de Python
- Funciones relacionadas con Python en `renderer.js`
- Verificaciones de Python en el sistema
- Configuración de `extraFiles` en `package.json`

#### 🔧 Configuración actualizada

- **Obtención automática de versiones**: Habilitada por defecto
- **Caché de versiones**: 1 hora de duración
- **Rutas actualizadas**: `.haporelauncher` en lugar de `.gwlauncher`
- **Arquitectura unificada**: Todo en el proceso principal

#### 📋 Instalación simplificada

```bash
# Antes (requería Python)
git clone <repo>
npm install
pip install -r requirements.txt

# Ahora (solo Node.js)
git clone <repo>
npm install
```

#### 🎯 Beneficios para el usuario final

- **Instalación más simple**: Solo requiere Node.js
- **Mejor distribución**: Paquete más pequeño y autónomo
- **Actualizaciones automáticas**: Las versiones se actualizan automáticamente
- **Mejor rendimiento**: Inicio más rápido y menor uso de memoria
- **Menos problemas**: Eliminación de conflictos con versiones de Python
- **Arquitectura más simple**: Menos puntos de fallo

#### 🔮 Próximas mejoras planificadas

- [ ] Soporte para NeoForge
- [ ] Descarga automática de modpacks
- [ ] Sistema de actualizaciones automáticas del launcher
- [ ] Interfaz para gestión de mods
- [ ] Soporte para servidores personalizados
- [ ] Sistema de respaldos de mundos
- [ ] Integración con Discord Rich Presence

---

## [1.0.0] - 2024-12-20

### 🎉 Lanzamiento inicial

- Interfaz moderna con efectos glassmorphism
- Soporte para perfiles de Minecraft
- Backend en Python con minecraft-launcher-lib
- Soporte para Forge y Fabric
- Sistema de modales y notificaciones
- Diseño responsive y animaciones fluidas 