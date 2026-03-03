# Script para crear Labels, Milestones e Issues
$REPO = "Rodrygoes21/sockets-"
$GH_EXE = "C:\Program Files\GitHub CLI\gh.exe"
# Asegúrate de haber hecho gh auth login antes de ejecutar

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Storage Cluster Project - Setup GitHub" -ForegroundColor Cyan
Write-Host "Stack: Node.js + MongoDB + React" -ForegroundColor Cyan
Write-Host "3 personas | 1 semana | 10 tickets" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# PASO 1: Crear Labels
Write-Host "PASO 1: Creando Labels..." -ForegroundColor Magenta

$labels = @(
    @{name="priority: high"; color="d73a4a"; desc="Alta prioridad"},
    @{name="priority: medium"; color="fbca04"; desc="Prioridad media"},
    @{name="priority: low"; color="0e8a16"; desc="Baja prioridad"},
    @{name="component: client"; color="1d76db"; desc="Cliente Node.js"},
    @{name="component: server"; color="5319e7"; desc="Servidor Node.js"},
    @{name="component: ui"; color="c5def5"; desc="UI React"},
    @{name="component: database"; color="006b75"; desc="MongoDB"},
    @{name="sprint-1"; color="bfd4f2"; desc="Sprint 1"},
    @{name="sprint-2"; color="d4c5f9"; desc="Sprint 2"}
)

foreach ($label in $labels) {
    Write-Host "  - $($label.name)" -NoNewline
    $null = & $GH_EXE label create $label.name --color $label.color --description $label.desc --repo $REPO 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
    } else {
        Write-Host " [EXISTS]" -ForegroundColor Yellow
    }
}

# PASO 2: Crear Milestones
Write-Host ""
Write-Host "PASO 2: Creando Milestones..." -ForegroundColor Magenta

$start = Get-Date
$milestones = @(
    @{name="Sprint 1"; due=$start.AddDays(4).ToString("yyyy-MM-dd"); desc="Setup y funcionalidad básica"},
    @{name="Sprint 2"; due=$start.AddDays(7).ToString("yyyy-MM-dd"); desc="Completar features y testing"}
)

foreach ($ms in $milestones) {
    Write-Host "  - $($ms.name)" -NoNewline
    $null = & $GH_EXE api repos/$REPO/milestones -f "title=$($ms.name)" -f "due_on=$($ms.due)T23:59:59Z" -f "description=$($ms.desc)" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
    } else {
        Write-Host " [ERROR]" -ForegroundColor Red
    }
}

# PASO 3: Crear Issues desde CSV
Write-Host ""
Write-Host "PASO 3: Creando 10 Issues..." -ForegroundColor Magenta

$tickets = Import-Csv -Path ".\tickets_import.csv"
$count = 0

foreach ($ticket in $tickets) {
    $num = $count + 1
    Write-Host "  - [$num/10] $($ticket.Title.Substring(0, [Math]::Min(40, $ticket.Title.Length)))..." -NoNewline
    
    $null = & $GH_EXE issue create --repo $REPO --title $ticket.Title --body $ticket.Description --label $ticket.Labels 2>&1
        
    if ($LASTEXITCODE -eq 0) {
        Write-Host " [OK]" -ForegroundColor Green
        $count++
    } else {
        Write-Host " [ERROR]" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Creados: $count / $($tickets.Count) issues" -ForegroundColor Green
Write-Host ""
Write-Host "Ver en: https://github.com/$REPO/issues" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
