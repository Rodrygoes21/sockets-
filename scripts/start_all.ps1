# ==============================================================================
# Script: start_all.ps1
# Descripción: Inicia todo el sistema: MongoDB, Servidor TCP, API REST, y UI
# Uso: .\start_all.ps1
# ==============================================================================

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Storage Cluster - Sistema Completo" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Obtener rutas
$rootPath = Split-Path -Parent $PSScriptRoot
$serverPath = Join-Path $rootPath "server"
$apiPath = Join-Path $rootPath "server\src"
$uiPath = Join-Path $rootPath "ui"

# Array para almacenar procesos
$processes = @()

Write-Host "📁 Directorio raíz: $rootPath" -ForegroundColor Gray
Write-Host ""

# ==============================================================================
# 1. Verificar MongoDB
# ==============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🔍 Paso 1/4: Verificando MongoDB" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue

if ($null -eq $mongoProcess) {
    Write-Host "⚠️  MongoDB no está ejecutándose" -ForegroundColor Yellow
    Write-Host "   Intentando iniciar MongoDB..." -ForegroundColor Gray
    
    try {
        # Intentar iniciar MongoDB como servicio
        Start-Service -Name "MongoDB" -ErrorAction Stop
        Write-Host "✅ MongoDB iniciado como servicio" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  No se pudo iniciar como servicio. Por favor inicia MongoDB manualmente:" -ForegroundColor Yellow
        Write-Host "   mongod --dbpath C:\data\db" -ForegroundColor Gray
        Write-Host ""
        $continue = Read-Host "¿MongoDB está ejecutándose? (s/n)"
        if ($continue -ne "s") {
            Write-Host "❌ Abortando..." -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "✅ MongoDB ya está ejecutándose (PID: $($mongoProcess.Id))" -ForegroundColor Green
}

Write-Host ""
Start-Sleep -Seconds 2

# ==============================================================================
# 2. Verificar e Instalar Dependencias
# ==============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📦 Paso 2/4: Verificando Dependencias" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

# Verificar node_modules del servidor
if (-not (Test-Path (Join-Path $serverPath "node_modules"))) {
    Write-Host "📥 Instalando dependencias del servidor..." -ForegroundColor Yellow
    Push-Location $serverPath
    npm install
    Pop-Location
} else {
    Write-Host "✅ Dependencias del servidor OK" -ForegroundColor Green
}

# Verificar node_modules del UI
if (-not (Test-Path (Join-Path $uiPath "node_modules"))) {
    Write-Host "📥 Instalando dependencias del UI..." -ForegroundColor Yellow
    Push-Location $uiPath
    npm install
    Pop-Location
} else {
    Write-Host "✅ Dependencias del UI OK" -ForegroundColor Green
}

Write-Host ""
Start-Sleep -Seconds 1

# ==============================================================================
# 3. Iniciar Servidor TCP
# ==============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🌐 Paso 3/4: Iniciando Servidor TCP" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$serverIndexPath = Join-Path $serverPath "src\index.js"

Write-Host "📡 Iniciando servidor TCP en puerto 5000..." -ForegroundColor Gray

$tcpProcess = Start-Process -FilePath "node" `
                             -ArgumentList $serverIndexPath `
                             -WorkingDirectory $serverPath `
                             -PassThru `
                             -WindowStyle Normal

$processes += @{ Name = "TCP Server"; Process = $tcpProcess; Port = 5000 }

Write-Host "✅ Servidor TCP iniciado (PID: $($tcpProcess.Id))" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# ==============================================================================
# 4. Iniciar API REST
# ==============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "⚙️  Paso 4/4: Iniciando API REST" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$apiIndexPath = Join-Path $apiPath "api.js"

Write-Host "🔌 Iniciando API REST en puerto 3000..." -ForegroundColor Gray

$apiProcess = Start-Process -FilePath "node" `
                             -ArgumentList $apiIndexPath `
                             -WorkingDirectory $serverPath `
                             -PassThru `
                             -WindowStyle Normal

$processes += @{ Name = "API REST"; Process = $apiProcess; Port = 3000 }

Write-Host "✅ API REST iniciada (PID: $($apiProcess.Id))" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# ==============================================================================
# 5. Iniciar UI React
# ==============================================================================

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "💻 Paso 5/5: Iniciando UI React" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "🎨 Iniciando UI con Vite en puerto 5173..." -ForegroundColor Gray

$uiProcess = Start-Process -FilePath "npm" `
                            -ArgumentList "run", "dev" `
                            -WorkingDirectory $uiPath `
                            -PassThru `
                            -WindowStyle Normal

$processes += @{ Name = "UI React"; Process = $uiProcess; Port = 5173 }

Write-Host "✅ UI React iniciado (PID: $($uiProcess.Id))" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 3

# ==============================================================================
# Resumen Final
# ==============================================================================

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Sistema Iniciado Correctamente" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Servicios Activos:" -ForegroundColor Cyan
Write-Host ""

foreach ($proc in $processes) {
    $status = if (-not $proc.Process.HasExited) { "🟢 Activo" } else { "🔴 Error" }
    Write-Host "  $status  $($proc.Name)" -ForegroundColor $(if (-not $proc.Process.HasExited) { "Green" } else { "Red" })
    Write-Host "           PID: $($proc.Process.Id) | Puerto: $($proc.Port)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🌐 URLs de Acceso:" -ForegroundColor Cyan
Write-Host "   • UI React:     http://localhost:5173" -ForegroundColor White
Write-Host "   • API REST:     http://localhost:3000" -ForegroundColor White
Write-Host "   • TCP Server:   localhost:5000" -ForegroundColor White
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "ℹ️  Instrucciones:" -ForegroundColor Yellow
Write-Host "   • Abre http://localhost:5173 en tu navegador" -ForegroundColor Gray
Write-Host "   • Inicia clientes con: cd client; node src/index.js" -ForegroundColor Gray
Write-Host "   • Para testing: .\scripts\test_9_clients.ps1" -ForegroundColor Gray
Write-Host "   • Para detener todo: .\scripts\stop_all.ps1" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Guardar PIDs
$pidsFile = Join-Path $PSScriptRoot "system_pids.txt"
$processes | ForEach-Object { "$($_.Name),$($_.Process.Id)" } | Out-File -FilePath $pidsFile

Write-Host "💾 PIDs guardados en: $pidsFile" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 ¡Sistema listo para usar!" -ForegroundColor Green
Write-Host ""
