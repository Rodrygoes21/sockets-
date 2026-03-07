# Script para crear Issues en GitHub usando GitHub CLI (gh)
# REQUISITO: gh CLI instalado y autenticado
# Instalar: winget install GitHub.cli
# Autenticar: gh auth login

# Configuración del repositorio
$REPO = "Rodrygoes21/sockets-"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   CREACIÓN AUTOMÁTICA DE ISSUES PARA PROYECTO" -ForegroundColor Cyan
Write-Host "   Repository: $REPO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar instalación de gh CLI
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ERROR: GitHub CLI (gh) no está instalado" -ForegroundColor Red
    Write-Host "   Instalar con: winget install GitHub.cli" -ForegroundColor Yellow
    Write-Host "   O descargar desde: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Verificar autenticación
Write-Host "🔐 Verificando autenticación..." -ForegroundColor Yellow
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás autenticado en GitHub CLI" -ForegroundColor Red
    Write-Host "   Ejecutar: gh auth login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Autenticación correcta" -ForegroundColor Green
Write-Host ""

# PASO 1: Crear Labels
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "PASO 1: Creando Labels" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

$labels = @(
    @{ name = "priority: high"; color = "d73a4a"; description = "Alta prioridad - Tareas críticas" }
    @{ name = "priority: medium"; color = "fbca04"; description = "Prioridad media - Tareas importantes" }
    @{ name = "priority: low"; color = "0e8a16"; description = "Baja prioridad - Puede esperar" }
    @{ name = "component: client"; color = "1d76db"; description = "Componente Cliente" }
    @{ name = "component: server"; color = "5319e7"; description = "Componente Servidor" }
    @{ name = "component: database"; color = "006b75"; description = "Componente Base de Datos" }
    @{ name = "component: ui"; color = "c5def5"; description = "Componente Interfaz de Usuario" }
    @{ name = "component: docs"; color = "e99695"; description = "Documentación" }
    @{ name = "component: testing"; color = "f9d0c4"; description = "Pruebas y Testing" }
    @{ name = "sprint-1"; color = "bfd4f2"; description = "Sprint 1 (Semanas 1-2)" }
    @{ name = "sprint-2"; color = "d4c5f9"; description = "Sprint 2 (Semanas 3-4)" }
    @{ name = "sprint-3"; color = "c2e0c6"; description = "Sprint 3 (Semanas 5-7)" }
    @{ name = "sprint-4"; color = "fef2c0"; description = "Sprint 4 (Semanas 8-9)" }
    @{ name = "type: testing"; color = "bfdadc"; description = "Tareas de pruebas y QA" }
)

foreach ($label in $labels) {
    Write-Host "  📌 Creando label: $($label.name)" -NoNewline
    $result = gh label create $label.name --color $label.color --description $label.description --repo $REPO 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        if ($result -match "already exists") {
            Write-Host " ⚠️  (ya existe)" -ForegroundColor Yellow
        } else {
            Write-Host " ❌ Error: $result" -ForegroundColor Red
        }
    }
}
Write-Host ""

# PASO 2: Crear Milestones
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "PASO 2: Creando Milestones" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

# Calcular fechas (ajusta según tu cronograma real)
$startDate = Get-Date
$sprint1End = $startDate.AddDays(14).ToString("yyyy-MM-dd")
$sprint2End = $startDate.AddDays(28).ToString("yyyy-MM-dd")
$sprint3End = $startDate.AddDays(49).ToString("yyyy-MM-dd")
$sprint4End = $startDate.AddDays(63).ToString("yyyy-MM-dd")

$milestones = @(
    @{ title = "Sprint 1"; due = $sprint1End; description = "Semanas 1-2: Fundamentos y Setup" }
    @{ title = "Sprint 2"; due = $sprint2End; description = "Semanas 3-4: Funciones Core" }
    @{ title = "Sprint 3"; due = $sprint3End; description = "Semanas 5-7: UI y Features" }
    @{ title = "Sprint 4"; due = $sprint4End; description = "Semanas 8-9: Testing y Documentación" }
)

foreach ($milestone in $milestones) {
    Write-Host "  🎯 Creando milestone: $($milestone.title) (Due: $($milestone.due))" -NoNewline
    $result = gh api repos/$REPO/milestones -f title="$($milestone.title)" -f due_on="$($milestone.due)T23:59:59Z" -f description="$($milestone.description)" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
    } else {
        Write-Host " ❌ Error" -ForegroundColor Red
    }
}
Write-Host ""

# PASO 3: Crear Issues
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "PASO 3: Creando Issues" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

# Array de issues con toda la información
$issues = @(
    @{ 
        title = "TICKET #1: Setup Básico del Cliente"
        body = @"
**Sprint:** 1  
**Componente:** Cliente  
**Estimación:** 8 horas  
**Asignado:** Integrante 1  

## Tareas
- [ ] TC-001: Socket Cliente TCP/IP
- [ ] TC-008: Archivo de Configuración
- [ ] TC-009: Sistema de Logging

## Criterios de Aceptación
- [ ] Cliente conecta al servidor en puerto configurado
- [ ] Reconexión automática funciona tras desconexión
- [ ] Config JSON completo (host, port, disco, intervalo)
- [ ] Logs con rotación automática

## Archivos Entregables
- ``client/src/network/socket_client.py``
- ``client/src/config/config_manager.py``
- ``client/src/utils/logger.py``

## Dependencias
Ninguna (tarea inicial)
"@
        labels = "component: client,priority: high,sprint-1"
        milestone = "Sprint 1"
        assignee = "Integrante1"
    },
    @{
        title = "TICKET #2: Recolección y Envío de Métricas"
        body = @"
**Sprint:** 1  
**Componente:** Cliente  
**Estimación:** 6 horas  
**Asignado:** Integrante 1  

## Tareas
- [ ] TC-002: Métricas de Disco (psutil)
- [ ] TC-003: Serialización JSON
- [ ] TC-004: Envío Periódico (cada 30s)

## Criterios de Aceptación
- [ ] Detecta primer disco correctamente (C:\ en Windows, / en Linux)
- [ ] Métricas correctas: total, usado, libre, porcentaje
- [ ] Envío cada 30 segundos sin fallos

## Archivos Entregables
- ``client/src/metrics/disk_monitor.py``
- ``client/src/protocol/message_builder.py``

## Dependencias
- Requiere TICKET #1 completado
"@
        labels = "component: client,priority: high,sprint-1"
        milestone = "Sprint 1"
        assignee = "Integrante1"
    },
    @{
        title = "TICKET #3: Recepción de Mensajes del Servidor"
        body = @"
**Sprint:** 2  
**Componente:** Cliente  
**Estimación:** 8 horas  
**Asignado:** Integrante 1  

## Tareas
- [ ] TC-005: Recepción de Mensajes
- [ ] TC-006: Almacenamiento en .log
- [ ] TC-007: Envío de ACK

## Criterios de Aceptación
- [ ] Thread independiente recibe mensajes del servidor
- [ ] Guarda mensajes en archivo .log con timestamp
- [ ] Envía ACK al servidor en <2s

## Archivos Entregables
- ``client/src/messaging/message_receiver.py``
- ``client/logs/received_messages.log``

## Dependencias
- Requiere TICKET #1 y #2 completados
"@
        labels = "component: client,priority: medium,sprint-2"
        milestone = "Sprint 2"
        assignee = "Integrante1"
    },
    @{
        title = "TICKET #4: Pruebas y Robustez del Cliente"
        body = @"
**Sprint:** 3  
**Componente:** Cliente  
**Estimación:** 6 horas  
**Asignado:** Integrante 1  

## Tareas
- [ ] TC-010: Shutdown Graceful
- [ ] TC-011: Pruebas de Integración

## Criterios de Aceptación
- [ ] Cierre limpio de conexiones
- [ ] Cobertura de pruebas ≥80%
- [ ] Todos los tests pasan

## Archivos Entregables
- ``client/tests/test_integration.py``
- ``client/tests/test_socket.py``

## Dependencias
- Requiere TICKET #1, #2, #3 completados
"@
        labels = "component: client,priority: low,sprint-3,type: testing"
        milestone = "Sprint 3"
        assignee = "Integrante1"
    },
    @{
        title = "TICKET #5: Setup Básico del Servidor"
        body = @"
**Sprint:** 1  
**Componente:** Servidor  
**Estimación:** 10 horas  
**Asignado:** Integrante 2  

## Tareas
- [ ] TS-001: Socket Servidor TCP
- [ ] TS-002: Gestor de Conexiones
- [ ] TS-003: Registro Automático en BD
- [ ] TS-011: Configuración del Servidor
- [ ] TS-013: Sistema de Logging

## Criterios de Aceptación
- [ ] Acepta hasta 9 conexiones concurrentes
- [ ] Registro automático de clientes en base de datos
- [ ] Logs por nivel (DEBUG, INFO, ERROR)

## Archivos Entregables
- ``server/src/network/socket_server.py``
- ``server/src/business_logic/connection_manager.py``
- ``server/config/server_config.json``

## Dependencias
- Requiere TICKET #11 (Base de datos)
"@
        labels = "component: server,priority: high,sprint-1"
        milestone = "Sprint 1"
        assignee = "Integrante2"
    },
    @{
        title = "TICKET #6: Procesamiento de Métricas"
        body = @"
**Sprint:** 2  
**Componente:** Servidor  
**Estimación:** 8 horas  
**Asignado:** Integrante 2  

## Tareas
- [ ] TS-004: Procesamiento de Métricas
- [ ] TS-006: Agregación de Métricas Globales
- [ ] TS-007: Cálculo de Growth Rate

## Criterios de Aceptación
- [ ] Procesa y almacena métricas de cada cliente
- [ ] Calcula métricas globales (suma total, usado, libre)
- [ ] Growth rate en MB/hora

## Archivos Entregables
- ``server/src/business_logic/metrics_processor.py``
- ``server/src/business_logic/metrics_aggregator.py``

## Dependencias
- Requiere TICKET #5 completado
"@
        labels = "component: server,priority: high,sprint-2"
        milestone = "Sprint 2"
        assignee = "Integrante2"
    },
    @{
        title = "TICKET #7: Monitoreo de Disponibilidad"
        body = @"
**Sprint:** 2  
**Componente:** Servidor  
**Estimación:** 8 horas  
**Asignado:** Integrante 2  

## Tareas
- [ ] TS-005: Detector de Clientes Inactivos
- [ ] TS-010: Cálculo de Availability

## Criterios de Aceptación
- [ ] Detecta clientes inactivos cada 15 segundos
- [ ] Calcula availability por cliente
- [ ] Alerta si availability <99.9%

## Archivos Entregables
- ``server/src/business_logic/inactivity_monitor.py``
- ``server/src/business_logic/availability_calculator.py``

## Dependencias
- Requiere TICKET #5 completado
"@
        labels = "component: server,priority: high,sprint-2"
        milestone = "Sprint 2"
        assignee = "Integrante2"
    },
    @{
        title = "TICKET #8: Sistema de Mensajería Bidireccional"
        body = @"
**Sprint:** 2  
**Componente:** Servidor  
**Estimación:** 8 horas  
**Asignado:** Integrante 2  

## Tareas
- [ ] TS-008: Envío de Mensajes a Clientes
- [ ] TS-009: Recepción y Procesamiento de ACKs

## Criterios de Aceptación
- [ ] Envía mensajes personalizados a clientes específicos
- [ ] Procesa ACKs de confirmación
- [ ] Timeout de 30 segundos para ACK

## Archivos Entregables
- ``server/src/messaging/message_sender.py``
- ``server/src/messaging/ack_handler.py``

## Dependencias
- Requiere TICKET #5 completado
"@
        labels = "component: server,priority: medium,sprint-2"
        milestone = "Sprint 2"
        assignee = "Integrante2"
    },
    @{
        title = "TICKET #9: API REST para UI"
        body = @"
**Sprint:** 3  
**Componente:** Servidor  
**Estimación:** 6 horas  
**Asignado:** Integrante 2  

## Tareas
- [ ] TS-012: Implementar API REST (Flask)

## Criterios de Aceptación
- [ ] Todos los endpoints funcionan correctamente
- [ ] CORS configurado para UI
- [ ] Respuestas en <200ms

## Archivos Entregables
- ``server/src/api/rest_api.py``
- ``server/src/api/endpoints.py``

## Dependencias
- Requiere TICKET #6 y #7 completados
"@
        labels = "component: server,priority: medium,sprint-3"
        milestone = "Sprint 3"
        assignee = "Integrante2"
    },
    @{
        title = "TICKET #10: Pruebas del Servidor"
        body = @"
**Sprint:** 3  
**Componente:** Servidor  
**Estimación:** 8 horas  
**Asignado:** Integrante 2  

## Tareas
- [ ] TS-014: Pruebas de Carga y Concurrencia

## Criterios de Aceptación
- [ ] Soporta 9 clientes concurrentes sin degradación
- [ ] Latency promedio <100ms por operación
- [ ] Sin memory leaks tras 1 hora de ejecución

## Archivos Entregables
- ``server/tests/test_load.py``
- ``server/tests/test_concurrency.py``

## Dependencias
- Requiere todos los tickets de servidor completados
"@
        labels = "component: server,priority: low,sprint-3,type: testing"
        milestone = "Sprint 3"
        assignee = "Integrante2"
    },
    @{
        title = "TICKET #11: Diseño e Implementación de Base de Datos"
        body = @"
**Sprint:** 1  
**Componente:** Base de Datos  
**Estimación:** 10 horas  
**Asignado:** Integrante 3  

## Tareas
- [ ] TD-001: Crear Esquema de Base de Datos
- [ ] TD-002: Implementar DAOs
- [ ] TD-003: Script de Inicialización

## Criterios de Aceptación
- [ ] 5 tablas creadas según especificación
- [ ] DAOs completos para todas las tablas
- [ ] Script init funcional

## Archivos Entregables
- ``database/schema.sql``
- ``database/init_database.sql``
- ``server/src/database/dao/``

## Dependencias
Ninguna (tarea inicial)
"@
        labels = "component: database,priority: high,sprint-1"
        milestone = "Sprint 1"
        assignee = "Integrante3"
    },
    @{
        title = "TICKET #12: Mantenimiento de Base de Datos"
        body = @"
**Sprint:** 2  
**Componente:** Base de Datos  
**Estimación:** 6 horas  
**Asignado:** Integrante 3  

## Tareas
- [ ] TD-004: Sistema de Migraciones
- [ ] TD-005: Scripts de Backup
- [ ] TD-006: Limpieza de Datos Antiguos

## Criterios de Aceptación
- [ ] Migraciones versionadas
- [ ] Backups automáticos funcionales
- [ ] Limpieza de registros >30 días

## Archivos Entregables
- ``database/migrations/``
- ``database/scripts/backup.py``
- ``database/scripts/cleanup.py``

## Dependencias
- Requiere TICKET #11 completado
"@
        labels = "component: database,priority: medium,sprint-2"
        milestone = "Sprint 2"
        assignee = "Integrante3"
    },
    @{
        title = "TICKET #13: Pruebas de Base de Datos"
        body = @"
**Sprint:** 3  
**Componente:** Base de Datos  
**Estimación:** 4 horas  
**Asignado:** Integrante 3  

## Tareas
- [ ] TD-007: Pruebas de Integridad y Performance

## Criterios de Aceptación
- [ ] Tests de integridad referencial
- [ ] Tests de performance de consultas
- [ ] EXPLAIN verifica uso de índices

## Archivos Entregables
- ``database/tests/test_dao.py``
- ``database/tests/test_performance.py``

## Dependencias
- Requiere TICKET #11 y #12 completados
"@
        labels = "component: database,priority: low,sprint-3,type: testing"
        milestone = "Sprint 3"
        assignee = "Integrante3"
    },
    @{
        title = "TICKET #14: Dashboard Principal de la UI"
        body = @"
**Sprint:** 2  
**Componente:** UI  
**Estimación:** 8 horas  
**Asignado:** Integrante 3  

## Tareas
- [ ] TI-001: Diseñar Wireframes
- [ ] TI-002: Implementar Dashboard

## Criterios de Aceptación
- [ ] Mockups diseñados y aprobados
- [ ] Tabla con 9 clientes y métricas
- [ ] Actualización automática cada 5s

## Archivos Entregables
- ``ui/web/index.html``
- ``ui/web/css/styles.css``
- ``ui/web/js/dashboard.js``

## Dependencias
- Requiere TICKET #9 (API REST)
"@
        labels = "component: ui,priority: high,sprint-2"
        milestone = "Sprint 2"
        assignee = "Integrante3"
    },
    @{
        title = "TICKET #15: Vistas Adicionales de la UI"
        body = @"
**Sprint:** 3  
**Componente:** UI  
**Estimación:** 10 horas  
**Asignado:** Integrante 3  

## Tareas
- [ ] TI-003: Vista Individual de Cliente
- [ ] TI-004: Vista de Métricas Globales

## Criterios de Aceptación
- [ ] Gráficos históricos con Chart.js
- [ ] Vista detallada por cliente
- [ ] Cards con métricas globales

## Archivos Entregables
- ``ui/web/client-detail.html``
- ``ui/web/global-metrics.html``
- ``ui/web/js/charts.js``

## Dependencias
- Requiere TICKET #14 completado
"@
        labels = "component: ui,priority: medium,sprint-3"
        milestone = "Sprint 3"
        assignee = "Integrante3"
    },
    @{
        title = "TICKET #16: Sistema de Mensajería en UI"
        body = @"
**Sprint:** 3  
**Componente:** UI  
**Estimación:** 8 horas  
**Asignado:** Integrante 4  

## Tareas
- [ ] TI-005: Vista de Mensajería
- [ ] TI-007: Actualización en Tiempo Real

## Criterios de Aceptación
- [ ] Formulario de envío de mensajes
- [ ] Historial de mensajes y ACKs
- [ ] Actualización automática

## Archivos Entregables
- ``ui/web/messaging.html``
- ``ui/web/js/messaging.js``

## Dependencias
- Requiere TICKET #8 y #9 completados
"@
        labels = "component: ui,priority: medium,sprint-3"
        milestone = "Sprint 3"
        assignee = "Integrante4"
    },
    @{
        title = "TICKET #17: Vista de Availability y Alertas"
        body = @"
**Sprint:** 3  
**Componente:** UI  
**Estimación:** 8 horas  
**Asignado:** Integrante 4  

## Tareas
- [ ] TI-006: Vista de Availability
- [ ] TI-009: Sistema de Alertas

## Criterios de Aceptación
- [ ] Timeline visual de disponibilidad
- [ ] Tabla de availability por cliente
- [ ] Notificaciones toast para alertas

## Archivos Entregables
- ``ui/web/availability.html``
- ``ui/web/js/availability.js``
- ``ui/web/js/alerts.js``

## Dependencias
- Requiere TICKET #7 y #9 completados
"@
        labels = "component: ui,priority: medium,sprint-3"
        milestone = "Sprint 3"
        assignee = "Integrante4"
    },
    @{
        title = "TICKET #18: Pruebas de UI y Usabilidad"
        body = @"
**Sprint:** 3  
**Componente:** UI  
**Estimación:** 6 horas  
**Asignado:** Integrante 4  

## Tareas
- [ ] TI-008: Configuración de UI
- [ ] TI-010: Pruebas de UI

## Criterios de Aceptación
- [ ] Funciona en 3 navegadores (Chrome, Firefox, Edge)
- [ ] Responsive design verificado
- [ ] Tiempo de carga <3s

## Archivos Entregables
- ``ui/tests/test_ui.py``
- ``ui/tests/screenshots/``

## Dependencias
- Requiere TICKET #14, #15, #16, #17 completados
"@
        labels = "component: ui,priority: low,sprint-3,type: testing"
        milestone = "Sprint 3"
        assignee = "Integrante4"
    },
    @{
        title = "TICKET #19: Documentación Técnica Parte 1"
        body = @"
**Sprint:** 3  
**Componente:** Documentación  
**Estimación:** 8 horas  
**Asignado:** Integrante 4  

## Tareas
- [ ] DOC-001: Documentación de Arquitectura
- [ ] DOC-002: Guía de Instalación
- [ ] DOC-003: Manual de Usuario

## Criterios de Aceptación
- [ ] Diagramas incluidos
- [ ] Manual de instalación probado
- [ ] Screenshots de la UI

## Archivos Entregables
- ``docs/ARQUITECTURA.md``
- ``docs/INSTALACION.md``
- ``docs/MANUAL_USUARIO.md``

## Dependencias
- Requiere implementación completa
"@
        labels = "component: docs,priority: medium,sprint-3"
        milestone = "Sprint 3"
        assignee = "Integrante4"
    },
    @{
        title = "TICKET #20: Documentación Técnica Parte 2"
        body = @"
**Sprint:** 3  
**Componente:** Documentación  
**Estimación:** 8 horas  
**Asignado:** Integrante 4  

## Tareas
- [ ] DOC-004: Documentación de API
- [ ] DOC-005: Especificación del Protocolo
- [ ] DOC-006: Documentación de Base de Datos
- [ ] DOC-007: Troubleshooting Guide

## Criterios de Aceptación
- [ ] Documentación API completa
- [ ] Protocolos TCP especificados
- [ ] 10+ problemas comunes documentados

## Archivos Entregables
- ``docs/API.md``
- ``docs/PROTOCOLO.md``
- ``docs/DATABASE.md``
- ``docs/TROUBLESHOOTING.md``

## Dependencias
- Requiere implementación completa
"@
        labels = "component: docs,priority: medium,sprint-3"
        milestone = "Sprint 3"
        assignee = "Integrante4"
    },
    @{
        title = "TICKET #21: Documentación Final y Presentación"
        body = @"
**Sprint:** 4  
**Componente:** Documentación  
**Estimación:** 10 horas  
**Asignado:** Integrante 4  

## Tareas
- [ ] DOC-008: Docstrings en Código
- [ ] DOC-009: Reporte de Pruebas
- [ ] DOC-010: Presentación de Defensa

## Criterios de Aceptación
- [ ] Todo el código documentado
- [ ] Reporte de pruebas completo
- [ ] Presentación de 15-20 slides
- [ ] Demo funcional ensayado

## Archivos Entregables
- ``docs/REPORTE_PRUEBAS.md``
- ``docs/presentation/slides.pdf``
- ``docs/presentation/demo_script.md``

## Dependencias
- Requiere todos los tickets completados
"@
        labels = "component: docs,priority: high,sprint-4"
        milestone = "Sprint 4"
        assignee = "Integrante4"
    },
    @{
        title = "TICKET #22: Pruebas End-to-End e Integración"
        body = @"
**Sprint:** 3  
**Componente:** Testing  
**Estimación:** 8 horas  
**Asignado:** Integrante 4  

## Tareas
- [ ] Implementar pruebas E2E completas
- [ ] Verificar flujo completo del sistema
- [ ] Validar todas las funcionalidades

## Criterios de Aceptación
- [ ] Tests con 9 clientes conectados
- [ ] Flujo completo: conexión → métricas → mensajería
- [ ] Availability ≥99.9% verificada

## Archivos Entregables
- ``tests/integration/test_e2e.py``
- ``tests/integration/test_full_flow.py``

## Dependencias
- Requiere todos los componentes implementados
"@
        labels = "component: testing,priority: high,sprint-3,type: testing"
        milestone = "Sprint 3"
        assignee = "Integrante4"
    }
)

$createdCount = 0
$failedCount = 0

foreach ($issue in $issues) {
    Write-Host "  📝 Creando: $($issue.title)" -NoNewline
    
    # Crear issue (sin asignación por ahora, necesitarás usernames reales)
    $result = gh issue create `
        --repo $REPO `
        --title $issue.title `
        --body $issue.body `
        --label $issue.labels `
        --milestone $issue.milestone `
        2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅" -ForegroundColor Green
        $createdCount++
    } else {
        Write-Host " ❌ Error: $result" -ForegroundColor Red
        $failedCount++
    }
    
    Start-Sleep -Milliseconds 500  # Evitar rate limiting
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   RESUMEN" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Issues creados exitosamente: $createdCount" -ForegroundColor Green
Write-Host "❌ Issues fallidos: $failedCount" -ForegroundColor Red
Write-Host ""
Write-Host "🌐 Ver issues en: https://github.com/$REPO/issues" -ForegroundColor Yellow
Write-Host ""
