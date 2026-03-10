Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Verificacion del Sistema - Storage Cluster" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Verificar Node.js
Write-Host "[1/8] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   OK Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Node.js NO instalado" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Verificar npm
Write-Host "[2/8] Verificando npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   OK npm instalado: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: npm NO instalado" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Verificar MongoDB
Write-Host "[3/8] Verificando MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if ($null -ne $mongoProcess) {
    Write-Host "   OK MongoDB corriendo (PID: $($mongoProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "   ADVERTENCIA: MongoDB NO esta corriendo" -ForegroundColor Yellow
    Write-Host "      Iniciar con: Start-Service MongoDB" -ForegroundColor Gray
}
Write-Host ""

# Verificar estructura
Write-Host "[4/8] Verificando estructura del proyecto..." -ForegroundColor Yellow
$rootPath = Split-Path -Parent $PSScriptRoot
$folders = @("client", "server", "ui", "scripts")
foreach ($folder in $folders) {
    if (Test-Path (Join-Path $rootPath $folder)) {
        Write-Host "   OK /$folder encontrado" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: /$folder NO encontrado" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# Verificar dependencias
Write-Host "[5/8] Verificando dependencias..." -ForegroundColor Yellow
$components = @("server", "client", "ui")
foreach ($comp in $components) {
    $nmPath = Join-Path $rootPath "$comp\node_modules"
    if (Test-Path $nmPath) {
        Write-Host "   OK $comp dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "   ADVERTENCIA: $comp dependencias NO instaladas" -ForegroundColor Yellow
        Write-Host "      Ejecutar: cd $comp; npm install" -ForegroundColor Gray
        $allGood = $false
    }
}
Write-Host ""

# Verificar puertos
Write-Host "[6/8] Verificando puertos..." -ForegroundColor Yellow
$ports = @(5000, 3000, 5173)
$portNames = @("TCP Server", "API REST", "UI Vite")
for ($i = 0; $i -lt $ports.Count; $i++) {
    $conn = Get-NetTCPConnection -LocalPort $ports[$i] -State Listen -ErrorAction SilentlyContinue
    if ($null -eq $conn) {
        Write-Host "   OK Puerto $($ports[$i]) disponible ($($portNames[$i]))" -ForegroundColor Green
    } else {
        Write-Host "   ADVERTENCIA: Puerto $($ports[$i]) EN USO ($($portNames[$i]))" -ForegroundColor Yellow
    }
}
Write-Host ""

# Verificar Git
Write-Host "[7/8] Verificando Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    if ($gitVersion -like "*git version*") {
        Write-Host "   OK Git instalado: $gitVersion" -ForegroundColor Green
        $branch = git rev-parse --abbrev-ref HEAD 2>&1
        if ($branch -and $branch -notlike "*fatal*") {
            Write-Host "   Branch actual: $branch" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "   ADVERTENCIA: Git NO instalado" -ForegroundColor Yellow
}
Write-Host ""

# Informacion de red
Write-Host "[8/8] Informacion de Red..." -ForegroundColor Yellow
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*"
}
if ($ips) {
    foreach ($ip in $ips) {
        Write-Host "   IP Local: $($ip.IPAddress)" -ForegroundColor Cyan
        Write-Host "      (Usar esta IP para cliente remoto)" -ForegroundColor Gray
    }
}
Write-Host ""

# Resumen
Write-Host "===============================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "SISTEMA LISTO PARA PRUEBAS" -ForegroundColor Green
    Write-Host ""
    Write-Host "Comandos rapidos:" -ForegroundColor Cyan
    Write-Host "  .\scripts\start_all.ps1       - Iniciar todo" -ForegroundColor White
    Write-Host "  .\scripts\test_9_clients.ps1  - Test 9 clientes" -ForegroundColor White
    Write-Host "  .\scripts\stop_9_clients.ps1  - Detener clientes" -ForegroundColor White
    Write-Host "  .\scripts\stop_all.ps1        - Detener todo" -ForegroundColor White
    Write-Host ""
    Write-Host "URLs:" -ForegroundColor Cyan
    Write-Host "  Dashboard: http://localhost:5173" -ForegroundColor White
    Write-Host "  API:       http://localhost:3000" -ForegroundColor White
} else {
    Write-Host "HAY PROBLEMAS QUE RESOLVER" -ForegroundColor Yellow
    Write-Host "Revisa los errores marcados arriba" -ForegroundColor Yellow
}
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
