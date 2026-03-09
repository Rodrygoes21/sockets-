# ==============================================================================
# Script: test_9_clients.ps1
# Descripción: Lanza 9 clientes TCP simultáneamente para testing de carga
# Uso: .\test_9_clients.ps1
# ==============================================================================

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 Testing con 9 Clientes Simultáneos" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$rootPath = Split-Path -Parent $PSScriptRoot
$clientPath = Join-Path $rootPath "client"

if (-not (Test-Path $clientPath)) {
    Write-Host "❌ Error: No se encuentra el directorio 'client'" -ForegroundColor Red
    Write-Host "   Path esperado: $clientPath" -ForegroundColor Yellow
    exit 1
}

# Verificar que existe node_modules
$nodeModulesPath = Join-Path $clientPath "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "⚠️  node_modules no encontrado. Instalando dependencias..." -ForegroundColor Yellow
    Push-Location $clientPath
    npm install
    Pop-Location
}

Write-Host "📍 Directorio de clientes: $clientPath" -ForegroundColor Gray
Write-Host ""

# Array para almacenar los procesos
$processes = @()

# Configuración
$SERVER_HOST = "localhost"
$SERVER_PORT = 5000
$REPORT_INTERVAL = 30000  # 30 segundos

Write-Host "🚀 Iniciando 9 clientes..." -ForegroundColor Green
Write-Host ""

# Lanzar 9 clientes con diferentes configuraciones
for ($i = 1; $i -le 9; $i++) {
    $clientName = "TestClient_$i"
    
    # Generar capacidades aleatorias para cada cliente
    $totalCapacity = Get-Random -Minimum 50000 -Maximum 500000  # 50GB - 500GB
    $usedPercent = Get-Random -Minimum 20 -Maximum 80
    $usedCapacity = [int]($totalCapacity * $usedPercent / 100)
    $freeCapacity = $totalCapacity - $usedCapacity
    
    Write-Host "[$i/9] Iniciando: $clientName" -ForegroundColor Cyan
    Write-Host "      📊 Capacidad: $([math]::Round($totalCapacity/1024, 2)) GB" -ForegroundColor Gray
    Write-Host "      💾 Usado: $usedPercent%" -ForegroundColor Gray
    Write-Host ""
    
    # Variables de entorno para cada cliente
    $env:CLIENT_NAME = $clientName
    $env:SERVER_HOST = $SERVER_HOST
    $env:SERVER_PORT = $SERVER_PORT
    $env:REPORT_INTERVAL = $REPORT_INTERVAL
    $env:TOTAL_CAPACITY = $totalCapacity
    $env:USED_CAPACITY = $usedCapacity
    $env:FREE_CAPACITY = $freeCapacity
    
    # Iniciar cliente en proceso separado
    $process = Start-Process -FilePath "node" `
                             -ArgumentList "src/index.js" `
                             -WorkingDirectory $clientPath `
                             -PassThru `
                             -WindowStyle Normal
    
    $processes += $process
    
    # Pequeña pausa entre lanzamientos para evitar sobrecarga
    Start-Sleep -Milliseconds 500
}

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ 9 clientes iniciados correctamente" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📌 PIDs de los procesos:" -ForegroundColor Yellow
$processes | ForEach-Object {
    Write-Host "   Cliente: PID $($_.Id)" -ForegroundColor Gray
}
Write-Host ""
Write-Host "⏱️  Intervalos de reporte: ${REPORT_INTERVAL}ms (30 segundos)" -ForegroundColor Cyan
Write-Host "🌐 Servidor: ${SERVER_HOST}:${SERVER_PORT}" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "ℹ️  Instrucciones:" -ForegroundColor Yellow
Write-Host "   • Los clientes están ejecutándose en ventanas separadas" -ForegroundColor Gray
Write-Host "   • Presiona Ctrl+C en cada ventana para detener un cliente" -ForegroundColor Gray
Write-Host "   • O ejecuta 'Stop-Process -Id <PID>' para detener uno específico" -ForegroundColor Gray
Write-Host "   • Para detener todos: .\stop_9_clients.ps1" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Guardar PIDs para poder detenerlos después
$pidsFile = Join-Path $PSScriptRoot "client_pids.txt"
$processes | ForEach-Object { $_.Id } | Out-File -FilePath $pidsFile

Write-Host "💾 PIDs guardados en: $pidsFile" -ForegroundColor Gray
Write-Host ""

# Monitorear procesos
Write-Host "🔍 Monitoreando clientes (presiona Ctrl+C para salir del monitor)..." -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        $runningCount = 0
        foreach ($process in $processes) {
            if (-not $process.HasExited) {
                $runningCount++
            }
        }
        
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] Clientes activos: $runningCount/9" -ForegroundColor Green
        
        if ($runningCount -eq 0) {
            Write-Host ""
            Write-Host "⚠️  Todos los clientes han finalizado" -ForegroundColor Yellow
            break
        }
    }
} catch {
    Write-Host ""
    Write-Host "⚠️  Monitor detenido manualmente" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Script de testing finalizado" -ForegroundColor Green
