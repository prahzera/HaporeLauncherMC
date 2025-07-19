# HaporeLauncher

> *Minecraft No‑Premium desktop launcher construido completamente con Electron + Node.js*

---

## Índice

1. [Descripción](#descripción)
2. [Características](#características)
3. [Requisitos](#requisitos)
4. [Instalación](#instalación)
5. [Uso](#uso)
6. [Empaquetado y distribución](#empaquetado-y-distribución)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [Contribuir](#contribuir)
9. [Licencia](#licencia)

---

## Descripción

**HaporeLauncher** es un lanzador no‑premium para Minecraft escrito completamente en JavaScript (Electron + Node.js).
Toda la lógica del launcher, incluyendo la descarga de versiones, instalación de mod‑loaders, gestión de Java y lanzamiento del juego, se ejecuta directamente en el proceso principal de Electron.

Diseñado para ser **multiplataforma** (Windows, macOS y Linux), **independiente** y fácil de clonar, ejecutar y empaquetar.

### ✨ Características de diseño

- 🎨 **Interfaz moderna** con efectos glassmorphism
- 🌈 **Paleta de colores mejorada** con gradientes atractivos
- ⚡ **Animaciones fluidas** y efectos visuales
- 📱 **Diseño responsive** para diferentes tamaños de pantalla
- 🎮 **Iconografía mejorada** con emojis y elementos visuales
- 🔧 **UX optimizada** con mejor feedback visual

## Características

* Descarga automática de cualquier versión oficial de Minecraft.
* **Obtención automática de versiones** desde la API de Mojang.
* Soporte opcional para **Forge**, **Fabric** y **Vanilla**.
* Ejecución *offline* con UUID determinista por nombre de usuario.
* Persiste el último perfil usado en `~/.haporelauncher/profiles.json`.
* Interfaz moderna con efectos visuales atractivos.
* Gestión de perfiles intuitiva y visual.
* **Arquitectura simplificada** - toda la lógica en un solo proceso.
* **Completamente independiente** - no requiere Python ni dependencias externas.

## Requisitos

| Herramienta | Versión recomendada | Comentario                     |
| ----------- | ------------------- | ------------------------------ |
| **Node.js** | ≥ 18.x              | Probado con Electron 37        |
| **npm**     | Pareada con tu Node | —                              |
| **Git**     | Cualquiera          | Para clonar el repo            |

### Dependencias Node.js (incluidas en `package.json`)

```json
{
  "minecraft-launcher-core": "^3.18.2",
  "axios": "^1.6.0",
  "adm-zip": "^0.5.10",
  "node-fetch": "^2.7.0",
  "uuid": "^9.0.1"
}
```

> Todas las dependencias se instalan automáticamente con `npm install`.

## Instalación

```bash
# 1. Clonar el repositorio
$ git clone https://github.com/tu_usuario/hapore-launcher.git
$ cd hapore-launcher

# 2. Instalar dependencias Node
$ npm install
```

## Uso

### Desarrollo (ventana de depuración abierta)

```bash
$ npm run start
```

La ventana mostrará la GUI moderna y, al pulsar **🚀 ¡JUGAR!**, ejecutará Minecraft directamente desde el proceso principal.

### Funcionalidades integradas

- **Gestión de perfiles**: Crear, editar y eliminar perfiles de Minecraft
- **Selector de versiones**: Lista automática de versiones disponibles
- **Configuración de memoria**: Ajustar RAM asignada al juego
- **Modloaders**: Soporte para Forge, Fabric y Vanilla
- **Argumentos JVM**: Configuración avanzada de Java
- **Descarga automática**: Java y versiones se descargan automáticamente

## Empaquetado y distribución

El empaquetado se realiza con **electron‑builder**.

```bash
$ npm run build
```

Por defecto generará instaladores en `dist/`:

* **Windows** → `HaporeLauncher Setup x.x.x.exe` (NSIS)
* **macOS**  → `HaporeLauncher.dmg` (PROXIMAMENTE)
* **Linux**  → `HaporeLauncher.AppImage` (PROXIMAMENTE)

### Configuración de empaquetado

El archivo `package.json` incluye la configuración completa para electron‑builder:

```json
{
  "build": {
    "appId": "com.haporelauncher.app",
    "productName": "HaporeLauncher",
    "win": {
      "target": "nsis",
      "icon": "src/icon.ico"
    }
  }
}
```

## Estructura del proyecto

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
├── README.md               # Este archivo
└── CHANGELOG.md            # Registro de cambios
```

### Arquitectura simplificada

- **Proceso principal** (`main.js`): Contiene toda la lógica del launcher
- **Proceso de renderer** (`renderer.js`): Maneja la interfaz y comunicación IPC
- **Comunicación IPC**: Intercambio de datos entre procesos de forma eficiente
- **Sin backend separado**: Toda la funcionalidad integrada en Electron

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de desarrollo

- **Estilo de código**: Seguir las convenciones de JavaScript/Node.js
- **Commits**: Usar mensajes descriptivos en español
- **Testing**: Probar en Windows, macOS y Linux cuando sea posible
- **Documentación**: Actualizar README y CHANGELOG para cambios importantes

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

*¡Prepárate para la aventura con HaporeLauncher! 🎮✨*
