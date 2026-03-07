# ESTRUCTURA DEL PROYECTO - NODE.JS + REACT + MONGODB

## Storage Cluster con Nodo Central de Monitoreo

**Stack Tecnológico:**
- **Backend**: Node.js (clientes y servidor)
- **Frontend**: React 18 + Vite
- **Base de Datos**: MongoDB 6.0+
- **Protocolo**: TCP/IP (módulo net)

---

## ESTRUCTURA COMPLETA

```
storage-cluster/
│
├── client/                          # Cliente (Nodo Regional)
│   ├── src/
│   │   ├── index.js                 # Punto de entrada
│   │   ├── network/
│   │   │   ├── SocketClient.js      # Conexión TCP con servidor
│   │   │   └── MessageHandler.js    # Manejo de mensajes
│   │   ├── metrics/
│   │   │   ├── DiskMonitor.js       # Recolección métricas (systeminformation)
│   │   │   └── MetricsReporter.js   # Envío periódico
│   │   ├── messaging/
│   │   │   ├── MessageReceiver.js   # Recepción mensajes servidor
│   │   │   └── AckSender.js         # Envío ACKs
│   │   ├── config/
│   │   │   ├── config.js            # Configuración
│   │   │   └── logger.js            # Winston logger
│   │   └── utils/
│   │       └── helpers.js
│   ├── logs/                        # Archivos .log
│   ├── config/
│   │   └── client_config.json
│   ├── tests/
│   │   ├── socket.test.js
│   │   └── metrics.test.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── server/                          # Servidor Central
│   ├── src/
│   │   ├── index.js                 # Punto de entrada
│   │   ├── network/
│   │   │   ├── TcpServer.js         # Servidor TCP (net.createServer)
│   │   │   └── ConnectionManager.js # Gestión de 9 clientes
│   │   ├── business_logic/
│   │   │   ├── MetricsProcessor.js  # Procesamiento métricas
│   │   │   ├── MetricsAggregator.js # Métricas globales
│   │   │   ├── InactivityMonitor.js # Detección nodos inactivos
│   │   │   ├── GrowthRateCalculator.js
│   │   │   └── AvailabilityCalculator.js
│   │   ├── messaging/
│   │   │   ├── MessageSender.js     # Envío mensajes a clientes
│   │   │   └── AckHandler.js        # Procesamiento ACKs
│   │   ├── database/
│   │   │   ├── MongoClient.js       # Conexión MongoDB
│   │   │   └── dao/                 # Data Access Objects
│   │   │       ├── ClientsDAO.js
│   │   │       ├── MetricsDAO.js
│   │   │       ├── GlobalMetricsDAO.js
│   │   │       ├── SentMessagesDAO.js
│   │   │       └── AvailabilityEventsDAO.js
│   │   ├── api/
│   │   │   ├── app.js               # Express app
│   │   │   ├── routes/
│   │   │   │   ├── clientsRoutes.js
│   │   │   │   ├── metricsRoutes.js
│   │   │   │   └── messagesRoutes.js
│   │   │   └── socketio/
│   │   │       └── socketHandler.js # WebSocket para UI
│   │   ├── config/
│   │   │   ├── config.js
│   │   │   └── logger.js
│   │   └── utils/
│   │       └── helpers.js
│   ├── database/
│   │   ├── init_database.js         # Script inicialización MongoDB
│   │   ├── backup.js                # Script backup
│   │   ├── restore.js               # Script restore
│   │   └── cleanup.js               # Limpieza datos antiguos
│   ├── logs/
│   ├── config/
│   │   └── server_config.json
│   ├── tests/
│   │   ├── tcp.test.js
│   │   ├── api.test.js
│   │   └── dao.test.js
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── ui/                              # Dashboard React
│   ├── src/
│   │   ├── main.jsx                 # Punto de entrada
│   │   ├── App.jsx                  # Componente raíz
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx    # Vista principal
│   │   │   │   ├── ClientCard.jsx
│   │   │   │   └── GlobalMetrics.jsx
│   │   │   ├── ClientDetail/
│   │   │   │   ├── ClientDetail.jsx
│   │   │   │   ├── MetricsChart.jsx # Chart.js
│   │   │   │   └── AvailabilityTimeline.jsx
│   │   │   ├── Messaging/
│   │   │   │   ├── MessagePanel.jsx
│   │   │   │   └── MessageHistory.jsx
│   │   │   ├── Availability/
│   │   │   │   └── AvailabilityView.jsx
│   │   │   └── common/
│   │   │       ├── Navbar.jsx
│   │   │       ├── Sidebar.jsx
│   │   │       └── AlertToast.jsx
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance
│   │   │   ├── clientsService.js
│   │   │   ├── metricsService.js
│   │   │   └── socketService.js     # Socket.io-client
│   │   ├── context/
│   │   │   └── AppContext.jsx       # Estado global
│   │   ├── hooks/
│   │   │   ├── useClients.js
│   │   │   ├── useMetrics.js
│   │   │   └── useWebSocket.js
│   │   ├── utils/
│   │   │   ├── formatters.js        # Formateo de datos
│   │   │   └── constants.js
│   │   └── styles/
│   │       └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── README.md
│
├── docs/                            # Documentación
│   ├── ARQUITECTURA_TECNICA.md
│   ├── DATABASE_DESIGN.md
│   ├── PLAN_IMPLEMENTACION.md
│   ├── PROJECT_STRUCTURE.md
│   ├── README.md
│   ├── TICKETS_DISTRIBUCION.md
│   └── API_DOCUMENTATION.md
│
├── tests/                           # Pruebas E2E
│   └── integration/
│       ├── full_flow.test.js
│       └── load_test.js
│
├── scripts/                         # Utilidades
│   ├── start_all.sh                 # Iniciar todo el sistema
│   ├── stop_all.sh
│   └── generate_clients.js          # Generar configs para 9 clientes
│
├── .gitignore
└── README.md                        # README maestro
```

---

## ARCHIVOS DE CONFIGURACIÓN

### client/config/client_config.json
```json
{
  "clientId": "CLIENT_001",
  "server": {
    "host": "localhost",
    "port": 5000
  },
  "metrics": {
    "diskIndex": 0,
    "reportIntervalSeconds": 30
  },
  "logging": {
    "level": "info",
    "file": "logs/client.log"
  }
}
```

### server/config/server_config.json
```json
{
  "tcp": {
    "port": 5000,
    "host": "0.0.0.0",
    "maxClients": 9
  },
  "api": {
    "port": 3000,
    "cors": {
      "origin": "http://localhost:5173"
    }
  },
  "database": {
    "url": "mongodb://localhost:27017",
    "name": "storage_cluster"
  },
  "monitoring": {
    "inactivityTimeoutSeconds": 105,
    "checkIntervalSeconds": 15
  },
  "logging": {
    "level": "info",
    "file": "logs/server.log"
  }
}
```

### ui/.env.example
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

---

## COMANDOS DE GESTIÓN

### Instalación
```bash
# Cliente
cd client
npm install

# Servidor
cd server
npm install
npm run init-db  # Inicializar MongoDB

# UI
cd ui
npm install
```

### Desarrollo
```bash
# Terminal 1: Iniciar MongoDB
mongod --dbpath ./data

# Terminal 2: Iniciar servidor
cd server
npm run dev

# Terminal 3: Iniciar UI
cd ui
npm run dev

# Terminal 4: Iniciar cliente (repetir para 9 clientes)
cd client
npm start
```

### Producción
```bash
# Servidor
cd server
npm start

# UI (compilar y servir)
cd ui
npm run build
# Servir dist/ con nginx o similar

# Clientes
cd client
npm start
```

### Testing
```bash
# Cliente
cd client
npm test

# Servidor
cd server
npm test

# UI
cd ui
npm run test

# E2E
cd tests/integration
npm test
```

---

## CONVENCIONES DE CÓDIGO

### JavaScript/Node.js
- **Estilo**: ESLint con configuración estándar
- **Nombres de archivos**: PascalCase para clases (`SocketClient.js`), camelCase para utilidades
- **Nombres de variables**: camelCase (`clientId`, `lastSeenAt`)
- **Nombres de funciones**: camelCase (`calculateMetrics`, `sendMessage`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_CLIENTS`, `TIMEOUT_SECONDS`)

### React
- **Componentes**: PascalCase (`Dashboard.jsx`, `ClientCard.jsx`)
- **Hooks personalizados**: camelCase con prefijo `use` (`useClients.js`)
- **Props**: camelCase
- **Eventos**: camelCase con prefijo `on` (`onClick`, `onMetricsUpdate`)

### MongoDB
- **Nombres de colecciones**: camelCase (`clients`, `globalMetrics`)
- **Nombres de campos**: snake_case (`client_id`, `recorded_at`)
- **IDs**: ObjectId generado automáticamente o strings como `CLIENT_001`

---

## VARIABLES DE ENTORNO

### client/.env
```env
NODE_ENV=development
CLIENT_ID=CLIENT_001
SERVER_HOST=localhost
SERVER_PORT=5000
LOG_LEVEL=info
```

### server/.env
```env
NODE_ENV=development
TCP_PORT=5000
API_PORT=3000
MONGO_URL=mongodb://localhost:27017
DB_NAME=storage_cluster
LOG_LEVEL=info
```

### ui/.env
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
VITE_REFRESH_INTERVAL=5000
```

---

## DESPLIEGUE

### Docker Compose (Opcional)
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
  
  server:
    build: ./server
    ports:
      - "5000:5000"  # TCP
      - "3000:3000"  # API REST
    depends_on:
      - mongodb
    environment:
      MONGO_URL: mongodb://mongodb:27017
  
  ui:
    build: ./ui
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  mongo-data:
```

---

## CHECKLIST DE ENTREGA

### Código
- [ ] Cliente Node.js funcional (conexión TCP, métricas, mensajería)
- [ ] Servidor Node.js funcional (9 clientes, métricas globales, inactividad)
- [ ] API REST completa con todos los endpoints
- [ ] Dashboard React con todas las vistas
- [ ] Base de datos MongoDB con 5 colecciones
- [ ] Scripts de inicialización y backup

### Documentación
- [ ] README.md con instrucciones de instalación
- [ ] Documentación de arquitectura
- [ ] Documentación de API
- [ ] Comentarios en código (JSDoc)

### Pruebas
- [ ] Tests unitarios (cliente, servidor, DAOs)
- [ ] Tests de integración
- [ ] Test E2E de flujo completo
- [ ] Test de carga (9 clientes concurrentes)

### Funcionalidades
- [ ] 9 clientes enviando métricas cada 30s
- [ ] Detección de nodos inactivos
- [ ] Cálculo de métricas globales
- [ ] Cálculo de growth rate (MB/h)
- [ ] Cálculo de availability (≥99.9%)
- [ ] Mensajería bidireccional con ACK
- [ ] Dashboard con actualización en tiempo real
- [ ] Almacenamiento en MongoDB

---

**Documento actualizado:** Marzo 2, 2026  
**Versión:** 2.0 (Node.js + React + MongoDB)  
**Estado:** COMPLETO
