# Storage Cluster Server - TCP

Servidor TCP para el sistema de Storage Cluster que gestiona conexiones de múltiples clientes y procesa métricas en tiempo real.

## 📋 Características

- ✅ Servidor TCP usando `net.createServer()`
- ✅ Gestión de 3-5 clientes simultáneos
- ✅ Identificación única de clientes (`clientId`)
- ✅ Recepción y procesamiento de métricas
- ✅ Mensajería bidireccional
- ✅ Sistema de ACKs (confirmaciones)
- ✅ Broadcasting a múltiples clientes
- ✅ Manejo robusto de errores y desconexiones

## 🚀 Inicio Rápido

### Instalación

```powershell
# Instalar dependencias (opcional, solo nodemon para desarrollo)
npm install
```

### Iniciar Servidor

```powershell
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev

# Con variables de entorno personalizadas
$env:PORT=6000; $env:MAX_CLIENTS=3; npm start
```

## ⚙️ Configuración

Crea un archivo `.env` basado en `.env.example`:

```env
PORT=5000
MAX_CLIENTS=5
```

## 📡 Protocolo de Comunicación

### Mensajes del Cliente al Servidor

#### 1. Métricas
```json
{
  "type": "METRICS",
  "messageId": 1234567890,
  "metrics": {
    "cpu": 45.5,
    "memory": 62.3,
    "disk": 78.1,
    "uptime": 3600
  }
}
```

#### 2. ACK (Confirmación)
```json
{
  "type": "ACK",
  "messageId": 1234567890
}
```

#### 3. Ping
```json
{
  "type": "PING"
}
```

#### 4. Solicitud de Estado
```json
{
  "type": "STATUS"
}
```

### Mensajes del Servidor al Cliente

#### 1. Conexión Exitosa
```json
{
  "type": "CONNECTED",
  "clientId": "CLIENT_1",
  "message": "Conexión establecida exitosamente",
  "timestamp": 1234567890
}
```

#### 2. ACK de Métricas
```json
{
  "type": "ACK",
  "messageId": 1234567890,
  "message": "Métricas recibidas correctamente",
  "timestamp": 1234567890
}
```

#### 3. Estado del Cliente
```json
{
  "type": "STATUS",
  "clientId": "CLIENT_1",
  "connectedAt": "2026-03-07T...",
  "metricsCount": 42,
  "pendingAcks": 0,
  "serverStats": {
    "totalClients": 3,
    "maxClients": 5,
    "uptime": 7200
  }
}
```

#### 4. Error
```json
{
  "type": "ERROR",
  "message": "Descripción del error",
  "timestamp": 1234567890
}
```

## 🏗️ Arquitectura

```
server/
├── src/
│   └── index.js          # Servidor principal (StorageClusterServer)
├── package.json          # Configuración del proyecto
├── .env.example          # Variables de entorno de ejemplo
└── README.md            # Esta documentación
```

## 🔧 API del Servidor

### Clase: `StorageClusterServer`

#### Constructor
```javascript
new StorageClusterServer(port = 5000, maxClients = 5)
```

#### Métodos

- `start()` - Inicia el servidor
- `stop()` - Detiene el servidor
- `sendMessage(clientId, message)` - Envía mensaje a un cliente específico
- `broadcast(message)` - Envía mensaje a todos los clientes
- `getClientsInfo()` - Obtiene información de todos los clientes

#### Eventos

- `started` - Servidor iniciado
- `clientConnected` - Nuevo cliente conectado
- `clientDisconnected` - Cliente desconectado
- `messageReceived` - Mensaje recibido de un cliente
- `metricsReceived` - Métricas recibidas
- `ackReceived` - ACK recibido
- `error` - Error del servidor

## 📊 Ejemplo de Uso

```javascript
const StorageClusterServer = require('./src/index.js');

const server = new StorageClusterServer(5000, 5);

// Escuchar eventos
server.on('clientConnected', ({ clientId, address }) => {
  console.log(`Cliente ${clientId} conectado desde ${address}`);
});

server.on('metricsReceived', ({ clientId, metrics }) => {
  console.log(`Métricas de ${clientId}:`, metrics);
});

// Iniciar servidor
server.start();

// Enviar mensaje a un cliente específico
server.sendMessage('CLIENT_1', {
  type: 'COMMAND',
  command: 'UPDATE_CONFIG',
  data: { interval: 5000 }
});

// Broadcast a todos
server.broadcast({
  type: 'ANNOUNCEMENT',
  message: 'Mantenimiento programado en 10 minutos'
});
```

## 🧪 Pruebas

Para probar el servidor, puedes usar el cliente incluido en el proyecto:

```powershell
# Terminal 1: Iniciar servidor
cd server
npm start

# Terminal 2: Iniciar cliente
cd ../client
npm start
```

## 📝 Notas Técnicas

- **Puerto por defecto**: 5000
- **Límite de clientes**: 3-5 (configurable)
- **Protocolo**: TCP/IP puro (sin HTTP/WebSocket)
- **Formato de mensajes**: JSON con delimitador `\n`
- **Identificación**: IDs secuenciales (`CLIENT_1`, `CLIENT_2`, ...)
- **Buffer de métricas**: Últimas 100 métricas por cliente

## 🔐 Seguridad

- Validación de formato de mensajes JSON
- Límite de clientes simultáneos
- Manejo de errores y reconexiones
- Timeout para ACKs pendientes (futuro)

## 📈 Story Points: 5

### Tareas Completadas ✅

1. ✅ Implementar `net.createServer()` en puerto 5000
2. ✅ Array (Map) para gestionar clientes conectados
3. ✅ Identificar clientes por `clientId`
4. ✅ Recibir y procesar métricas
5. ✅ Enviar mensajes a clientes específicos
6. ✅ Procesar ACKs

### Criterios de Aceptación ✅

- ✅ Acepta múltiples clientes simultáneos (3-5)
- ✅ Identifica y gestiona cada cliente
- ✅ Procesa métricas recibidas
- ✅ Envía mensajes bidireccionales

## 🐛 Troubleshooting

### Puerto en uso
```powershell
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Reiniciar servidor
```powershell
# Ctrl+C para detener
# npm start para reiniciar
```

## 📚 Recursos

- [Node.js net module](https://nodejs.org/api/net.html)
- [TCP Protocol](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)
- [Event Emitter](https://nodejs.org/api/events.html)
