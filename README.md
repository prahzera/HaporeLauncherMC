# HaporeLauncher

> *Minecraft No‑Premium desktop launcher construido con Electron + Python*

---

## Índice

1. [Descripción](#descripción)
2. [Características](#características)
3. [Requisitos](#requisitos)
4. [Instalación](#instalación)
5. [Uso](#uso)
6. [Empaquetado y distribución](#empaquetado-y-distribución)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [CLI del backend](#cli-del-backend)
9. [Contribuir](#contribuir)
10. [Licencia](#licencia)

---

## Descripción

**HaporeLauncher** es un lanzador no‑premium para Minecraft escrito en JavaScript (Electron) y Python.
La interfaz gráfica corre en Electron y delega todas las operaciones específicas del juego (descarga de versiones, instalación de mod‑loaders, construcción y ejecución del comando `java`) a un módulo Python (`gwlauncher_backend.py`).

Diseñado para ser **multiplataforma** (Windows, macOS y Linux) y fácil de clonar, ejecutar y empaquetar.

### ✨ Nuevas características de diseño

- 🎨 **Interfaz moderna** con efectos glassmorphism
- 🌈 **Paleta de colores mejorada** con gradientes atractivos
- ⚡ **Animaciones fluidas** y efectos visuales
- 📱 **Diseño responsive** para diferentes tamaños de pantalla
- 🎮 **Iconografía mejorada** con emojis y elementos visuales
- 🔧 **UX optimizada** con mejor feedback visual

## Características

* Descarga automática de cualquier versión oficial de Minecraft.
* Soporte opcional para **Forge**, **Fabric** y **Vanilla**.
* Ejecución *offline* con UUID determinista por nombre de usuario.
* Persiste el último perfil usado en `~/.haporelauncher/profiles.json`.
* CLI de backend para instalar, lanzar o listar versiones sin abrir la GUI.
* Interfaz moderna con efectos visuales atractivos.
* Gestión de perfiles intuitiva y visual.

## Requisitos

| Herramienta | Versión recomendada | Comentario                     |
| ----------- | ------------------- | ------------------------------ |
| **Node.js** | ≥ 18.x              | Probado con Electron 37        |
| **npm**     | Pareada con tu Node | —                              |
| **Python**  | ≥ 3.9               | Necesario por `typing.Literal` |
| **Git**     | Cualquiera          | Para clonar el repo            |

### Dependencias Node (vienen en `package.json`)

```json
"dependencies": {},
"devDependencies": {
  "electron": "^37.2.3",
  "electron-builder": "^24.0.0"
}
```

### Dependencias Python (archivo [`requirements.txt`](requirements.txt))

```text
minecraft-launcher-lib>=7.1
```

> Si alguna otra librería se añade en el futuro, recuerda actualizar ambos archivos.

## Instalación

```bash
# 1. Clonar el repositorio
$ git clone https://github.com/tu_usuario/hapore-launcher.git
$ cd hapore-launcher

# 2. Instalar dependencias Node
$ npm install

# 3. Instalar dependencias Python
$ pip install -r requirements.txt
```

## Uso

### Desarrollo (ventana de depuración abierta)

```bash
$ npm run start
```

La ventana mostrará la GUI moderna y, al pulsar **🚀 ¡JUGAR!**, ejecutará el backend Python y volcará la salida en el `pre#log`.

### Ejecución del backend en consola

```bash
# Instalar una versión
$ python src/python/gwlauncher_backend.py install 1.21.1

# Lanzar en modo offline con 4 GiB de RAM y Forge
$ python src/python/gwlauncher_backend.py launch 1.21.1 Alex --ram 4096 --modloader forge

# Listar catálogo de versiones (JSON)
$ python src/python/gwlauncher_backend.py versions
```

## Empaquetado y distribución

El empaquetado se realiza con **electron‑builder**.

```bash
$ npm run build
```

Por defecto generará instaladores en `dist/`:

* **Windows** → `HaporeLauncher Setup x.x.x.exe` (NSIS)
* **macOS**  → `HaporeLauncher.dmg` (PROXIMAMENTE)
* **Linux**  → `HaporeLauncher.AppImage` (PROXIMAMENTE)

Ajusta la sección **`build`** de `package.json` para cambiar íconos, targets o metadatos.

## Estructura del proyecto

```text
├─ main.js                 # Proceso principal de Electron
├─ package.json            # Configuración Node/Electron
├─ requirements.txt        # Dependencias Python
├─ src/
│  ├─ index.html           # GUI principal
│  ├─ renderer.js          # Lógica de la ventana
│  ├─ styles.css           # Estilos modernos
│  ├─ icon.ico             # Ícono Windows
│  ├─ editor/              # Editor de perfiles
│  └─ python/              # Backend Python
├─ assets/                 # Imágenes y recursos
└─ dist/                   # (se genera al compilar)
```

## CLI del backend

| Comando              | Descripción                                                                               |        |             |
| -------------------- | ----------------------------------------------------------------------------------------- | ------ | ----------- |
| `install <ver>`      | Descarga o actualiza la versión indicada.                                                 |        |             |
| `launch <ver> <usr>` | Lanza el juego en modo offline. Args extra:<br>• `--ram <MiB>`<br>• `--modloader <forge \| fabric \| neoforge>` |

## Características de la nueva interfaz

### 🎨 Diseño visual
- **Glassmorphism**: Efectos de cristal y transparencia
- **Gradientes modernos**: Colores vibrantes y atractivos
- **Animaciones suaves**: Transiciones fluidas en todos los elementos
- **Iconografía mejorada**: Emojis y elementos visuales intuitivos

### 🚀 Experiencia de usuario
- **Feedback visual**: Efectos hover y estados activos claros
- **Navegación intuitiva**: Sidebar mejorada con mejor organización
- **Responsive design**: Adaptable a diferentes tamaños de pantalla
- **Accesibilidad**: Contraste mejorado y elementos claramente identificables

### ⚡ Rendimiento
- **Optimización CSS**: Variables CSS para consistencia
- **Animaciones eficientes**: Uso de transform y opacity para mejor rendimiento
- **Carga rápida**: Estructura optimizada para tiempos de carga mínimos

## Contribuir

1. Crea un *fork* y una rama (`feat/…` o `fix/…`).
2. Haz cambios atómicos y documenta en el *commit*.
3. Abre un *pull request* describiendo el problema y la solución.

> Sigue las buenas prácticas de *clean code* y formatea con Prettier / Black.

## Licencia

Este proyecto se publica bajo la licencia **MIT**. Consulta [`LICENSE`](LICENSE) para más detalles.

---

*¡Prepárate para la aventura con HaporeLauncher! 🎮✨*
