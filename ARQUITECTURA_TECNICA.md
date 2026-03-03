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
│  │   SQLite    │                          │             │      │
│  │             │                          └──────┬──────┘      │
│  │ ┌─────────┐ │                                 │             │
│  │ │clients  │ │                          ┌──────▼──────┐      │
│  │ │metrics  │ │                          │ INTERFAZ    │      │
│  │ │messages │ │                          │  GRÁFICA    │      │
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

```python
class ConnectionManager:
    def __init__(self):
        self._clients = {}  # Dict de clientes activos
        self._lock = threading.RLock()  # Reentrant lock
        self._max_clients = 9
    
    def add_client(self, client_id, socket, address):
        with self._lock:
            if len(self._clients) >= self._max_clients:
                raise MaxClientsReachedError()
            self._clients[client_id] = {
                'socket': socket,
                'address': address,
                'last_seen': datetime.now(),
                'status': 'UP'
            }
    
    def update_last_seen(self, client_id):
        with self._lock:
            if client_id in self._clients:
                self._clients[client_id]['last_seen'] = datetime.now()
    
    def get_inactive_clients(self, timeout_seconds):
        with self._lock:
            now = datetime.now()
            inactive = []
            for cid, info in self._clients.items():
                elapsed = (now - info['last_seen']).total_seconds()
                if elapsed > timeout_seconds:
                    inactive.append(cid)
            return inactive
```

**Patrones de Sincronización:**
1. **Locks (threading.RLock)**: Para estructuras compartidas como ConnectionManager
2. **Queues (queue.Queue)**: Para comunicación entre threads (thread-safe por diseño)
3. **Thread-local storage**: Para datos específicos de cada cliente
4. **Database transactions**: Aislamiento SERIALIZABLE para operaciones críticas

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

```python
class InactivityMonitor:
    def __init__(self, connection_manager, db_manager, config):
        self.conn_mgr = connection_manager
        self.db = db_manager
        self.timeout = config.inactivity_timeout_seconds
        self.check_interval = 15  # segundos
    
    def run_monitoring_loop(self):
        while self.running:
            time.sleep(self.check_interval)
            self.check_inactive_clients()
    
    def check_inactive_clients(self):
        inactive = self.conn_mgr.get_inactive_clients(self.timeout)
        
        for client_id in inactive:
            current_status = self.db.get_client_status(client_id)
            
            if current_status == 'UP':
                # Cliente pasó de UP a DOWN
                self.db.update_client_status(client_id, 'DOWN')
                self.db.log_availability_event(
                    client_id=client_id,
                    event_type='DOWN',
                    timestamp=datetime.now()
                )
                logger.warning(f"Cliente {client_id} marcado como DOWN (no reporta)")
                self.trigger_ui_alert(client_id, "Cliente no reporta")
```

**Parámetros Configurables:**
- `inactivity_timeout_seconds`: Tiempo sin reporte antes de marcar como DOWN
  - **Recomendado**: `report_interval * 3 + 15` segundos
  - Ejemplo: Si report_interval = 30s → timeout = 3*30 + 15 = 105 segundos
- `check_interval`: Frecuencia de verificación (15 segundos)

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

```python
class MetricsAggregator:
    def calculate_global_metrics(self):
        # Solo considerar clientes UP
        active_clients = self.db.get_clients_by_status('UP')
        
        total_capacity_global = 0
        used_capacity_global = 0
        free_capacity_global = 0
        
        for client in active_clients:
            # Obtener última métrica de cada cliente
            latest_metric = self.db.get_latest_metric(client.client_id)
            
            total_capacity_global += latest_metric.total_capacity
            used_capacity_global += latest_metric.used_capacity
            free_capacity_global += latest_metric.free_capacity
        
        # Calcular porcentaje global
        if total_capacity_global > 0:
            utilization_percent_global = (
                (used_capacity_global / total_capacity_global) * 100
            )
        else:
            utilization_percent_global = 0.0
        
        # Contar clientes
        clients_up = len(active_clients)
        clients_down = self.db.count_clients_by_status('DOWN')
        
        # Almacenar en BD
        self.db.insert_global_metrics({
            'total_capacity_global': total_capacity_global,
            'used_capacity_global': used_capacity_global,
            'free_capacity_global': free_capacity_global,
            'utilization_percent_global': round(utilization_percent_global, 2),
            'clients_up': clients_up,
            'clients_down': clients_down,
            'calculated_at': datetime.now()
        })
        
        return {
            'total_capacity': total_capacity_global,
            'used_capacity': used_capacity_global,
            'free_capacity': free_capacity_global,
            'utilization_percent': utilization_percent_global,
            'clients_up': clients_up,
            'clients_down': clients_down
        }
```

---

### 5.2 Cálculo de Growth Rate

**Growth Rate Individual:**
```python
def calculate_growth_rate(client_id, time_window_hours=24):
    """
    Calcula la tasa de crecimiento del espacio usado en MB/hora
    """
    # Obtener métricas de las últimas N horas
    metrics = db.get_metrics_in_window(
        client_id=client_id,
        hours=time_window_hours
    )
    
    if len(metrics) < 2:
        return None  # No hay suficientes datos
    
    # Primera y última métrica del período
    first_metric = metrics[0]
    last_metric = metrics[-1]
    
    # Calcular diferencia en bytes
    used_diff_bytes = last_metric.used_capacity - first_metric.used_capacity
    
    # Calcular tiempo transcurrido en horas
    time_diff_seconds = (
        last_metric.recorded_at - first_metric.recorded_at
    ).total_seconds()
    time_diff_hours = time_diff_seconds / 3600
    
    if time_diff_hours == 0:
        return None
    
    # Convertir a MB/hora
    used_diff_mb = used_diff_bytes / (1024 ** 2)
    growth_rate_mb_per_hour = used_diff_mb / time_diff_hours
    
    return round(growth_rate_mb_per_hour, 2)
```

**Growth Rate Global:**
```python
def calculate_global_growth_rate(time_window_hours=24):
    """
    Suma de growth rates de todos los clientes UP
    """
    active_clients = db.get_clients_by_status('UP')
    
    total_growth_rate = 0.0
    clients_with_data = 0
    
    for client in active_clients:
        gr = calculate_growth_rate(client.client_id, time_window_hours)
        if gr is not None:
            total_growth_rate += gr
            clients_with_data += 1
    
    return round(total_growth_rate, 2)
```

**Interpretación:**
- **Valor positivo**: El espacio usado está creciendo
- **Valor negativo**: Se está liberando espacio
- **~0**: Uso estable

---

### 5.3 Cálculo de Availability

```python
def calculate_availability(client_id, window_hours=24):
    """
    Calcula availability % en ventana de tiempo
    availability = (uptime / (uptime + downtime)) * 100
    """
    # Obtener eventos de cambio de estado en la ventana
    now = datetime.now()
    start_time = now - timedelta(hours=window_hours)
    
    events = db.get_availability_events(
        client_id=client_id,
        start_time=start_time,
        end_time=now
    )
    
    # Estado inicial al principio de la ventana
    initial_state = db.get_client_status_at_time(client_id, start_time)
    
    uptime_seconds = 0
    downtime_seconds = 0
    current_state = initial_state
    previous_timestamp = start_time
    
    for event in events:
        duration = (event.event_timestamp - previous_timestamp).total_seconds()
        
        if current_state == 'UP':
            uptime_seconds += duration
        else:
            downtime_seconds += duration
        
        current_state = event.event_type
        previous_timestamp = event.event_timestamp
    
    # Última duración hasta ahora
    final_duration = (now - previous_timestamp).total_seconds()
    if current_state == 'UP':
        uptime_seconds += final_duration
    else:
        downtime_seconds += final_duration
    
    # Calcular availability
    total_time = uptime_seconds + downtime_seconds
    if total_time > 0:
        availability = (uptime_seconds / total_time) * 100
    else:
        availability = 0.0
    
    return {
        'availability_percent': round(availability, 3),
        'uptime_seconds': int(uptime_seconds),
        'downtime_seconds': int(downtime_seconds),
        'meets_sla': availability >= 99.9
    }
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

### 6.1 Stack Tecnológico Recomendado

**Opción 1: Web (HTML/CSS/JavaScript)**
```
Frontend: React / Vue.js / Vanilla JS
Backend API: Flask (Python) / Express (Node.js)
Real-time: Polling HTTP / WebSockets
Charts: Chart.js / D3.js
```

**Opción 2: Desktop (Python)**
```
GUI Framework: Tkinter / PyQt5 / wxPython
Charts: Matplotlib / Plotly
Data access: Direct DB connection
```

**Opción 3: Desktop (Java)**
```
GUI Framework: JavaFX / Swing
Charts: JFreeChart
Data access: JDBC
```

---

### 6.2 Comunicación UI ↔ Servidor

**Arquitectura con API REST:**
```
┌─────────────────┐
│  INTERFAZ WEB   │
│                 │
│  Dashboard      │
│  Client View    │
│  Global Metrics │
│  Messages       │
└────────┬────────┘
         │ HTTP Requests
         │ (JSON)
         ▼
┌─────────────────┐
│   REST API      │
│  (Flask/Express)│
│                 │
│  GET /clients   │
│  GET /metrics   │
│  POST /messages │
└────────┬────────┘
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

**Índices Estratégicos:**
```sql
-- Consultas frecuentes de métricas por cliente y fecha
CREATE INDEX idx_metrics_client_recorded 
ON metrics(client_id, recorded_at DESC);

-- Búsqueda de últimas métricas
CREATE INDEX idx_metrics_recorded_at 
ON metrics(recorded_at DESC);

-- Disponibilidad por cliente
CREATE INDEX idx_events_client_timestamp 
ON availability_events(client_id, event_timestamp);

-- Mensajes pendientes de ACK
CREATE INDEX idx_messages_status_sent 
ON sent_messages(status, sent_at);
```

**Consultas Optimizadas:**
```sql
-- Obtener última métrica de cada cliente (eficiente)
SELECT m1.*
FROM metrics m1
INNER JOIN (
    SELECT client_id, MAX(recorded_at) as max_time
    FROM metrics
    GROUP BY client_id
) m2 ON m1.client_id = m2.client_id 
    AND m1.recorded_at = m2.max_time;

-- Métricas globales (precalculadas)
SELECT * FROM global_metrics
ORDER BY calculated_at DESC
LIMIT 1;
```

---

### 7.2 Estrategia de Caché (Opcional)

```python
class MetricsCache:
    def __init__(self, ttl_seconds=5):
        self.cache = {}
        self.ttl = timedelta(seconds=ttl_seconds)
        self.lock = threading.Lock()
    
    def get_global_metrics(self):
        with self.lock:
            if 'global' in self.cache:
                cached_at, data = self.cache['global']
                if datetime.now() - cached_at < self.ttl:
                    return data
            
            # Cache miss: consultar BD
            data = db.get_latest_global_metrics()
            self.cache['global'] = (datetime.now(), data)
            return data
```

---

## 8. RESUMEN DE DECISIONES DE DISEÑO

| Aspecto | Decisión | Justificación |
|---------|----------|---------------|
| **Protocolo** | TCP/IP | Confiabilidad garantizada, orden de mensajes |
| **Formato de datos** | JSON | Legibilidad, simplicidad, amplio soporte |
| **Base de datos** | SQLite | Simplicidad para 9 clientes, sin servidor adicional |
| **Concurrencia** | Multi-threading | Fácil de implementar, apropiado para I/O-bound |
| **Detección inactividad** | Timeout configurable | Balance entre falsos positivos y detección rápida |
| **Growth Rate** | MB/hora | Métrica intuitiva para gestores de sistemas |
| **Availability** | Ventana de 24h | Alineado con SLAs estándar de la industria |
| **UI Updates** | Polling 5s | Simple de implementar, suficiente para 9 clientes |

---

**Documento generado:** Marzo 2, 2026  
**Versión:** 1.0  
**Estado:** COMPLETO
