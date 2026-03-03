# Script para actualizar Story Points en issues existentes
$REPO = "Rodrygoes21/sockets-"
$GH_EXE = "C:\Program Files\GitHub CLI\gh.exe"
# Asegúrate de haber hecho gh auth login antes de ejecutar este script

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Actualizando Issues con Story Points" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Leer tickets actualizados
$tickets = Import-Csv "tickets_import.csv"

# Obtener todos los issues existentes
Write-Host "Obteniendo issues existentes..." -ForegroundColor Yellow
$issues = & $GH_EXE issue list --repo $REPO --limit 50 --json number,title,body --state open | ConvertFrom-Json

$updated = 0
$errors = 0

# Actualizar TODOS los issues en orden
for ($i = 1; $i -le 22; $i++) {
    $ticket = $tickets | Where-Object { $_.Title -like "TICKET #$i*" }
    
    if ($ticket) {
        Write-Host "  [#$i] Actualizando: $($ticket.Title.Substring(0, [Math]::Min(45, $ticket.Title.Length)))..." -NoNewline
        
        # Actualizar el body del issue
        $result = & $GH_EXE issue edit $i --repo $REPO --body $ticket.Description 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host " [OK]" -ForegroundColor Green
            $updated++
        } else {
            Write-Host " [ERROR]" -ForegroundColor Red
            $errors++
        }
        
        Start-Sleep -Milliseconds 200
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Actualizados: $updated issues" -ForegroundColor Green
Write-Host "Errores: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host ""
Write-Host "Ver en: https://github.com/$REPO/issues" -ForegroundColor Blue
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
