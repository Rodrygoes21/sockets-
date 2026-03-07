# Storage Cluster API - REST

API REST para consumir datos del Storage Cluster desde aplicaciones frontend (React).

## 📋 Características

- ✅ Express.js en puerto 3000
- ✅ 4 Endpoints REST funcionales
- ✅ CORS habilitado para todas las rutas
- ✅ Consultas a MongoDB
- ✅ Respuestas JSON estructuradas
- ✅ Manejo de errores HTTP
- ✅ Validación de parámetros

## 🚀 Inicio Rápido

### Instalación

```powershell
cd server
npm install
```

### Iniciar API

```powershell
# Producción
npm run api

# Desarrollo (con auto-reload)
npm run api:dev

# Con puerto personalizado
$env:API_PORT=4000; npm run api
```

## ⚙️ Configuración

Variables de entorno en `.env`:

```env
API_PORT=3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=storage_cluster
```

## 📡 Endpoints

### 1. Health Check

```http
GET /
```

**Respuesta:**
```json
{
  "status": "OK",
  "service": "Storage Cluster API",
  "version": "1.0.0",
  "timestamp": "2026-03-07T15:00:00.000Z",
  "database": "connected"
}
```

---

### 2. Listar Clientes Activos

```http
GET /api/clients
```

**Query Parameters (opcionales):**
- `status` - Filtrar por estado: `connected` | `disconnected`

**Ejemplo:**
```http
GET /api/clients?status=connected
```

**Respuesta:**
```json
{
  "success": true,
  "count": 3,
  "clients": [
    {
      "clientId": "CLIENT_1",
      "address": "::1:52473",
      "status": "connected",
      "connectedAt": "2026-03-07T15:00:00.000Z",
      "lastSeen": "2026-03-07T15:30:00.000Z",
      "disconnectedAt": null,
      "disconnectReason": null
    },
    {
      "clientId": "CLIENT_2",
      "address": "::1:24048",
      "status": "connected",
      "connectedAt": "2026-03-07T15:05:00.000Z",
      "lastSeen": "2026-03-07T15:30:00.000Z",
      "disconnectedAt": null,
      "disconnectReason": null
    }
  ],
  "timestamp": "2026-03-07T15:30:00.000Z"
}
```

**Códigos de estado:**
- `200` - OK
- `500` - Error del servidor
- `503` - Base de datos no disponible

---

### 3. Últimas Métricas (Todos los Clientes)

```http
GET /api/metrics
```

**Query Parameters (opcionales):**
- `limit` - Número de métricas por cliente (default: 10)

**Ejemplo:**
```http
GET /api/metrics?limit=5
```

**Respuesta:**
```json
{
  "success": true,
  "clientsCount": 2,
  "data": [
    {
      "clientId": "CLIENT_1",
      "status": "connected",
      "metricsCount": 5,
      "metrics": [
        {
          "totalCapacity": 500000,
          "usedCapacity": 300000,
          "freeCapacity": 200000,
          "utilizationPercent": 60.0,
          "growthRate": 10.5,
          "receivedAt": "2026-03-07T15:30:00.000Z"
        },
        {
          "totalCapacity": 500000,
          "usedCapacity": 302000,
          "freeCapacity": 198000,
          "utilizationPercent": 60.4,
          "growthRate": 12.3,
          "receivedAt": "2026-03-07T15:29:30.000Z"
        }
      ]
    }
  ],
  "timestamp": "2026-03-07T15:30:00.000Z"
}
```

**Códigos de estado:**
- `200` - OK
- `500` - Error del servidor
- `503` - Base de datos no disponible

---

### 4. Métricas de Cliente Específico

```http
GET /api/metrics/:clientId
```

**URL Parameters:**
- `clientId` - ID del cliente (ej: CLIENT_1)

**Query Parameters (opcionales):**
- `limit` - Número de métricas (default: 20)
- `stats` - Incluir estadísticas: `true` | `false`

**Ejemplo:**
```http
GET /api/metrics/CLIENT_1?limit=10&stats=true
```

**Respuesta:**
```json
{
  "success": true,
  "clientId": "CLIENT_1",
  "clientStatus": "connected",
  "metricsCount": 10,
  "metrics": [
    {
      "totalCapacity": 500000,
      "usedCapacity": 300000,
      "freeCapacity": 200000,
      "utilizationPercent": 60.0,
      "growthRate": 10.5,
      "receivedAt": "2026-03-07T15:30:00.000Z"
    }
  ],
  "statistics": {
    "totalRecords": 150,
    "avgUtilization": "58.50",
    "maxUtilization": "65.20",
    "minUtilization": "52.10",
    "avgGrowthRate": "8.75"
  },
  "timestamp": "2026-03-07T15:30:00.000Z"
}
```

**Códigos de estado:**
- `200` - OK
- `404` - Cliente no encontrado
- `500` - Error del servidor
- `503` - Base de datos no disponible

---

### 5. Enviar Mensaje a Cliente

```http
POST /api/message
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "clientId": "CLIENT_1",
  "messageType": "SERVER_COMMAND",
  "message": "Actualizar configuración"
}
```

**Campos requeridos:**
- `clientId` - ID del cliente destino
- `messageType` - Tipo de mensaje: `SERVER_COMMAND` | `SERVER_NOTIFICATION`
- `message` - Contenido del mensaje

**Respuesta:**
```json
{
  "success": true,
  "message": "Mensaje guardado correctamente",
  "messageId": 1709827800000,
  "clientId": "CLIENT_1",
  "timestamp": "2026-03-07T15:30:00.000Z"
}
```

**Códigos de estado:**
- `201` - Mensaje creado
- `400` - Datos inválidos
- `404` - Cliente no encontrado
- `500` - Error del servidor
- `503` - Base de datos no disponible

---

## 🔧 Uso desde React

### Ejemplos con fetch

#### Obtener clientes
```javascript
const fetchClients = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/clients?status=connected');
    const data = await response.json();
    console.log(data.clients);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Obtener métricas de un cliente
```javascript
const fetchClientMetrics = async (clientId) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/metrics/${clientId}?limit=20&stats=true`
    );
    const data = await response.json();
    console.log(data.metrics);
    console.log(data.statistics);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Enviar mensaje
```javascript
const sendMessage = async (clientId, message) => {
  try {
    const response = await fetch('http://localhost:3000/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clientId: clientId,
        messageType: 'SERVER_COMMAND',
        message: message
      })
    });
    const data = await response.json();
    console.log('Mensaje enviado:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Ejemplos con axios

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

// Obtener clientes
const getClients = () => axios.get(`${API_BASE}/api/clients`);

// Obtener métricas
const getMetrics = (clientId, limit = 20) => 
  axios.get(`${API_BASE}/api/metrics/${clientId}?limit=${limit}`);

// Enviar mensaje
const sendMessage = (clientId, messageType, message) =>
  axios.post(`${API_BASE}/api/message`, {
    clientId,
    messageType,
    message
  });
```

## 🧪 Pruebas con cURL

### Health check
```bash
curl http://localhost:3000/
```

### Obtener clientes
```bash
curl http://localhost:3000/api/clients
```

### Obtener métricas
```bash
curl "http://localhost:3000/api/metrics?limit=5"
```

### Métricas de cliente específico
```bash
curl "http://localhost:3000/api/metrics/CLIENT_1?stats=true"
```

### Enviar mensaje
```bash
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "CLIENT_1",
    "messageType": "SERVER_COMMAND",
    "message": "Test message"
  }'
```

## 🔧 Pruebas con PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3000/" -Method Get

# Obtener clientes
Invoke-RestMethod -Uri "http://localhost:3000/api/clients" -Method Get

# Obtener métricas
Invoke-RestMethod -Uri "http://localhost:3000/api/metrics?limit=5" -Method Get

# Enviar mensaje
$body = @{
    clientId = "CLIENT_1"
    messageType = "SERVER_COMMAND"
    message = "Test message"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/message" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## 📊 Story Points: 4

### Tareas Completadas ✅

1. ✅ Express.js en puerto 3000
2. ✅ GET /api/clients - lista clientes activos
3. ✅ GET /api/metrics - últimas métricas
4. ✅ GET /api/metrics/:clientId - métricas de cliente
5. ✅ POST /api/message - enviar mensaje a cliente
6. ✅ CORS habilitado

### Criterios de Aceptación ✅

- ✅ 4 endpoints funcionando
- ✅ Respuestas JSON correctas
- ✅ CORS configurado
- ✅ Consultas a MongoDB

## 🔐 CORS

CORS está habilitado para **todas las rutas** usando el middleware:

```javascript
app.use(cors());
```

Esto permite peticiones desde cualquier origen. Para producción, configurar orígenes específicos:

```javascript
app.use(cors({
  origin: 'http://localhost:5173' // URL de React
}));
```

## 🐛 Troubleshooting

### Puerto 3000 en uso
```powershell
# Ver proceso usando el puerto
netstat -ano | findstr :3000

# Matar proceso
taskkill /PID <PID> /F

# O usar otro puerto
$env:API_PORT=4000; npm run api
```

### MongoDB no conecta
- Verificar que MongoDB está corriendo: `Get-Service MongoDB`
- Verificar URI en `.env`
- Ejecutar `npm run init-db` para inicializar

### CORS errors en React
- Verificar que la API está corriendo en puerto 3000
- Verificar URL en fetch/axios
- Verificar que CORS está habilitado en `api.js`

## 📚 Recursos

- [Express.js Documentation](https://expressjs.com/)
- [CORS Middleware](https://www.npmjs.com/package/cors)
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## 🚀 Próximos Pasos

- [ ] Autenticación con JWT
- [ ] Rate limiting
- [ ] Logging de peticiones
- [ ] Documentación con Swagger
- [ ] Tests con Jest/Supertest
- [ ] Validación con Joi
