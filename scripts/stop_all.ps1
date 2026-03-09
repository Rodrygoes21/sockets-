# ==============================================================================
# Script: stop_all.ps1
# Descripción: Detiene todos los servicios del Storage Cluster
# Uso: .\stop_all.ps1
# ==============================================================================

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🛑 Deteniendo Storage Cluster" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Buscar archivo de PIDs
$pidsFile = Join-Path $PSScriptRoot "system_pids.txt"

$stoppedCount = 0
$notFoundCount = 0

if (Test-Path $pidsFile) {
    Write-Host "📌 Leyendo PIDs desde: $pidsFile" -ForegroundColor Gray
    Write-Host ""
    
    $pids = Get-Content $pidsFile
    
    foreach ($line in $pids) {
        $parts = $line -split ","
        $name = $parts[0]
        $pid = $parts[1]
        
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        
        if ($null -ne $process) {
            Write-Host "🛑 Deteniendo $name (PID: $pid)..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force
            Write-Host "   ✅ Proceso detenido" -ForegroundColor Green
            $stoppedCount++
        } else {
            Write-Host "⚠️  $name (PID: $pid) no encontrado" -ForegroundColor DarkGray
            $notFoundCount++
        }
    }
    
    # Eliminar archivo de PIDs
    Remove-Item $pidsFile -ErrorAction SilentlyContinue
    
} else {
    Write-Host "⚠️  No se encontró archivo de PIDs" -ForegroundColor Yellow
    Write-Host "   Buscando procesos manualmente..." -ForegroundColor Gray
    Write-Host ""
}

# Buscar y matar procesos adicionales por nombre
Write-Host ""
Write-Host "🔍 Buscando procesos adicionales..." -ForegroundColor Cyan

$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

foreach ($process in $nodeProcesses) {
    # Intentar identificar el tipo de proceso
    $commandLine = $process.CommandLine
    
    $shouldKill = $false
    $processType = "Node.js"
    
    if ($commandLine -like "*api.js*") {
        $processType = "API REST"
        $shouldKill = $true
    } elseif ($commandLine -like "*server*index.js*") {
        $processType = "TCP Server"
        $shouldKill = $true
    } elseif ($commandLine -like "*client*index.js*") {
        $processType = "Cliente TCP"
        $shouldKill = $true
    }
    
    if ($shouldKill) {
        Write-Host "🛑 Deteniendo $processType (PID: $($process.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Proceso detenido" -ForegroundColor Green
        $stoppedCount++
    }
}

# Detener Vite (UI)
$viteProcesses = Get-Process | Where-Object { $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*npm*run*dev*" }

foreach ($process in $viteProcesses) {
    Write-Host "🛑 Deteniendo UI Vite (PID: $($process.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ Proceso detenido" -ForegroundColor Green
    $stoppedCount++
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "📊 Resumen:" -ForegroundColor Cyan
Write-Host "   ✅ Procesos detenidos: $stoppedCount" -ForegroundColor Green
if ($notFoundCount -gt 0) {
    Write-Host "   ⚠️  Procesos no encontrados: $notFoundCount" -ForegroundColor Yellow
}
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "ℹ️  Nota: MongoDB no ha sido detenido (servicio del sistema)" -ForegroundColor Cyan
Write-Host "   Para detenerlo: Stop-Service -Name MongoDB" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Sistema detenido correctamente" -ForegroundColor Green
