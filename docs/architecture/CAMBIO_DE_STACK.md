# 🔄 CAMBIO DE STACK TECNOLÓGICO

## Storage Cluster con Nodo Central de Monitoreo

**Fecha:** Marzo 2, 2026  
**Motivo:** Adopción de stack JavaScript moderno full-stack

---

## ⚠️ CAMBIO IMPORTANTE

Se ha actualizado **completamente** el stack tecnológico del proyecto de Python a Node.js/React/MongoDB.

---

## 📊 COMPARACIÓN DE STACKS

| Componente | Stack Anterior (❌) | Stack Actual (✅) |
|------------|---------------------|-------------------|
| **Backend Cliente** | Python 3.x | Node.js 18+ |
| **Backend Servidor** | Python 3.x | Node.js 18+ |
| **Frontend** | HTML/CSS/JS vanilla | React 18 + Vite |
| **Base de Datos** | SQLite | MongoDB 6.0+ |
| **Sockets TCP** | `socket` (Python) | `net` (Node.js) |
| **Métricas de Sistema** | `psutil` | `systeminformation` |
| **API REST** | Flask | Express.js |
| **WebSockets** | N/A (polling) | Socket.io |
| **Logging** | `logging` (Python) | Winston |
| **Testing** | pytest | Jest |
| **Concurrencia** | Threading | Event Loop |

---

## 🎯 VENTAJAS DEL NUEVO STACK

### 1. **JavaScript Full-Stack**
- Mismo lenguaje en frontend, backend y configuración
- Facilita el desarrollo y onboarding del equipo
- Ecosistema npm unificado

### 2. **Node.js Event Loop**
- Más eficiente para operaciones I/O (sockets, DB)
- Manejo asíncrono nativo (async/await)
- Ideal para múltiples conexiones concurrentes

### 3. **MongoDB**
- Schema flexible (JSON nativo)
- Evolución sin migraciones complejas
- Aggregation Pipeline potente
- TTL Indexes para limpieza automática
- Escalabilidad horizontal

### 4. **React**
- Componentización y reutilización
- Estado reactivo (re-render automático)
- Ecosistema robusto de librerías
- Excelente experiencia de desarrollo (Hot Reload)

### 5. **WebSockets en tiempo real**
- Actualización instantánea de métricas
- Sin polling (reduce latencia y recursos)
- Bidireccional (alertas push)

---

## 📄 ARCHIVOS ACTUALIZADOS

### ✅ Completamente Reescritos

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `README.md` | ✅ ACTUALIZADO | Stack y tecnologías actualizadas |
| `ARQUITECTURA_TECNICA.md` | ✅ ACTUALIZADO | Ejemplos de código en Node.js |
| `DATABASE_DESIGN.md` | ✅ REESCRITO | Schemas MongoDB + DAOs en Node.js |
| `PROJECT_STRUCTURE.md` | ✅ REESCRITO | Estructura Node.js/React |
| `client_package.json` | ✅ NUEVO | Dependencias del cliente |
| `server_package.json` | ✅ NUEVO | Dependencias del servidor |
| `ui_package.json` | ✅ NUEVO | Dependencias del frontend React |

### ⚠️ Requieren Actualización Manual

| Archivo | Estado | Acción Requerida |
|---------|--------|------------------|
| `PLAN_IMPLEMENTACION.md` | ⚠️ CONTIENE REFERENCIAS PYTHON | Adaptar tareas a Node.js durante implementación |
| `TICKETS_DISTRIBUCION.md` | ⚠️ CONTIENE REFERENCIAS PYTHON | Actualizar nombres de archivos y tecnologías |
| `create_issues.ps1` | ⚠️ CONTIENE REFERENCIAS PYTHON | Actualizar descripciones de tickets |

**Nota:** Estos archivos conservan la estructura y plan general, pero mencionan tecnologías del stack anterior. Durante la implementación, interpreta las tareas según el nuevo stack.

---

## 🔧 MAPEO DE TECNOLOGÍAS

### Librerías y Módulos

| Python (Anterior) | Node.js (Actual) | Propósito |
|-------------------|------------------|-----------|
| `socket` | `net` | Sockets TCP/IP |
| `psutil` | `systeminformation` | Métricas del sistema |
| `sqlite3` | `mongodb` | Base de datos |
| `threading` | Event Loop + async/await | Concurrencia |
| `json` | `JSON` (nativo) | Serialización |
| `logging` | `winston` | Logging |
| `datetime` | `Date` | Fechas y tiempos |
| `flask` | `express` | API REST |
| N/A | `socket.io` | WebSockets |
| `tkinter` | React | Interfaz gráfica |

### Archivos Python → JavaScript

| Python | JavaScript | Ubicación |
|--------|------------|-----------|
| `socket_client.py` | `SocketClient.js` | `client/src/network/` |
| `socket_server.py` | `TcpServer.js` | `server/src/network/` |
| `disk_monitor.py` | `DiskMonitor.js` | `client/src/metrics/` |
| `metrics_processor.py` | `MetricsProcessor.js` | `server/src/business_logic/` |
| `client_dao.py` | `ClientsDAO.js` | `server/src/database/dao/` |
| `main.py` | `index.js` | Raíz de cada módulo |

### SQL → MongoDB

| SQL (Anterior) | MongoDB (Actual) |
|----------------|------------------|
| `CREATE TABLE clients` | `db.createCollection('clients')` |
| `INSERT INTO clients` | `db.collection('clients').insertOne()` |
| `SELECT * FROM clients WHERE status='UP'` | `db.collection('clients').find({ status: 'UP' })` |
| `UPDATE clients SET status='DOWN'` | `db.collection('clients').updateOne({ ... }, { $set: { ... } })` |
| `JOIN` entre tablas | Aggregation Pipeline con `$lookup` |
| Índice: `CREATE INDEX` | `db.collection().createIndex()` |

---

## 🚀 GUÍA DE MIGRACIÓN PARA IMPLEMENTACIÓN

### Paso 1: Instalar Dependencias

```bash
# Instalar Node.js 18+ LTS
# Instalar MongoDB 6.0+

# Cliente
cd client
npm install

# Servidor
cd server
npm install

# UI
cd ui
npm install
```

### Paso 2: Inicializar MongoDB

```bash
# Iniciar MongoDB
mongod --dbpath ./data

# En otra terminal, inicializar esquema
cd server
node database/init_database.js
```

### Paso 3: Configurar Variables de Entorno

Ver `PROJECT_STRUCTURE.md` sección "Variables de Entorno"

### Paso 4: Seguir PLAN_IMPLEMENTACION.md

**IMPORTANTE:** Al leer las tareas en `PLAN_IMPLEMENTACION.md`:
- Donde dice "Python", interpretar como "Node.js"
- Donde dice "`psutil`", usar "`systeminformation`"
- Donde dice "SQLite", usar "MongoDB"
- Donde dice "threading", usar "Event Loop con async/await"
- Los nombres de archivos `.py` deben ser `.js`

### Paso 5: Referirse a Documentación Actualizada

- ✅ `DATABASE_DESIGN.md` → Schemas MongoDB completos con ejemplos
- ✅ `ARQUITECTURA_TECNICA.md` → Código Node.js funcional
- ✅ `PROJECT_STRUCTURE.md` → Estructura de carpetas Node.js/React

---

## 📚 RECURSOS DE APRENDIZAJE

### Node.js
- [Documentación oficial Node.js](https://nodejs.org/docs/)
- [Guía de módulo net (TCP)](https://nodejs.org/api/net.html)
- [async/await en Node.js](https://nodejs.dev/learn/modern-asynchronous-javascript-with-async-and-await)

### MongoDB
- [MongoDB University (cursos gratis)](https://university.mongodb.com/)
- [Driver MongoDB para Node.js](https://www.mongodb.com/docs/drivers/node/current/)
- [Aggregation Pipeline](https://www.mongodb.com/docs/manual/aggregation/)

### React
- [Documentación oficial React](https://react.dev/)
- [React + Vite quickstart](https://vitejs.dev/guide/)
- [Chart.js con React](https://react-chartjs-2.js.org/)

### Express.js
- [Documentación Express](https://expressjs.com/)
- [Express REST API tutorial](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs)

### Socket.io
- [Documentación Socket.io](https://socket.io/docs/v4/)
- [Socket.io con React](https://socket.io/how-to/use-with-react)

---

## ⚙️ CONFIGURACIÓN DE DESARROLLO

### VS Code - Extensiones Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "mongodb.mongodb-vscode",
    "formulahendry.auto-rename-tag",
    "dsznajder.es7-react-js-snippets",
    "ms-vscode.vscode-node-azure-pack"
  ]
}
```

### ESLint Config (JavaScript)

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
  },
};
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Cannot find module 'mongodb'"
**Solución:** `npm install` en el directorio del servidor

### Problema: "ECONNREFUSED localhost:27017"
**Solución:** Iniciar MongoDB con `mongod`

### Problema: "Port 5000 already in use"
**Solución:** Cambiar puerto en `server_config.json` o matar proceso: `lsof -ti:5000 | xargs kill`

### Problema: React no se conecta a API
**Solución:** Verificar `VITE_API_URL` en `.env` y CORS en servidor

---

## 📋 CHECKLIST DE TRANSICIÓN

### Configuración del Entorno
- [ ] Node.js 18+ instalado
- [ ] MongoDB 6.0+ instalado
- [ ] npm/yarn configurado
- [ ] VS Code con extensiones instaladas

### Repositorio
- [ ] Dependencias instaladas (`npm install` en client, server, ui)
- [ ] Variables de entorno configuradas (`.env` files)
- [ ] MongoDB inicializado (`node init_database.js`)
- [ ] Git ignorando `node_modules/`, `.env`, `logs/`

### Conocimiento del Equipo
- [ ] Equipo familiarizado con JavaScript ES6+
- [ ] Equipo entiende async/await
- [ ] Equipo conoce React básico
- [ ] Equipo entiende MongoDB vs SQL

### Documentación
- [ ] Leído `ARQUITECTURA_TECNICA.md` actualizado
- [ ] Leído `DATABASE_DESIGN.md` (MongoDB)
- [ ] Leído `PROJECT_STRUCTURE.md` (estructura Node.js)
- [ ] Entendido mapeo de tecnologías (tabla arriba)

---

## 🎓 PREGUNTAS FRECUENTES

**P: ¿Por qué cambiar de Python a Node.js?**  
R: JavaScript full-stack permite mayor coherencia, el Event Loop es más eficiente para I/O, y Node.js tiene mejor soporte para WebSockets en tiempo real.

**P: ¿Por qué MongoDB en lugar de SQLite?**  
R: MongoDB maneja JSON nativamente (nuestros mensajes TCP son JSON), tiene schema flexible para evolución, y ofrece mejor escalabilidad horizontal.

**P: ¿Necesitamos experiencia previa en React?**  
R: No es obligatoria, pero es recomendable. React es intuitivo y hay muchos tutoriales. Empezar con la documentación oficial.

**P: ¿Es compatible con Windows/Linux/Mac?**  
R: Sí, Node.js, MongoDB y React son multiplataforma. El módulo `systeminformation` funciona en todos los OS.

**P: ¿Podemos seguir usando el PLAN_IMPLEMENTACION.md?**  
R: Sí, la estructura de tareas sigue siendo válida. Solo hay que interpretar las tecnologías específicas según el mapeo de este documento.

**P: ¿Qué pasa con los tickets ya creados?**  
R: Si ya se crearon en GitHub, actualizar las descripciones manualmente según el nuevo stack. Si no, usar los archivos `.ps1` actualizados cuando estén listos.

---

## 📞 SOPORTE

Si tienes dudas durante la implementación:

1. **Consultar documentación actualizada** en carpeta `docs/`
2. **Revisar mapeo de tecnologías** en este documento
3. **Consultar documentación oficial** de Node.js, MongoDB, React
4. **Preguntar al equipo** o abrir issue en GitHub

---

**¡Éxito con la implementación del nuevo stack! 🚀**

---

**Documento creado:** Marzo 2, 2026  
**Versión:** 1.0  
**Estado:** COMPLETO
