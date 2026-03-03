# DISEÑO DE BASE DE DATOS - STORAGE CLUSTER

## ESQUEMA COMPLETO Y DICCIONARIO DE DATOS

---

## 1. DIAGRAMA ENTIDAD-RELACIÓN (ER)

```
┌─────────────────────────────────────────────────────────────────┐
│                     ESQUEMA DE BASE DE DATOS                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐           ┌──────────────────┐
│     clients      │           │     metrics      │
├──────────────────┤           ├──────────────────┤
│ client_id    PK  │◄──────────┤ id           PK  │
│ ip_address       │         │ │ client_id    FK  │
│ port             │         │ │ total_capacity   │
│ status           │         │ │ used_capacity    │
│ first_connected  │         │ │ free_capacity    │
│ last_seen_at     │         │ │ utilization_%    │
│ total_uptime     │         │ │ growth_rate      │
│ total_downtime   │         │ │ recorded_at      │
│ created_at       │         │ │ created_at       │
│ updated_at       │         │ └──────────────────┘
└──────────────────┘         │
        │                    │
        │                    │
        │ 1:N                │ 1:N
        │                    │
        ▼                    ▼
┌──────────────────┐   ┌──────────────────┐
│ sent_messages    │   │availability_     │
├──────────────────┤   │    events        │
│ message_id   PK  │   ├──────────────────┤
│ client_id    FK  │   │ id           PK  │
│ message_type     │   │ client_id    FK  │
│ content          │   │ event_type       │
│ status           │   │ event_timestamp  │
│ sent_at          │   │ duration_seconds │
│ ack_received_at  │   │ created_at       │
│ response_time_ms │   └──────────────────┘
│ created_at       │
└──────────────────┘

┌──────────────────┐
│ global_metrics   │
├──────────────────┤
│ id           PK  │
│ total_capacity   │
│ used_capacity    │
│ free_capacity    │
│ utilization_%    │
│ growth_rate      │
│ clients_up       │
│ clients_down     │
│ calculated_at    │
│ created_at       │
└──────────────────┘
```

---

## 2. DEFINICIÓN DE TABLAS

### 2.1 Tabla: `clients`

**Descripción:** Almacena información de los 9 nodos clientes (servidores regionales).

**Script SQL:**
```sql
CREATE TABLE clients (
    client_id VARCHAR(20) PRIMARY KEY,
    ip_address VARCHAR(15) NOT NULL,
    port INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    first_connected_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP NOT NULL,
    total_uptime_seconds INTEGER DEFAULT 0,
    total_downtime_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('UP', 'DOWN', 'DISCONNECTED', 'CONNECTED')),
    CONSTRAINT chk_client_id CHECK (client_id GLOB 'CLIENT_[0-9][0-9][0-9]')
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_last_seen ON clients(last_seen_at);
```

**Diccionario de Campos:**

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `client_id` | VARCHAR(20) | Identificador único del cliente (CLIENT_001 a CLIENT_009) | PRIMARY KEY, Formato: CLIENT_XXX |
| `ip_address` | VARCHAR(15) | Dirección IPv4 del cliente | NOT NULL, VARCHAR(15) para "255.255.255.255" |
| `port` | INTEGER | Puerto del socket del cliente | NOT NULL, Rango típico: 49152-65535 |
| `status` | VARCHAR(20) | Estado actual del cliente | NOT NULL, Valores: UP, DOWN, DISCONNECTED, CONNECTED |
| `first_connected_at` | TIMESTAMP | Timestamp de la primera conexión exitosa | NOT NULL |
| `last_seen_at` | TIMESTAMP | Timestamp de la última métrica recibida | NOT NULL, Actualizado con cada METRICS_REPORT |
| `total_uptime_seconds` | INTEGER | Tiempo acumulado en estado UP (segundos) | DEFAULT 0, Para cálculo de availability |
| `total_downtime_seconds` | INTEGER | Tiempo acumulado en estado DOWN (segundos) | DEFAULT 0, Para cálculo de availability |
| `created_at` | TIMESTAMP | Timestamp de creación del registro | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | Timestamp de última actualización | DEFAULT CURRENT_TIMESTAMP |

**Estados del Cliente:**
- `CONNECTED`: Cliente conectado pero no ha enviado métricas
- `UP`: Cliente activo enviando métricas periódicamente
- `DOWN`: Cliente no reporta (timeout excedido)
- `DISCONNECTED`: Conexión cerrada

**Ejemplo de Registro:**
```sql
INSERT INTO clients (
    client_id, ip_address, port, status, 
    first_connected_at, last_seen_at
) VALUES (
    'CLIENT_001', '192.168.1.10', 54321, 'UP',
    '2026-03-02 14:30:00', '2026-03-02 14:35:00'
);
```

---

### 2.2 Tabla: `metrics`

**Descripción:** Almacena las métricas de disco reportadas por cada cliente.

**Script SQL:**
```sql
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id VARCHAR(20) NOT NULL,
    total_capacity BIGINT NOT NULL,
    used_capacity BIGINT NOT NULL,
    free_capacity BIGINT NOT NULL,
    utilization_percent DECIMAL(5,2) NOT NULL,
    growth_rate DECIMAL(10,2),
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT chk_capacities CHECK (
        total_capacity > 0 AND 
        used_capacity >= 0 AND 
        free_capacity >= 0 AND
        used_capacity + free_capacity = total_capacity
    ),
    CONSTRAINT chk_utilization CHECK (
        utilization_percent >= 0 AND utilization_percent <= 100
    )
);

CREATE INDEX idx_metrics_client_id ON metrics(client_id);
CREATE INDEX idx_metrics_recorded_at ON metrics(recorded_at DESC);
CREATE INDEX idx_metrics_client_recorded ON metrics(client_id, recorded_at DESC);
```

**Diccionario de Campos:**

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | INTEGER | Identificador único autoincremental | PRIMARY KEY, AUTOINCREMENT |
| `client_id` | VARCHAR(20) | ID del cliente que reportó la métrica | NOT NULL, FOREIGN KEY → clients(client_id) |
| `total_capacity` | BIGINT | Capacidad total del disco en bytes | NOT NULL, > 0, Rango: hasta 18 EB (exabytes) |
| `used_capacity` | BIGINT | Espacio usado del disco en bytes | NOT NULL, >= 0 |
| `free_capacity` | BIGINT | Espacio libre del disco en bytes | NOT NULL, >= 0 |
| `utilization_percent` | DECIMAL(5,2) | Porcentaje de utilización (0.00 - 100.00) | NOT NULL, 0 ≤ valor ≤ 100 |
| `growth_rate` | DECIMAL(10,2) | Tasa de crecimiento en MB/hora | NULL permitido, Puede ser negativo |
| `recorded_at` | TIMESTAMP | Timestamp cuando se tomó la métrica | NOT NULL, Timestamp del cliente |
| `created_at` | TIMESTAMP | Timestamp de inserción en BD | DEFAULT CURRENT_TIMESTAMP |

**Cálculos y Validaciones:**
```python
# Verificación de integridad
assert used_capacity + free_capacity == total_capacity

# Cálculo de utilization_percent
utilization_percent = (used_capacity / total_capacity) * 100

# Growth rate (calculado comparando con métrica anterior)
time_diff_hours = (current_recorded_at - previous_recorded_at).total_seconds() / 3600
used_diff_mb = (current_used_capacity - previous_used_capacity) / (1024 ** 2)
growth_rate = used_diff_mb / time_diff_hours
```

**Ejemplo de Registro:**
```sql
INSERT INTO metrics (
    client_id, total_capacity, used_capacity, free_capacity,
    utilization_percent, growth_rate, recorded_at
) VALUES (
    'CLIENT_001', 
    1099511627776,  -- 1 TB en bytes
    659706977280,   -- 600 GB usado
    439804650496,   -- 400 GB libre
    60.00,          -- 60% de uso
    15.50,          -- Creciendo 15.5 MB/hora
    '2026-03-02 14:35:00'
);
```

**Consultas Típicas:**
```sql
-- Última métrica de un cliente
SELECT * FROM metrics 
WHERE client_id = 'CLIENT_001' 
ORDER BY recorded_at DESC 
LIMIT 1;

-- Métricas de las últimas 24 horas
SELECT * FROM metrics 
WHERE client_id = 'CLIENT_001' 
  AND recorded_at >= datetime('now', '-24 hours')
ORDER BY recorded_at ASC;

-- Tendencia de utilización
SELECT 
    DATE(recorded_at) as date,
    AVG(utilization_percent) as avg_utilization
FROM metrics 
WHERE client_id = 'CLIENT_001'
GROUP BY DATE(recorded_at)
ORDER BY date DESC;
```

---

### 2.3 Tabla: `global_metrics`

**Descripción:** Almacena métricas agregadas de todo el cluster.

**Script SQL:**
```sql
CREATE TABLE global_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_capacity_global BIGINT NOT NULL,
    used_capacity_global BIGINT NOT NULL,
    free_capacity_global BIGINT NOT NULL,
    utilization_percent_global DECIMAL(5,2) NOT NULL,
    growth_rate_global DECIMAL(10,2),
    clients_up INTEGER NOT NULL DEFAULT 0,
    clients_down INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_clients_total CHECK (clients_up + clients_down <= 9)
);

CREATE INDEX idx_global_metrics_calculated ON global_metrics(calculated_at DESC);
```

**Diccionario de Campos:**

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | INTEGER | Identificador único autoincremental | PRIMARY KEY, AUTOINCREMENT |
| `total_capacity_global` | BIGINT | Suma de capacidades totales de clientes UP | NOT NULL, SUM(total_capacity) |
| `used_capacity_global` | BIGINT | Suma de capacidad usada de clientes UP | NOT NULL, SUM(used_capacity) |
| `free_capacity_global` | BIGINT | Suma de capacidad libre de clientes UP | NOT NULL, SUM(free_capacity) |
| `utilization_percent_global` | DECIMAL(5,2) | % de uso global del cluster | NOT NULL, (used/total) * 100 |
| `growth_rate_global` | DECIMAL(10,2) | Tasa de crecimiento global en MB/hora | NULL permitido, SUM(growth_rates) |
| `clients_up` | INTEGER | Número de clientes con estado UP | NOT NULL, DEFAULT 0 |
| `clients_down` | INTEGER | Número de clientes con estado DOWN | NOT NULL, DEFAULT 0 |
| `calculated_at` | TIMESTAMP | Timestamp del cálculo | NOT NULL |
| `created_at` | TIMESTAMP | Timestamp de inserción | DEFAULT CURRENT_TIMESTAMP |

**Ejemplo de Registro:**
```sql
INSERT INTO global_metrics (
    total_capacity_global, used_capacity_global, free_capacity_global,
    utilization_percent_global, growth_rate_global,
    clients_up, clients_down, calculated_at
) VALUES (
    9895604649984,   -- ~9 TB total (9 clientes x 1TB c/u)
    5937362789990,   -- ~5.4 TB usado
    3958241859994,   -- ~3.6 TB libre
    60.00,           -- 60% global
    139.50,          -- 139.5 MB/hora crecimiento total
    8,               -- 8 clientes UP
    1,               -- 1 cliente DOWN
    '2026-03-02 14:35:00'
);
```

**Consulta de Última Métrica Global:**
```sql
SELECT * FROM global_metrics 
ORDER BY calculated_at DESC 
LIMIT 1;
```

---

### 2.4 Tabla: `sent_messages`

**Descripción:** Registro de mensajes enviados del servidor a los clientes con estado de ACK.

**Script SQL:**
```sql
CREATE TABLE sent_messages (
    message_id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    sent_at TIMESTAMP NOT NULL,
    ack_received_at TIMESTAMP,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT chk_message_status CHECK (status IN ('SENT', 'ACKNOWLEDGED', 'TIMEOUT')),
    CONSTRAINT chk_response_time CHECK (
        (status = 'ACKNOWLEDGED' AND response_time_ms IS NOT NULL) OR
        (status != 'ACKNOWLEDGED' AND response_time_ms IS NULL)
    )
);

CREATE INDEX idx_messages_client_id ON sent_messages(client_id);
CREATE INDEX idx_messages_status ON sent_messages(status);
CREATE INDEX idx_messages_sent_at ON sent_messages(sent_at DESC);
```

**Diccionario de Campos:**

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `message_id` | VARCHAR(50) | ID único del mensaje (formato: MSG_timestamp_uuid) | PRIMARY KEY |
| `client_id` | VARCHAR(20) | Cliente destinatario | NOT NULL, FOREIGN KEY → clients(client_id) |
| `message_type` | VARCHAR(50) | Tipo de mensaje | NOT NULL, Ej: NOTIFICATION, ALERT, COMMAND |
| `content` | TEXT | Contenido del mensaje | NOT NULL, Hasta 2 GB en SQLite |
| `status` | VARCHAR(20) | Estado del mensaje | NOT NULL, SENT / ACKNOWLEDGED / TIMEOUT |
| `sent_at` | TIMESTAMP | Timestamp de envío | NOT NULL |
| `ack_received_at` | TIMESTAMP | Timestamp de recepción del ACK | NULL hasta que llega ACK |
| `response_time_ms` | INTEGER | Tiempo de respuesta en milisegundos | NULL si no ACK, ack_time - sent_time |
| `created_at` | TIMESTAMP | Timestamp de creación del registro | DEFAULT CURRENT_TIMESTAMP |

**Estados del Mensaje:**
- `SENT`: Mensaje enviado, esperando ACK
- `ACKNOWLEDGED`: ACK recibido
- `TIMEOUT`: ACK no recibido en tiempo límite (30 segundos)

**Ejemplo de Registro:**
```sql
-- Mensaje recién enviado
INSERT INTO sent_messages (
    message_id, client_id, message_type, content, status, sent_at
) VALUES (
    'MSG_1709390100_a3f2e1c4',
    'CLIENT_001',
    'NOTIFICATION',
    'Sistema funcionando correctamente',
    'SENT',
    '2026-03-02 14:35:00'
);

-- Actualizar cuando llega ACK
UPDATE sent_messages 
SET 
    status = 'ACKNOWLEDGED',
    ack_received_at = '2026-03-02 14:35:01.234',
    response_time_ms = 1234
WHERE message_id = 'MSG_1709390100_a3f2e1c4';
```

**Consultas Típicas:**
```sql
-- Mensajes pendientes de ACK
SELECT * FROM sent_messages 
WHERE status = 'SENT' 
  AND sent_at < datetime('now', '-30 seconds')
ORDER BY sent_at ASC;

-- Estadísticas de ACK por cliente
SELECT 
    client_id,
    COUNT(*) as total_messages,
    SUM(CASE WHEN status = 'ACKNOWLEDGED' THEN 1 ELSE 0 END) as acked,
    AVG(response_time_ms) as avg_response_time
FROM sent_messages
GROUP BY client_id;
```

---

### 2.5 Tabla: `availability_events`

**Descripción:** Registro de eventos de cambio de estado (UP ↔ DOWN) para cálculo de availability.

**Script SQL:**
```sql
CREATE TABLE availability_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id VARCHAR(20) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT chk_event_type CHECK (event_type IN ('UP', 'DOWN'))
);

CREATE INDEX idx_events_client_id ON availability_events(client_id);
CREATE INDEX idx_events_timestamp ON availability_events(event_timestamp);
CREATE INDEX idx_events_client_timestamp ON availability_events(client_id, event_timestamp DESC);
```

**Diccionario de Campos:**

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | INTEGER | Identificador único autoincremental | PRIMARY KEY, AUTOINCREMENT |
| `client_id` | VARCHAR(20) | Cliente al que pertenece el evento | NOT NULL, FOREIGN KEY → clients(client_id) |
| `event_type` | VARCHAR(20) | Tipo de evento (transición de estado) | NOT NULL, UP o DOWN |
| `event_timestamp` | TIMESTAMP | Momento exacto del cambio de estado | NOT NULL |
| `duration_seconds` | INTEGER | Duración en el estado anterior (segundos) | NULL para primer evento, Calculado posteriormente |
| `created_at` | TIMESTAMP | Timestamp de creación del registro | DEFAULT CURRENT_TIMESTAMP |

**Interpretación:**
- Evento `UP`: Cliente pasó a estado UP (activo)
- Evento `DOWN`: Cliente pasó a estado DOWN (inactivo)
- `duration_seconds`: Tiempo que estuvo en el estado ANTERIOR

**Ejemplo de Secuencia:**
```sql
-- Cliente conecta y pasa a UP
INSERT INTO availability_events (client_id, event_type, event_timestamp, duration_seconds)
VALUES ('CLIENT_001', 'UP', '2026-03-02 14:00:00', NULL);

-- Cliente cae a DOWN después de 3600 segundos (1 hora)
INSERT INTO availability_events (client_id, event_type, event_timestamp, duration_seconds)
VALUES ('CLIENT_001', 'DOWN', '2026-03-02 15:00:00', 3600);

-- Cliente vuelve a UP después de 120 segundos (2 minutos)
INSERT INTO availability_events (client_id, event_type, event_timestamp, duration_seconds)
VALUES ('CLIENT_001', 'UP', '2026-03-02 15:02:00', 120);
```

**Cálculo de Availability:**
```sql
-- Availability de un cliente en las últimas 24 horas
SELECT 
    client_id,
    SUM(CASE WHEN event_type = 'UP' THEN duration_seconds ELSE 0 END) as uptime,
    SUM(CASE WHEN event_type = 'DOWN' THEN duration_seconds ELSE 0 END) as downtime,
    (SUM(CASE WHEN event_type = 'UP' THEN duration_seconds ELSE 0 END) * 100.0 / 
     (SUM(duration_seconds))) as availability_percent
FROM availability_events
WHERE client_id = 'CLIENT_001'
  AND event_timestamp >= datetime('now', '-24 hours')
GROUP BY client_id;
```

---

## 3. TABLA DE CONFIGURACIÓN (Opcional)

### 3.1 Tabla: `system_config`

**Descripción:** Parámetros de configuración almacenados en BD (alternativa a archivo config).

**Script SQL:**
```sql
CREATE TABLE system_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_config_type CHECK (config_type IN ('INTEGER', 'STRING', 'FLOAT', 'BOOLEAN'))
);

CREATE INDEX idx_config_key ON system_config(config_key);
```

**Ejemplo de Registros:**
```sql
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('report_interval_seconds', '30', 'INTEGER', 'Intervalo de envío de métricas del cliente'),
('inactivity_timeout_seconds', '105', 'INTEGER', 'Timeout para marcar cliente como inactivo'),
('ack_timeout_seconds', '30', 'INTEGER', 'Timeout para esperar ACK de mensaje'),
('max_clients', '9', 'INTEGER', 'Máximo número de clientes simultáneos'),
('availability_window_hours', '24', 'INTEGER', 'Ventana de tiempo para cálculo de availability');
```

---

## 4. POLÍTICAS DE RETENCIÓN Y LIMPIEZA

### 4.1 Script de Limpieza Automática

```sql
-- Eliminar métricas más antiguas de 30 días
DELETE FROM metrics 
WHERE recorded_at < datetime('now', '-30 days');

-- Eliminar métricas globales más antiguas de 90 días
DELETE FROM global_metrics 
WHERE calculated_at < datetime('now', '-90 days');

-- Eliminar mensajes con ACK más antiguos de 7 días
DELETE FROM sent_messages 
WHERE status = 'ACKNOWLEDGED' 
  AND ack_received_at < datetime('now', '-7 days');

-- Eliminar mensajes sin ACK más antiguos de 30 días
DELETE FROM sent_messages 
WHERE status IN ('SENT', 'TIMEOUT')
  AND sent_at < datetime('now', '-30 days');

-- Eliminar eventos de availability más antiguos de 90 días
DELETE FROM availability_events 
WHERE event_timestamp < datetime('now', '-90 days');

-- Optimizar base de datos después de limpieza
VACUUM;
ANALYZE;
```

### 4.2 Política de Retención Recomendada

| Tabla | Retención | Justificación |
|-------|-----------|---------------|
| `clients` | Permanente | Datos maestros |
| `metrics` | 30 días | Suficiente para análisis histórico |
| `global_metrics` | 90 días | Análisis de tendencias a largo plazo |
| `sent_messages` (ACK) | 7 días | Auditoría reciente |
| `sent_messages` (no ACK) | 30 días | Investigación de problemas |
| `availability_events` | 90 días | Cálculo de SLA trimestral |

---

## 5. TRIGGERS PARA AUTOMATIZACIÓN

### 5.1 Trigger: Actualizar `updated_at` en Clientes

```sql
CREATE TRIGGER update_clients_timestamp 
AFTER UPDATE ON clients
FOR EACH ROW
BEGIN
    UPDATE clients 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE client_id = NEW.client_id;
END;
```

### 5.2 Trigger: Validar Integridad de Métricas

```sql
CREATE TRIGGER validate_metrics_integrity 
BEFORE INSERT ON metrics
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.used_capacity + NEW.free_capacity != NEW.total_capacity THEN
            RAISE(ABORT, 'Capacidades no suman correctamente')
        WHEN NEW.utilization_percent < 0 OR NEW.utilization_percent > 100 THEN
            RAISE(ABORT, 'Porcentaje de utilización fuera de rango')
    END;
END;
```

### 5.3 Trigger: Auto-calcular `response_time_ms`

```sql
CREATE TRIGGER calculate_response_time 
AFTER UPDATE OF ack_received_at ON sent_messages
FOR EACH ROW
WHEN NEW.ack_received_at IS NOT NULL
BEGIN
    UPDATE sent_messages 
    SET response_time_ms = (
        CAST((julianday(NEW.ack_received_at) - julianday(NEW.sent_at)) * 86400000 AS INTEGER)
    )
    WHERE message_id = NEW.message_id;
END;
```

---

## 6. VISTAS ÚTILES

### 6.1 Vista: Resumen de Clientes

```sql
CREATE VIEW v_clients_summary AS
SELECT 
    c.client_id,
    c.ip_address,
    c.status,
    c.last_seen_at,
    CAST((julianday('now') - julianday(c.last_seen_at)) * 86400 AS INTEGER) as seconds_since_last_seen,
    m.total_capacity,
    m.used_capacity,
    m.free_capacity,
    m.utilization_percent,
    m.growth_rate
FROM clients c
LEFT JOIN (
    SELECT m1.*
    FROM metrics m1
    INNER JOIN (
        SELECT client_id, MAX(recorded_at) as max_time
        FROM metrics
        GROUP BY client_id
    ) m2 ON m1.client_id = m2.client_id AND m1.recorded_at = m2.max_time
) m ON c.client_id = m.client_id;
```

### 6.2 Vista: Estadísticas de Mensajería

```sql
CREATE VIEW v_messaging_stats AS
SELECT 
    client_id,
    COUNT(*) as total_messages,
    SUM(CASE WHEN status = 'ACKNOWLEDGED' THEN 1 ELSE 0 END) as acked_count,
    SUM(CASE WHEN status = 'TIMEOUT' THEN 1 ELSE 0 END) as timeout_count,
    ROUND(AVG(CASE WHEN response_time_ms IS NOT NULL THEN response_time_ms END), 2) as avg_response_time_ms,
    MIN(response_time_ms) as min_response_time_ms,
    MAX(response_time_ms) as max_response_time_ms
FROM sent_messages
GROUP BY client_id;
```

### 6.3 Vista: Availability Actual

```sql
CREATE VIEW v_current_availability AS
SELECT 
    c.client_id,
    c.status,
    ROUND(
        (c.total_uptime_seconds * 100.0) / 
        NULLIF(c.total_uptime_seconds + c.total_downtime_seconds, 0),
        3
    ) as availability_percent,
    c.total_uptime_seconds,
    c.total_downtime_seconds,
    CASE 
        WHEN (c.total_uptime_seconds * 100.0) / 
             NULLIF(c.total_uptime_seconds + c.total_downtime_seconds, 0) >= 99.9 
        THEN 'YES' 
        ELSE 'NO' 
    END as meets_sla
FROM clients c
WHERE c.total_uptime_seconds + c.total_downtime_seconds > 0;
```

---

## 7. SCRIPT DE INICIALIZACIÓN COMPLETO

### init_database.sql

```sql
-- ============================================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
-- Storage Cluster con Nodo Central de Monitoreo
-- ============================================================================

-- Eliminar tablas si existen (solo para reinicio limpio)
DROP TABLE IF EXISTS availability_events;
DROP TABLE IF EXISTS sent_messages;
DROP TABLE IF EXISTS global_metrics;
DROP TABLE IF EXISTS metrics;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS system_config;

-- ============================================================================
-- TABLA: clients
-- ============================================================================
CREATE TABLE clients (
    client_id VARCHAR(20) PRIMARY KEY,
    ip_address VARCHAR(15) NOT NULL,
    port INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    first_connected_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP NOT NULL,
    total_uptime_seconds INTEGER DEFAULT 0,
    total_downtime_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('UP', 'DOWN', 'DISCONNECTED', 'CONNECTED')),
    CONSTRAINT chk_client_id CHECK (client_id GLOB 'CLIENT_[0-9][0-9][0-9]')
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_last_seen ON clients(last_seen_at);

-- ============================================================================
-- TABLA: metrics
-- ============================================================================
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id VARCHAR(20) NOT NULL,
    total_capacity BIGINT NOT NULL,
    used_capacity BIGINT NOT NULL,
    free_capacity BIGINT NOT NULL,
    utilization_percent DECIMAL(5,2) NOT NULL,
    growth_rate DECIMAL(10,2),
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT chk_capacities CHECK (
        total_capacity > 0 AND 
        used_capacity >= 0 AND 
        free_capacity >= 0
    ),
    CONSTRAINT chk_utilization CHECK (
        utilization_percent >= 0 AND utilization_percent <= 100
    )
);

CREATE INDEX idx_metrics_client_id ON metrics(client_id);
CREATE INDEX idx_metrics_recorded_at ON metrics(recorded_at DESC);
CREATE INDEX idx_metrics_client_recorded ON metrics(client_id, recorded_at DESC);

-- ============================================================================
-- TABLA: global_metrics
-- ============================================================================
CREATE TABLE global_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_capacity_global BIGINT NOT NULL,
    used_capacity_global BIGINT NOT NULL,
    free_capacity_global BIGINT NOT NULL,
    utilization_percent_global DECIMAL(5,2) NOT NULL,
    growth_rate_global DECIMAL(10,2),
    clients_up INTEGER NOT NULL DEFAULT 0,
    clients_down INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_clients_total CHECK (clients_up + clients_down <= 9)
);

CREATE INDEX idx_global_metrics_calculated ON global_metrics(calculated_at DESC);

-- ============================================================================
-- TABLA: sent_messages
-- ============================================================================
CREATE TABLE sent_messages (
    message_id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    sent_at TIMESTAMP NOT NULL,
    ack_received_at TIMESTAMP,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT chk_message_status CHECK (status IN ('SENT', 'ACKNOWLEDGED', 'TIMEOUT'))
);

CREATE INDEX idx_messages_client_id ON sent_messages(client_id);
CREATE INDEX idx_messages_status ON sent_messages(status);
CREATE INDEX idx_messages_sent_at ON sent_messages(sent_at DESC);

-- ============================================================================
-- TABLA: availability_events
-- ============================================================================
CREATE TABLE availability_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id VARCHAR(20) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE,
    CONSTRAINT chk_event_type CHECK (event_type IN ('UP', 'DOWN'))
);

CREATE INDEX idx_events_client_id ON availability_events(client_id);
CREATE INDEX idx_events_timestamp ON availability_events(event_timestamp);
CREATE INDEX idx_events_client_timestamp ON availability_events(client_id, event_timestamp DESC);

-- ============================================================================
-- TABLA: system_config (Opcional)
-- ============================================================================
CREATE TABLE system_config (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_config_type CHECK (config_type IN ('INTEGER', 'STRING', 'FLOAT', 'BOOLEAN'))
);

-- Insertar configuración por defecto
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('report_interval_seconds', '30', 'INTEGER', 'Intervalo de envío de métricas del cliente'),
('inactivity_timeout_seconds', '105', 'INTEGER', 'Timeout para marcar cliente como inactivo'),
('ack_timeout_seconds', '30', 'INTEGER', 'Timeout para esperar ACK de mensaje'),
('max_clients', '9', 'INTEGER', 'Máximo número de clientes simultáneos'),
('availability_window_hours', '24', 'INTEGER', 'Ventana de tiempo para cálculo de availability');

-- ============================================================================
-- VISTAS
-- ============================================================================

CREATE VIEW v_clients_summary AS
SELECT 
    c.client_id,
    c.ip_address,
    c.status,
    c.last_seen_at,
    CAST((julianday('now') - julianday(c.last_seen_at)) * 86400 AS INTEGER) as seconds_since_last_seen,
    m.total_capacity,
    m.used_capacity,
    m.free_capacity,
    m.utilization_percent,
    m.growth_rate
FROM clients c
LEFT JOIN (
    SELECT m1.*
    FROM metrics m1
    INNER JOIN (
        SELECT client_id, MAX(recorded_at) as max_time
        FROM metrics
        GROUP BY client_id
    ) m2 ON m1.client_id = m2.client_id AND m1.recorded_at = m2.max_time
) m ON c.client_id = m.client_id;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Base de datos inicializada correctamente.' as status;
SELECT COUNT(*) as total_tables FROM sqlite_master WHERE type='table';
SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;
```

---

## 8. ESTIMACIÓN DE CRECIMIENTO DE LA BASE DE DATOS

### 8.1 Cálculo de Tamaño

**Asunciones:**
- 9 clientes enviando métricas cada 30 segundos
- 24/7 operación
- Retención de 30 días para métricas

**Cálculo:**
```
Métricas por cliente por día = (86400 segundos / 30 segundos) = 2,880 métricas
Métricas totales por día = 2,880 × 9 = 25,920 métricas
Métricas en 30 días = 25,920 × 30 = 777,600 métricas
```

**Tamaño por registro:**
```
Tabla metrics:
- id: 4 bytes (INTEGER)
- client_id: 20 bytes (VARCHAR)
- capacities (3 campos): 24 bytes (3 × BIGINT)
- utilization_percent: 8 bytes (DECIMAL)
- growth_rate: 8 bytes (DECIMAL)
- timestamps: 16 bytes (2 × TIMESTAMP)
Total por registro: ~80 bytes

Tamaño estimado tabla metrics (30 días):
777,600 registros × 80 bytes = 62,208,000 bytes ≈ 59 MB
```

**Con índices (overhead 30%):**
```
Total estimado: 59 MB × 1.3 ≈ 77 MB
```

**Otras tablas:**
- clients: < 1 MB
- global_metrics: < 5 MB (30 días)
- sent_messages: Variable, ~2-10 MB
- availability_events: < 5 MB

**Total estimado de BD después de 30 días: ~100 MB**

---

## 9. BACKUP Y RECUPERACIÓN

### 9.1 Script de Backup (SQLite)

```bash
#!/bin/bash
# backup_database.sh

DB_PATH="./data/storage_cluster.db"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/storage_cluster_$TIMESTAMP.db"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Backup usando SQLite
sqlite3 $DB_PATH ".backup '$BACKUP_FILE'"

# Comprimir backup
gzip $BACKUP_FILE

echo "Backup completado: ${BACKUP_FILE}.gz"

# Eliminar backups más antiguos de 7 días
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

### 9.2 Script de Restore

```bash
#!/bin/bash
# restore_database.sh

BACKUP_FILE=$1
DB_PATH="./data/storage_cluster.db"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore_database.sh <archivo_backup.db.gz>"
    exit 1
fi

# Descomprimir
gunzip -c $BACKUP_FILE > /tmp/restore.db

# Restaurar
cp /tmp/restore.db $DB_PATH

echo "Base de datos restaurada desde: $BACKUP_FILE"
```

---

**Documento generado:** Marzo 2, 2026  
**Versión:** 1.0  
**Estado:** COMPLETO
