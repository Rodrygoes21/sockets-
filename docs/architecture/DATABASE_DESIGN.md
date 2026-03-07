# DISEÑO DE BASE DE DATOS - MONGODB

## STORAGE CLUSTER CON NODO CENTRAL DE MONITOREO

**Base de Datos:** MongoDB 6.0+  
**Driver:** mongodb para Node.js  
**Fecha:** Marzo 2, 2026

---

## 1. VISIÓN GENERAL

### 1.1 Base de Datos

```javascript
// Nombre de la base de datos
const DATABASE_NAME = "storage_cluster";

// Colecciones principales
const COLLECTIONS = {
  clients: "clients",
  metrics: "metrics",
  globalMetrics: "globalMetrics",
  sentMessages: "sentMessages",
  availabilityEvents: "availabilityEvents"
};
```

### 1.2 Ventajas de MongoDB para Este Proyecto

| Característica | Beneficio |
|----------------|-----------|
| **Schema flexible** | Permite evolución de métricas sin migraciones complejas |
| **JSON nativo** | Los mensajes TCP ya están en JSON, almacenamiento directo |
| **Aggregation Pipeline** | Cálculos de métricas globales eficientes |
| **Escalabilidad horizontal** | Preparado para crecer de 9 a más clientes |
| **Indexación eficiente** | Búsquedas optimizadas por cliente y timestamp |

---

## 2. SCHEMAS DE COLECCIONES

### 2.1 Colección: `clients`

**Descripción:** Información de los 9 nodos clientes conectados

**Schema:**
```javascript
{
  _id: ObjectId("..."),
  client_id: "CLIENT_001",              // String, único, requerido
  client_name: "Servidor Regional Norte", // String
  ip_address: "192.168.1.10",           // String
  hostname: "SERVER-REGIONAL-01",       // String
  status: "UP",                         // Enum: ['UP', 'DOWN', 'DISCONNECTED']
  connected_at: ISODate("2026-03-02T10:00:00Z"), // Date
  last_seen_at: ISODate("2026-03-02T14:30:45Z"), // Date
  uptime_seconds: 15845,                // Number (int)
  downtime_seconds: 120,                // Number (int)
  last_metric: {                        // Subdocumento (última métrica)
    total_capacity: 1099511627776,
    used_capacity: 659706977280,
    free_capacity: 439804650496,
    utilization_percent: 60.0,
    recorded_at: ISODate("2026-03-02T14:30:45Z")
  },
  created_at: ISODate("2026-03-02T10:00:00Z"),
  updated_at: ISODate("2026-03-02T14:30:45Z")
}
```

**Índices:**
```javascript
db.clients.createIndex({ "client_id": 1 }, { unique: true });
db.clients.createIndex({ "status": 1 });
db.clients.createIndex({ "last_seen_at": -1 });
```

**Validación de Schema:**
```javascript
db.createCollection("clients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["client_id", "status", "ip_address"],
      properties: {
        client_id: {
          bsonType: "string",
          pattern: "^CLIENT_[0-9]{3}$",
          description: "ID del cliente: CLIENT_001 a CLIENT_009"
        },
        status: {
          enum: ["UP", "DOWN", "DISCONNECTED"],
          description: "Estado del cliente"
        },
        ip_address: {
          bsonType: "string",
          description: "Dirección IP del cliente"
        },
        uptime_seconds: {
          bsonType: "int",
          minimum: 0
        },
        downtime_seconds: {
          bsonType: "int",
          minimum: 0
        }
      }
    }
  }
});
```

---

### 2.2 Colección: `metrics`

**Descripción:** Historial de métricas de disco de cada cliente

**Schema:**
```javascript
{
  _id: ObjectId("..."),
  client_id: "CLIENT_001",              // String, requerido
  total_capacity: 1099511627776,        // Number (long) en bytes
  used_capacity: 659706977280,          // Number (long) en bytes
  free_capacity: 439804650496,          // Number (long) en bytes
  utilization_percent: 60.0,            // Number (double), 0-100
  growth_rate_mb_per_hour: 125.5,       // Number (double), puede ser negativo
  recorded_at: ISODate("2026-03-02T14:30:45Z"), // Date
  received_at: ISODate("2026-03-02T14:30:45.300Z") // Date (timestamp del servidor)
}
```

**Índices:**
```javascript
// Consultas de métricas por cliente ordenadas por fecha
db.metrics.createIndex({ "client_id": 1, "recorded_at": -1 });

// Búsqueda global de últimas métricas
db.metrics.createIndex({ "recorded_at": -1 });

// Índice compuesto para agregaciones
db.metrics.createIndex({ "client_id": 1, "recorded_at": 1 });
```

**TTL Index (Limpieza automática de datos antiguos):**
```javascript
// Eliminar métricas después de 30 días
db.metrics.createIndex(
  { "recorded_at": 1 }, 
  { expireAfterSeconds: 2592000 }  // 30 días = 2,592,000 segundos
);
```

**Ejemplo de inserción:**
```javascript
const metricsDAO = new MetricsDAO(db);

await metricsDAO.insertMetric({
  client_id: "CLIENT_001",
  total_capacity: 1099511627776,
  used_capacity: 659706977280,
  free_capacity: 439804650496,
  utilization_percent: 60.0,
  growth_rate_mb_per_hour: 125.5,
  recorded_at: new Date(),
  received_at: new Date()
});
```

---

### 2.3 Colección: `globalMetrics`

**Descripción:** Métricas agregadas del cluster completo

**Schema:**
```javascript
{
  _id: ObjectId("..."),
  total_capacity_global: 9895604649984,  // Number (long) suma de todos los clientes UP
  used_capacity_global: 5937362789990,   // Number (long)
  free_capacity_global: 3958241859994,   // Number (long)
  utilization_percent_global: 60.0,      // Number (double)
  growth_rate_global_mb_per_hour: 1130.5, // Number (double)
  clients_up: 8,                         // Number (int)
  clients_down: 1,                       // Number (int)
  calculated_at: ISODate("2026-03-02T14:30:50Z"), // Date
  detailed_clients: [                    // Array de objetos con info de cada cliente
    {
      client_id: "CLIENT_001",
      status: "UP",
      utilization_percent: 60.0,
      total_capacity: 1099511627776
    },
    // ... más clientes
  ]
}
```

**Índices:**
```javascript
// Obtener métricas globales más recientes
db.globalMetrics.createIndex({ "calculated_at": -1 });
```

**Cálculo con Aggregation Pipeline:**
```javascript
async function calculateAndStoreGlobalMetrics(db) {
  const activeClients = await db.collection('clients').aggregate([
    { $match: { status: 'UP' } },
    { $project: {
        client_id: 1,
        'last_metric.total_capacity': 1,
        'last_metric.used_capacity': 1,
        'last_metric.free_capacity': 1,
        'last_metric.utilization_percent': 1
      }
    }
  ]).toArray();
  
  const globalMetrics = {
    total_capacity_global: 0,
    used_capacity_global: 0,
    free_capacity_global: 0,
    clients_up: activeClients.length,
    clients_down: await db.collection('clients').countDocuments({ status: 'DOWN' }),
    calculated_at: new Date(),
    detailed_clients: []
  };
  
  for (const client of activeClients) {
    const metric = client.last_metric || {};
    globalMetrics.total_capacity_global += metric.total_capacity || 0;
    globalMetrics.used_capacity_global += metric.used_capacity || 0;
    globalMetrics.free_capacity_global += metric.free_capacity || 0;
    
    globalMetrics.detailed_clients.push({
      client_id: client.client_id,
      status: 'UP',
      utilization_percent: metric.utilization_percent || 0,
      total_capacity: metric.total_capacity || 0
    });
  }
  
  if (globalMetrics.total_capacity_global > 0) {
    globalMetrics.utilization_percent_global = 
      (globalMetrics.used_capacity_global / globalMetrics.total_capacity_global) * 100;
  }
  
  await db.collection('globalMetrics').insertOne(globalMetrics);
  return globalMetrics;
}
```

---

### 2.4 Colección: `sentMessages`

**Descripción:** Mensajes enviados desde el servidor a los clientes

**Schema:**
```javascript
{
  _id: ObjectId("..."),
  message_id: "MSG_1709390100_a3f2e1c4", // String, único
  client_id: "CLIENT_001",               // String, requerido
  content: "Sistema funcionando correctamente", // String
  status: "PENDING",                     // Enum: ['PENDING', 'ACKNOWLEDGED', 'TIMEOUT']
  sent_at: ISODate("2026-03-02T14:35:00Z"), // Date
  ack_received_at: null,                 // Date o null
  timeout_at: ISODate("2026-03-02T14:35:30Z"), // Date (sent_at + 30s)
  attempts: 1,                           // Number (int)
  metadata: {                            // Subdocumento opcional
    priority: "normal",
    category: "notification"
  }
}
```

**Índices:**
```javascript
db.sentMessages.createIndex({ "message_id": 1 }, { unique: true });
db.sentMessages.createIndex({ "client_id": 1, "sent_at": -1 });
db.sentMessages.createIndex({ "status": 1, "sent_at": -1 });

// Para buscar mensajes pendientes que expiraron
db.sentMessages.createIndex({ "status": 1, "timeout_at": 1 });
```

**Ejemplo de uso:**
```javascript
// Enviar mensaje y registrar
const messageId = `MSG_${Date.now()}_${generateRandomHash()}`;
await db.collection('sentMessages').insertOne({
  message_id: messageId,
  client_id: "CLIENT_001",
  content: "Alerta: Utilización >90%",
  status: "PENDING",
  sent_at: new Date(),
  ack_received_at: null,
  timeout_at: new Date(Date.now() + 30000), // 30 segundos
  attempts: 1,
  metadata: {
    priority: "high",
    category: "alert"
  }
});

// Actualizar cuando se recibe ACK
await db.collection('sentMessages').updateOne(
  { message_id: messageId },
  { 
    $set: { 
      status: "ACKNOWLEDGED",
      ack_received_at: new Date()
    }
  }
);
```

---

### 2.5 Colección: `availabilityEvents`

**Descripción:** Historial de cambios de estado de los clientes (UP ↔ DOWN)

**Schema:**
```javascript
{
  _id: ObjectId("..."),
  client_id: "CLIENT_001",              // String, requerido
  event_type: "DOWN",                   // Enum: ['UP', 'DOWN']
  event_timestamp: ISODate("2026-03-02T14:40:00Z"), // Date
  previous_state: "UP",                 // String o null
  duration_seconds: 120,                // Number (int), duración en el estado previo
  reason: "TIMEOUT_EXCEEDED",           // String (opcional)
  metadata: {                           // Subdocumento opcional
    last_seen_at: ISODate("2026-03-02T14:38:30Z"),
    timeout_threshold: 105
  }
}
```

**Índices:**
```javascript
// Consultas de disponibilidad por cliente y rango de fechas
db.availabilityEvents.createIndex({ "client_id": 1, "event_timestamp": 1 });

// Búsqueda de eventos recientes
db.availabilityEvents.createIndex({ "event_timestamp": -1 });
```

**TTL Index:**
```javascript
// Eliminar eventos después de 90 días
db.availabilityEvents.createIndex(
  { "event_timestamp": 1 }, 
  { expireAfterSeconds: 7776000 }  // 90 días
);
```

**Ejemplo de registro:**
```javascript
async function logStateChange(db, clientId, newState, previousState) {
  const event = {
    client_id: clientId,
    event_type: newState,
    event_timestamp: new Date(),
    previous_state: previousState,
    reason: newState === 'DOWN' ? 'TIMEOUT_EXCEEDED' : 'METRICS_RECEIVED'
  };
  
  await db.collection('availabilityEvents').insertOne(event);
}
```

---

## 3. DATA ACCESS OBJECTS (DAOs)

### 3.1 ClientsDAO

```javascript
// ClientsDAO.js
class ClientsDAO {
  constructor(db) {
    this.collection = db.collection('clients');
  }
  
  async registerClient(clientData) {
    const client = {
      client_id: clientData.client_id,
      client_name: clientData.client_name || `Cliente ${clientData.client_id}`,
      ip_address: clientData.ip_address,
      hostname: clientData.hostname,
      status: 'UP',
      connected_at: new Date(),
      last_seen_at: new Date(),
      uptime_seconds: 0,
      downtime_seconds: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await this.collection.updateOne(
      { client_id: client.client_id },
      { $set: client },
      { upsert: true }
    );
    
    return client;
  }
  
  async updateLastSeen(clientId) {
    await this.collection.updateOne(
      { client_id: clientId },
      { 
        $set: { 
          last_seen_at: new Date(),
          updated_at: new Date()
        }
      }
    );
  }
  
  async updateStatus(clientId, status) {
    await this.collection.updateOne(
      { client_id: clientId },
      { 
        $set: { 
          status,
          updated_at: new Date()
        }
      }
    );
  }
  
  async updateLastMetric(clientId, metric) {
    await this.collection.updateOne(
      { client_id: clientId },
      { 
        $set: { 
          last_metric: metric,
          updated_at: new Date()
        }
      }
    );
  }
  
  async getClientsByStatus(status) {
    return await this.collection.find({ status }).toArray();
  }
  
  async getAllClients() {
    return await this.collection.find().toArray();
  }
  
  async getClient(clientId) {
    return await this.collection.findOne({ client_id: clientId });
  }
}

module.exports = ClientsDAO;
```

---

### 3.2 MetricsDAO

```javascript
// MetricsDAO.js
class MetricsDAO {
  constructor(db) {
    this.collection = db.collection('metrics');
  }
  
  async insertMetric(metric) {
    const doc = {
      ...metric,
      received_at: new Date()
    };
    
    const result = await this.collection.insertOne(doc);
    return result.insertedId;
  }
  
  async getLatestMetric(clientId) {
    const metrics = await this.collection
      .find({ client_id: clientId })
      .sort({ recorded_at: -1 })
      .limit(1)
      .toArray();
    
    return metrics[0] || null;
  }
  
  async getMetricsInWindow(clientId, hoursBack) {
    const startTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    
    return await this.collection
      .find({
        client_id: clientId,
        recorded_at: { $gte: startTime }
      })
      .sort({ recorded_at: 1 })
      .toArray();
  }
  
  async getMetricsByDateRange(clientId, startDate, endDate) {
    return await this.collection
      .find({
        client_id: clientId,
        recorded_at: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ recorded_at: 1 })
      .toArray();
  }
  
  async getAllLatestMetrics() {
    return await this.collection.aggregate([
      { $sort: { recorded_at: -1 } },
      { 
        $group: {
          _id: "$client_id",
          latestMetric: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestMetric" } }
    ]).toArray();
  }
}

module.exports = MetricsDAO;
```

---

### 3.3 GlobalMetricsDAO

```javascript
// GlobalMetricsDAO.js
class GlobalMetricsDAO {
  constructor(db) {
    this.collection = db.collection('globalMetrics');
  }
  
  async getLatest() {
    const metrics = await this.collection
      .find()
      .sort({ calculated_at: -1 })
      .limit(1)
      .toArray();
    
    return metrics[0] || null;
  }
  
  async getHistory(limit = 100) {
    return await this.collection
      .find()
      .sort({ calculated_at: -1 })
      .limit(limit)
      .toArray();
  }
  
  async insertGlobalMetrics(metrics) {
    const result = await this.collection.insertOne(metrics);
    return result.insertedId;
  }
}

module.exports = GlobalMetricsDAO;
```

---

### 3.4 SentMessagesDAO

```javascript
// SentMessagesDAO.js
class SentMessagesDAO {
  constructor(db) {
    this.collection = db.collection('sentMessages');
  }
  
  async createMessage(messageData) {
    const message = {
      message_id: messageData.message_id,
      client_id: messageData.client_id,
      content: messageData.content,
      status: 'PENDING',
      sent_at: new Date(),
      ack_received_at: null,
      timeout_at: new Date(Date.now() + 30000), // 30s timeout
      attempts: 1,
      metadata: messageData.metadata || {}
    };
    
    await this.collection.insertOne(message);
    return message;
  }
  
  async markAsAcknowledged(messageId) {
    await this.collection.updateOne(
      { message_id: messageId },
      { 
        $set: { 
          status: 'ACKNOWLEDGED',
          ack_received_at: new Date()
        }
      }
    );
  }
  
  async markAsTimeout(messageId) {
    await this.collection.updateOne(
      { message_id: messageId },
      { $set: { status: 'TIMEOUT' } }
    );
  }
  
  async getPendingMessages() {
    return await this.collection
      .find({ status: 'PENDING' })
      .sort({ sent_at: 1 })
      .toArray();
  }
  
  async getMessagesByClient(clientId, limit = 50) {
    return await this.collection
      .find({ client_id: clientId })
      .sort({ sent_at: -1 })
      .limit(limit)
      .toArray();
  }
}

module.exports = SentMessagesDAO;
```

---

### 3.5 AvailabilityEventsDAO

```javascript
// AvailabilityEventsDAO.js
class AvailabilityEventsDAO {
  constructor(db) {
    this.collection = db.collection('availabilityEvents');
  }
  
  async logEvent(eventData) {
    const event = {
      client_id: eventData.client_id,
      event_type: eventData.event_type,
      event_timestamp: new Date(),
      previous_state: eventData.previous_state || null,
      reason: eventData.reason || null,
      metadata: eventData.metadata || {}
    };
    
    await this.collection.insertOne(event);
    return event;
  }
  
  async getEventsInWindow(clientId, hoursBack) {
    const startTime = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    
    return await this.collection
      .find({
        client_id: clientId,
        event_timestamp: { $gte: startTime }
      })
      .sort({ event_timestamp: 1 })
      .toArray();
  }
  
  async getRecentEvents(limit = 100) {
    return await this.collection
      .find()
      .sort({ event_timestamp: -1 })
      .limit(limit)
      .toArray();
  }
}

module.exports = AvailabilityEventsDAO;
```

---

## 4. SCRIPT DE INICIALIZACIÓN

### 4.1 init_database.js

```javascript
// init_database.js - Inicialización de la base de datos MongoDB
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'storage_cluster';

async function initializeDatabase() {
  const client = new MongoClient(MONGO_URL);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');
    
    const db = client.db(DB_NAME);
    
    // 1. Crear colección 'clients' con validación
    console.log('\n📦 Creando colección: clients');
    try {
      await db.createCollection('clients', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['client_id', 'status', 'ip_address'],
            properties: {
              client_id: {
                bsonType: 'string',
                pattern: '^CLIENT_[0-9]{3}$'
              },
              status: {
                enum: ['UP', 'DOWN', 'DISCONNECTED']
              },
              ip_address: { bsonType: 'string' },
              uptime_seconds: { bsonType: 'int', minimum: 0 },
              downtime_seconds: { bsonType: 'int', minimum: 0 }
            }
          }
        }
      });
      console.log('   ✓ Colección clients creada');
    } catch (err) {
      if (err.codeName === 'NamespaceExists') {
        console.log('   ⚠️  Colección clients ya existe');
      } else {
        throw err;
      }
    }
    
    // Crear índices para clients
    await db.collection('clients').createIndex({ client_id: 1 }, { unique: true });
    await db.collection('clients').createIndex({ status: 1 });
    await db.collection('clients').createIndex({ last_seen_at: -1 });
    console.log('   ✓ Índices creados para clients');
    
    // 2. Crear colección 'metrics'
    console.log('\n📦 Creando colección: metrics');
    await db.createCollection('metrics').catch(() => {});
    
    // Índices para metrics
    await db.collection('metrics').createIndex({ client_id: 1, recorded_at: -1 });
    await db.collection('metrics').createIndex({ recorded_at: -1 });
    
    // TTL Index: eliminar métricas después de 30 días
    await db.collection('metrics').createIndex(
      { recorded_at: 1 },
      { expireAfterSeconds: 2592000 }
    );
    console.log('   ✓ Índices creados para metrics (con TTL 30 días)');
    
    // 3. Crear colección 'globalMetrics'
    console.log('\n📦 Creando colección: globalMetrics');
    await db.createCollection('globalMetrics').catch(() => {});
    await db.collection('globalMetrics').createIndex({ calculated_at: -1 });
    console.log('   ✓ Índices creados para globalMetrics');
    
    // 4. Crear colección 'sentMessages'
    console.log('\n📦 Creando colección: sentMessages');
    await db.createCollection('sentMessages').catch(() => {});
    await db.collection('sentMessages').createIndex({ message_id: 1 }, { unique: true });
    await db.collection('sentMessages').createIndex({ client_id: 1, sent_at: -1 });
    await db.collection('sentMessages').createIndex({ status: 1, sent_at: -1 });
    await db.collection('sentMessages').createIndex({ status: 1, timeout_at: 1 });
    console.log('   ✓ Índices creados para sentMessages');
    
    // 5. Crear colección 'availabilityEvents'
    console.log('\n📦 Creando colección: availabilityEvents');
    await db.createCollection('availabilityEvents').catch(() => {});
    await db.collection('availabilityEvents').createIndex({ client_id: 1, event_timestamp: 1 });
    await db.collection('availabilityEvents').createIndex({ event_timestamp: -1 });
    
    // TTL Index: eliminar eventos después de 90 días
    await db.collection('availabilityEvents').createIndex(
      { event_timestamp: 1 },
      { expireAfterSeconds: 7776000 }
    );
    console.log('   ✓ Índices creados para availabilityEvents (con TTL 90 días)');
    
    // 6. Insertar datos de prueba (opcional)
    console.log('\n🌱 Insertando datos de prueba...');
    const clientsCount = await db.collection('clients').countDocuments();
    
    if (clientsCount === 0) {
      const testClients = [];
      for (let i = 1; i <= 9; i++) {
        testClients.push({
          client_id: `CLIENT_${String(i).padStart(3, '0')}`,
          client_name: `Servidor Regional ${i}`,
          ip_address: `192.168.1.${10 + i}`,
          hostname: `SERVER-REG-${String(i).padStart(2, '0')}`,
          status: 'DISCONNECTED',
          connected_at: null,
          last_seen_at: null,
          uptime_seconds: 0,
          downtime_seconds: 0,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      await db.collection('clients').insertMany(testClients);
      console.log(`   ✓ ${testClients.length} clientes de prueba insertados`);
    } else {
      console.log('   ⚠️  Ya existen clientes en la base de datos');
    }
    
    console.log('\n✅ Base de datos inicializada correctamente');
    console.log('\n📊 Resumen de colecciones:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`   • ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar si es el script principal
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
```

**Uso:**
```bash
# Instalar dependencias
npm install mongodb

# Configurar variable de entorno (opcional)
export MONGO_URL="mongodb://localhost:27017"

# Ejecutar script
node init_database.js
```

---

## 5. BACKUPS Y MANTENIMIENTO

### 5.1 Script de Backup

```javascript
// backup.js - Backup de MongoDB
const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'storage_cluster';
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}`);
  
  // Crear directorio de backups si no existe
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  console.log(`📦 Creando backup en: ${backupPath}`);
  
  const command = `mongodump --uri="${MONGO_URL}" --db=${DB_NAME} --out="${backupPath}"`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error al crear backup:', error);
        reject(error);
      } else {
        console.log('✅ Backup creado exitosamente');
        console.log(stdout);
        resolve(backupPath);
      }
    });
  });
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
```

### 5.2 Script de Restore

```javascript
// restore.js - Restaurar backup de MongoDB
const { exec } = require('child_process');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'storage_cluster';

async function restoreBackup(backupPath) {
  console.log(`📥 Restaurando desde: ${backupPath}`);
  
  const command = `mongorestore --uri="${MONGO_URL}" --db=${DB_NAME} "${backupPath}/${DB_NAME}"`;
  
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error al restaurar:', error);
        reject(error);
      } else {
        console.log('✅ Backup restaurado exitosamente');
        console.log(stdout);
        resolve();
      }
    });
  });
}

// Uso: node restore.js ./backups/backup_2026-03-02T10-00-00
if (require.main === module) {
  const backupPath = process.argv[2];
  if (!backupPath) {
    console.error('❌ Debe especificar la ruta del backup');
    console.log('Uso: node restore.js <ruta_backup>');
    process.exit(1);
  }
  restoreBackup(backupPath);
}

module.exports = { restoreBackup };
```

---

## 6. CONSULTAS ÚTILES

### 6.1 Consultas Administrativas

```javascript
// Obtener todos los clientes activos
const activeClients = await db.collection('clients')
  .find({ status: 'UP' })
  .toArray();

// Contar métricas por cliente
const metricsCounts = await db.collection('metrics').aggregate([
  { $group: {
      _id: '$client_id',
      count: { $sum: 1 },
      avgUtilization: { $avg: '$utilization_percent' }
    }
  },
  { $sort: { count: -1 } }
]).toArray();

// Clientes con utilización >80%
const highUtilClients = await db.collection('clients').find({
  'last_metric.utilization_percent': { $gt: 80 }
}).toArray();

// Mensajes sin ACK
const pendingMessages = await db.collection('sentMessages')
  .find({ 
    status: 'PENDING',
    timeout_at: { $lt: new Date() }
  })
  .toArray();

// Availability en las últimas 24h
const last24h = new Date(Date.now() - (24 * 60 * 60 * 1000));
const availabilityEvents = await db.collection('availabilityEvents')
  .find({
    event_timestamp: { $gte: last24h }
  })
  .sort({ event_timestamp: 1 })
  .toArray();
```

### 6.2 Agregaciones Complejas

```javascript
// Métricas promedio por cliente en las últimas 24h
const avgMetrics = await db.collection('metrics').aggregate([
  { 
    $match: { 
      recorded_at: { $gte: new Date(Date.now() - (24 * 60 * 60 * 1000)) }
    }
  },
  {
    $group: {
      _id: '$client_id',
      avgUtilization: { $avg: '$utilization_percent' },
      avgGrowthRate: { $avg: '$growth_rate_mb_per_hour' },
      totalCapacity: { $max: '$total_capacity' },
      count: { $sum: 1 }
    }
  },
  { $sort: { avgUtilization: -1 } }
]).toArray();

// Timeline de disponibilidad
const availabilityTimeline = await db.collection('availabilityEvents').aggregate([
  { $match: { client_id: 'CLIENT_001' } },
  { $sort: { event_timestamp: 1 } },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$event_timestamp' } },
      events: { $push: '$$ROOT' },
      downs: { $sum: { $cond: [{ $eq: ['$event_type', 'DOWN'] }, 1, 0] } }
    }
  }
]).toArray();
```

---

## 7. POLÍTICAS DE RETENCIÓN

| Colección | Política | Implementación |
|-----------|----------|----------------|
| **clients** | Permanente | Sin TTL |
| **metrics** | 30 días | TTL Index en `recorded_at` |
| **globalMetrics** | 90 días | Limpieza manual o TTL opcional |
| **sentMessages** | 7 días | Limpieza programada |
| **availabilityEvents** | 90 días | TTL Index en `event_timestamp` |

**Script de limpieza manual:**
```javascript
// cleanup.js
async function cleanupOldData(db) {
  const now = new Date();
  
  // Limpiar métricas globales >90 días
  const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
  const result1 = await db.collection('globalMetrics').deleteMany({
    calculated_at: { $lt: ninetyDaysAgo }
  });
  console.log(`✅ ${result1.deletedCount} métricas globales eliminadas`);
  
  // Limpiar mensajes >7 días
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  const result2 = await db.collection('sentMessages').deleteMany({
    sent_at: { $lt: sevenDaysAgo }
  });
  console.log(`✅ ${result2.deletedCount} mensajes antiguos eliminados`);
}
```

---

## 8. RESUMEN DE VENTAJAS

| Característica | SQL/SQLite | MongoDB | Ganancia |
|----------------|------------|---------|----------|
| **Schema Evolution** | Requiere ALTER TABLE | Flexible por diseño | ⚡ Mayor agilidad |
| **JSON Handling** | Serialización manual | Nativo | ⚡ Menos código |
| **Agregaciones** | JOINs complejos | Pipeline intuitivo | ⚡ Más legible |
| **TTL Automático** | Trigger/Cron | Index built-in | ⚡ Sin código extra |
| **Escalabilidad** | Vertical | Horizontal | ⚡ Preparado para crecer |

---

**Documento generado:** Marzo 2, 2026  
**Versión:** 2.0 (MongoDB)  
**Estado:** COMPLETO
