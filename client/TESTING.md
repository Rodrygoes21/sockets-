# 🧪 GUÍA DE TESTING MANUAL - CLIENTE TCP

Guía completa para probar todas las funcionalidades del cliente TCP del Storage Cluster.

---

## 📋 ÍNDICE

1. [Pre-requisitos](#pre-requisitos)
2. [Checklist General](#checklist-general)
3. [Pruebas de Conexión](#pruebas-conexión)
4. [Pruebas de Métricas](#pruebas-métricas)
5. [Pruebas de Mensajes](#pruebas-mensajes)
6. [Pruebas de ACKs](#pruebas-acks)
7. [Pruebas de Reconexión](#pruebas-reconexión)
8. [Pruebas de Logging](#pruebas-logging)
9. [Pruebas de Configuración](#pruebas-configuración)
10. [Pruebas de Robustez](#pruebas-robustez)
11. [Casos de Uso Completos](#casos-uso-completos)

---

## 1. PRE-REQUISITOS {#pre-requisitos}

### ✅ Antes de Empezar

- [ ] Node.js >= 18.0.0 instalado (`node --version`)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` configurado con CLIENT_ID único
- [ ] Servidor TCP corriendo en el puerto configurado
- [ ] Permisos de lectura en disco
- [ ] Carpeta `logs/` creada (se crea automáticamente)

### 🔧 Setup Inicial

```bash
# Verificar Node.js
node --version

# Instalar dependencias
npm install

# Verificar que exista .env
dir .env   # Windows
ls .env    # Linux/Mac

# Verificar servidor (en otra terminal)
netstat -an | findstr :5000   # Windows
netstat -tuln | grep 5000     # Linux
```

---

## 2. CHECKLIST GENERAL {#checklist-general}

### ✅ Funcionalidades Core (Obligatorias)

- [ ] **CON-001**: Cliente conecta al servidor TCP correctamente
- [ ] **CON-002**: Envía mensaje de registro (REGISTER) al conectar
- [ ] **MET-001**: Recolecta métricas del primer disco detectado
- [ ] **MET-002**: Envía métricas cada 30 segundos (configurable)
- [ ] **MET-003**: JSON de métricas tiene estructura correcta
- [ ] **MSG-001**: Recibe mensajes del servidor
- [ ] **MSG-002**: Guarda mensajes en `logs/messages.log`
- [ ] **ACK-001**: Envía ACK automático tras recibir mensaje
- [ ] **REC-001**: Reconexión automática funciona
- [ ] **REC-002**: Backoff exponencial implementado (1s, 2s, 4s, 8s)
- [ ] **LOG-001**: Logs se escriben en `logs/client.log`
- [ ] **LOG-002**: Logs de error en `logs/error.log`
- [ ] **LOG-003**: Rotación de logs funciona

### ✅ Funcionalidades Adicionales

- [ ] **CFG-001**: Configuración desde .env funciona
- [ ] **CFG-002**: Validación de configuración detecta errores
- [ ] **GRC-001**: Cierre graceful con SIGINT (Ctrl+C)
- [ ] **GRC-002**: Cierre graceful con SIGTERM
- [ ] **ERR-001**: Manejo de errores sin crashear
- [ ] **GRW-001**: Growth rate calculado correctamente

---

## 3. PRUEBAS DE CONEXIÓN {#pruebas-conexión}

### TEST CON-001: Conexión Exitosa

**Objetivo:** Verificar que el cliente conecta correctamente al servidor.

**Steps:**
```bash
# 1. Asegurar que el servidor esté corriendo
cd ../server
npm start

# 2. En otra terminal, iniciar cliente
cd ../client
npm start
```

**Resultado Esperado:**
```
✅ Conectado al servidor
✅ Estado: CONECTADO
```

**Validaciones:**
- [ ] Banner del cliente aparece
- [ ] Mensaje "Conectado al servidor" visible
- [ ] No hay mensajes de error
- [ ] El servidor reporta nueva conexión

---

### TEST CON-002: Conexión con Servidor Apagado

**Objetivo:** Verificar comportamiento cuando el servidor no está disponible.

**Steps:**
```bash
# 1. NO iniciar el servidor
# 2. Iniciar cliente
npm start
```

**Resultado Esperado:**
```
🔌 Conectando a localhost:5000...
🔌 Reconectando (intento 1/∞)...
🔌 Reconectando (intento 2/∞)...
```

**Validaciones:**
- [ ] Cliente intenta reconectar automáticamente
- [ ] Intervalo entre intentos aumenta (backoff exponencial)
- [ ] No crashea la aplicación
- [ ] Logs muestran intentos de reconexión

---

### TEST CON-003: Mensaje de Registro (REGISTER)

**Objetivo:** Verificar que el mensaje de registro se envía al conectar.

**Steps:**
```bash
# 1. Con servidor corriendo, iniciar cliente
npm start

# 2. Revisar logs o salida del servidor
```

**Resultado Esperado:**
```
📝 Mensaje de registro enviado
```

**Validaciones:**
- [ ] Mensaje REGISTER enviado inmediatamente tras conectar
- [ ] JSON contiene: `message_type`, `client_id`, `timestamp`, `metadata`
- [ ] SERVER recibe y procesa el mensaje
- [ ] `client_id` correcto según `.env`

**Formato Esperado:**
```json
{
  "message_type": "REGISTER",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-06T...",
  "metadata": {
    "version": "1.0.0",
    "platform": "win32",
    "node_version": "v18.x.x"
  }
}
```

---

## 4. PRUEBAS DE MÉTRICAS {#pruebas-métricas}

### TEST MET-001: Recolección de Métricas

**Objetivo:** Verificar que las métricas del disco se recolectan correctamente.

**Steps:**
```bash
# 1. Iniciar cliente
npm start

# 2. Esperar al menos 30 segundos
# 3. Observar la salida de consola
```

**Resultado Esperado:**
```
📈 Métricas enviadas:
   Total: 931.32 GB | Usado: 598.45 GB | Libre: 332.87 GB
   Utilización: 64.25% | Growth Rate: 12.5 MB/hora
```

**Validaciones:**
- [ ] Valores en GB son coherentes con el disco real
- [ ] Suma: total = usado + libre
- [ ] Porcentaje de utilización correcto: (usado/total * 100)
- [ ] Growth rate calculado (puede ser 0 en primera ejecución)

---

### TEST MET-002: Formato JSON de Métricas

**Objetivo:** Validar estructura JSON de las métricas enviadas.

**Steps:**
```bash
# 1. Iniciar cliente con LOG_LEVEL=debug en .env
LOG_LEVEL=debug

# 2. Revisar logs/client.log
Get-Content logs/client.log -Tail 50
```

**Resultado Esperado:**
```json
{
  "message_type": "METRICS_REPORT",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-06T10:30:00.000Z",
  "metrics": {
    "total_capacity": 1000000000000,
    "used_capacity": 642500000000,
    "free_capacity": 357500000000,
    "utilization_percent": 64.25,
    "growth_rate": 12.5
  }
}
```

**Validaciones:**
- [ ] Todos los campos obligatorios presentes
- [ ] `timestamp` en formato ISO 8601
- [ ] Capacidades en bytes (enteros)
- [ ] `utilization_percent` con máximo 2 decimales
- [ ] `growth_rate` en MB/hora

---

### TEST MET-003: Envío Periódico (30 segundos)

**Objetivo:** Confirmar que las métricas se envían cada 30 segundos.

**Steps:**
```bash
# 1. Iniciar cliente
npm start

# 2. Anotar hora de primera métrica enviada: ___:___
# 3. Anotar hora de segunda métrica: ___:___
# 4. Calcular diferencia
```

**Resultado Esperado:**
- Diferencia entre envíos: **~30 segundos** (±1s)

**Validaciones:**
- [ ] Primera métrica enviada tras registro
- [ ] Siguiente métrica exactamente 30s después
- [ ] Tercera métrica exactamente 30s después de la segunda
- [ ] Intervalo es consistente

---

### TEST MET-004: Cálculo de Growth Rate

**Objetivo:** Verificar que el growth rate se calcula correctamente.

**Steps:**
```bash
# 1. Iniciar cliente y esperar 2-3 envíos de métricas
npm start

# 2. Crear un archivo grande para cambiar el disco
fsutil file createnew test_file.tmp 104857600  # 100 MB en Windows
# dd if=/dev/zero of=test_file.tmp bs=1M count=100  # Linux

# 3. Esperar siguiente envío de métrica
# 4. Verificar growth rate en consola
```

**Resultado Esperado:**
- Growth rate > 0 (positivo si se agregó archivo)
- Valor aproximadamente proporcional al archivo creado

**Validaciones:**
- [ ] Growth rate cambia tras modificar disco
- [ ] Valor en MB/hora es coherente
- [ ] Cálculo considera tiempo transcurrido

---

## 5. PRUEBAS DE MENSAJES {#pruebas-mensajes}

### TEST MSG-001: Recepción de Mensajes del Servidor

**Objetivo:** Verificar que el cliente recibe mensajes del servidor.

**Steps:**
```bash
# 1. Cliente corriendo
# 2. Desde el servidor, enviar mensaje al cliente
# (usar UI o API del servidor)

# 3. Verificar consola del cliente
```

**Resultado Esperado:**
```
📨 Mensaje recibido del servidor: [msg_12345] "Sistema OK"
💾 Mensaje guardado en logs/messages.log
```

**Validaciones:**
- [ ] Mensaje aparece en consola
- [ ] Mensaje guardado en `logs/messages.log`
- [ ] Formato correcto en archivo
- [ ] ACK enviado automáticamente

---

### TEST MSG-002: Persistencia en messages.log

**Objetivo:** Confirmar que los mensajes se guardan correctamente.

**Steps:**
```bash
# 1. Cliente corriendo
# 2. Enviar 3 mensajes desde el servidor
# 3. Abrir logs/messages.log
Get-Content logs/messages.log
```

**Resultado Esperado:**
```
[2026-03-06 10:30:00] [msg_12345] Sistema funcionando correctamente
[2026-03-06 10:31:15] [msg_12346] Alerta de mantenimiento programado
[2026-03-06 10:32:30] [msg_12347] Respaldo completado exitosamente
```

**Validaciones:**
- [ ] Cada mensaje en nueva línea
- [ ] Formato: `[timestamp] [message_id] content`
- [ ] Timestamp correcto (local time)
- [ ] Sin duplicados
- [ ] Orden cronológico

---

### TEST MSG-003: Mensajes con Caracteres Especiales

**Objetivo:** Validar manejo de caracteres especiales y UTF-8.

**Steps:**
```bash
# 1. Enviar mensaje con caracteres especiales:
# "Prueba: áéíóú ñÑ 中文 emoji 🚀"

# 2. Verificar en logs/messages.log
```

**Resultado Esperado:**
- Todos los caracteres se muestran correctamente

**Validaciones:**
- [ ] Acentos preservados
- [ ] Caracteres UTF-8 correctos
- [ ] Emojis visibles (si el sistema lo soporta)
- [ ] Sin caracteres corruptos

---

## 6. PRUEBAS DE ACKs {#pruebas-acks}

### TEST ACK-001: Envío Automático de ACK

**Objetivo:** Verificar que se envía ACK tras recibir mensaje.

**Steps:**
```bash
# 1. Cliente corriendo con LOG_LEVEL=debug
# 2. Servidor envía mensaje al cliente
# 3. Revisar logs del cliente
Get-Content logs/client.log -Tail 20
```

**Resultado Esperado:**
```
📨 Mensaje recibido del servidor
💾 Mensaje guardado en logs/messages.log
✅ ACK enviado para mensaje: msg_12345
```

**Validaciones:**
- [ ] ACK enviado automáticamente (sin intervención manual)
- [ ] ACK contiene `message_id` correcto
- [ ] Enviado **después** de guardar en archivo
- [ ] Servidor recibe el ACK

---

### TEST ACK-002: Formato del ACK

**Objetivo:** Validar estructura JSON del ACK.

**Steps:**
```bash
# 1. Con debug activado, observar logs
# 2. Capturar JSON del ACK enviado
```

**Resultado Esperado:**
```json
{
  "message_type": "ACK",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-06T10:30:15.456Z",
  "ack_for": "msg_12345"
}
```

**Validaciones:**
- [ ] Todos los campos presentes
- [ ] `ack_for` coincide con `message_id` recibido
- [ ] `timestamp` refleja momento del ACK (no del mensaje)
- [ ] JSON bien formado

---

## 7. PRUEBAS DE RECONEXIÓN {#pruebas-reconexión}

### TEST REC-001: Reconexión tras Caída del Servidor

**Objetivo:** Verificar reconexión automática al restaurar el servidor.

**Steps:**
```bash
# 1. Cliente y servidor corriendo
# 2. Detener el servidor (Ctrl+C en terminal del servidor)
# 3. Observar comportamiento del cliente (debe intentar reconectar)
# 4. Reiniciar el servidor
# 5. Verificar que cliente se reconecta automáticamente
```

**Resultado Esperado:**
```
⚠️  Desconectado del servidor
🔌 Reconectando (intento 1/∞)...
🔌 Reconectando (intento 2/∞)...
✅ Conectado al servidor
📝 Mensaje de registro enviado
```

**Validaciones:**
- [ ] Cliente detecta desconexión
- [ ] Intentos de reconexión automáticos
- [ ] Reconexión exitosa al volver servidor
- [ ] Continúa enviando métricas normalmente
- [ ] No se pierden datos (se reanudan envíos)

---

### TEST REC-002: Backoff Exponencial

**Objetivo:** Confirmar que el intervalo de reconexión aumenta exponencialmente.

**Steps:**
```bash
# 1. Servidor apagado
# 2. Iniciar cliente
# 3. Cronometrar tiempo entre intentos de reconexión
```

**Resultado Esperado:**
- Intento 1: inmediato
- Intento 2: ~1 segundo después
- Intento 3: ~2 segundos después
- Intento 4: ~4 segundos después
- Intento 5: ~8 segundos después
- Intento 6+: ~8 segundos (cap)

**Validaciones:**
- [ ] Tiempo aumenta exponencialmente (1s, 2s, 4s, 8s)
- [ ] Máximo: 8 segundos (no aumenta más)
- [ ] No hay intentos excesivos en corto tiempo

---

### TEST REC-003: Pérdida Intermitente de Conexión

**Objetivo:** Probar reconexión con caídas intermitentes.

**Steps:**
```bash
# 1. Cliente y servidor corriendo
# 2. Detener servidor 10 segundos
# 3. Reiniciar servidor
# 4. Esperar reconexión
# 5. Repetir 2-3 veces
```

**Resultado Esperado:**
- Cliente se reconecta cada vez sin perder funcionalidad

**Validaciones:**
- [ ] Reconexión exitosa en todas las ocasiones
- [ ] Métricas se reanudan tras cada reconexión
- [ ] No hay memory leaks (uso de memoria estable)
- [ ] Logs coherentes

---

## 8. PRUEBAS DE LOGGING {#pruebas-logging}

### TEST LOG-001: Archivo client.log Creado

**Objetivo:** Verificar que se crea el archivo de log principal.

**Steps:**
```bash
# 1. Borrar carpeta logs/ si existe
rmdir /s logs   # Windows
# rm -rf logs   # Linux

# 2. Iniciar cliente
npm start

# 3. Verificar archivos creados
dir logs\   # Windows
ls logs/    # Linux
```

**Resultado Esperado:**
```
logs/
├── client.log
├── error.log
└── messages.log
```

**Validaciones:**
- [ ] Carpeta `logs/` creada automáticamente
- [ ] Archivo `client.log` existe
- [ ] Archivo `error.log` existe (puede estar vacío)
- [ ] Archivo `messages.log` creado

---

### TEST LOG-002: Niveles de Log

**Objetivo:** Validar que los niveles de log funcionan correctamente.

**Steps:**
```bash
# 1. Probar nivel DEBUG
# Editar .env: LOG_LEVEL=debug
npm start
# Verificar: muchos logs detallados

# 2. Probar nivel INFO
# Editar .env: LOG_LEVEL=info
npm start
# Verificar: logs normales

# 3. Probar nivel WARN
# Editar .env: LOG_LEVEL=warn
npm start
# Verificar: solo warnings y errores

# 4. Probar nivel ERROR
# Editar .env: LOG_LEVEL=error
npm start
# Verificar: solo errores
```

**Validaciones:**
- [ ] `debug`: muestra todos los mensajes (muy verbose)
- [ ] `info`: muestra info, warn, error
- [ ] `warn`: solo warn y error
- [ ] `error`: solo errores críticos

---

### TEST LOG-003: Rotación de Logs

**Objetivo:** Verificar que los logs rotan al alcanzar tamaño máximo.

**Steps:**
```bash
# 1. Configurar LOG_LEVEL=debug para generar muchos logs
# 2. Ejecutar cliente por tiempo prolongado o simular logs
# 3. Verificar tamaño de client.log
# 4. Si supera límite (ej. 10MB), debe crear client.log.1
```

**Resultado Esperado:**
- Cuando `client.log` alcanza límite, se renombra a `client.log.1`
- Se crea nuevo `client.log` vacío

**Validaciones:**
- [ ] Archivos rotados: `client.log.1`, `client.log.2`, etc.
- [ ] Logs antiguos no se pierden
- [ ] Tamaño de archivos controlado

---

### TEST LOG-004: Error.log solo Errores

**Objetivo:** Confirmar que `error.log` solo contiene errores críticos.

**Steps:**
```bash
# 1. Iniciar cliente con servidor apagado (forzar errores)
npm start

# 2. Revisar error.log
Get-Content logs/error.log -Tail 20
```

**Resultado Esperado:**
- Solo mensajes de nivel `error`
- Sin mensajes `info` o `debug`

**Validaciones:**
- [ ] error.log tiene solo errores
- [ ] Errores incluyen stack traces
- [ ] Timestamps correctos

---

## 9. PRUEBAS DE CONFIGURACIÓN {#pruebas-configuración}

### TEST CFG-001: Validación de CLIENT_ID

**Objetivo:** Verificar que CLIENT_ID es obligatorio.

**Steps:**
```bash
# 1. Editar .env y comentar o borrar CLIENT_ID
# CLIENT_ID=

# 2. Iniciar cliente
npm start
```

**Resultado Esperado:**
```
❌ Error: CLIENT_ID is required
```

**Validaciones:**
- [ ] Cliente no inicia sin CLIENT_ID
- [ ] Mensaje de error claro
- [ ] No crashea, termina limpiamente

---

### TEST CFG-002: Validación de Formato de CLIENT_ID

**Objetivo:** Validar formato correcto de CLIENT_ID.

**Steps:**
```bash
# Probar valores inválidos:
CLIENT_ID=
CLIENT_ID=123
CLIENT_ID=CLIENTE_001
CLIENT_ID=CLIENT_0001
CLIENT_ID=client_001
```

**Resultado Esperado:**
- Formatos válidos: `CLIENT_001` a `CLIENT_009`
- Formatos inválidos deben rechazarse (si hay validación estricta)

**Validaciones:**
- [ ] Solo acepta formato `CLIENT_XXX`
- [ ] XXX es número de 001 a 009

---

### TEST CFG-003: Valores por Defecto

**Objetivo:** Verificar que se usan valores por defecto si no se especifican.

**Steps:**
```bash
# 1. Editar .env y comentar SERVER_HOST y SERVER_PORT
# SERVER_HOST=
# SERVER_PORT=

# 2. Verificar que usa defaults: localhost:5000
npm start
```

**Resultado Esperado:**
```
Servidor: localhost:5000
```

**Validaciones:**
- [ ] SERVER_HOST default = `localhost`
- [ ] SERVER_PORT default = `5000`
- [ ] Otros parámetros tienen defaults correctos

---

### TEST CFG-004: Cambio de Intervalo de Métricas

**Objetivo:** Verificar que METRICS_INTERVAL es respetado.

**Steps:**
```bash
# 1. Editar .env
METRICS_INTERVAL=10000  # 10 segundos

# 2. Iniciar cliente y verificar que envía cada 10s
npm start
```

**Resultado Esperado:**
- Métricas enviadas cada 10 segundos (no 30)

**Validaciones:**
- [ ] Intervalo modificado funciona
- [ ] Tiempo entre métricas correcto
- [ ] Se respeta el valor del .env

---

## 10. PRUEBAS DE ROBUSTEZ {#pruebas-robustez}

### TEST ROB-001: Múltiples Clientes Simultáneos

**Objetivo:** Probar que múltiples clientes pueden correr simultáneamente.

**Steps:**
```bash
# 1. Crear 3 carpetas de cliente con diferentes CLIENT_ID
# client1/.env → CLIENT_ID=CLIENT_001
# client2/.env → CLIENT_ID=CLIENT_002
# client3/.env → CLIENT_ID=CLIENT_003

# 2. Iniciar los 3 clientes al mismo tiempo
# Terminal 1: cd client1 && npm start
# Terminal 2: cd client2 && npm start
# Terminal 3: cd client3 && npm start
```

**Resultado Esperado:**
- Todos los clientes conectan exitosamente
- Cada uno envía métricas independientemente

**Validaciones:**
- [ ] 3 clientes conectados simultáneamente
- [ ] Servidor registra 3 conexiones
- [ ] No hay conflictos entre clientes
- [ ] Cada cliente identificado por su CLIENT_ID

---

### TEST ROB-002: Ejecución Prolongada (Stress Test)

**Objetivo:** Verificar estabilidad en ejecución de larga duración.

**Steps:**
```bash
# 1. Iniciar cliente
npm start

# 2. Dejar corriendo por al menos 30 minutos
# 3. Monitorear uso de memoria y CPU
```

**Resultado Esperado:**
- Cliente funciona sin problemas
- Métricas enviadas consistentemente
- No hay memory leaks

**Validaciones:**
- [ ] Uso de memoria estable (no crece infinitamente)
- [ ] CPU no se dispara
- [ ] Todas las métricas enviadas correctamente
- [ ] Logs sin errores inesperados

---

### TEST ROB-003: Cierre Graceful (SIGINT / Ctrl+C)

**Objetivo:** Verificar que el cliente cierra correctamente con Ctrl+C.

**Steps:**
```bash
# 1. Iniciar cliente
npm start

# 2. Presionar Ctrl+C
```

**Resultado Esperado:**
```
📴 Cerrando cliente (SIGINT)...
✅ Cliente cerrado correctamente
```

**Validaciones:**
- [ ] Cliente se cierra limpiamente
- [ ] Sin procesos zombies
- [ ] Logs finales escritos correctamente
- [ ] Socket cerrado apropiadamente

---

### TEST ROB-004: Cierre con Servidor Caído

**Objetivo:** Verificar cierre limpio cuando servidor no responde.

**Steps:**
```bash
# 1. Detener servidor
# 2. Cliente intentando reconectar
# 3. Presionar Ctrl+C en cliente
```

**Resultado Esperado:**
- Cliente cierra inmediatamente sin esperar al servidor

**Validaciones:**
- [ ] Cierre rápido (< 2 segundos)
- [ ] No queda colgado esperando respuesta
- [ ] Proceso termina limpiamente

---

## 11. CASOS DE USO COMPLETOS {#casos-uso-completos}

### CASO 1: Flujo Completo Normal

**Escenario:** Cliente conecta, envía métricas, recibe mensaje, confirma con ACK.

**Steps:**
1. Iniciar servidor (`cd server && npm start`)
2. Iniciar cliente (`cd client && npm start`)
3. Esperar 30 segundos (primera métrica)
4. Desde servidor/UI, enviar mensaje al cliente
5. Verificar que cliente recibe y responde ACK
6. Cerrar con Ctrl+C

**Checklist:**
- [ ] Conexión exitosa
- [ ] Registro enviado
- [ ] Primera métrica enviada a los ~3 segundos
- [ ] Segunda métrica a los ~33 segundos
- [ ] Mensaje recibido y guardado
- [ ] ACK enviado automáticamente
- [ ] Cierre limpio

---

### CASO 2: Recuperación de Fallos

**Escenario:** Cliente con servidor que se cae y se recupera.

** Steps:**
1. Iniciar servidor y cliente
2. Esperar primera métrica
3. **DETENER servidor** (Ctrl+C)
4. Observar reconexión del cliente (intentos cada 1s, 2s, 4s, 8s)
5. **REINICIAR servidor** después de ~30 segundos
6. Verificar que cliente se reconecta
7. Verificar que métricas continúan enviándose

**Checklist:**
- [ ] Cliente detecta desconexión
- [ ] Reconexión automática iniciada
- [ ] Backoff exponencial aplicado
- [ ] Reconexión exitosa al volver servidor
- [ ] Métricas continúan sin pérdida

---

### CASO 3: Múltiples Mensajes

**Escenario:** Cliente recibe múltiples mensajes en secuencia.

**Steps:**
1. Cliente conectado
2. Enviar 5 mensajes en rápida sucesión desde servidor
3. Verificar `logs/messages.log`
4. Verificar que servidor recibe 5 ACKs

**Checklist:**
- [ ] Todos los 5 mensajes recibidos
- [ ] Todos guardados en messages.log
- [ ] 5 ACKs enviados (uno por mensaje)
- [ ] Orden preservado
- [ ] Sin duplicados

---

## 📊 MATRIZ DE COBERTURA

| Módulo | Tests | Cobertura |
|--------|-------|-----------|
| Conexión TCP | 3 | ✅ 100% |
| Métricas | 4 | ✅ 100% |
| Mensajes | 3 | ✅ 100% |
| ACKs | 2 | ✅ 100% |
| Reconexión | 3 | ✅ 100% |
| Logging | 4 | ✅ 100% |
| Configuración | 4 | ✅ 100% |
| Robustez | 4 | ✅ 100% |
| **TOTAL** | **27** | **✅ 100%** |

---

## 📸 SCREENSHOTS ESPERADOS

### Salida Normal del Cliente

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

🚀 Iniciando cliente TCP...
🔌 Conectando a localhost:5000...
✅ Conectado al servidor
✅ Estado: CONECTADO

📝 Mensaje de registro enviado
📊 Iniciando envío periódico de métricas cada 30 segundos

📈 Métricas enviadas:
   Total: 931.32 GB | Usado: 598.45 GB | Libre: 332.87 GB
   Utilización: 64.25% | Growth Rate: 12.5 MB/hora

📨 Mensaje recibido del servidor: [msg_12345] "Sistema funcionando correctamente"
💾 Mensaje guardado en logs/messages.log
✅ ACK enviado para mensaje: msg_12345

📈 Métricas enviadas:
   Total: 931.32 GB | Usado: 598.50 GB | Libre: 332.82 GB
   Utilización: 64.26% | Growth Rate: 15.2 MB/hora
```

### Comportamiento de Reconexión

```
⚠️  Desconectado del servidor
⚠️  Estado: DESCONECTADO

🔌 Reconectando (intento 1/∞)...
🔌 Reconectando (intento 2/∞)...
🔌 Reconectando (intento 3/∞)...
✅ Conectado al servidor
✅ Estado: CONECTADO

📝 Mensaje de registro enviado
📊 Reanudando envío de métricas...
```

---

## ✅ CRITERIOS FINALES DE ACEPTACIÓN

El cliente está **COMPLETAMENTE FUNCIONAL** si:

- ✅ Todos los tests de la sección 2 (Checklist General) pasan
- ✅ Al menos 1 Caso de Uso Completo (sección 11) funciona end-to-end
- ✅ No hay errores críticos en `logs/error.log` durante operación normal
- ✅ Reconexión automática funciona tras caída del servidor
- ✅ Métricas se envían consistentemente cada 30 segundos
- ✅ Mensajes del servidor se reciben, guardan y confirman con ACK
- ✅ Cliente cierra limpiamente con Ctrl+C

---

**🎯 Testing completado por:** ___________________  
**📅 Fecha:** ___________________  
**✅ Estado:** [ ] PASS  [ ] FAIL

**Notas adicionales:**
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

---

**📚 Documentación relacionada:**
- [README.md](README.md) - Documentación completa
- [QUICKSTART.md](QUICKSTART.md) - Inicio rápido
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Detalles técnicos
