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
        $processId = $parts[1]
        
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($null -ne $process) {
            Write-Host "🛑 Deteniendo $name (PID: $processId)..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force
            Write-Host "   ✅ Proceso detenido" -ForegroundColor Green
            $stoppedCount++
        } else {
            Write-Host "⚠️  $name (PID: $processId) no encontrado" -ForegroundColor DarkGray
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

# Buscar y matar procesos adicionales por nombre usando WMI
Write-Host ""
Write-Host "🔍 Buscando procesos adicionales..." -ForegroundColor Cyan

# Obtener procesos Node.js con línea de comandos
$nodeProcesses = Get-WmiObject Win32_Process -Filter "name = 'node.exe'" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    foreach ($process in $nodeProcesses) {
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
            Write-Host "🛑 Deteniendo $processType (PID: $($process.ProcessId))..." -ForegroundColor Yellow
            Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
            Write-Host "   ✅ Proceso detenido" -ForegroundColor Green
            $stoppedCount++
        }
    }
} else {
    Write-Host "ℹ️  No se encontraron procesos Node.js" -ForegroundColor Gray
}

# Detener Vite (UI) - buscar por nombre de proceso
$viteProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $wmiProc = Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)" -ErrorAction SilentlyContinue
    if ($wmiProc -and $wmiProc.CommandLine) {
        $wmiProc.CommandLine -like "*vite*" -or $wmiProc.CommandLine -like "*npm*run*dev*"
    }
}

if ($viteProcesses) {
    foreach ($process in $viteProcesses) {
        Write-Host "🛑 Deteniendo UI Vite (PID: $($process.Id))..." -ForegroundColor Yellow
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Proceso detenido" -ForegroundColor Green
        $stoppedCount++
    }
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
