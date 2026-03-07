# 📚 ÍNDICE DE DOCUMENTACIÓN

## Guía de Navegación

Bienvenido a la documentación del proyecto **Storage Cluster con Nodo Central de Monitoreo**.

---

## 🚀 Por Dónde Empezar

### Para Nuevos Miembros del Equipo
1. Lee el [README.md](../README.md) en la raíz del proyecto
2. Revisa [architecture/CAMBIO_DE_STACK.md](architecture/CAMBIO_DE_STACK.md) para entender el stack tecnológico
3. Consulta [planning/PLAN_IMPLEMENTACION.md](planning/PLAN_IMPLEMENTACION.md) para ver el plan completo

### Para Implementadores
1. [architecture/ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md) - Entender la arquitectura
2. [architecture/DATABASE_DESIGN.md](architecture/DATABASE_DESIGN.md) - Diseño de base de datos
3. [planning/PROJECT_STRUCTURE.md](planning/PROJECT_STRUCTURE.md) - Estructura del código

---

## 📂 Documentos por Categoría

### 🏗️ Arquitectura y Diseño

| Documento | Descripción | Prioridad |
|-----------|-------------|-----------|
| [ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md) | Arquitectura completa del sistema, protocolos TCP/IP, estrategias de concurrencia | ⭐⭐⭐ |
| [DATABASE_DESIGN.md](architecture/DATABASE_DESIGN.md) | Esquema de MongoDB, colecciones, índices, queries | ⭐⭐⭐ |
| [CAMBIO_DE_STACK.md](architecture/CAMBIO_DE_STACK.md) | Stack tecnológico, mapeo de tecnologías, guía de migración | ⭐⭐⭐ |

### 📋 Planificación

| Documento | Descripción | Prioridad |
|-----------|-------------|-----------|
| [PLAN_IMPLEMENTACION.md](planning/PLAN_IMPLEMENTACION.md) | Plan completo: tareas, fases, criterios de aceptación, preguntas de defensa | ⭐⭐⭐ |
| [PROJECT_STRUCTURE.md](planning/PROJECT_STRUCTURE.md) | Estructura de carpetas, convenciones, flujo de desarrollo | ⭐⭐ |
| [TICKETS_DISTRIBUCION.md](planning/TICKETS_DISTRIBUCION.md) | Distribución de tareas entre miembros del equipo | ⭐⭐ |

### 🔧 GitHub y Automatización

| Documento | Descripción | Prioridad |
|-----------|-------------|-----------|
| [COMO_CREAR_TICKETS.md](github/COMO_CREAR_TICKETS.md) | Guía para crear issues, configurar proyectos y milestones | ⭐ |

### 📜 Scripts ([../scripts/](../scripts/))

| Script | Descripción |
|--------|-------------|
| `setup_github.ps1` | Configuración inicial de GitHub |
| `create_all.ps1` | Crear todos los issues de una vez |
| `create_issues.ps1` | Script principal para creación de issues |
| `delete_all_issues.ps1` | Eliminar todos los issues (usar con precaución) |

---

## 🎯 Búsqueda Rápida por Tema

### Comunicación TCP/IP
- [architecture/ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md) - Secciones 2 y 3
  - Modelo de comunicación TCP/IP
  - Estructura de mensajes JSON
  - Protocolo de handshake y ACK

### Base de Datos MongoDB
- [architecture/DATABASE_DESIGN.md](architecture/DATABASE_DESIGN.md)
  - Esquema completo de colecciones
  - Índices y optimización
  - Queries y agregaciones

### Concurrencia
- [architecture/ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md) - Sección 3
  - Event Loop de Node.js
  - Gestión de múltiples clientes
  - Thread safety y sincronización

### Detección de Nodos Inactivos
- [architecture/ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md) - Sección 4
  - Algoritmo de detección
  - Estados del cliente (UP/DOWN)
  - Timeouts configurables

### Métricas Globales
- [architecture/ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md) - Sección 5
  - Agregación de capacidades
  - Growth Rate
  - Availability (≥99.9%)

### Interfaz Gráfica (React)
- [architecture/ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md) - Sección 6
  - Stack tecnológico (React + Vite)
  - API REST endpoints
  - WebSockets en tiempo real

### Stack Tecnológico
- [architecture/CAMBIO_DE_STACK.md](architecture/CAMBIO_DE_STACK.md)
  - Node.js vs Python
  - React + Vite
  - MongoDB
  - Recursos de aprendizaje

### Plan de Implementación
- [planning/PLAN_IMPLEMENTACION.md](planning/PLAN_IMPLEMENTACION.md)
  - 9 semanas de desarrollo
  - Tareas por componente
  - Criterios de aceptación
  - 30 preguntas de defensa

---

## 📖 Cómo Usar Esta Documentación

### Durante el Desarrollo
1. **Antes de codificar**: Lee la arquitectura y diseño relacionado
2. **Durante la implementación**: Consulta los criterios de aceptación
3. **Al terminar una tarea**: Verifica el checklist de entrega

### Para la Defensa
1. Estudia el [PLAN_IMPLEMENTACION.md](planning/PLAN_IMPLEMENTACION.md) - Contiene 30 preguntas con respuestas
2. Revisa los diagramas en [ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md)
3. Entiende las decisiones de diseño justificadas

### Para Debugging
1. Revisa los logs en `../client/logs/`
2. Consulta los índices en [DATABASE_DESIGN.md](architecture/DATABASE_DESIGN.md)
3. Verifica los endpoints en [ARQUITECTURA_TECNICA.md](architecture/ARQUITECTURA_TECNICA.md) - Sección 6.2

---

## 📝 Glosario Rápido

| Término | Descripción |
|---------|-------------|
| **Nodo Cliente** | Servidor regional que reporta métricas de disco |
| **Nodo Servidor** | Servidor central que recibe y procesa métricas |
| **Metrics Report** | Mensaje JSON con capacidades del disco (cada 30s) |
| **ACK** | Confirmación de recepción de mensaje |
| **UP/DOWN** | Estados de disponibilidad del cliente |
| **Growth Rate** | Tasa de crecimiento en MB/hora |
| **Availability** | % de tiempo UP (debe ser ≥99.9%) |
| **Global Metrics** | Suma de métricas de todos los clientes UP |

---

## 🔄 Última Actualización

**Fecha:** Marzo 3, 2026  
**Versión:** 1.1  
**Cambios:**
- Reorganización de documentación en subcarpetas
- Creación de este índice
- Movimiento de scripts a carpeta dedicada

---

**Universidad del Valle**  
**Sistemas Distribuidos - 2026**
