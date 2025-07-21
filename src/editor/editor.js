/*--   HaporeLauncher – editor.js   */
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

const profilesFile = path.join(os.homedir(), '.haporelauncher', 'ui_profiles.json');
const recommendedFlags = [
    '-XX:+UnlockExperimentalVMOptions',
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
];

// Utilidades
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function validateField(field, isValid, message = '') {
    const wrapper = field.closest('.field-wrapper');
    
    // Remover estados previos
    wrapper.classList.remove('error', 'success');
    
    if (isValid) {
        wrapper.classList.add('success');
        if (message) showNotification(message, 'success');
    } else {
        wrapper.classList.add('error');
        if (message) showNotification(message, 'error');
    }
}

function addFieldValidation() {
    const fields = document.querySelectorAll('.field-input, .field-select, .field-textarea');
    
    fields.forEach(field => {
        field.addEventListener('blur', () => {
            validateFieldOnBlur(field);
        });
        
        field.addEventListener('input', () => {
            // Remover error al escribir
            const wrapper = field.closest('.field-wrapper');
            wrapper.classList.remove('error');
        });
    });
}

function validateFieldOnBlur(field) {
    const value = field.value.trim();
    const fieldName = field.id;
    
    switch (fieldName) {
        case 'prof-name':
            if (value.length < 2) {
                validateField(field, false, 'El nombre del perfil debe tener al menos 2 caracteres');
                return false;
            }
            if (value.length > 20) {
                validateField(field, false, 'El nombre del perfil no puede exceder 20 caracteres');
                return false;
            }
            validateField(field, true);
            return true;
            
        case 'username':
            if (value && value.length < 3) {
                validateField(field, false, 'El nombre de usuario debe tener al menos 3 caracteres');
                return false;
            }
            if (value && value.length > 16) {
                validateField(field, false, 'El nombre de usuario no puede exceder 16 caracteres');
                return false;
            }
            validateField(field, true);
            return true;
            
        case 'ram':
            if (value) {
                const ram = parseInt(value);
                if (ram < 1024) {
                    validateField(field, false, 'La RAM mínima es 1024 MB');
                    return false;
                }
                if (ram > 32768) {
                    validateField(field, false, 'La RAM máxima es 32768 MB');
                    return false;
                }
            }
            validateField(field, true);
            return true;
            
        default:
            return true;
    }
}

function validateForm() {
    const fields = document.querySelectorAll('.field-input, .field-select, .field-textarea');
    let isValid = true;
    
    fields.forEach(field => {
        if (!validateFieldOnBlur(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function showLoadingState(button, isLoading) {
    const originalText = button.innerHTML;
    
    if (isLoading) {
        button.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Guardando...';
        button.disabled = true;
    } else {
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Función para actualizar la ruta de instalación
function updateInstallPath() {
    const profName = document.getElementById('prof-name').value.trim() || '[perfil]';
    const version = document.getElementById('version').value || '[versión]';
    const installPathElement = document.getElementById('install-path');
    
    const username = os.userInfo().username || '[usuario]';
    const installPath = path.join(`C:\\Users\\${username}\\.haporelauncher\\instances\\${version}`);
    
    installPathElement.textContent = installPath;
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(location.search);
    const profName = params.get('name');
    const btnClose = document.getElementById('close-btn');
    const submitBtn = document.querySelector('button[type="submit"]');
    const formTitle = document.getElementById('form-title');

    // Configurar validaciones
    addFieldValidation();
    
    // Inicializar la ruta de instalación
    updateInstallPath();
    
    // Actualizar la ruta cuando cambie el nombre del perfil
    document.getElementById('prof-name').addEventListener('input', updateInstallPath);

    // Cargar versiones automáticamente usando IPC
    try {
        console.log('Cargando versiones disponibles...');
        const versions = await ipcRenderer.invoke('get-available-versions');
        const versionSelect = document.getElementById('version');
        
        if (versionSelect && versions.length > 0) {
            // Limpiar opciones existentes
            versionSelect.innerHTML = '';
            
            // Agregar opción por defecto
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Seleccionar versión...';
            versionSelect.appendChild(defaultOption);
            
            // Agregar versiones con mejor formato
            versions.forEach(version => {
                const option = document.createElement('option');
                option.value = version;
                option.textContent = `Minecraft ${version}`;
                versionSelect.appendChild(option);
            });
            
            console.log(`Cargadas ${versions.length} versiones`);
            showNotification(`Cargadas ${versions.length} versiones de Minecraft`, 'success');
            
            // Actualizar la ruta de instalación cuando cambie la versión
            versionSelect.addEventListener('change', updateInstallPath);
        }
    } catch (error) {
        console.error('Error cargando versiones:', error);
        showNotification('Error cargando versiones. Usando lista básica.', 'error');
        
        // Usar versiones básicas como fallback
        const basicVersions = ['1.21.2', '1.20.6', '1.19.4', '1.18.2', '1.17.1', '1.16.5', '1.15.2', '1.14.4', '1.13.2', '1.12.2', '1.11.2', '1.10.2', '1.9.4', '1.8.9', '1.7.10'];
        const versionSelect = document.getElementById('version');
        
        if (versionSelect) {
            versionSelect.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Seleccionar versión...';
            versionSelect.appendChild(defaultOption);
            
            basicVersions.forEach(version => {
                const option = document.createElement('option');
                option.value = version;
                option.textContent = `Minecraft ${version}`;
                versionSelect.appendChild(option);
            });
            
            // Actualizar la ruta de instalación cuando cambie la versión
            versionSelect.addEventListener('change', updateInstallPath);
        }
    }

    // Configurar botón de cerrar
    if (btnClose) {
        btnClose.addEventListener('click', () => {
            window.close();
        });
    }

    // Cargar perfil existente si se está editando
    if (profName) {
        formTitle.textContent = `✏️ Editar Perfil: ${profName}`;
        document.getElementById('prof-name').value = profName;
        document.getElementById('prof-name').disabled = true;

        if (fs.existsSync(profilesFile)) {
            try {
                const profiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
                const profile = profiles[profName];
                if (profile) {
                    document.getElementById('username').value = profile.username || '';
                    document.getElementById('version').value = profile.version || '';
                    document.getElementById('modloader').value = profile.modloader || 'vanilla';
                    document.getElementById('ram').value = profile.ram || '';
                    document.getElementById('jvm-flags').value = (profile.jvmFlags || []).join(' ');
                    
                    showNotification('Perfil cargado correctamente', 'success');
                }
            } catch (e) {
                console.warn('Error al cargar perfiles:', e);
                showNotification('Error cargando el perfil', 'error');
            }
        }
    }

    // Manejar envío del formulario
    document.getElementById('editor').addEventListener('submit', async e => {
        e.preventDefault();
        
        if (!validateForm()) {
            showNotification('Por favor, corrige los errores en el formulario', 'error');
            return;
        }
        
        const name = document.getElementById('prof-name').value.trim();
        const username = document.getElementById('username').value.trim();
        const version = document.getElementById('version').value;
        const ram = document.getElementById('ram').value.trim();
        const jvmFlags = document.getElementById('jvm-flags').value.trim().split(/\s+/).filter(Boolean);
        
        // Validaciones adicionales
        if (!name) {
            showNotification('El nombre del perfil es obligatorio', 'error');
            return;
        }
        
        if (!version) {
            showNotification('Debes seleccionar una versión de Minecraft', 'error');
            return;
        }
        
        // Mostrar estado de carga
        showLoadingState(submitBtn, true);
        
        try {
            // Cargar perfiles existentes
            const profiles = fs.existsSync(profilesFile)
                ? JSON.parse(fs.readFileSync(profilesFile, 'utf8'))
                : {};

            // Verificar si el nombre ya existe (solo si es un perfil nuevo)
            if (!profName && profiles[name]) {
                showLoadingState(submitBtn, false);
                showNotification('Ya existe un perfil con ese nombre', 'error');
                return;
            }

            // Guardar perfil
            profiles[name] = {
                username,
                version,
                ram: ram || 2048, // Usar 2048 MB (2GB) por defecto
                jvmFlags
            };
            
            // Crear directorio si no existe
            fs.mkdirSync(path.dirname(profilesFile), { recursive: true });
            fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2));

            // Simular delay para mejor UX
            await new Promise(resolve => setTimeout(resolve, 500));
            
            showNotification('Perfil guardado correctamente', 'success');
            
            // Notificar al proceso principal
            ipcRenderer.send('profile-saved', name);
            
            // Cerrar ventana después de un breve delay
            setTimeout(() => {
                window.close();
            }, 1000);
            
        } catch (error) {
            console.error('Error guardando perfil:', error);
            showLoadingState(submitBtn, false);
            showNotification('Error guardando el perfil', 'error');
        }
    });

    // Configurar botón de flags recomendadas
    document.getElementById('btn-opt').addEventListener('click', () => {
        const jvmFlagsField = document.getElementById('jvm-flags');
        jvmFlagsField.value = recommendedFlags.join(' ');
        showNotification('Flags JVM recomendadas aplicadas', 'success');
        
        // Efecto visual
        jvmFlagsField.focus();
        jvmFlagsField.select();
    });

    // Detectar cambios en el mod loader
    document.getElementById('modloader').addEventListener('change', (e) => {
        const modloader = e.target.value;
        const modloaderWrapper = e.target.closest('.field-wrapper');
        
        // Remover clases previas
        modloaderWrapper.classList.remove('fabric-selected', 'forge-selected', 'vanilla-selected');
        
        if (modloader === 'fabric') {
            modloaderWrapper.classList.add('fabric-selected');
            showNotification('Fabric será instalado automáticamente al guardar el perfil', 'info');
        } else if (modloader === 'forge') {
            modloaderWrapper.classList.add('forge-selected');
            showNotification('Forge deberá ser instalado manualmente', 'info');
        } else {
            modloaderWrapper.classList.add('vanilla-selected');
        }
    });

    // Efectos de hover para mejor feedback
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            if (!btn.disabled) {
                btn.style.transform = 'translateY(-2px)';
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
        });
    });

    // Auto-focus en el primer campo
    setTimeout(() => {
        const firstField = document.getElementById('prof-name');
        if (firstField && !firstField.disabled) {
            firstField.focus();
        }
    }, 100);
});

// Agregar estilos CSS para las notificaciones
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-success {
        border-left: 4px solid #10b981;
    }
    
    .notification-error {
        border-left: 4px solid #ef4444;
    }
    
    .notification-info {
        border-left: 4px solid #3b82f6;
    }
    
    .spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
