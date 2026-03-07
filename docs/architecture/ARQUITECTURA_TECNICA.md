# ARQUITECTURA TÉCNICA - STORAGE CLUSTER

## DISEÑO BASADO ESTRICTAMENTE EN REQUERIMIENTOS DEL PDF

---

## 1. ARQUITECTURA GENERAL DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    NODO CENTRAL DE MONITOREO                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    SERVIDOR TCP/IP                         │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │ Connection   │  │   Metrics    │  │  Inactivity  │   │ │
│  │  │  Manager     │  │  Processor   │  │   Monitor    │   │ │
│  │  │ (9 clientes) │  │              │  │              │   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │ │
│  │         │                  │                  │           │ │
│  │         └──────────────────┴──────────────────┘           │ │
│  │                            │                               │ │
│  └────────────────────────────┼───────────────────────────────┘ │
│                               │                                 │
│         ┌─────────────────────┴──────────────────┐             │
│         │                                         │             │
│  ┌──────▼──────┐                          ┌──────▼──────┐      │
│  │  DATABASE   │                          │  REST API   │      │
│  │   MongoDB   │                          │  (Express)  │      │
│  │             │                          └──────┬──────┘      │
│  │ ┌─────────┐ │                                 │             │
│  │ │clients  │ │                          ┌──────▼──────┐      │
│  │ │metrics  │ │                          │ INTERFAZ    │      │
│  │ │messages │ │                          │   REACT     │      │
│  │ │events   │ │                          │             │      │
│  │ └─────────┘ │                          │  Dashboard  │      │
│  └─────────────┘                          └─────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                           ▲
          Sockets TCP/IP (Bidireccional)
                           │
          ┌────────────────┴────────────────┐
          │                                 │
 ┌────────▼────────┐              ┌────────▼────────┐
 │  CLIENTE 001    │   ...        │  CLIENTE 009    │
 │  (Servidor      │              │  (Servidor      │
 │   Regional)     │              │   Regional)     │
 │                 │              │                 │
 │ ┌─────────────┐ │              │ ┌─────────────┐ │
 │ │Socket Client│ │              │ │Socket Client│ │
 │ │             │ │              │ │             │ │
 │ │Disk Metrics │ │              │ │Disk Metrics │ │
 │ │Collector    │ │              │ │Collector    │ │
 │ │             │ │              │ │             │ │
 │ │Message Log  │ │              │ │Message Log  │ │
 │ │(.log files) │ │              │ │(.log files) │ │
 │ └─────────────┘ │              │ └─────────────┘ │
 │                 │              │                 │
 │ 📀 Primer Disco │              │ 📀 Primer Disco │
 └─────────────────┘              └─────────────────┘
```

---

## 2. MODELO DE COMUNICACIÓN TCP/IP

### 2.1 Protocolo de Conexión Inicial

**Cliente → Servidor: HANDSHAKE**
```json
{
  "message_type": "CLIENT_REGISTER",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-02T14:30:00.000Z",
  "client_info": {
    "hostname": "SERVER-REGIONAL-01",
    "os": "Windows 10",
    "ip_address": "192.168.1.10"
  }
}
```

**Servidor → Cliente: CONFIRMATION**
```json
{
  "message_type": "REGISTER_ACK",
  "status": "SUCCESS",
  "timestamp": "2026-03-02T14:30:00.123Z",
  "server_message": "Cliente registrado exitosamente",
  "assigned_id": "CLIENT_001"
}
```

---

### 2.2 Envío Periódico de Métricas

**Cliente → Servidor: METRICS_REPORT (cada 30 segundos)**
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
  },
  "disk_info": {
    "disk_label": "C:\\",
    "filesystem": "NTFS"
  }
}
```

**Estructura de Campos:**
- `total_capacity`: Bytes (BIGINT) - Capacidad total del primer disco
- `used_capacity`: Bytes (BIGINT) - Espacio usado
- `free_capacity`: Bytes (BIGINT) - Espacio libre
- `utilization_percent`: DECIMAL(5,2) - Porcentaje de uso (0.00 - 100.00)

---

### 2.3 Mensajería Bidireccional: Servidor → Cliente

**Servidor → Cliente: SERVER_NOTIFICATION**
```json
{
  "message_type": "SERVER_NOTIFICATION",
  "message_id": "MSG_1709390100_a3f2e1c4",
  "timestamp": "2026-03-02T14:35:00.000Z",
  "priority": "NORMAL",
  "content": "Sistema funcionando correctamente. Capacidad global al 65%."
}
```

**Tipos de Mensajes:**
- `SERVER_NOTIFICATION`: Información general
- `ALERT`: Alertas críticas (ej: "Capacidad > 90%")
- `COMMAND`: Comandos especiales (extensión futura)
- `SHUTDOWN`: Solicitud de desconexión ordenada

---

### 2.4 Confirmación ACK del Cliente

**Cliente → Servidor: ACK (después de guardar en .log)**
```json
{
  "message_type": "ACK",
  "client_id": "CLIENT_001",
  "message_id": "MSG_1709390100_a3f2e1c4",
  "timestamp": "2026-03-02T14:35:00.500Z",
  "status": "RECEIVED",
  "saved_to_log": true
}
```

**Flujo Completo del ACK:**
```
1. Servidor envía mensaje → Cliente
2. Cliente recibe mensaje
3. Cliente guarda en archivo .log
4. Cliente envía ACK al servidor
5. Servidor marca mensaje como ACKNOWLEDGED en BD
6. Servidor calcula response_time_ms
```

**Timeout:** Si ACK no llega en 30 segundos → estado TIMEOUT

---

### 2.5 Desconexión Ordenada

**Cliente → Servidor: DISCONNECT**
```json
{
  "message_type": "CLIENT_DISCONNECT",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-02T15:00:00.000Z",
  "reason": "SHUTDOWN"
}
```

---

## 3. ESTRATEGIA DE CONCURRENCIA

### 3.1 Arquitectura Multi-Thread del Servidor

```
SERVIDOR PRINCIPAL (Main Thread)
│
├─ THREAD: Accept Loop
│  │  - Escucha conexiones entrantes
│  │  - Valida límite de 9 clientes
│  │  - Crea ClientHandler por cada conexión
│  │
│  └─ THREAD POOL: Client Handlers (9 threads)
│     │
│     ├─ ClientHandler #1 (CLIENT_001)
│     │  ├─ Receive Loop: Escucha métricas y ACKs
│     │  └─ Send Queue: Envía mensajes al cliente
│     │
│     ├─ ClientHandler #2 (CLIENT_002)
│     ⋮
│     └─ ClientHandler #9 (CLIENT_009)
│
├─ THREAD: Inactivity Monitor
│  │  - Ejecuta cada 15 segundos
│  │  - Verifica last_seen de cada cliente
│  │  - Marca como DOWN si excede timeout
│  │
│  └─ Actions:
│     - Update client status in DB
│     - Log event in availability_events
│     - Trigger UI notification
│
├─ THREAD: Metrics Aggregator
│  │  - Se activa al recibir nuevas métricas
│  │  - Calcula métricas globales
│  │  - Calcula growth rate
│  │
│  └─ Actions:
│     - SUM(capacities) de clientes UP
│     - Calculate global utilization %
│     - Store in global_metrics table
│
└─ THREAD: Database Cleanup (diario)
   - Ejecuta a las 3:00 AM
   - Elimina métricas > 30 días
   - Optimiza índices
   - Backup automático
```

---

### 3.2 Sincronización y Thread Safety

**Estructuras Compartidas Críticas:**

```javascript
// ConnectionManager.js - Gestión de clientes conectados
class ConnectionManager {
  constructor() {
    this._clients = new Map();  // Map de clientes activos
    this._maxClients = 9;
  }
  
  addClient(clientId, socket, address) {
    if (this._clients.size >= this._maxClients) {
      throw new Error('MaxClientsReached');
    }
    this._clients.set(clientId, {
      socket,
      address,
      lastSeen: new Date(),
      status: 'UP'
    });
  }
  
  updateLastSeen(clientId) {
    const client = this._clients.get(clientId);
    if (client) {
      client.lastSeen = new Date();
    }
  }
  
  getInactiveClients(timeoutSeconds) {
    const now = new Date();
    const inactive = [];
    
    for (const [clientId, info] of this._clients.entries()) {
      const elapsed = (now - info.lastSeen) / 1000;
      if (elapsed > timeoutSeconds) {
        inactive.push(clientId);
      }
    }
    return inactive;
  }
  
  getClient(clientId) {
    return this._clients.get(clientId);
  }
}

module.exports = ConnectionManager;
```

**Patrones de Concurrencia en Node.js:**
1. **Event Loop**: Manejo asíncrono nativo (sin threads explícitos)
2. **async/await**: Para operaciones I/O (base de datos, sockets)
3. **EventEmitter**: Para comunicación entre módulos
4. **Promises**: Para operaciones asíncronas
5. **MongoDB transactions**: Aislamiento para operaciones críticas

---

### 3.3 Arquitectura del Cliente

```
CLIENTE (Main Thread)
│
├─ THREAD: Metrics Sender
│  │  - Timer/Scheduler cada 30 segundos
│  │  - Recolecta métricas de disco
│  │  - Serializa a JSON
│  │  - Envía por socket
│  │
│  └─ Actions:
│     - get_disk_metrics()
│     - serialize_metrics()
│     - socket.send()
│     - Log resultado
│
├─ THREAD: Message Receiver
│  │  - Loop infinito leyendo del socket
│  │  - Deserializa JSON recibido
│  │  - Coloca mensaje en cola
│  │
│  └─ Actions:
│     - socket.recv()
│     - parse JSON
│     - message_queue.put()
│
└─ THREAD: Message Processor
   │  - Consume mensajes de la cola
   │  - Guarda en archivo .log
   │  - Envía ACK al servidor
   │
   └─ Actions:
      - message_queue.get()
      - write_to_log()
      - send_ack()
```

---

## 4. DETECCIÓN DE NODOS INACTIVOS

### 4.1 Algoritmo de Detección

```javascript
// InactivityMonitor.js - Monitoreo de clientes inactivos
class InactivityMonitor {
  constructor(connectionManager, dbManager, config) {
    this.connMgr = connectionManager;
    this.db = dbManager;
    this.timeout = config.inactivityTimeoutSeconds;
    this.checkInterval = 15000; // 15 segundos en milisegundos
    this.intervalId = null;
  }
  
  startMonitoring() {
    this.intervalId = setInterval(() => {
      this.checkInactiveClients();
    }, this.checkInterval);
  }
  
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  async checkInactiveClients() {
    const inactive = this.connMgr.getInactiveClients(this.timeout);
    
    for (const clientId of inactive) {
      const currentStatus = await this.db.getClientStatus(clientId);
      
      if (currentStatus === 'UP') {
        // Cliente pasó de UP a DOWN
        await this.db.updateClientStatus(clientId, 'DOWN');
        await this.db.logAvailabilityEvent({
          client_id: clientId,
          event_type: 'DOWN',
          timestamp: new Date()
        });
        
        console.warn(`Cliente ${clientId} marcado como DOWN (no reporta)`);
        this.triggerUIAlert(clientId, "Cliente no reporta");
      }
    }
  }
  
  triggerUIAlert(clientId, message) {
    // Emitir evento para WebSocket/Socket.io hacia UI
    this.socketIo.emit('alert', { clientId, message, type: 'warning' });
  }
}

module.exports = InactivityMonitor;
```

**Parámetros Configurables:**
- `inactivityTimeoutSeconds`: Tiempo sin reporte antes de marcar como DOWN
  - **Recomendado**: `reportInterval * 3 + 15` segundos
  - Ejemplo: Si reportInterval = 30s → timeout = 3*30 + 15 = 105 segundos
- `checkInterval`: Frecuencia de verificación (15000 ms = 15 segundos)

---

### 4.2 Estados del Cliente

```
┌──────────────────────────────────────────────────┐
│                 ESTADOS DEL CLIENTE              │
└──────────────────────────────────────────────────┘

    INITIAL
       │
       │ Conexión exitosa
       ▼
   CONNECTED ◄──────────────────┐
       │                        │
       │ Primera métrica        │ Reconexión
       ▼                        │
      UP ◄────────────┐         │
       │              │         │
       │ Timeout      │ Métrica │
       │ excedido     │ recibida│
       ▼              │         │
     DOWN             │         │
       │              │         │
       │ Métrica ─────┘         │
       │ recibida               │
       │                        │
       │ Desconexión            │
       ▼                        │
  DISCONNECTED ─────────────────┘
       │
       │ Timeout largo (5 min)
       ▼
    REMOVED
```

**Transiciones:**
- `INITIAL → CONNECTED`: Cliente conecta por primera vez
- `CONNECTED → UP`: Cliente envía primera métrica
- `UP → DOWN`: No se reciben métricas en timeout configurado
- `DOWN → UP`: Cliente vuelve a enviar métricas
- `UP/DOWN → DISCONNECTED`: Conexión se cierra
- `DISCONNECTED → CONNECTED`: Cliente reconecta

---

## 5. CÁLCULO DE MÉTRICAS GLOBALES

### 5.1 Agregación de Capacidades

```javascript
// MetricsAggregator.js - Agregación de métricas globales
class MetricsAggregator {
  constructor(dbManager) {
    this.db = dbManager;
  }
  
  async calculateGlobalMetrics() {
    // Solo considerar clientes UP
    const activeClients = await this.db.getClientsByStatus('UP');
    
    let totalCapacityGlobal = 0;
    let usedCapacityGlobal = 0;
    let freeCapacityGlobal = 0;
    
    for (const client of activeClients) {
      // Obtener última métrica de cada cliente
      const latestMetric = await this.db.getLatestMetric(client.client_id);
      
      if (latestMetric) {
        totalCapacityGlobal += latestMetric.total_capacity;
        usedCapacityGlobal += latestMetric.used_capacity;
        freeCapacityGlobal += latestMetric.free_capacity;
      }
    }
    
    // Calcular porcentaje global
    let utilizationPercentGlobal = 0;
    if (totalCapacityGlobal > 0) {
      utilizationPercentGlobal = (usedCapacityGlobal / totalCapacityGlobal) * 100;
    }
    
    // Contar clientes
    const clientsUp = activeClients.length;
    const clientsDown = await this.db.countClientsByStatus('DOWN');
    
    // Almacenar en BD
    const globalMetrics = {
      total_capacity_global: totalCapacityGlobal,
      used_capacity_global: usedCapacityGlobal,
      free_capacity_global: freeCapacityGlobal,
      utilization_percent_global: Math.round(utilizationPercentGlobal * 100) / 100,
      clients_up: clientsUp,
      clients_down: clientsDown,
      calculated_at: new Date()
    };
    
    await this.db.insertGlobalMetrics(globalMetrics);
    
    return {
      total_capacity: totalCapacityGlobal,
      used_capacity: usedCapacityGlobal,
      free_capacity: freeCapacityGlobal,
      utilization_percent: utilizationPercentGlobal,
      clients_up: clientsUp,
      clients_down: clientsDown
    };
  }
}

module.exports = MetricsAggregator;
```

---

### 5.2 Cálculo de Growth Rate

**Growth Rate Individual:**
```javascript
// growthRateCalculator.js
async function calculateGrowthRate(clientId, timeWindowHours = 24) {
  /**
   * Calcula la tasa de crecimiento del espacio usado en MB/hora
   */
  // Obtener métricas de las últimas N horas
  const metrics = await db.getMetricsInWindow(clientId, timeWindowHours);
  
  if (metrics.length < 2) {
    return null; // No hay suficientes datos
  }
  
  // Primera y última métrica del período
  const firstMetric = metrics[0];
  const lastMetric = metrics[metrics.length - 1];
  
  // Calcular diferencia en bytes
  const usedDiffBytes = lastMetric.used_capacity - firstMetric.used_capacity;
  
  // Calcular tiempo transcurrido en horas
  const timeDiffMs = new Date(lastMetric.recorded_at) - new Date(firstMetric.recorded_at);
  const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
  
  if (timeDiffHours === 0) {
    return null;
  }
  
  // Convertir a MB/hora
  const usedDiffMB = usedDiffBytes / (1024 ** 2);
  const growthRateMBPerHour = usedDiffMB / timeDiffHours;
  
  return Math.round(growthRateMBPerHour * 100) / 100;
}
```

**Growth Rate Global:**
```javascript
async function calculateGlobalGrowthRate(timeWindowHours = 24) {
  /**
   * Suma de growth rates de todos los clientes UP
   */
  const activeClients = await db.getClientsByStatus('UP');
  
  let totalGrowthRate = 0.0;
  let clientsWithData = 0;
  
  for (const client of activeClients) {
    const gr = await calculateGrowthRate(client.client_id, timeWindowHours);
    if (gr !== null) {
      totalGrowthRate += gr;
      clientsWithData++;
    }
  }
  
  return Math.round(totalGrowthRate * 100) / 100;
}

module.exports = { calculateGrowthRate, calculateGlobalGrowthRate };
```

**Interpretación:**
- **Valor positivo**: El espacio usado está creciendo
- **Valor negativo**: Se está liberando espacio
- **~0**: Uso estable

---

### 5.3 Cálculo de Availability

```javascript
// availabilityCalculator.js
async function calculateAvailability(clientId, windowHours = 24) {
  /**
   * Calcula availability % en ventana de tiempo
   * availability = (uptime / (uptime + downtime)) * 100
   */
  // Obtener eventos de cambio de estado en la ventana
  const now = new Date();
  const startTime = new Date(now.getTime() - (windowHours * 60 * 60 * 1000));
  
  const events = await db.getAvailabilityEvents({
    client_id: clientId,
    start_time: startTime,
    end_time: now
  });
  
  // Estado inicial al principio de la ventana
  let initialState = await db.getClientStatusAtTime(clientId, startTime);
  
  let uptimeSeconds = 0;
  let downtimeSeconds = 0;
  let currentState = initialState;
  let previousTimestamp = startTime;
  
  for (const event of events) {
    const duration = (new Date(event.event_timestamp) - previousTimestamp) / 1000;
    
    if (currentState === 'UP') {
      uptimeSeconds += duration;
    } else {
      downtimeSeconds += duration;
    }
    
    currentState = event.event_type;
    previousTimestamp = new Date(event.event_timestamp);
  }
  
  // Última duración hasta ahora
  const finalDuration = (now - previousTimestamp) / 1000;
  if (currentState === 'UP') {
    uptimeSeconds += finalDuration;
  } else {
    downtimeSeconds += finalDuration;
  }
  
  // Calcular availability
  const totalTime = uptimeSeconds + downtimeSeconds;
  let availability = 0.0;
  
  if (totalTime > 0) {
    availability = (uptimeSeconds / totalTime) * 100;
  }
  
  return {
    availability_percent: Math.round(availability * 1000) / 1000,
    uptime_seconds: Math.floor(uptimeSeconds),
    downtime_seconds: Math.floor(downtimeSeconds),
    meets_sla: availability >= 99.9
  };
}

module.exports = { calculateAvailability };
```

**Verificación de SLA (99.9%):**
```
99.9% availability en 24 horas:
- Uptime mínimo: 86,313.6 segundos (23 horas 58 minutos 33.6 segundos)
- Downtime máximo: 86.4 segundos (1 minuto 26.4 segundos)

99.9% availability en 30 días:
- Uptime mínimo: 2,591,136 segundos (29 días 23 horas 52 minutos)
- Downtime máximo: 2,592 segundos (43 minutos 12 segundos)
```

---

## 6. INTERFAZ GRÁFICA - ARQUITECTURA

### 6.1 Stack Tecnológico Utilizado

**Frontend: React Dashboard**
```
Framework: React 18+ con Vite
Estado: Context API / Redux Toolkit
Routing: React Router v6
Charts: Chart.js con react-chartjs-2
Estilos: Tailwind CSS / Material-UI
HTTP Client: Axios
Real-time: Socket.io-client para actualizaciones
```

**Backend API: Express (Node.js)**
```
Framework: Express.js 4+
WebSockets: Socket.io para updates en tiempo real
Base de Datos: MongoDB driver nativo
Middleware: cors, body-parser, helmet
Autenticación: JWT (opcional)
```

---

### 6.2 Comunicación UI ↔ Servidor

**Arquitectura con API REST + WebSockets:**
```
┌─────────────────────┐
│  REACT DASHBOARD    │
│                     │
│  Dashboard (Home)   │
│  Client Details     │
│  Global Metrics     │
│  Messaging          │
│  Availability       │
└────────┬────────────┘
         │ 
         ├─ HTTP/REST (Axios)
         │  GET /api/clients
         │  GET /api/metrics
         │  POST /api/messages
         │
         └─ WebSocket (Socket.io)
            • Real-time metrics updates
            • Alert notifications
            • Client status changes
            
┌─────────────────────┐
│   EXPRESS SERVER    │
│  (API REST Layer)   │
│                     │
│  Routes:            │
│  - /api/clients     │
│  - /api/metrics     │
│  - /api/messages    │
│                     │
│  Socket.io server   │
└────────┬────────────┘
         │ SQL Queries
         ▼
┌─────────────────┐
│    DATABASE     │
│     SQLite      │
└─────────────────┘
```

**Endpoints de la API:**

```python
# Listar todos los clientes con estado actual
GET /api/clients
Response:
[
  {
    "client_id": "CLIENT_001",
    "ip_address": "192.168.1.10",
    "status": "UP",
    "last_seen_at": "2026-03-02T14:35:00Z",
    "current_metrics": {
      "total_capacity": 1099511627776,
      "used_capacity": 659706977280,
      "free_capacity": 439804650496,
      "utilization_percent": 60.00
    }
  },
  ...
]

# Métricas históricas de un cliente
GET /api/metrics/history?client_id=CLIENT_001&from=2026-03-01&to=2026-03-02
Response:
{
  "client_id": "CLIENT_001",
  "metrics": [
    {
      "timestamp": "2026-03-02T14:00:00Z",
      "utilization_percent": 58.50
    },
    ...
  ]
}

# Métricas globales actuales
GET /api/metrics/global
Response:
{
  "total_capacity_global": 9895604649984,
  "used_capacity_global": 5937362789990,
  "free_capacity_global": 3958241859994,
  "utilization_percent_global": 60.00,
  "clients_up": 8,
  "clients_down": 1,
  "calculated_at": "2026-03-02T14:35:00Z"
}

# Enviar mensaje a un cliente
POST /api/messages/send
Body:
{
  "client_id": "CLIENT_001",
  "message_type": "NOTIFICATION",
  "content": "Mensaje de prueba"
}
Response:
{
  "message_id": "MSG_1709390100_a3f2e1c4",
  "status": "SENT",
  "sent_at": "2026-03-02T14:35:00Z"
}

# Availability de clientes
GET /api/availability?window_hours=24
Response:
[
  {
    "client_id": "CLIENT_001",
    "availability_percent": 99.95,
    "uptime_seconds": 86356,
    "downtime_seconds": 44,
    "meets_sla": true
  },
  ...
]
```

---

## 7. ESTRATEGIAS DE OPTIMIZACIÓN

### 7.1 Performance de Base de Datos

**Índices Estratégicos (MongoDB):**
```javascript
// Crear índices en MongoDB para optimizar consultas

// Consultas frecuentes de métricas por cliente y fecha
db.metrics.createIndex({ "client_id": 1, "recorded_at": -1 });

// Búsqueda de últimas métricas
db.metrics.createIndex({ "recorded_at": -1 });

// Disponibilidad por cliente
db.availabilityEvents.createIndex({ "client_id": 1, "event_timestamp": 1 });

// Mensajes pendientes de ACK
db.sentMessages.createIndex({ "status": 1, "sent_at": -1 });

// Índice para estado de clientes
db.clients.createIndex({ "status": 1 });
```

**Consultas Optimizadas (MongoDB Aggregation):**
```javascript
// Obtener última métrica de cada cliente (eficiente)
const latestMetrics = await db.collection('metrics').aggregate([
  { $sort: { recorded_at: -1 } },
  { $group: {
      _id: "$client_id",
      latestMetric: { $first: "$$ROOT" }
    }
  },
  { $replaceRoot: { newRoot: "$latestMetric" } }
]).toArray();
// Métricas globales (precalculadas) - obtener la más reciente
const latestGlobalMetrics = await db.collection('globalMetrics')
  .find()
  .sort({ calculated_at: -1 })
  .limit(1)
  .toArray();
  
// Clientes activos con última métrica
const activeClientsWithMetrics = await db.collection('clients').aggregate([
  { $match: { status: 'UP' } },
  { $lookup: {
      from: 'metrics',
      let: { clientId: '$client_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$client_id', '$$clientId'] } } },
        { $sort: { recorded_at: -1 } },
        { $limit: 1 }
      ],
      as: 'latestMetric'
    }
  },
  { $unwind: { path: '$latestMetric', preserveNullAndEmptyArrays: true } }
]).toArray();
```

---

### 7.2 Estrategia de Caché (Opcional)

```javascript
// MetricsCache.js - Cache simple con TTL
class MetricsCache {
  constructor(ttlSeconds = 5) {
    this.cache = new Map();
    this.ttl = ttlSeconds * 1000; // Convertir a milisegundos
  }
  
  async getGlobalMetrics(db) {
    const cacheKey = 'global';
    
    if (this.cache.has(cacheKey)) {
      const { cachedAt, data } = this.cache.get(cacheKey);
      const now = Date.now();
      
      if (now - cachedAt < this.ttl) {
        return data; // Cache hit
      }
    }
    
    // Cache miss: consultar MongoDB
    const data = await db.getLatestGlobalMetrics();
    this.cache.set(cacheKey, {
      cachedAt: Date.now(),
      data
    });
    
    return data;
  }
  
  clearCache() {
    this.cache.clear();
  }
}

module.exports = MetricsCache;
```

---

## 8. RESUMEN DE DECISIONES DE DISEÑO

| Aspecto | Decisión | Justificación |
|---------|----------|---------------|
| **Protocolo** | TCP/IP (módulo net) | Confiabilidad garantizada, orden de mensajes |
| **Formato de datos** | JSON | Legibilidad, simplicidad, amplio soporte |
| **Base de datos** | MongoDB | Flexible schema, escala horizontal, JSON nativo |
| **Backend** | Node.js | Event Loop efíciente, ecosistema npm, JavaScript full-stack |
| **Frontend** | React | Componentización, estado reactivo, ecosistema robusto |
| **Concurrencia** | Event Loop (Node.js) | Non-blocking I/O, apropiado para muchas conexiones |
| **Detección inactividad** | Timeout configurable | Balance entre falsos positivos y detección rápida |
| **Growth Rate** | MB/hora | Métrica intuitiva para gestores de sistemas |
| **Availability** | Ventana de 24h | Alineado con SLAs estándar de la industria |
| **UI Updates** | WebSocket (Socket.io) | Actualizaciones en tiempo real sin polling |

---

**Documento generado:** Marzo 2, 2026  
**Versión:** 1.0  
**Estado:** COMPLETO
