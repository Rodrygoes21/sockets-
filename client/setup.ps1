# =============================================================================
# Script de Setup del Cliente TCP
# =============================================================================
# Este script instala las dependencias y configura el cliente
# Uso: .\setup.ps1 [CLIENT_ID]
# Ejemplo: .\setup.ps1 CLIENT_001
# =============================================================================

param(
    [string]$ClientId = "CLIENT_001",
    [string]$ServerHost = "localhost",
    [int]$ServerPort = 5000
)

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                   ║" -ForegroundColor Cyan
Write-Host "║           SETUP - CLIENTE TCP STORAGE CLUSTER                     ║" -ForegroundColor Cyan
Write-Host "║                                                                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "🔍 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
    
    # Verificar versión mínima (v18)
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "   ⚠️  Advertencia: Se requiere Node.js v18 o superior" -ForegroundColor Yellow
        Write-Host "   Tu versión: $nodeVersion" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Node.js no encontrado" -ForegroundColor Red
    Write-Host "   Por favor instala Node.js v18+ desde: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verificar npm
Write-Host ""
Write-Host "🔍 Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm encontrado: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm no encontrado" -ForegroundColor Red
    exit 1
}

# Instalar dependencias
Write-Host ""
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
Write-Host ""

try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "   ✅ Dependencias instaladas correctamente" -ForegroundColor Green
    } else {
        throw "npm install falló con código $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "   ❌ Error al instalar dependencias: $_" -ForegroundColor Red
    exit 1
}

# Crear archivo .env si no existe
Write-Host ""
Write-Host "⚙️  Configurando cliente..." -ForegroundColor Yellow

if (Test-Path .env) {
    Write-Host "   ℹ️  Archivo .env ya existe, no se sobrescribirá" -ForegroundColor Cyan
    Write-Host "   Para reconfigurar, elimina el archivo .env y vuelve a ejecutar este script" -ForegroundColor Cyan
} else {
    try {
        $envContent = @"
CLIENT_ID=$ClientId
SERVER_HOST=$ServerHost
SERVER_PORT=$ServerPort
METRICS_INTERVAL=30000
RECONNECT_INTERVAL=5000
MAX_RECONNECT_ATTEMPTS=-1
MESSAGE_TIMEOUT=30000
LOG_LEVEL=info
LOG_FILE=logs/client.log
MESSAGES_LOG_FILE=logs/messages.log
NODE_ENV=development
"@
        
        $envContent | Out-File -FilePath .env -Encoding UTF8
        Write-Host "   ✅ Archivo .env creado con CLIENT_ID=$ClientId" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error al crear .env: $_" -ForegroundColor Red
        exit 1
    }
}

# Crear directorio de logs si no existe
if (-not (Test-Path logs)) {
    New-Item -ItemType Directory -Path logs | Out-Null
    Write-Host "   ✅ Directorio de logs creado" -ForegroundColor Green
}

# Resumen
Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                   ║" -ForegroundColor Green
Write-Host "║                    ✅ SETUP COMPLETADO                            ║" -ForegroundColor Green
Write-Host "║                                                                   ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuración:" -ForegroundColor Cyan
Write-Host "   • Cliente ID: $ClientId" -ForegroundColor White
Write-Host "   • Servidor: ${ServerHost}:${ServerPort}" -ForegroundColor White
Write-Host "   • Logs: logs/" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para iniciar el cliente:" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 Para desarrollo (auto-reload):" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Para ver logs en tiempo real:" -ForegroundColor Cyan
Write-Host "   Get-Content logs/client.log -Wait -Tail 20" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚙️  Para cambiar la configuración:" -ForegroundColor Cyan
Write-Host "   Edita el archivo .env" -ForegroundColor Yellow
Write-Host ""
