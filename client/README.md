# Cliente TCP - Storage Cluster 📡

Cliente TCP robusto que monitorea el disco local y envía métricas al servidor central cada 30 segundos. Implementa reconexión automática, manejo bidireccional de mensajes y logging completo.

## 🚀 Características

- ✅ **Conexión TCP robusta** con timeout y manejo de errores
- ✅ **Registro automático** al conectar con el servidor
- ✅ **Recolección de métricas** del primer disco usando `systeminformation`
- ✅ **Envío periódico** de métricas cada 30 segundos (configurable)
- ✅ **Recepción bidireccional** de mensajes del servidor
- ✅ **ACKs automáticos** para confirmación de mensajes
- ✅ **Reconexión automática** con backoff exponencial (1s → 2s → 4s → 8s)
- ✅ **Logging multinivel** con rotación automática de archivos
- ✅ **Mensajes persistidos** en archivo especial `messages.log`
- ✅ **Growth Rate** calculado en MB/hora
- ✅ **Gestión de señales** (SIGINT, SIGTERM) para cierre graceful

## 📋 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** o **yarn**
- **Servidor TCP** corriendo en el puerto configurado (default: 5000)

## 🔧 Instalación Rápida

### Opción 1: Setup Automático (Windows)

```powershell
cd client
.\setup.ps1 -ClientId CLIENT_001
```

### Opción 2: Setup Manual

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar configuración de ejemplo
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac

# 3. Editar configuración (¡IMPORTANTE: cambia CLIENT_ID!)
notepad .env   # Windows
# nano .env    # Linux/Mac
```

## ⚙️ Configuración Detallada

Edita el archivo `.env` con los parámetros de tu cliente:

```env
# ===== IDENTIFICACIÓN =====
CLIENT_ID=CLIENT_001              # ID único (OBLIGATORIO) - CLIENT_001 a CLIENT_009

# ===== SERVIDOR =====
SERVER_HOST=localhost             # IP o hostname del servidor
SERVER_PORT=5000                  # Puerto TCP del servidor

# ===== INTERVALOS =====
METRICS_INTERVAL=30000            # Envío de métricas en ms (30000 = 30 segundos)
RECONNECT_INTERVAL=5000           # Intervalo de reconexión en ms
MAX_RECONNECT_ATTEMPTS=-1         # Máximo de intentos (-1 = infinito)

# ===== LOGGING =====
LOG_LEVEL=info                    # Niveles: debug, info, warn, error
LOG_FILE=logs/client.log          # Archivo de log principal
```

### 📝 Valores Comunes

| Parámetro | Desarrollo | Producción | Descripción |
|-----------|------------|------------|-------------|
| `LOG_LEVEL` | `debug` | `info` | Nivel de detalle en logs |
| `METRICS_INTERVAL` | `10000` | `30000` | Frecuencia de envío (ms) |
| `RECONNECT_INTERVAL` | `3000` | `5000` | Tiempo entre reconexiones |

## 🏃 Ejecución

```bash
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev

# Testing
npm test
```

### 💡 Ejemplo de Salida Exitosa

```
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║           STORAGE CLUSTER - CLIENTE TCP                           ║
║           Nodo Regional de Monitoreo de Disco                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

Cliente ID: CLIENT_001
Servidor: localhost:5000
Intervalo de métricas: 30s
Nivel de log: info
Ambiente: development
───────────────────────────────────────────────────────────────────

🔌 Conectando a localhost:5000...
✅ Conectado al servidor
✅ Estado: CONECTADO

📝 Mensaje de registro enviado
📊 Iniciando envío periódico de métricas cada 30 segundos

📈 Métricas enviadas:
   Total: 931.32 GB | Usado: 598.45 GB | Libre: 332.87 GB
   Utilización: 64.25% | Growth Rate: 12.5 MB/hora

✅ ACK recibido para mensaje: msg_12345
```

## 📁 Estructura del Proyecto

```
client/
├── src/
│   ├── index.js              # Punto de entrada principal
│   ├── client.js             # Cliente TCP con reconexión
│   ├── metricsCollector.js   # Recolección de métricas (systeminformation)
│   ├── messageHandler.js     # Procesamiento de mensajes y ACKs
│   ├── logger.js             # Configuración de Winston
│   └── config.js             # Validación y gestión de configuración
├── logs/                     # Archivos de log (creados automáticamente)
│   ├── client.log           # Log principal rotado
│   ├── messages.log         # Solo mensajes del servidor
│   └── error.log            # Solo errores críticos
├── .env                      # Tu configuración (NO subir a git)
├── .env.example             # Plantilla de configuración
├── package.json              # Dependencias y scripts
├── README.md                 # Esta documentación
├── QUICKSTART.md            # Guía de inicio rápido
└── TESTING.md               # Guía de testing manual
```

## 📊 Formato de Mensajes

### Métricas Enviadas al Servidor

El cliente envía métricas del **primer disco** detectado en formato JSON:

```json
{
  "message_type": "METRICS_REPORT",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-06T10:30:00.000Z",
  "metrics": {
    "total_capacity": 1000000000000,     // Bytes (1 TB)
    "used_capacity": 642500000000,       // Bytes (642.5 GB)
    "free_capacity": 357500000000,       // Bytes (357.5 GB)
    "utilization_percent": 64.25,        // Porcentaje
    "growth_rate": 12.5                  // MB/hora
  }
}
```

### Mensaje de Registro (al conectar)

```json
{
  "message_type": "REGISTER",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-06T10:29:45.123Z",
  "metadata": {
    "version": "1.0.0",
    "platform": "win32",
    "node_version": "v18.17.0"
  }
}
```

### ACK Enviado (confirmación de mensaje)

```json
{
  "message_type": "ACK",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-06T10:30:15.456Z",
  "ack_for": "msg_12345"
}
```

## 📨 Mensajes del Servidor

El cliente puede recibir mensajes del servidor que se guardan automáticamente en `logs/messages.log`:

### Formato Recibido

```json
{
  "message_type": "SERVER_MESSAGE",
  "message_id": "msg_12345",
  "timestamp": "2026-03-06T10:30:00.000Z",
  "content": "Sistema funcionando correctamente"
}
```

### Formato en `messages.log`

```
[2026-03-06 10:30:00] [msg_12345] Sistema funcionando correctamente
```

## 📈 Cálculo de Growth Rate

El **growth rate** indica cuánto crece el espacio usado del disco por hora:

```
growth_rate = (usado_actual - usado_anterior) / tiempo_transcurrido * 3600000 / (1024 * 1024)
```

- Unidades: **MB/hora**
- Positivo = disco llenándose
- Negativo = disco liberándose
- Cero = sin cambios

## 🔍 Logs y Monitoreo

### Ver Logs en Tiempo Real

```powershell
# Windows PowerShell
Get-Content logs/client.log -Wait -Tail 20
Get-Content logs/messages.log -Wait -Tail 10
Get-Content logs/error.log -Wait -Tail 10
```

```bash
# Linux/Mac
tail -f logs/client.log
tail -f logs/messages.log
tail -f logs/error.log
```

### Estructura de Logs

```
2026-03-06 10:30:00 [info]: ✅ Conectado al servidor
2026-03-06 10:30:05 [info]: 📈 Métricas enviadas
2026-03-06 10:30:35 [info]: 📈 Métricas enviadas
2026-03-06 10:31:00 [warn]: ⚠️  Desconectado del servidor
2026-03-06 10:31:03 [info]: 🔌 Reconectando (intento 1/∞)...
```

## 🐛 Troubleshooting

### ❌ Error: "ECONNREFUSED" o "connect ECONNREFUSED"

**Causa:** El servidor no está corriendo o está en otra IP/puerto.

**Solución:**
```bash
# 1. Verificar que el servidor esté corriendo
# 2. Verificar IP y puerto en .env
SERVER_HOST=localhost
SERVER_PORT=5000

# 3. Comprobar firewall (Windows)
netstat -an | findstr :5000

# 4. Probar conexión manual
telnet localhost 5000
```

### ❌ Error: "CLIENT_ID is required"

**Causa:** No se configuró el CLIENT_ID en `.env`

**Solución:**
```bash
# Editar .env y agregar
CLIENT_ID=CLIENT_001
```

### ❌ Error: "No se detectaron discos en el sistema"

**Causa:** Permisos insuficientes para leer información del disco.

**Solución:**
```bash
# Windows: Ejecutar como Administrador
# Linux: Agregar usuario a grupos necesarios
sudo usermod -aG disk $USER
```

### ❌ Cliente se desconecta constantemente

**Causa:** Problemas de red o servidor caído.

**Solución:**
```bash
# 1. Revisar logs
Get-Content logs/error.log -Tail 50

# 2. Aumentar timeout si red es lenta
MESSAGE_TIMEOUT=60000

# 3. Verificar estabilidad del servidor
```

### ⚠️ Logs no se crean

**Causa:** No hay permisos en carpeta `logs/`

**Solución:**
```bash
# Crear carpeta manualmente
mkdir logs

# Windows: Dar permisos
icacls logs /grant Users:F
```

## 🧪 Testing

Ver guía completa de testing en: **[TESTING.md](TESTING.md)**

### Quick Test

```bash
# 1. Iniciar servidor (en otra terminal)
cd ../server
npm start

# 2. Iniciar cliente
npm start

# 3. Verificar que se conecte y envíe métricas cada 30s
# 4. Revisar logs/client.log
```

## 📦 Dependencias Principales

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `systeminformation` | ^5.21.0 | Recolección de métricas del disco |
| `winston` | ^3.11.0 | Sistema de logging con rotación |
| `dotenv` | ^16.3.1 | Gestión de variables de entorno |
| `joi` | ^17.11.0 | Validación de configuración |

## 🚦 Estados del Cliente

| Estado | Descripción | Acción |
|--------|-------------|--------|
| 🔌 **CONECTANDO** | Intentando conectar al servidor | Esperar |
| ✅ **CONECTADO** | Conexión activa, enviando métricas | Normal |
| ⚠️ **DESCONECTADO** | Sin conexión, reconectando | Verificar servidor |
| ❌ **ERROR** | Error crítico | Revisar logs |

## 📚 Documentación Adicional

- **[QUICKSTART.md](QUICKSTART.md)** - Inicio rápido en 5 minutos
- **[TESTING.md](TESTING.md)** - Guía completa de testing manual
- **[IMPLEMENTATION.md](IMPLEMENTATION.md)** - Detalles de implementación técnica
- **[../docs/](../docs/)** - Documentación del proyecto completo

## 🤝 Soporte

Para problemas o preguntas:
1. Revisar los logs en `logs/client.log` y `logs/error.log`
2. Consultar [TESTING.md](TESTING.md) para casos de prueba
3. Verificar configuración en `.env`
4. Comprobar que el servidor esté corriendo

---

**✨ Cliente implementado en:** Node.js + TCP Sockets  
**📅 Última actualización:** Marzo 2026  
**🎯 Proyecto:** Storage Cluster - Sistemas Distribuidos

1. **SERVER_NOTIFICATION**: Notificaciones generales
2. **SERVER_COMMAND**: Comandos específicos
3. **PING**: Verificación de conectividad

Para cada mensaje recibido:
- ✅ Se procesa automáticamente
- ✅ Se guarda en `logs/messages.log`
- ✅ Se envía ACK al servidor

## 🔄 Reconexión Automática

Si se pierde la conexión:
- ✅ Reconexión automática con backoff exponencial
- ✅ Intentos ilimitados por defecto
- ✅ Estado y métricas se preservan

## 📝 Logs

- **client.log**: Todos los eventos del cliente
- **messages.log**: Mensajes del servidor (formato legible)
- **error.log**: Solo errores críticos

## 🛑 Cierre Graceful

El cliente maneja las señales de sistema para cerrar limpiamente:

```bash
# Presiona Ctrl+C para detener
# Se enviará señal al servidor y se cerrarán recursos
```

## 🐛 Debug

Para modo debug detallado:

```env
LOG_LEVEL=debug
```

Esto mostrará:
- Mensajes de conexión detallados
- Métricas formateadas
- Estado del cliente cada minuto

## 📞 Soporte

Para problemas o preguntas, revisar:
- Logs en `logs/`
- Configuración en `.env`
- Documentación del proyecto principal

---

**Desarrollado para Universidad del Valle - Sistemas Distribuidos 2026**
