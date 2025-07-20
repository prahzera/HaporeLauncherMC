!macro customInstall
  ; Crear directorio para los datos del launcher
  CreateDirectory "$LOCALAPPDATA\HaporeLauncher"
  
  ; Crear archivo de configuración inicial si no existe
  ${IfNot} ${FileExists} "$LOCALAPPDATA\HaporeLauncher\config.json"
    FileOpen $0 "$LOCALAPPDATA\HaporeLauncher\config.json" w
    FileWrite $0 '{"profiles":[],"settings":{"theme":"dark","language":"es"}}'
    FileClose $0
  ${EndIf}
  
  ; Crear directorio para las versiones de Minecraft
  CreateDirectory "$LOCALAPPDATA\HaporeLauncher\versions"
  
  ; Crear directorio para Java
  CreateDirectory "$LOCALAPPDATA\HaporeLauncher\java"
  
  ; Crear directorio para las instancias
  CreateDirectory "$LOCALAPPDATA\HaporeLauncher\instances"
!macroend

!macro customUnInstall
  ; Preguntar si eliminar los datos del usuario
  MessageBox MB_YESNO|MB_ICONQUESTION "¿Deseas eliminar todos los datos del launcher (perfiles, versiones de Minecraft, etc.)?" IDYES deleteData IDNO keepData
  
  deleteData:
    RMDir /r "$LOCALAPPDATA\HaporeLauncher"
    Goto endUninstall
  
  keepData:
    ; Mantener los datos del usuario
    Goto endUninstall
  
  endUninstall:
!macroend

; Personalizar la interfaz del instalador
!define MUI_WELCOMEPAGE_TITLE "Bienvenido a HaporeLauncher"
!define MUI_WELCOMEPAGE_TEXT "Este asistente te guiará a través de la instalación de HaporeLauncher.$\\r$\\n$\\r$\\nHaporeLauncher es un launcher de Minecraft moderno y fácil de usar que soporta tanto cuentas premium como no-premium."

!define MUI_LICENSEPAGE_TEXT_TOP "HaporeLauncher - Licencia de Uso"
!define MUI_LICENSEPAGE_TEXT_BOTTOM "Por favor, lee cuidadosamente los términos de la licencia antes de continuar."

!define MUI_DIRECTORYPAGE_TEXT_TOP "Selecciona el directorio donde deseas instalar HaporeLauncher"
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Directorio de instalación"

!define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Instalación Completada"
!define MUI_INSTFILESPAGE_FINISHPAGE_TEXT "HaporeLauncher ha sido instalado exitosamente en tu sistema.$\\r$\\n$\\r$\\nEl launcher está listo para usar. Puedes encontrarlo en el menú inicio o en el escritorio."

!define MUI_FINISHPAGE_RUN "$INSTDIR\HaporeLauncher.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Ejecutar HaporeLauncher ahora"
!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\README.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Mostrar archivo README"

; Información del instalador (solo si no está ya definida)
!ifndef VIProductVersion
  VIProductVersion "2.0.0.0"
!endif
!ifndef VIAddVersionKey
  VIAddVersionKey "ProductName" "HaporeLauncher"
  VIAddVersionKey "CompanyName" "HaporeLauncher Team"
  VIAddVersionKey "LegalCopyright" "Copyright © 2024 HaporeLauncher"
  VIAddVersionKey "FileDescription" "HaporeLauncher - Minecraft Launcher"
  VIAddVersionKey "FileVersion" "2.0.0"
  VIAddVersionKey "ProductVersion" "2.0.0"
!endif 