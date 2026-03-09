# ==============================================================================
# Script: stop_9_clients.ps1
# Descripción: Detiene todos los clientes TCP iniciados por test_9_clients.ps1
# Uso: .\stop_9_clients.ps1
# ==============================================================================

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🛑 Deteniendo Clientes TCP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Buscar archivo de PIDs
$pidsFile = Join-Path $PSScriptRoot "client_pids.txt"

if (-not (Test-Path $pidsFile)) {
    Write-Host "⚠️  No se encontró archivo de PIDs: $pidsFile" -ForegroundColor Yellow
    Write-Host "   Buscando procesos node.exe manualmente..." -ForegroundColor Yellow
    Write-Host ""
    
    # Buscar todos los procesos node.exe que estén ejecutando el cliente
    $clientProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*client*index.js*"
    }
    
    if ($clientProcesses.Count -eq 0) {
        Write-Host "❌ No se encontraron clientes ejecutándose" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "📌 Encontrados $($clientProcesses.Count) proceso(s) de clientes" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($process in $clientProcesses) {
        Write-Host "🛑 Deteniendo PID $($process.Id)..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force
        Write-Host "   ✅ Proceso $($process.Id) detenido" -ForegroundColor Green
    }
    
} else {
    # Leer PIDs del archivo
    $pids = Get-Content $pidsFile
    
    Write-Host "📌 Leyendo PIDs desde: $pidsFile" -ForegroundColor Gray
    Write-Host "   PIDs encontrados: $($pids.Count)" -ForegroundColor Gray
    Write-Host ""
    
    $stoppedCount = 0
    $notFoundCount = 0
    
    foreach ($pid in $pids) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        
        if ($null -ne $process) {
            Write-Host "🛑 Deteniendo PID $pid..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force
            Write-Host "   ✅ Proceso $pid detenido" -ForegroundColor Green
            $stoppedCount++
        } else {
            Write-Host "⚠️  PID $pid no encontrado (ya finalizado)" -ForegroundColor DarkGray
            $notFoundCount++
        }
    }
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "📊 Resumen:" -ForegroundColor Cyan
    Write-Host "   ✅ Detenidos: $stoppedCount" -ForegroundColor Green
    Write-Host "   ⚠️  No encontrados: $notFoundCount" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    
    # Eliminar archivo de PIDs
    Remove-Item $pidsFile -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "🗑️  Archivo de PIDs eliminado" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Todos los clientes han sido detenidos" -ForegroundColor Green
