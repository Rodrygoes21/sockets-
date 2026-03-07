# Storage Cluster Server - MongoDB Setup

Sistema de persistencia de datos con MongoDB para el Storage Cluster Server.

## 📋 Características

- ✅ Conexión a MongoDB con driver nativo
- ✅ 3 Colecciones principales: `clients`, `metrics`, `messages`
- ✅ CRUD completo (Create, Read, Update)
- ✅ Persistencia de métricas en tiempo real
- ✅ Registro de clientes conectados
- ✅ Historial de mensajes
- ✅ Índices optimizados para búsquedas
- ✅ TTL (Time To Live) para limpieza automática
- ✅ Agregaciones y estadísticas

## 📦 Colecciones

### 1. **clients** - Clientes Conectados
```javascript
{
  clientId: "CLIENT_1",
  address: "::1:52473",
  connectedAt: ISODate("2026-03-07T15:00:00Z"),
  status: "connected", // connected | disconnected
  lastSeen: ISODate("2026-03-07T15:30:00Z"),
  disconnectedAt: ISODate("2026-03-07T16:00:00Z"), // opcional
  disconnectReason: "Client closed connection", // opcional
  createdAt: ISODate("2026-03-07T15:00:00Z")
}
```

**Índices:**
- `clientId` (único)
- `status`
- `connectedAt`

### 2. **metrics** - Métricas de Disco
```javascript
{
  clientId: "CLIENT_1",
  metrics: {
    total_capacity: 249049084,
    used_capacity: 205824144,
    free_capacity: 43224940,
    utilization_percent: 82.64,
    growth_rate: 10.5
  },
  receivedAt: ISODate("2026-03-07T15:00:00Z"),
  timestamp: ISODate("2026-03-07T15:00:00Z")
}
```

**Índices:**
- `clientId`
- `receivedAt` (descendente)
- `clientId + receivedAt` (compuesto)
- `timestamp` con TTL de 30 días

### 3. **messages** - Historial de Mensajes
```javascript
{
  clientId: "CLIENT_1",
  direction: "sent", // sent | received
  messageType: "SERVER_NOTIFICATION",
  messageId: 1234567890,
  content: "Mensaje del servidor",
  timestamp: ISODate("2026-03-07T15:00:00Z"),
  createdAt: ISODate("2026-03-07T15:00:00Z")
}
```

**Índices:**
- `clientId`
- `timestamp` (descendente)
- `messageType`
- `clientId + timestamp` (compuesto)
- `timestamp` con TTL de 30 días

## 🚀 Instalación

### Prerequisitos

1. **MongoDB instalado** (versión 5.0+)
   ```powershell
   # Descargar desde: https://www.mongodb.com/try/download/community
   # o instalar con chocolatey
   choco install mongodb
   ```

2. **Iniciar MongoDB**
   ```powershell
   # Windows - iniciar servicio
   net start MongoDB
   
   # o manualmente
   mongod --dbpath C:\data\db
   ```

### Setup del Proyecto

```powershell
# 1. Instalar dependencias
cd server
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# 3. Inicializar base de datos
npm run init-db
```

## ⚙️ Configuración

Edita el archivo `.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=storage_cluster

# Habilitar persistencia
ENABLE_DB_PERSISTENCE=true
```

## 🔧 API de DatabaseManager

### Conexión

```javascript
const DatabaseManager = require('./database/db');
const db = new DatabaseManager('mongodb://localhost:27017', 'storage_cluster');

await db.connect();
```

### CRUD - Clientes

```javascript
// Registrar cliente
await db.registerClient({
  clientId: 'CLIENT_1',
  address: '::1:52473',
  connectedAt: new Date()
});

// Actualizar estado
await db.updateClientStatus('CLIENT_1', 'connected');

// Obtener cliente
const client = await db.getClient('CLIENT_1');

// Obtener todos
const clients = await db.getAllClients();

// Desconectar
await db.disconnectClient('CLIENT_1', 'Timeout');
```

### CRUD - Métricas

```javascript
// Guardar métricas
await db.saveMetrics({
  clientId: 'CLIENT_1',
  metrics: {
    total_capacity: 500000,
    used_capacity: 300000,
    free_capacity: 200000,
    utilization_percent: 60.0,
    growth_rate: 10.5
  },
  receivedAt: Date.now()
});

// Obtener últimas métricas
const metrics = await db.getLatestMetrics('CLIENT_1', 10);

// Métricas por rango de fechas
const rangeMetrics = await db.getMetricsByDateRange(
  'CLIENT_1',
  '2026-03-07T00:00:00Z',
  '2026-03-07T23:59:59Z'
);

// Estadísticas
const stats = await db.getMetricsStats('CLIENT_1');
// { avgUtilization, maxUtilization, minUtilization, avgGrowthRate }
```

### CRUD - Mensajes

```javascript
// Guardar mensaje
await db.saveMessage({
  clientId: 'CLIENT_1',
  direction: 'sent',
  messageType: 'SERVER_NOTIFICATION',
  messageId: Date.now(),
  content: 'Mensaje de ejemplo',
  timestamp: Date.now()
});

// Obtener mensajes del cliente
const messages = await db.getClientMessages('CLIENT_1', 50);

// Mensajes por tipo
const notifications = await db.getMessagesByType('SERVER_NOTIFICATION');

// Contar mensajes
const count = await db.getMessageCount('CLIENT_1');
// { sent: 10, received: 15, total: 25 }
```

### Mantenimiento

```javascript
// Limpiar registros antiguos (>30 días)
await db.cleanOldRecords(30);

// Estadísticas generales
const stats = await db.getDatabaseStats();
// { clients: 5, metrics: 150, messages: 200, connectedClients: 3 }
```

## 📝 Scripts Disponibles

```powershell
# Inicializar base de datos (crea colecciones e índices)
npm run init-db

# Iniciar servidor con DB
npm start

# Modo desarrollo
npm run dev
```

## 🧪 Pruebas

### Verificar MongoDB está corriendo

```powershell
# Conectar con mongo shell
mongosh

# Usar la base de datos
use storage_cluster

# Ver colecciones
show collections

# Ver datos
db.clients.find().pretty()
db.metrics.find().limit(5).pretty()
db.messages.find().limit(5).pretty()
```

### Insertar datos de prueba

El script `init-db.js` ya inserta datos de prueba automáticamente:
- 1 cliente de prueba
- 1 registro de métricas
- 1 mensaje de prueba

## 📊 Story Points: 5

### Tareas Completadas ✅

1. ✅ Conexión MongoDB con driver nativo
2. ✅ 3 colecciones: clients, metrics, messages
3. ✅ CRUD básico (insert, find, update)
4. ✅ Guardar métricas en MongoDB
5. ✅ Guardar mensajes enviados
6. ✅ Registrar clientes conectados

### Criterios de Aceptación ✅

- ✅ MongoDB conectado correctamente
- ✅ Métricas se guardan en DB
- ✅ Clientes registrados en DB
- ✅ Mensajes persistidos

## 🔍 Monitoreo

### Ver logs de MongoDB
```powershell
# Windows
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 50 -Wait
```

### Verificar tamaño de colecciones
```javascript
// En mongosh
db.clients.stats()
db.metrics.stats()
db.messages.stats()
```

## 🐛 Troubleshooting

### MongoDB no inicia
```powershell
# Verificar servicio
Get-Service MongoDB

# Iniciar servicio
net start MongoDB

# Verificar puerto
netstat -ano | findstr :27017
```

### Error de conexión
- Verificar que MongoDB está corriendo
- Verificar URI de conexión en `.env`
- Verificar firewall no bloquea puerto 27017

### Colecciones no se crean
```powershell
# Ejecutar script de inicialización
npm run init-db
```

## 📚 Recursos

- [MongoDB Node Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [MongoDB CRUD Operations](https://www.mongodb.com/docs/manual/crud/)
- [Indexes](https://www.mongodb.com/docs/manual/indexes/)
- [TTL Indexes](https://www.mongodb.com/docs/manual/core/index-ttl/)
- [Aggregation](https://www.mongodb.com/docs/manual/aggregation/)

## 🔐 Seguridad (Producción)

Para producción, configurar:
- Autenticación de MongoDB
- Conexión con usuario/password
- Cambiar URI en `.env`:

```env
MONGODB_URI=mongodb://username:password@localhost:27017
```

## 📈 Optimizaciones Futuras

- [ ] Conexión pool configurado
- [ ] Backup automático de datos
- [ ] Réplicas para alta disponibilidad
- [ ] Sharding para escalabilidad
- [ ] Validación de schemas con JSON Schema
