# Script para BORRAR todos los issues actuales de GitHub
# ADVERTENCIA: Esto eliminará permanentemente los 22 issues existentes

$REPO = "Rodrygoes21/sockets-"
$GH_EXE = "C:\Program Files\GitHub CLI\gh.exe"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Red
Write-Host "  BORRAR TODOS LOS ISSUES" -ForegroundColor Red
Write-Host "=====================================" -ForegroundColor Red
Write-Host ""
Write-Host "ADVERTENCIA: Esto borrará TODOS los issues del repositorio" -ForegroundColor Yellow
Write-Host "Repositorio: $REPO" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "¿Estás seguro? Escribe 'SI' para continuar"

if ($confirmation -ne "SI") {
    Write-Host "Operación cancelada" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Obteniendo lista de issues..." -ForegroundColor Yellow

# Obtener todos los issues abiertos
$issues = & $GH_EXE issue list --repo $REPO --limit 100 --json number --state open | ConvertFrom-Json

$totalIssues = $issues.Count
Write-Host "Encontrados: $totalIssues issues" -ForegroundColor Cyan
Write-Host ""

if ($totalIssues -eq 0) {
    Write-Host "No hay issues para borrar" -ForegroundColor Green
    exit 0
}

Write-Host "Borrando issues..." -ForegroundColor Yellow
$deleted = 0
$errors = 0

foreach ($issue in $issues) {
    $number = $issue.number
    Write-Host "  [#$number] Borrando..." -NoNewline
    
    # gh issue delete requiere confirmación, usar --yes
    $result = & $GH_EXE issue delete $number --repo $REPO --yes 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
        $deleted++
    } else {
        Write-Host " [ERROR]" -ForegroundColor Red
        $errors++
    }
    
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Borrados: $deleted issues" -ForegroundColor Green
Write-Host "Errores: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
