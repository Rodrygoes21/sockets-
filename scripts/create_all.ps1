# Script para crear Labels, Milestones e Issues
$REPO = "Rodrygoes21/sockets-"
$GH_EXE = "C:\Program Files\GitHub CLI\gh.exe"
# Verifica que GH_TOKEN esté configurado

Write-Host "`n════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " CREACIÓN DE ISSUES - Storage Cluster Project" -ForegroundColor Cyan
Write-Host " Stack: Node.js + React + MongoDB" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════`n" -ForegroundColor Cyan

# PASO 1: Crear Labels
Write-Host "PASO 1: Creando Labels..." -ForegroundColor Magenta

$labels = @(
    @("priority: high", "d73a4a", "Alta prioridad"),
    @("priority: medium", "fbca04", "Prioridad media"),
    @("priority: low", "0e8a16", "Baja prioridad"),
    @("component: client", "1d76db", "Cliente Node.js"),
    @("component: server", "5319e7", "Servidor Node.js"),
    @("component: database", "006b75", "MongoDB"),
    @("component: ui", "c5def5", "UI React"),
    @("component: docs", "e99695", "Documentación"),
    @("component: testing", "f9d0c4", "Testing"),
    @("sprint-1", "bfd4f2", "Sprint 1"),
    @("sprint-2", "d4c5f9", "Sprint 2"),
    @("sprint-3", "c2e0c6", "Sprint 3"),
    @("sprint-4", "fef2c0", "Sprint 4"),
    @("type: testing", "bfdadc", "Testing QA")
)

foreach ($label in $labels) {
    Write-Host "  📌 $($label[0])" -NoNewline
    $result = & $GH_EXE label create $label[0] --color $label[1] --description $label[2] --repo $REPO 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        if ($result -match "already exists") {
            Write-Host " ⚠️" -ForegroundColor Yellow
        } else {
            Write-Host " ❌" -ForegroundColor Red
        }
    }
}

# PASO 2: Crear Milestones
Write-Host "`nPASO 2: Creando Milestones..." -ForegroundColor Magenta

$startDate = Get-Date
$milestones = @(
    @("Sprint 1", $startDate.AddDays(14).ToString("yyyy-MM-dd"), "Setup"),
    @("Sprint 2", $startDate.AddDays(28).ToString("yyyy-MM-dd"), "Core"),
    @("Sprint 3", $startDate.AddDays(49).ToString("yyyy-MM-dd"), "UI"),
    @("Sprint 4", $startDate.AddDays(63).ToString("yyyy-MM-dd"), "Testing")
)

foreach ($ms in $milestones) {
    Write-Host "  🎯 $($ms[0])" -NoNewline
    $result = & $GH_EXE api repos/$REPO/milestones -f title="$($ms[0])" -f due_on="$($ms[1])T23:59:59Z" -f description="$($ms[2])" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌" -ForegroundColor Red
    }
}

# PASO 3: Crear Issues desde CSV
Write-Host "`nPASO 3: Creando Issues desde CSV..." -ForegroundColor Magenta

$tickets = Import-Csv -Path ".\tickets_import.csv"
$count = 0

foreach ($ticket in $tickets) {
    Write-Host "  📝 $($ticket.Title)" -NoNewline
    
    # Crear issue sin milestone por ahora (evitar problemas)
    $result = & $GH_EXE issue create `
        --repo $REPO `
        --title $ticket.Title `
        --body $ticket.Description `
        --label $ticket.Labels `
        2>&1
        
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
        $count++
    } else {
        Write-Host " ❌" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 300
}

Write-Host "`n════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host " ✅ Issues creados: $count / $($tickets.Count)" -ForegroundColor Green
Write-Host "`n 🌐 Ver en: https://github.com/$REPO/issues" -ForegroundColor Yellow
Write-Host "════════════════════════════════════════════════`n" -ForegroundColor Cyan
