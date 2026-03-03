# STORAGE CLUSTER CON NODO CENTRAL DE MONITOREO

## Práctica 1 - Implementación de Sockets TCP/IP

**Universidad del Valle**  
**Sistemas Distribuidos - 2026**  
**Fecha:** Marzo 2, 2026

---

## � IMPORTANTE: CAMBIO DE STACK TECNOLÓGICO

> **⚠️ AVISO:** Este proyecto ha sido rediseñado con stack JavaScript moderno.
> 
> **Stack Actual:**
> - **Backend:** Node.js (clientes y servidor)
> - **Frontend:** React 18 + Vite
> - **Base de Datos:** MongoDB 6.0+
> - **Protocolo:** TCP/IP (módulo `net`)
>
> 📖 **Lee primero:** [CAMBIO_DE_STACK.md](CAMBIO_DE_STACK.md) para entender las diferencias y mapeo de tecnologías.

---

## 📋 DESCRIPCIÓN DEL PROYECTO

Sistema distribuido de monitoreo de almacenamiento que implementa:

- **9 Nodos Clientes** (Servidores Regionales) que reportan métricas de disco
- **1 Nodo Servidor Central** que centraliza, procesa y agrega información
- **Comunicación bidireccional** mediante Sockets TCP/IP
- **Persistencia** en base de datos MongoDB
- **Interfaz gráfica React** para visualización en tiempo real
- **Monitoreo de disponibilidad** con SLA ≥ 99.9%

---

## 📚 DOCUMENTACIÓN TÉCNICA COMPLETA

### 🚀 Inicio Rápido

1. **[CAMBIO_DE_STACK.md](CAMBIO_DE_STACK.md)** 🔥 **LEE ESTO PRIMERO**
   - Explicación del cambio de stack tecnológico
   - Mapeo de tecnologías Python → Node.js
   - Guía de migración y recursos de aprendizaje

### 📖 Documentos Principales

2. **[PLAN_IMPLEMENTACION.md](PLAN_IMPLEMENTACION.md)** ⭐ **PLAN GENERAL**
   - Lista completa de tareas divididas por componente
   - Descripción técnica de cada tarea
   - Criterios de aceptación y dependencias
   - Plan de implementación por fases (9 semanas)
   - Riesgos técnicos y mitigación
   - 30 preguntas de defensa técnica con respuestas

2. **[ARQUITECTURA_TECNICA.md](ARQUITECTURA_TECNICA.md)**
   - Diagrama de arquitectura general del sistema
   - Modelo de comunicación TCP/IP detallado
   - Estructura JSON de todos los mensajes
   - Estrategia de concurrencia multi-thread
   - Algoritmo de detección de nodos inactivos
   - Cálculo de métricas globales y availability
   - Decisiones de diseño justificadas

3. **[DATABASE_DESIGN.md](DATABASE_DESIGN.md)**
   - Esquema completo de base de datos (5 tablas)
   - Diagrama Entidad-Relación (ER)
   - Diccionario de datos detallado
   - Índices y constraints
   - Scripts SQL completos
   - Triggers y vistas útiles
   - Políticas de retención y limpieza
   - Scripts de backup y recuperación

4. **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)**
   - Estructura de carpetas completa del proyecto
   - Descripción de cada directorio
   - Archivos de configuración
   - Convenciones de nombres
   - Flujo de desarrollo recomendado
   - Comandos de gestión
   - Checklist de entrega

---

## 🎯 REQUERIMIENTOS PRINCIPALES

### Funcionales
- ✅ 9 clientes enviando métricas de disco periódicamente
- ✅ Servidor central registra clientes automáticamente
- ✅ Detección de nodos inactivos (estado "No Reporta")
- ✅ Comunicación bidireccional (servidor → cliente → ACK)
- ✅ Cliente guarda mensajes en archivo .log
- ✅ Cálculo de métricas globales agregadas
- ✅ Cálculo de Growth Rate y Availability
- ✅ Interfaz gráfica con dashboard en tiempo real

### No Funcionales
- ✅ Protocolo: TCP/IP con sockets (módulo net de Node.js)
- ✅ Formato de mensajes: JSON
- ✅ Concurrencia: Event Loop de Node.js para 9 clientes simultáneos
- ✅ Base de datos: MongoDB (almacenamiento de métricas y eventos)
- ✅ Frontend: React Dashboard con actualización en tiempo real
- ✅ Operación: LAN (Red de Área Local)
- ✅ Availability: ≥ 99.9%
- ✅ Solo primer disco detectado por cliente

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│           NODO CENTRAL DE MONITOREO                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Socket Server (Puerto 5000)                      │  │
│  │  - Connection Manager (9 clientes max)           │  │
│  │  - Metrics Processor                              │  │
│  │  - Inactivity Monitor                             │  │
│  │  - Message Sender/ACK Handler                     │  │
│  └─────────────┬─────────────────────────────────────┘  │
│                │                                         │
│  ┌─────────────▼──────────┐   ┌─────────────────────┐  │
│  │      DATABASE          │   │    REST API         │  │
│  │  - clients             │   │  Endpoints para UI  │  │
│  │  - metrics             │   └──────────┬──────────┘  │
│  │  - global_metrics      │              │             │
│  │  - sent_messages       │   ┌──────────▼──────────┐  │
│  │  - availability_events │   │ INTERFAZ GRÁFICA    │  │
│  └────────────────────────┘   │  - Dashboard        │  │
│                                │  - Client Details   │  │
│                                │  - Global Metrics   │  │
└────────────────────────────────│  - Messaging        │──┘
                                 │  - Availability     │
                          Sockets TCP/IP (Bidireccional)
                                 └─────────────────────┘
          ┌──────────────────────────┴─────────────────┐
          │                                             │
┌─────────▼─────────┐                    ┌─────────────▼──────┐
│  CLIENTE 001      │       ...          │  CLIENTE 009       │
│  - Socket Client  │                    │  - Socket Client   │
│  - Disk Monitor   │                    │  - Disk Monitor    │
│  - Message Logger │                    │  - Message Logger  │
│  📀 Primer Disco  │                    │  📀 Primer Disco   │
└───────────────────┘                    └────────────────────┘
```

---

## 📊 MÉTRICAS REQUERIDAS

### Métricas por Cliente
- **Total Capacity** (bytes): Capacidad total del primer disco
- **Used Capacity** (bytes): Espacio usado
- **Free Capacity** (bytes): Espacio libre
- **% Utilization**: Porcentaje de uso (0-100%)
- **Growth Rate** (MB/hora): Tasa de crecimiento del espacio usado

### Métricas Globales
- **Capacidad Total Global**: Σ total_capacity de clientes UP
- **Espacio Libre Total**: Σ free_capacity de clientes UP
- **% Utilización Global**: (used_global / total_global) × 100
- **Growth Rate Global**: Σ growth_rates de clientes UP
- **Clientes UP/DOWN**: Contadores de estado

### Métricas de Disponibilidad
- **Availability %**: (uptime / (uptime + downtime)) × 100
- **Uptime**: Tiempo en estado UP
- **Downtime**: Tiempo en estado DOWN
- **SLA Compliance**: Availability ≥ 99.9%

---

## 🔄 PROTOCOLO DE COMUNICACIÓN

### Mensajes Cliente → Servidor

**1. Registro Inicial**
```json
{
  "message_type": "CLIENT_REGISTER",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-02T14:30:00.000Z"
}
```

**2. Reporte de Métricas (cada 30 segundos)**
```json
{
  "message_type": "METRICS_REPORT",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-02T14:30:30.000Z",
  "metrics": {
    "total_capacity": 1099511627776,
    "used_capacity": 659706977280,
    "free_capacity": 439804650496,
    "utilization_percent": 60.00
  }
}
```

**3. Confirmación (ACK)**
```json
{
  "message_type": "ACK",
  "client_id": "CLIENT_001",
  "message_id": "MSG_1709390100_a3f2e1c4",
  "timestamp": "2026-03-02T14:35:00.500Z",
  "status": "RECEIVED"
}
```

### Mensajes Servidor → Cliente

**1. Notificación**
```json
{
  "message_type": "SERVER_NOTIFICATION",
  "message_id": "MSG_1709390100_a3f2e1c4",
  "timestamp": "2026-03-02T14:35:00.000Z",
  "content": "Sistema funcionando correctamente"
}
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS (MongoDB)

### Colecciones Principales

1. **clients**: Información de los 9 nodos clientes
   - Campos: client_id, ip_address, status, last_seen_at, uptime, downtime

2. **metrics**: Métricas históricas de disco por cliente
   - Campos: client_id, capacities, utilization_percent, growth_rate, recorded_at

3. **globalMetrics**: Métricas agregadas del cluster
   - Campos: total/used/free capacities global, clients_up/down, calculated_at

4. **sentMessages**: Mensajes enviados con estado de ACK
   - Campos: message_id, client_id, content, status, sent_at, ack_received_at

5. **availabilityEvents**: Historial de cambios de estado UP/DOWN
   - Campos: client_id, event_type, event_timestamp, duration_seconds

**Ver [DATABASE_DESIGN.md](DATABASE_DESIGN.md) para esquemas MongoDB completos**

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Fundamentos (Semana 1-2)
- Socket cliente y servidor básico
- Registro de clientes
- Envío/recepción de métricas
- Base de datos inicializada

### Fase 2: Lógica Core (Semana 3)
- Envío periódico automático
- Detección de nodos inactivos
- Cálculo de métricas globales
- Growth rate y availability

### Fase 3: Mensajería (Semana 4)
- Servidor → Cliente messaging
- Cliente guarda en .log
- Envío y recepción de ACK
- Timeouts

### Fase 4-5: Interfaz Gráfica (Semana 5-6)
- Dashboard con estado de clientes
- Vista detallada por cliente
- Métricas globales visualizadas
- Vista de mensajería
- Gráficos de availability

### Fase 6: Robustez (Semana 7)
- Configuración parametrizable
- Logging completo
- Shutdown graceful
- Backups automáticos

### Fase 7: Pruebas (Semana 8)
- Pruebas unitarias
- Pruebas de integración
- Pruebas de carga (9 clientes)
- Verificación de availability ≥ 99.9%

### Fase 8: Documentación (Semana 9)
- Documentación completa
- Manuales
- Presentación de defensa

**Ver [PLAN_IMPLEMENTACION.md](PLAN_IMPLEMENTACION.md) para detalle completo de tareas**

---

## 💻 STACK TECNOLÓGICO

### Backend (Node.js)
- **Runtime**: Node.js v18+ (LTS)
- **Sockets TCP**: Módulo `net` nativo de Node.js
- **Base de Datos**: MongoDB con driver oficial `mongodb`
- **Métricas del Sistema**: `systeminformation` para info de discos
- **Validación**: `joi` para validación de mensajes JSON
- **Concurrencia**: Event Loop de Node.js (async/await)

### Frontend (React)
- **Framework**: React v18+ con Vite
- **Gestión de Estado**: Context API / Redux Toolkit
- **Gráficos**: Chart.js con react-chartjs-2
- **Estilos**: Tailwind CSS o Material-UI
- **HTTP Client**: Axios para conexión con API REST
- **WebSockets**: Socket.io-client para actualizaciones en tiempo real

### Base de Datos (MongoDB)
- **Versión**: MongoDB 6.0+
- **Driver**: mongodb para Node.js
- **Colecciones**: clients, metrics, globalMetrics, sentMessages, availabilityEvents
- **Indexación**: Índices en client_id, timestamps
- **Agregaciones**: Pipeline de agregación para métricas globales

---

## 📦 ESTRUCTURA DEL PROYECTO

```
storage-cluster/
├── client/              # Nodo cliente (Node.js)
│   ├── src/
│   ├── config/
│   ├── logs/
│   └── package.json
├── server/              # Servidor central (Node.js)
│   ├── src/
│   ├── config/
│   ├── logs/
│   └── package.json
├── ui/                  # Dashboard React
│   ├── src/
│   ├── public/
│   └── package.json
├── database/            # Scripts MongoDB e inicialización
├── docs/                # Documentación técnica
├── tests/               # Pruebas end-to-end
└── scripts/             # Utilidades
```

**Ver [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) para estructura completa**

---

## ⚠️ RIESGOS TÉCNICOS PRINCIPALES

1. **Concurrencia**: Race conditions con 9 clientes
   - Mitigación: Locks, estructuras thread-safe, pruebas intensivas

2. **Desconexiones de red**: Pérdida temporal de conectividad
   - Mitigación: Reconexión automática, timeouts apropiados

3. **Crecimiento de BD**: Datos históricos sin límite
   - Mitigación: Política de retención (30 días), limpieza automática

4. **Detección de inactivos**: Balance entre falsos positivos y rapidez
   - Mitigación: Timeout = 3 × report_interval + buffer

5. **Performance UI**: Actualizaciones frecuentes degradan experiencia
   - Mitigación: Actualizaciones incrementales, polling 5s

**Ver [PLAN_IMPLEMENTACION.md](PLAN_IMPLEMENTACION.md) sección 7 para todos los riesgos**

---

## 🎓 PREGUNTAS DE DEFENSA TÉCNICA

### Ejemplos:

**P: ¿Por qué eligieron sockets TCP en lugar de UDP?**
- TCP garantiza entrega ordenada y confiable, esencial para métricas y ACKs

**P: ¿Cómo manejan la concurrencia con 9 clientes simultáneos?**
- Thread pool, estructuras thread-safe con locks, transactions en BD

**P: ¿Cómo calculan la disponibilidad (availability)?**
- `availability = (uptime / (uptime + downtime)) × 100`
- Registramos eventos UP/DOWN con timestamps para cálculo preciso

**P: ¿Qué pasa si un cliente se cae después de recibir mensaje pero antes de enviar ACK?**
- Timeout de 30 segundos marca mensaje como TIMEOUT
- Cliente no recibe mensaje duplicado al reconectar

**Ver 30 preguntas completas con respuestas en [PLAN_IMPLEMENTACION.md](PLAN_IMPLEMENTACION.md) sección 8**

---

## ✅ CHECKLIST DE CUMPLIMIENTO DE REQUERIMIENTOS

### Comunicación
- [x] Sockets TCP/IP bidireccionales
- [x] Formato JSON para mensajes
- [x] 9 clientes concurrentes soportados
- [x] Registro automático de clientes

### Métricas
- [x] Total Capacity, Used, Free
- [x] % Utilization
- [x] Growth Rate
- [x] Métricas globales agregadas
- [x] Solo primer disco reportado

### Monitoreo
- [x] Detección de nodos inactivos
- [x] Estado "No Reporta" implementado
- [x] Availability ≥ 99.9% calculada
- [x] Uptime/Downtime tracking

### Mensajería
- [x] Servidor envía mensajes a clientes
- [x] Cliente guarda en archivo .log
- [x] Cliente envía ACK
- [x] Servidor registra ACKs recibidos

### Persistencia
- [x] Base de datos con todas las tablas
- [x] Métricas históricas almacenadas
- [x] Eventos de availability registrados
- [x] Mensajes y ACKs persistidos

### Interfaz Gráfica
- [x] Dashboard con estado de clientes
- [x] Vista individual por cliente
- [x] Métricas globales visualizadas
- [x] Vista de mensajería
- [x] Actualización en tiempo real

---

## 📧 CONTACTO Y SOPORTE

**Proyecto Académico - Universidad del Valle**  
Sistemas Distribuidos 2026

Para preguntas sobre la implementación, consultar:
- Documentación técnica en `/docs`
- Sección de troubleshooting en documentos
- Código de ejemplo en `/tests`

---

## 📄 LICENCIA

Proyecto académico desarrollado para fines educativos.

---

## 🏆 CRITERIOS DE ÉXITO

✅ **Sistema funcional** con 9 clientes reportando métricas  
✅ **Comunicación bidireccional** con ACKs funcionando  
✅ **Métricas globales** calculadas correctamente  
✅ **Availability ≥ 99.9%** verificada en operación real  
✅ **Interfaz gráfica** clara e intuitiva  
✅ **Documentación completa** y profesional  
✅ **Defensa técnica exitosa** demostrando comprensión profunda  

---

**¡ÉXITO EN LA IMPLEMENTACIÓN!** 🚀

*Última actualización: Marzo 2, 2026*
