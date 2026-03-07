# Script simple para crear issues desde CSV
$REPO = "Rodrygoes21/sockets-"
$GH_EXE = "C:\Program Files\GitHub CLI\gh.exe"
# Verifica que GH_TOKEN esté configurado

Write-Host "Creando issues desde CSV..." -ForegroundColor Cyan

# Leer CSV
$tickets = Import-Csv -Path ".\tickets_import.csv"

$count = 0
foreach ($ticket in $tickets) {
    Write-Host "`nCreando: $($ticket.Title)" -ForegroundColor Yellow
    
    try {
        $result = & $GH_EXE issue create `
            --repo $REPO `
            --title $ticket.Title `
            --body $ticket.Description `
            --label $ticket.Labels `
            2>&1
            
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅ Creado exitosamente" -ForegroundColor Green
            $count++
        } else {
            Write-Host " ❌ Error: $result" -ForegroundColor Red
        }
    }
    catch {
        Write-Host " ❌ Error: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Total creados: $count / $($tickets.Count)" -ForegroundColor Green
Write-Host "`nVer issues: https://github.com/$REPO/issues" -ForegroundColor Yellow
