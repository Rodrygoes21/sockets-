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
    
    # Obtener todos los procesos node con su línea de comandos usando WMI
    $nodeProcesses = Get-WmiObject Win32_Process -Filter "name = 'node.exe'" -ErrorAction SilentlyContinue
    
    $clientProcesses = @()
    foreach ($proc in $nodeProcesses) {
        if ($proc.CommandLine -like "*client*index.js*") {
            $clientProcesses += $proc
        }
    }
    
    if ($clientProcesses.Count -eq 0) {
        Write-Host "⚠️  No se encontraron clientes ejecutándose" -ForegroundColor Yellow
        Write-Host "   Deteniendo todos los procesos node.exe como alternativa..." -ForegroundColor Yellow
        $allNodes = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($allNodes.Count -gt 0) {
            foreach ($proc in $allNodes) {
                Write-Host "🛑 Deteniendo Node.js PID $($proc.Id)..." -ForegroundColor Yellow
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ Proceso detenido" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ No se encontraron procesos node.exe" -ForegroundColor Red
        }
        exit 0
    }
    
    Write-Host "📌 Encontrados $($clientProcesses.Count) proceso(s) de clientes" -ForegroundColor Cyan
    Write-Host ""
    
    foreach ($process in $clientProcesses) {
        Write-Host "🛑 Deteniendo PID $($process.ProcessId)..." -ForegroundColor Yellow
        Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Proceso $($process.ProcessId) detenido" -ForegroundColor Green
    }
    
} else {
    # Leer PIDs del archivo
    $pids = Get-Content $pidsFile
    
    Write-Host "📌 Leyendo PIDs desde: $pidsFile" -ForegroundColor Gray
    Write-Host "   PIDs encontrados: $($pids.Count)" -ForegroundColor Gray
    Write-Host ""
    
    $stoppedCount = 0
    $notFoundCount = 0
    
    foreach ($processId in $pids) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($null -ne $process) {
            Write-Host "🛑 Deteniendo PID $processId..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force
            Write-Host "   ✅ Proceso $processId detenido" -ForegroundColor Green
            $stoppedCount++
        } else {
            Write-Host "⚠️  PID $processId no encontrado (ya finalizado)" -ForegroundColor DarkGray
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
