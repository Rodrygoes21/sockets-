# 🎫 Cómo Crear los Tickets en GitHub

Este directorio contiene 3 formas diferentes de crear los 22 tickets del proyecto en GitHub Issues.

## 📋 Archivos Disponibles

1. **`TICKETS_DISTRIBUCION.md`** - Documento con toda la información de los tickets
2. **`tickets_import.csv`** - Archivo CSV para importación manual
3. **`create_issues.ps1`** - Script PowerShell para creación automática con GitHub CLI

---

## 🚀 OPCIÓN 1: Script Automático con GitHub CLI (RECOMENDADO)

### Requisitos Previos
1. Instalar GitHub CLI:
   ```powershell
   winget install GitHub.cli
   ```
   O descargar desde: https://cli.github.com/

2. Autenticar con tu cuenta de GitHub:
   ```powershell
   gh auth login
   ```
   - Selecciona GitHub.com
   - Selecciona HTTPS
   - Autentica con tu navegador

### Ejecutar el Script
```powershell
cd c:\Users\HP\Downloads\univalle-2026\SISTEMAS-DISTRIBUIDOS\sockets
.\create_issues.ps1
```

### ¿Qué hace el script?
- ✅ Crea 14 **labels** (priority, component, sprint, type)
- ✅ Crea 4 **milestones** (Sprint 1-4 con fechas)
- ✅ Crea 22 **issues** con toda la información
- ✅ Asigna labels y milestones automáticamente

**Ventajas:**
- Rápido (2-3 minutos)
- No hay errores de copy-paste
- Estructura consistente

---

## 📊 OPCIÓN 2: Importar desde CSV

### Paso 1: Ir a GitHub Projects
1. Ve a tu repositorio: https://github.com/Rodrygoes21/sockets-
2. Haz clic en **"Projects"** (pestaña superior)
3. Crea un nuevo proyecto: **"Storage Cluster Development"**
4. Selecciona template: **"Board"**

### Paso 2: Importar CSV
1. En el proyecto, haz clic en "⋯" (tres puntos) → **"Import"**
2. Selecciona el archivo `tickets_import.csv`
3. Mapea las columnas:
   - Title → Title
   - Description → Body
   - Labels → Labels
   - Milestone → Milestone
   - Priority → Priority
   - Estimate → Custom field

### Paso 3: Crear Labels Manualmente
Ve a **Settings** → **Labels** y crea:

**Prioridades:**
- `priority: high` (rojo #d73a4a)
- `priority: medium` (amarillo #fbca04)
- `priority: low` (verde #0e8a16)

**Componentes:**
- `component: client` (azul #1d76db)
- `component: server` (morado #5319e7)
- `component: database` (cyan #006b75)
- `component: ui` (azul claro #c5def5)
- `component: docs` (rosa #e99695)

**Sprints:**
- `sprint-1` (azul claro #bfd4f2)
- `sprint-2` (morado claro #d4c5f9)
- `sprint-3` (verde claro #c2e0c6)
- `sprint-4` (amarillo claro #fef2c0)

---

## 📝 OPCIÓN 3: Crear Issues Manualmente

### Paso 1: Crear Labels y Milestones
Sigue el **Paso 3** de la Opción 2 para crear labels.

Para milestones, ve a **Issues** → **Milestones** → **New milestone**:
- Sprint 1 (Due: 2 semanas desde hoy)
- Sprint 2 (Due: 4 semanas desde hoy)
- Sprint 3 (Due: 7 semanas desde hoy)
- Sprint 4 (Due: 9 semanas desde hoy)

### Paso 2: Crear Issues Uno por Uno
1. Ve a **Issues** → **New issue**
2. Copia el contenido de cada ticket desde `TICKETS_DISTRIBUCION.md`
3. Asigna labels y milestone correspondientes
4. Asigna a cada integrante

**Ejemplo para TICKET #1:**
- **Title:** `TICKET #1: Setup Básico del Cliente`
- **Description:** Copiar sección completa del documento
- **Labels:** `component: client`, `priority: high`, `sprint-1`
- **Milestone:** `Sprint 1`
- **Assignee:** Integrante 1

**⚠️ Nota:** Este método toma más tiempo (~30-40 minutos) pero te da control total.

---

## 👥 Asignar Tickets a los Integrantes

### Distribución Recomendada:

**Integrante 1 (Backend Cliente) - 28 horas:**
- TICKET #1: Setup Básico del Cliente
- TICKET #2: Recolección y Envío de Métricas
- TICKET #3: Recepción de Mensajes del Servidor
- TICKET #4: Pruebas y Robustez del Cliente

**Integrante 2 (Backend Servidor) - 48 horas:**
- TICKET #5: Setup Básico del Servidor
- TICKET #6: Procesamiento de Métricas
- TICKET #7: Monitoreo de Disponibilidad
- TICKET #8: Sistema de Mensajería Bidireccional
- TICKET #9: API REST para UI
- TICKET #10: Pruebas del Servidor

**Integrante 3 (Database + UI Core) - 38 horas:**
- TICKET #11: Diseño e Implementación de Base de Datos
- TICKET #12: Mantenimiento de Base de Datos
- TICKET #13: Pruebas de Base de Datos
- TICKET #14: Dashboard Principal de la UI
- TICKET #15: Vistas Adicionales de la UI

**Integrante 4 (UI Avanzada + Docs) - 56 horas:**
- TICKET #16: Sistema de Mensajería en UI
- TICKET #17: Vista de Availability y Alertas
- TICKET #18: Pruebas de UI y Usabilidad
- TICKET #19: Documentación Técnica Parte 1
- TICKET #20: Documentación Técnica Parte 2
- TICKET #21: Documentación Final y Presentación
- TICKET #22: Pruebas End-to-End e Integración

### Para Asignar en GitHub:
1. Cada integrante debe tener una cuenta de GitHub
2. Agrégalos como **Collaborators** en el repositorio:
   - Settings → Collaborators → Add people
3. En cada issue, usa el campo **"Assignees"** para asignar al responsable

---

## 📅 Planificación de Sprints

### Sprint 1 (Semanas 1-2): Fundamentos
**Tickets:** #1, #2, #5, #11  
**Objetivo:** Infraestructura base funcionando

### Sprint 2 (Semanas 3-4): Funciones Core
**Tickets:** #3, #6, #7, #8, #12, #14  
**Objetivo:** Comunicación y procesamiento completo

### Sprint 3 (Semanas 5-7): UI y Features Avanzadas
**Tickets:** #4, #9, #10, #13, #15, #16, #17, #18, #19, #20, #22  
**Objetivo:** Interfaz completa y robustez

### Sprint 4 (Semanas 8-9): Testing Final y Documentación
**Tickets:** #21  
**Objetivo:** Preparación de la defensa

---

## 🔄 Flujo de Trabajo Recomendado

1. **Al iniciar un ticket:**
   - Cambiar estado a "In Progress" en el Project Board
   - Crear una rama: `git checkout -b feature/ticket-X`

2. **Durante el desarrollo:**
   - Commits descriptivos: `git commit -m "TICKET-1: Implementa conexión TCP"`
   - Push frecuente: `git push origin feature/ticket-X`

3. **Al completar:**
   - Crear Pull Request (PR)
   - Referenciar el issue: `Closes #1` en la descripción del PR
   - Solicitar code review de otro integrante
   - Merge a `main` después de aprobación

4. **Cerrar ticket:**
   - El issue se cierra automáticamente al hacer merge del PR
   - Verificar que el estado cambió a "Done"

---

## 📊 Seguimiento del Progreso

### Usar GitHub Projects Board
Crear columnas:
- **Todo** (22 tickets al inicio)
- **In Progress** (máximo 4 simultáneos, uno por persona)
- **In Review** (PRs pendientes de revisión)
- **Done** (tickets completados)

### Reuniones de Seguimiento
**Daily Stand-up (5 min):**
- ¿Qué hice ayer?
- ¿Qué haré hoy?
- ¿Hay bloqueadores?

**Sprint Review (cada 2 semanas):**
- Demo de funcionalidades completadas
- Actualizar roadmap si es necesario

---

## ❓ FAQ

**P: ¿Puedo cambiar la estimación de horas?**  
R: Sí, edita el issue y actualiza la descripción. Las estimaciones son aproximadas.

**P: ¿Cómo manejo dependencias entre tickets?**  
R: En la sección "Dependencias" de cada ticket está clara. No puedes empezar un ticket hasta que sus dependencias estén completadas.

**P: ¿Qué pasa si un ticket toma más tiempo del estimado?**  
R: Es normal. Actualiza el issue con un comentario explicando el retraso y la nueva estimación.

**P: ¿Puedo dividir un ticket en sub-tareas?**  
R: Sí, GitHub permite crear "task lists" dentro de un issue. Usa checkboxes:
```markdown
- [ ] Sub-tarea 1
- [ ] Sub-tarea 2
```

---

## 🎯 Próximos Pasos

1. ✅ **Ahora:** Elegir método de importación (recomendado: Script PowerShell)
2. ✅ **Siguiente:** Crear GitHub Projects board
3. ✅ **Después:** Agregar colaboradores
4. ✅ **Finalmente:** Iniciar Sprint 1 con tickets #1, #2, #5, #11

---

## 🆘 Soporte

Si tienes problemas con la creación de tickets:
1. Verifica que estés autenticado en GitHub CLI: `gh auth status`
2. Verifica permisos del repositorio (debes ser admin/owner)
3. Revisa el output de errores del script

Para más información sobre GitHub Issues: https://docs.github.com/en/issues

---

**¡Éxito con el proyecto! 🚀**
