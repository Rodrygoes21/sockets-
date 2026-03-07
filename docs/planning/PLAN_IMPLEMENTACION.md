# PLAN DE IMPLEMENTACIÓN - STORAGE CLUSTER CON NODO CENTRAL DE MONITOREO

## PROYECTO: Práctica 1 - Implementación de Sockets TCP/IP

---

## 📋 ÍNDICE

1. [Tareas del Nodo Cliente](#tareas-nodo-cliente)
2. [Tareas del Nodo Servidor](#tareas-nodo-servidor)
3. [Tareas de Base de Datos](#tareas-base-de-datos)
4. [Tareas de Interfaz Gráfica](#tareas-interfaz-grafica)
5. [Tareas de Documentación](#tareas-documentacion)
6. [Plan de Implementación por Fases](#plan-implementacion-fases)
7. [Riesgos Técnicos y Mitigación](#riesgos-tecnicos)
8. [Preguntas de Defensa Técnica](#preguntas-defensa)

---

## 1. TAREAS DEL NODO CLIENTE {#tareas-nodo-cliente}

### **TC-001: Implementar Socket Cliente TCP/IP**

**Descripción Técnica:**
- Crear clase `ClientSocket` que establezca conexión TCP con el servidor central
- Implementar manejo de excepciones de conexión (timeout, refused, network unreachable)
- Configurar socket con opciones: SO_KEEPALIVE, TCP_NODELAY
- Implementar mecanismo de reconexión automática con backoff exponencial (1s, 2s, 4s, 8s, max 30s)
- Socket debe ser no bloqueante para permitir operaciones concurrentes

**Criterios de Aceptación:**
- [ ] El cliente se conecta exitosamente al servidor usando IP:Puerto configurables
- [ ] Reconexión automática funciona después de pérdida de conexión
- [ ] Timeout de conexión configurado en máximo 10 segundos
- [ ] Logs de todos los intentos de conexión y errores
- [ ] Pruebas unitarias con servidor simulado

**Dependencias:**
- Ninguna (tarea inicial)

---

### **TC-002: Implementar Recolección de Métricas de Disco**

**Descripción Técnica:**
- Detectar automáticamente el primer disco del sistema operativo
- Obtener métricas usando librerías nativas del SO:
  - **Linux**: `psutil.disk_usage('/')` o `/proc/mounts`
  - **Windows**: `psutil.disk_usage('C:\\')` o WMI
- Recolectar métricas específicas:
  - `total_capacity`: Capacidad total en bytes
  - `used_capacity`: Espacio usado en bytes
  - `free_capacity`: Espacio libre en bytes
  - `utilization_percent`: Porcentaje de utilización (used/total * 100)
- Implementar función `get_disk_metrics()` que retorne diccionario
- Manejar errores de permisos o disco no disponible

**Criterios de Aceptación:**
- [ ] Detecta correctamente el primer disco en Windows y Linux
- [ ] Métricas en bytes (enteros de 64 bits)
- [ ] Cálculo preciso del porcentaje de utilización con 2 decimales
- [ ] Manejo de errores de permisos sin crashear la aplicación
- [ ] Función ejecuta en menos de 500ms
- [ ] Pruebas con discos de diferentes tamaños (GB, TB)

**Dependencias:**
- Ninguna

---

### **TC-003: Implementar Serialización JSON de Mensajes**

**Descripción Técnica:**
- Diseñar estructura JSON para envío de métricas al servidor:
```json
{
  "message_type": "METRICS_REPORT",
  "client_id": "CLIENT_001",
  "timestamp": "2026-03-02T14:30:45.123Z",
  "metrics": {
    "total_capacity": 1099511627776,
    "used_capacity": 659706977280,
    "free_capacity": 439804650496,
    "utilization_percent": 60.00
  }
}
```
- Implementar clase `MessageSerializer` con métodos:
  - `serialize_metrics(client_id, metrics) -> str`
  - `serialize_ack(client_id, message_id) -> str`
  - `deserialize_message(json_str) -> dict`
- Validar estructura JSON antes de enviar
- Implementar manejo de errores de serialización

**Criterios de Aceptación:**
- [ ] JSON bien formado y válido según especificación
- [ ] Timestamp en formato ISO 8601 con milisegundos
- [ ] Validación de campos obligatorios antes de serializar
- [ ] Manejo de caracteres especiales y encoding UTF-8
- [ ] Pruebas con mensajes válidos e inválidos

**Dependencias:**
- TC-002 (necesita métricas para serializar)

---

### **TC-004: Implementar Envío Periódico de Métricas**

**Descripción Técnica:**
- Crear thread independiente para envío periódico de métricas
- Leer intervalo de envío desde archivo de configuración `client_config.json`:
```json
{
  "client_id": "CLIENT_001",
  "server_ip": "192.168.1.100",
  "server_port": 5000,
  "report_interval_seconds": 30
}
```
- Implementar timer/scheduler que ejecute cada N segundos
- Recolectar métricas → Serializar → Enviar por socket
- Manejar errores de envío sin detener el scheduler
- Implementar shutdown graceful del thread

**Criterios de Aceptación:**
- [ ] Envío se ejecuta exactamente cada N segundos (tolerancia ±1s)
- [ ] Parámetro `report_interval_seconds` es configurable (min: 10s, max: 300s)
- [ ] Thread se detiene correctamente al cerrar aplicación
- [ ] Logs de cada envío exitoso con timestamp
- [ ] Reintentos automáticos si falla el envío (3 intentos con 2s entre c/u)

**Dependencias:**
- TC-001 (socket cliente)
- TC-002 (recolección de métricas)
- TC-003 (serialización JSON)

---

### **TC-005: Implementar Recepción de Mensajes del Servidor**

**Descripción Técnica:**
- Crear thread independiente para escuchar mensajes entrantes del servidor
- Implementar recepción de mensajes con delimitador o longitud prefijada:
  - **Opción 1**: Mensajes delimitados por `\n`
  - **Opción 2**: Prefijo de 4 bytes indicando longitud del mensaje
- Parsear mensajes JSON recibidos con estructura:
```json
{
  "message_type": "SERVER_NOTIFICATION",
  "message_id": "MSG_1234567890",
  "timestamp": "2026-03-02T14:35:00.000Z",
  "content": "Alerta: Capacidad de almacenamiento crítica"
}
```
- Procesar tipos de mensajes: NOTIFICATION, COMMAND, SHUTDOWN
- Implementar cola thread-safe para mensajes recibidos

**Criterios de Aceptación:**
- [ ] Recibe y parsea correctamente mensajes del servidor
- [ ] Maneja mensajes malformados sin crashear
- [ ] Thread de recepción corre continuamente sin bloquear envío
- [ ] Cola de mensajes implementada con `queue.Queue` (thread-safe)
- [ ] Logs de cada mensaje recibido

**Dependencias:**
- TC-001 (socket cliente)
- TC-003 (deserialización JSON)

---

### **TC-006: Implementar Almacenamiento en Archivo .log**

**Descripción Técnica:**
- Crear archivo de log rotativo `client_messages.log` en directorio `logs/`
- Implementar clase `LogWriter` con gestión de archivos:
  - Rotación automática cuando archivo supere 10 MB
  - Mantener últimos 5 archivos de log
  - Formato: `client_messages_YYYYMMDD_HHMMSS.log`
- Escribir cada mensaje recibido con formato:
```
[2026-03-02 14:35:00.123] [MSG_1234567890] [SERVER_NOTIFICATION]
Content: Alerta: Capacidad de almacenamiento crítica
---
```
- Operaciones de escritura deben ser thread-safe (lock)
- Flush inmediato después de cada escritura para garantizar persistencia

**Criterios de Aceptación:**
- [ ] Archivo .log creado automáticamente si no existe
- [ ] Formato de log estructurado y legible
- [ ] Rotación funciona correctamente al superar 10 MB
- [ ] Thread-safe: múltiples threads pueden escribir simultáneamente
- [ ] Caracteres especiales manejados correctamente (UTF-8)
- [ ] Pruebas con múltiples mensajes concurrentes

**Dependencias:**
- TC-005 (recepción de mensajes)

---

### **TC-007: Implementar Envío de ACK**

**Descripción Técnica:**
- Implementar función `send_ack(message_id)` que envíe confirmación al servidor
- Estructura JSON del ACK:
```json
{
  "message_type": "ACK",
  "client_id": "CLIENT_001",
  "message_id": "MSG_1234567890",
  "timestamp": "2026-03-02T14:35:00.500Z",
  "status": "RECEIVED"
}
```
- Enviar ACK inmediatamente después de guardar mensaje en .log
- Implementar timeout de 5 segundos para envío de ACK
- Manejar fallo en envío de ACK (registrar en log de errores)

**Criterios de Aceptación:**
- [ ] ACK enviado dentro de 2 segundos después de recibir mensaje
- [ ] JSON del ACK incluye `message_id` correcto
- [ ] Si falla envío de ACK, se registra en log de errores
- [ ] ACK no bloquea recepción de nuevos mensajes
- [ ] Pruebas de envío exitoso y con errores de red

**Dependencias:**
- TC-005 (recepción de mensajes)
- TC-006 (almacenamiento en log)

---

### **TC-008: Implementar Archivo de Configuración**

**Descripción Técnica:**
- Crear archivo `client_config.json` con todos los parámetros configurables:
```json
{
  "client_id": "CLIENT_001",
  "server_ip": "192.168.1.100",
  "server_port": 5000,
  "report_interval_seconds": 30,
  "connection_timeout_seconds": 10,
  "reconnection_enabled": true,
  "max_reconnection_attempts": -1,
  "log_directory": "./logs",
  "log_max_size_mb": 10,
  "log_retention_count": 5
}
```
- Implementar clase `ConfigManager` para cargar y validar configuración
- Validaciones:
  - `client_id` debe seguir patrón `CLIENT_\d{3}` (CLIENT_001 a CLIENT_009)
  - `server_ip` debe ser IPv4 válida
  - `report_interval_seconds` entre 10 y 300
- Manejar errores de archivo no encontrado o JSON inválido

**Criterios de Aceptación:**
- [ ] Archivo JSON válido y bien formado
- [ ] Validación de todos los parámetros obligatorios
- [ ] Mensajes de error claros si configuración es inválida
- [ ] Valores por defecto para parámetros opcionales
- [ ] Documentación de cada parámetro en comentarios del archivo

**Dependencias:**
- Ninguna (puede desarrollarse en paralelo)

---

### **TC-009: Implementar Sistema de Logging**

**Descripción Técnica:**
- Configurar logging con librería estándar (Python: `logging`, Java: `log4j`)
- Niveles de log: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Dos handlers:
  1. **FileHandler**: `client_app.log` con rotación
  2. **ConsoleHandler**: Salida estándar para desarrollo
- Formato de log:
```
[2026-03-02 14:35:00.123] [INFO] [ClientSocket] Conexión establecida con servidor 192.168.1.100:5000
```
- Configuración por archivo `logging_config.ini`

**Criterios de Aceptación:**
- [ ] Logs estructurados con timestamp, nivel, módulo y mensaje
- [ ] Archivo de log rota automáticamente
- [ ] Console output en desarrollo, file only en producción
- [ ] Todos los módulos usan el mismo logger configurado
- [ ] Performance: logging no degrada rendimiento (async si es necesario)

**Dependencias:**
- Ninguna (infraestructura base)

---

### **TC-010: Implementar Manejo de Shutdown Graceful**

**Descripción Técnica:**
- Capturar señales de sistema: SIGINT, SIGTERM
- Implementar secuencia de shutdown:
  1. Detener scheduler de envío de métricas
  2. Enviar mensaje de desconexión al servidor
  3. Cerrar threads de recepción
  4. Flush y cerrar archivos de log
  5. Cerrar socket de red
- Timeout máximo de shutdown: 30 segundos
- Registrar evento de shutdown en log

**Criterios de Aceptación:**
- [ ] Aplicación se cierra limpiamente con Ctrl+C
- [ ] Todos los recursos se liberan correctamente
- [ ] No quedan threads zombies
- [ ] Último mensaje enviado al servidor es tipo DISCONNECT
- [ ] Logs finales escritos antes de cerrar

**Dependencias:**
- TC-001, TC-004, TC-005, TC-006, TC-009

---

### **TC-011: Pruebas de Integración del Cliente**

**Descripción Técnica:**
- Crear suite de pruebas de integración end-to-end:
  1. **Test conexión**: Cliente se conecta y envía primera métrica
  2. **Test métricas periódicas**: Envío cada N segundos
  3. **Test reconexión**: Simular caída de servidor y recuperación
  4. **Test mensajes**: Recibir mensaje, guardar en log, enviar ACK
  5. **Test concurrencia**: Múltiples operaciones simultáneas
- Usar servidor mock para pruebas controladas
- Medir tiempo de respuesta y throughput

**Criterios de Aceptación:**
- [ ] Todas las pruebas pasan exitosamente
- [ ] Coverage de código ≥ 80%
- [ ] Documentación de casos de prueba
- [ ] Pruebas automáticas en CI/CD
- [ ] Reporte de resultados en formato JUnit XML

**Dependencias:**
- TC-001 a TC-010 (todas las tareas del cliente)

---

## 2. TAREAS DEL NODO SERVIDOR {#tareas-nodo-servidor}

### **TS-001: Implementar Socket Servidor TCP/IP**

**Descripción Técnica:**
- Crear clase `ServerSocket` que escuche en puerto configurado
- Configurar socket con opciones:
  - `SO_REUSEADDR`: Permitir reutilización de puerto
  - `SO_KEEPALIVE`: Detectar conexiones muertas
  - `listen(10)`: Backlog de 10 conexiones pendientes
- Implementar accept loop para aceptar conexiones entrantes
- Cada nueva conexión debe manejarse en thread separado
- Limitar máximo 9 conexiones simultáneas (validación)

**Criterios de Aceptación:**
- [ ] Servidor escucha en IP:Puerto configurables
- [ ] Acepta conexiones entrantes correctamente
- [ ] Rechaza conexión #10 con mensaje de error
- [ ] Maneja errores de puerto ocupado
- [ ] Logs de cada nueva conexión aceptada

**Dependencias:**
- Ninguna (tarea inicial)

---

### **TS-002: Implementar Gestor de Conexiones Concurrentes**

**Descripción Técnica:**
- Crear clase `ConnectionManager` para administrar múltiples clientes
- Estructura de datos thread-safe para almacenar conexiones activas:
```python
{
  "CLIENT_001": {
    "socket": socket_obj,
    "address": ("192.168.1.10", 54321),
    "connected_at": datetime,
    "last_seen": datetime,
    "status": "CONNECTED"
  }
}
```
- Implementar métodos:
  - `add_client(client_id, socket, address)`
  - `remove_client(client_id)`
  - `get_client(client_id)`
  - `get_all_clients() -> list`
  - `is_full() -> bool` (retorna True si 9 clientes)
- Usar locks para operaciones thread-safe

**Criterios de Aceptación:**
- [ ] Almacena hasta 9 clientes simultáneamente
- [ ] Operaciones thread-safe con locks apropiados
- [ ] Actualiza `last_seen` automáticamente al recibir mensaje
- [ ] Método `is_full()` verifica límite de 9 clientes
- [ ] Pruebas de concurrencia con múltiples threads

**Dependencias:**
- TS-001 (socket servidor)

---

### **TS-003: Implementar Registro Automático de Clientes**

**Descripción Técnica:**
- Cuando servidor recibe primer mensaje de un cliente nuevo:
  1. Extraer `client_id` del mensaje JSON
  2. Validar formato del `client_id` (CLIENT_001 a CLIENT_009)
  3. Verificar que no exceda límite de 9 clientes
  4. Registrar cliente en `ConnectionManager`
  5. Insertar registro en base de datos (tabla `clients`)
  6. Enviar mensaje de confirmación al cliente
- Si `client_id` ya existe, actualizar `last_seen` y estado a UP

**Criterios de Aceptación:**
- [ ] Clientes nuevos se registran automáticamente
- [ ] Validación de `client_id` con formato correcto
- [ ] No permite registro si hay 9 clientes activos
- [ ] Cliente existente que reconecta actualiza su estado
- [ ] Logs de cada registro exitoso

**Dependencias:**
- TS-002 (gestor de conexiones)
- TD-001 (esquema de base de datos)

---

### **TS-004: Implementar Recepción y Procesamiento de Métricas**

**Descripción Técnica:**
- En thread dedicado por cliente, recibir mensajes JSON de métricas
- Usar mismo protocolo que cliente (delimitador `\n` o longitud prefijada)
- Parsear JSON y validar estructura:
  - Campos obligatorios presentes
  - Tipos de datos correctos
  - Valores numéricos positivos
- Extraer métricas y almacenar en base de datos (tabla `metrics`)
- Actualizar `last_seen` del cliente en `ConnectionManager`
- Marcar cliente como UP si estaba DOWN

**Criterios de Aceptación:**
- [ ] Recibe y parsea correctamente mensajes de métricas
- [ ] Validación completa de estructura JSON
- [ ] Métricas almacenadas en BD con timestamp del servidor
- [ ] Cliente marcado como UP automáticamente
- [ ] Maneja JSON malformado sin crashear

**Dependencias:**
- TS-002 (gestor de conexiones)
- TS-003 (registro de clientes)
- TD-002 (tabla de métricas)

---

### **TS-005: Implementar Detector de Nodos Inactivos**

**Descripción Técnica:**
- Crear thread `InactivityMonitor` que ejecuta cada 15 segundos
- Para cada cliente registrado:
  1. Calcular tiempo transcurrido desde `last_seen`
  2. Comparar con timeout configurado (ej: `report_interval * 3`)
  3. Si excede timeout: marcar cliente como "No Reporta" (DOWN)
  4. Actualizar estado en BD y `ConnectionManager`
  5. Registrar evento en log
- Parámetro `inactivity_timeout_seconds` configurable en `server_config.json`

**Criterios de Aceptación:**
- [ ] Detecta clientes inactivos dentro de 15 segundos después de timeout
- [ ] Estado cambia automáticamente de UP a DOWN
- [ ] Cambio de estado registrado en BD con timestamp
- [ ] Cliente que vuelve a reportar pasa automáticamente a UP
- [ ] Pruebas con diferentes valores de timeout

**Dependencias:**
- TS-002 (gestor de conexiones)
- TS-004 (actualización de last_seen)
- TD-001 (tabla clients para estado)

---

### **TS-006: Implementar Cálculo de Métricas Globales**

**Descripción Técnica:**
- Crear clase `MetricsAggregator` que calcule métricas globales
- Ejecutar cálculo cada vez que se reciben nuevas métricas
- Métricas globales a calcular:
```python
total_capacity_global = SUM(total_capacity de todos los clientes UP)
used_capacity_global = SUM(used_capacity de todos los clientes UP)
free_capacity_global = SUM(free_capacity de todos los clientes UP)
utilization_percent_global = (used_capacity_global / total_capacity_global) * 100
```
- Almacenar métricas globales en tabla `global_metrics`
- Solo considerar clientes con estado UP para el cálculo

**Criterios de Aceptación:**
- [ ] Cálculo correcto de suma de capacidades
- [ ] Porcentaje global calculado con 2 decimales
- [ ] Solo clientes UP incluidos en el cálculo
- [ ] Métricas globales actualizadas en tiempo real
- [ ] Pruebas con diferentes combinaciones de clientes UP/DOWN

**Dependencias:**
- TS-004 (recepción de métricas)
- TD-003 (tabla global_metrics)

---

### **TS-007: Implementar Cálculo de Growth Rate**

**Descripción Técnica:**
- Calcular tasa de crecimiento del espacio usado por cliente
- Fórmula: `growth_rate = (used_actual - used_anterior) / tiempo_transcurrido`
- Unidad: MB/hora o GB/día
- Requiere al menos 2 mediciones con intervalo mínimo de 5 minutos
- Almacenar growth_rate en tabla `metrics` o tabla separada
- Calcular también growth_rate global (agregado de todos los clientes)

**Criterios de Aceptación:**
- [ ] Growth rate calculado correctamente en MB/hora
- [ ] Mínimo 2 mediciones para cálculo
- [ ] Maneja casos de crecimiento negativo (liberación de espacio)
- [ ] Growth rate global es suma de todos los growth rates individuales
- [ ] Pruebas con datos simulados de diferentes tasas

**Dependencias:**
- TS-004 (métricas históricas)
- TS-006 (agregación)
- TD-002 (histórico de métricas)

---

### **TS-008: Implementar Envío de Mensajes a Clientes**

**Descripción Técnica:**
- Crear método `send_message_to_client(client_id, message_type, content)`
- Generar `message_id` único usando timestamp + UUID
- Estructura JSON del mensaje:
```json
{
  "message_type": "SERVER_NOTIFICATION",
  "message_id": "MSG_1709390100_a3f2e1",
  "timestamp": "2026-03-02T14:35:00.000Z",
  "content": "Mensaje de prueba"
}
```
- Enviar mensaje por socket del cliente específico
- Implementar timeout de 10 segundos para envío
- Registrar mensaje enviado en tabla `sent_messages`

**Criterios de Aceptación:**
- [ ] Mensaje enviado correctamente al cliente específico
- [ ] `message_id` único generado automáticamente
- [ ] Timeout funciona correctamente
- [ ] Mensaje registrado en BD con estado SENT
- [ ] Maneja errores de cliente desconectado

**Dependencias:**
- TS-002 (gestor de conexiones)
- TD-004 (tabla sent_messages)

---

### **TS-009: Implementar Recepción de ACKs**

**Descripción Técnica:**
- Modificar handler de mensajes entrantes para procesar ACKs
- Al recibir ACK:
  1. Parsear JSON y extraer `message_id`
  2. Buscar mensaje en tabla `sent_messages`
  3. Actualizar estado de SENT a ACKNOWLEDGED
  4. Registrar `ack_received_at` timestamp
  5. Calcular tiempo de respuesta (ack_received_at - sent_at)
- Implementar timeout de ACK: si no se recibe en 30 segundos, marcar como TIMEOUT

**Criterios de Aceptación:**
- [ ] ACKs procesados correctamente
- [ ] Estado del mensaje actualizado en BD
- [ ] Tiempo de respuesta calculado en milisegundos
- [ ] Mensajes sin ACK marcados como TIMEOUT después de 30s
- [ ] Logs de cada ACK recibido

**Dependencias:**
- TS-008 (envío de mensajes)
- TD-004 (tabla sent_messages)

---

### **TS-010: Implementar Mecanismo de Availability**

**Descripción Técnica:**
- Calcular availability para cada cliente:
```
availability = (uptime / (uptime + downtime)) * 100
```
- Registrar eventos de cambio de estado (UP ↔ DOWN) con timestamps
- Calcular uptime/downtime desde inicio del monitoreo o ventana de tiempo (ej: últimas 24h)
- Verificar si availability ≥ 99.9% para cada cliente
- Calcular availability global (promedio o peor caso)
- Crear tabla `availability_events` para historial

**Criterios de Aceptación:**
- [ ] Availability calculado correctamente con 3 decimales
- [ ] Eventos de cambio de estado registrados
- [ ] Cálculo sobre ventana de tiempo configurable
- [ ] Availability global calculado (promedio de todos los clientes)
- [ ] Alerta si availability < 99.9%

**Dependencias:**
- TS-005 (detector de inactivos)
- TD-005 (tabla availability_events)

---

### **TS-011: Implementar Archivo de Configuración del Servidor**

**Descripción Técnica:**
- Crear `server_config.json` con parámetros:
```json
{
  "server_ip": "0.0.0.0",
  "server_port": 5000,
  "max_clients": 9,
  "inactivity_timeout_seconds": 90,
  "ack_timeout_seconds": 30,
  "database": {
    "type": "sqlite",
    "path": "./data/storage_cluster.db"
  },
  "monitoring_interval_seconds": 15,
  "availability_window_hours": 24
}
```
- Validar configuración al inicio
- Permitir override con variables de entorno

**Criterios de Aceptación:**
- [ ] Archivo JSON válido con todos los parámetros
- [ ] Validación de tipos y rangos
- [ ] Valores por defecto para parámetros opcionales
- [ ] Variables de entorno sobrescriben config file
- [ ] Documentación de cada parámetro

**Dependencias:**
- Ninguna

---

### **TS-012: Implementar API para Interfaz Gráfica**

**Descripción Técnica:**
- Crear API REST simple o WebSocket para comunicación con UI
- Endpoints/Métodos necesarios:
  - `GET /clients`: Lista de clientes y estado actual
  - `GET /metrics/current`: Métricas actuales de todos los clientes
  - `GET /metrics/history?client_id=X&from=&to=`: Histórico
  - `GET /metrics/global`: Métricas globales agregadas
  - `GET /availability`: Availability de cada cliente
  - `POST /messages/send`: Enviar mensaje a un cliente
  - `GET /messages/history`: Historial de mensajes enviados
- También puede ser interface directa con BD si UI accede directamente

**Criterios de Aceptación:**
- [ ] Todos los endpoints retornan JSON válido
- [ ] Respuestas en menos de 200ms para datos actuales
- [ ] Filtrado y paginación para históricos
- [ ] Manejo de errores con códigos HTTP apropiados
- [ ] Documentación de API (Swagger/OpenAPI)

**Dependencias:**
- TS-002, TS-004, TS-006, TS-010 (fuentes de datos)

---

### **TS-013: Implementar Sistema de Logging del Servidor**

**Descripción Técnica:**
- Configurar logging con rotación automática
- Niveles: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Múltiples handlers:
  - `server_app.log`: Logs generales
  - `connections.log`: Conexiones/desconexiones
  - `metrics.log`: Recepción de métricas
  - `errors.log`: Solo errores
- Formato estructurado con timestamp, nivel, módulo, mensaje

**Criterios de Aceptación:**
- [ ] Logs separados por categoría
- [ ] Rotación automática por tamaño o tiempo
- [ ] Performance no afectado por logging
- [ ] Logs incluyen información de contexto (client_id, IP)
- [ ] Integración con syslog opcional

**Dependencias:**
- Ninguna (infraestructura base)

---

### **TS-014: Pruebas de Carga y Estrés del Servidor**

**Descripción Técnica:**
- Crear suite de pruebas de carga:
  1. **Test 9 clientes concurrentes**: Todos enviando métricas cada 30s
  2. **Test reconexiones masivas**: Todos los clientes reconectan simultáneamente
  3. **Test envío masivo de mensajes**: Servidor envía a todos los clientes
  4. **Test BD bajo carga**: Miles de inserts de métricas
- Medir:
  - Latencia de procesamiento de mensajes
  - Uso de CPU y memoria
  - Throughput de métricas procesadas/segundo
- Verificar que servidor maneja carga sin degradación

**Criterios de Aceptación:**
- [ ] Servidor maneja 9 clientes sin degradación de performance
- [ ] Latencia de procesamiento < 100ms en promedio
- [ ] Uso de memoria estable (sin memory leaks)
- [ ] CPU < 50% con carga normal
- [ ] Reporte de resultados de benchmarks

**Dependencias:**
- TS-001 a TS-013 (todas las funcionalidades del servidor)

---

## 3. TAREAS DE BASE DE DATOS {#tareas-base-de-datos}

### **TD-001: Diseñar Esquema de Base de Datos**

**Descripción Técnica:**
- Crear esquema completo con las siguientes tablas:

**Tabla: `clients`**
```sql
CREATE TABLE clients (
    client_id VARCHAR(20) PRIMARY KEY,
    ip_address VARCHAR(15) NOT NULL,
    port INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,  -- UP, DOWN, NO_REPORTA
    first_connected_at TIMESTAMP NOT NULL,
    last_seen_at TIMESTAMP NOT NULL,
    total_uptime_seconds INTEGER DEFAULT 0,
    total_downtime_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tabla: `metrics`**
```sql
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id VARCHAR(20) NOT NULL,
    total_capacity BIGINT NOT NULL,
    used_capacity BIGINT NOT NULL,
    free_capacity BIGINT NOT NULL,
    utilization_percent DECIMAL(5,2) NOT NULL,
    growth_rate DECIMAL(10,2),  -- MB/hora
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
);

CREATE INDEX idx_metrics_client_id ON metrics(client_id);
CREATE INDEX idx_metrics_recorded_at ON metrics(recorded_at);
```

**Tabla: `global_metrics`**
```sql
CREATE TABLE global_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_capacity_global BIGINT NOT NULL,
    used_capacity_global BIGINT NOT NULL,
    free_capacity_global BIGINT NOT NULL,
    utilization_percent_global DECIMAL(5,2) NOT NULL,
    growth_rate_global DECIMAL(10,2),
    clients_up INTEGER NOT NULL,
    clients_down INTEGER NOT NULL,
    calculated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tabla: `sent_messages`**
```sql
CREATE TABLE sent_messages (
    message_id VARCHAR(50) PRIMARY KEY,
    client_id VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,  -- SENT, ACKNOWLEDGED, TIMEOUT
    sent_at TIMESTAMP NOT NULL,
    ack_received_at TIMESTAMP,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
);

CREATE INDEX idx_messages_client_id ON sent_messages(client_id);
CREATE INDEX idx_messages_status ON sent_messages(status);
```

**Tabla: `availability_events`**
```sql
CREATE TABLE availability_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id VARCHAR(20) NOT NULL,
    event_type VARCHAR(20) NOT NULL,  -- UP, DOWN
    event_timestamp TIMESTAMP NOT NULL,
    duration_seconds INTEGER,  -- Duración en estado anterior
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id)
);

CREATE INDEX idx_events_client_id ON availability_events(client_id);
CREATE INDEX idx_events_timestamp ON availability_events(event_timestamp);
```

**Criterios de Aceptación:**
- [ ] Esquema SQL válido para SQLite/MySQL/PostgreSQL
- [ ] Relaciones de Foreign Keys correctas
- [ ] Índices en columnas de búsqueda frecuente
- [ ] Tipos de datos apropiados para cada campo
- [ ] Constraints (NOT NULL, UNIQUE) definidos

**Dependencias:**
- Ninguna (diseño inicial)

---

### **TD-002: Implementar Capa de Acceso a Datos (DAO)**

**Descripción Técnica:**
- Crear clases DAO para cada tabla:
  - `ClientDAO`: CRUD de clientes
  - `MetricsDAO`: Insert y consulta de métricas
  - `GlobalMetricsDAO`: Insert y consulta de métricas globales
  - `MessageDAO`: CRUD de mensajes
  - `AvailabilityDAO`: Insert y consulta de eventos
- Métodos típicos:
  - `create()`, `read()`, `update()`, `delete()`
  - Métodos de consulta específicos (ej: `get_metrics_by_client_and_date()`)
- Usar prepared statements para prevenir SQL injection
- Implementar connection pooling para mejor performance

**Criterios de Aceptación:**
- [ ] DAOs implementados para todas las tablas
- [ ] Prepared statements en todas las consultas
- [ ] Connection pooling configurado (min: 2, max: 10)
- [ ] Manejo de excepciones de BD
- [ ] Pruebas unitarias de cada método DAO

**Dependencias:**
- TD-001 (esquema de BD)

---

### **TD-003: Implementar Script de Inicialización de BD**

**Descripción Técnica:**
- Crear script `init_database.sql` o `init_database.py`
- Script debe:
  1. Crear base de datos si no existe
  2. Crear todas las tablas según esquema
  3. Crear índices
  4. Insertar datos iniciales si es necesario (ej: configuración)
- Script debe ser idempotente (puede ejecutarse múltiples veces sin error)
- Verificar integridad después de inicialización

**Criterios de Aceptación:**
- [ ] Script crea BD y tablas correctamente
- [ ] Idempotente: no falla si BD ya existe
- [ ] Verifica integridad después de creación
- [ ] Documentación de cómo ejecutar el script
- [ ] Compatible con SQLite, MySQL y PostgreSQL

**Dependencias:**
- TD-001 (esquema)

---

### **TD-004: Implementar Migración y Versionado de BD**

**Descripción Técnica:**
- Implementar sistema de migraciones para cambios en esquema
- Crear tabla `schema_version` para tracking:
```sql
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
- Scripts de migración numerados: `001_initial.sql`, `002_add_indexes.sql`
- Implementar rollback para cada migración
- Validar versión actual antes de aplicar migraciones

**Criterios de Aceptación:**
- [ ] Sistema de migraciones funcional
- [ ] Versión de esquema tracked correctamente
- [ ] Migraciones aplicadas en orden
- [ ] Rollback disponible para cada migración
- [ ] Documentación del proceso de migración

**Dependencias:**
- TD-003 (inicialización)

---

### **TD-005: Implementar Estrategia de Respaldo y Recuperación**

**Descripción Técnica:**
- Implementar backup automático de la base de datos
- Para SQLite: copia del archivo .db
- Para MySQL/PostgreSQL: uso de herramientas nativas (mysqldump, pg_dump)
- Programar backups:
  - Cada hora: backup incremental
  - Cada día: backup completo
- Retención: últimas 24 horas + últimos 7 días
- Script de recuperación desde backup
- Verificar integridad de backups

**Criterios de Aceptación:**
- [ ] Backups automáticos programados
- [ ] Backups almacenados en directorio separado
- [ ] Script de restore funcional y documentado
- [ ] Verificación de integridad de backups
- [ ] Pruebas de recuperación exitosas

**Dependencias:**
- TD-003 (BD inicializada)

---

### **TD-006: Implementar Limpieza de Datos Históricos**

**Descripción Técnica:**
- Crear proceso de limpieza de datos antiguos para evitar crecimiento indefinido
- Políticas de retención:
  - `metrics`: mantener últimos 30 días, eliminar anteriores
  - `global_metrics`: mantener últimos 90 días
  - `sent_messages`: mantener últimos 7 días con ACK, 30 días sin ACK
  - `availability_events`: mantener últimos 90 días
- Implementar como stored procedure o script Python
- Ejecutar limpieza automáticamente cada noche (cron/task scheduler)
- Opcionalmente: archivar datos antes de eliminar

**Criterios de Aceptación:**
- [ ] Políticas de retención implementadas correctamente
- [ ] Proceso de limpieza se ejecuta automáticamente
- [ ] Performance de BD no degradada
- [ ] Logs de proceso de limpieza
- [ ] Opción de archivar datos antes de eliminar

**Dependencias:**
- TD-002 (DAOs)
- TD-003 (BD operativa)

---

### **TD-007: Pruebas de Integridad y Performance de BD**

**Descripción Técnica:**
- Crear suite de pruebas de base de datos:
  1. **Test integridad**: Foreign keys, constraints
  2. **Test performance inserts**: 10,000 métricas en lote
  3. **Test queries complejas**: Consultas con JOINs y agregaciones
  4. **Test concurrencia**: Múltiples conexiones simultáneas
  5. **Test índices**: Verificar uso correcto de índices
- Usar EXPLAIN para analizar planes de ejecución
- Benchmarks con diferentes volúmenes de datos

**Criterios de Aceptación:**
- [ ] Constraints de integridad funcionan correctamente
- [ ] Insert de 10,000 registros en < 5 segundos
- [ ] Queries de dashboard en < 200ms
- [ ] Sin deadlocks en operaciones concurrentes
- [ ] Índices usados correctamente (verificado con EXPLAIN)

**Dependencias:**
- TD-001 a TD-006 (toda la infraestructura de BD)

---

## 4. TAREAS DE INTERFAZ GRÁFICA {#tareas-interfaz-grafica}

### **TI-001: Diseñar Wireframes y Mockups de la UI**

**Descripción Técnica:**
- Diseñar interfaz gráfica con las siguientes vistas:
  1. **Dashboard Principal**: Vista general de todos los clientes
  2. **Vista de Cliente Individual**: Métricas detalladas de un cliente
  3. **Vista de Métricas Globales**: Agregados del cluster
  4. **Vista de Mensajes**: Enviar y ver historial de mensajes
  5. **Vista de Availability**: Gráficos de disponibilidad
- Herramientas: Figma, Adobe XD, o Sketch
- Diseño debe ser responsive (mínimo 1280x720)
- Usar paleta de colores consistente

**Criterios de Aceptación:**
- [ ] Mockups de todas las vistas principales
- [ ] Flujo de navegación entre vistas definido
- [ ] Especificación de colores y tipografía
- [ ] Assets exportados para desarrollo
- [ ] Aprobación del diseño por profesor/equipo

**Dependencias:**
- Ninguna (tarea de diseño)

---

### **TI-002: Implementar Dashboard Principal**

**Descripción Técnica:**
- Crear vista principal que muestre:
  - **Tabla de clientes** con columnas:
    - ID Cliente
    - Estado (UP/DOWN) con indicador visual (verde/rojo)
    - IP:Puerto
    - Última conexión (hace X minutos)
    - Capacidad Total (GB/TB)
    - Espacio Usado (GB/TB)
    - % Utilización (barra de progreso)
    - Growth Rate (MB/h)
  - **Panel de métricas globales**:
    - Capacidad total del cluster
    - Espacio libre total
    - % Utilización global
    - Clientes UP/DOWN (ej: 8/9)
- Actualización automática cada 5 segundos
- Indicadores visuales: colores, iconos, progress bars

**Criterios de Aceptación:**
- [ ] Tabla muestra información de todos los 9 clientes
- [ ] Colores diferenciados para estados UP/DOWN
- [ ] Actualización automática sin degradar performance
- [ ] Ordenamiento por columnas (click en header)
- [ ] Responsive para diferentes resoluciones

**Dependencias:**
- TI-001 (diseño)
- TS-012 (API del servidor)

---

### **TI-003: Implementar Vista de Cliente Individual**

**Descripción Técnica:**
- Al hacer click en un cliente del dashboard, abrir vista detallada con:
  - **Información general**: ID, IP, estado, última conexión
  - **Métricas actuales**: Capacidad, uso, libre, % utilización
  - **Gráfico histórico**: Línea de tiempo de % utilización (últimas 24h)
  - **Gráfico de crecimiento**: Growth rate en el tiempo
  - **Tabla de eventos**: Historial de UP/DOWN con timestamps
  - **Botón "Enviar Mensaje"**: Abre modal para enviar mensaje
- Gráficos interactivos con tooltips
- Actualización en tiempo real

**Criterios de Aceptación:**
- [ ] Vista muestra toda la información detallada
- [ ] Gráficos generados con librería (Chart.js, D3.js)
- [ ] Tooltips en gráficos con valores exactos
- [ ] Actualización en tiempo real sin recargar página
- [ ] Navegación de regreso al dashboard

**Dependencias:**
- TI-001 (diseño)
- TI-002 (dashboard base)
- TS-012 (API)

---

### **TI-004: Implementar Vista de Métricas Globales**

**Descripción Técnica:**
- Vista dedicada a métricas agregadas del cluster:
  - **Cards de métricas globales**:
    - Capacidad Total del Cluster (TB)
    - Espacio Usado Total (TB)
    - Espacio Libre Total (TB)
    - % Utilización Global
  - **Gráfico circular**: Distribución de espacio por cliente
  - **Gráfico de barras**: Comparación de % uso entre clientes
  - **Gráfico de línea**: Evolución de utilización global (últimos 7 días)
  - **Tabla ranking**: Clientes ordenados por % de uso
- Opción para exportar datos a CSV/Excel

**Criterios de Aceptación:**
- [ ] Cards con métricas actualizadas en tiempo real
- [ ] Gráficos visuales y fáciles de interpretar
- [ ] Leyenda y etiquetas en todos los gráficos
- [ ] Exportación a CSV funcional
- [ ] Colores consistentes con diseño

**Dependencias:**
- TI-001 (diseño)
- TS-006 (métricas globales)
- TS-012 (API)

---

### **TI-005: Implementar Vista de Mensajería**

**Descripción Técnica:**
- Interfaz para envío de mensajes a clientes:
  - **Formulario de envío**:
    - Selector de cliente (dropdown con lista de clientes UP)
    - Tipo de mensaje (NOTIFICATION, COMMAND, ALERT)
    - Contenido del mensaje (textarea)
    - Botón "Enviar"
  - **Tabla de mensajes enviados**:
    - Timestamp
    - Cliente destino
    - Tipo
    - Contenido (truncado)
    - Estado (SENT, ACK, TIMEOUT)
    - Tiempo de respuesta
  - Filtrado por cliente y estado
  - Paginación si hay muchos mensajes

**Criterios de Aceptación:**
- [ ] Formulario valida campos antes de enviar
- [ ] Mensaje enviado exitosamente al cliente seleccionado
- [ ] Tabla actualiza automáticamente cuando se recibe ACK
- [ ] Indicador visual para estados (iconos o colores)
- [ ] Filtrado y búsqueda funcionales

**Dependencias:**
- TI-001 (diseño)
- TS-008 (envío de mensajes)
- TS-009 (ACKs)
- TS-012 (API)

---

### **TI-006: Implementar Vista de Availability**

**Descripción Técnica:**
- Vista dedicada a mostrar disponibilidad de clientes:
  - **Tabla de availability**:
    - Cliente ID
    - Availability % (últimas 24h)
    - Uptime (horas:minutos)
    - Downtime (horas:minutos)
    - Indicador si cumple ≥ 99.9%
  - **Timeline visual**: Línea de tiempo mostrando UP/DOWN de cada cliente
  - **Gráfico de availability**: Barras horizontales con % de cada cliente
  - **Alertas**: Clientes con availability < 99.9% destacados en rojo
- Selector de ventana de tiempo (24h, 7d, 30d)

**Criterios de Aceptación:**
- [ ] Cálculo correcto de availability mostrado
- [ ] Timeline visual intuitivo y claro
- [ ] Alertas visibles para clientes bajo el umbral
- [ ] Selector de ventana de tiempo funcional
- [ ] Exportación de reporte de availability

**Dependencias:**
- TI-001 (diseño)
- TS-010 (cálculo de availability)
- TS-012 (API)

---

### **TI-007: Implementar Actualización en Tiempo Real**

**Descripción Técnica:**
- Implementar mecanismo de actualización en tiempo real de la UI
- Opciones:
  1. **Polling**: Peticiones HTTP cada 5 segundos
  2. **WebSockets**: Conexión persistente con push de actualizaciones
  3. **Server-Sent Events (SSE)**: Push unidireccional del servidor
- Elegir opción más apropiada según tecnología
- Actualizar solo los datos que cambiaron (no recargar toda la vista)
- Indicador visual de última actualización

**Criterios de Aceptación:**
- [ ] Datos actualizados automáticamente sin intervención del usuario
- [ ] Latencia de actualización < 10 segundos
- [ ] No degrada performance del navegador
- [ ] Indicador visual de "actualizando..." o timestamp de última actualización
- [ ] Reconexión automática si se pierde conexión

**Dependencias:**
- TI-002 a TI-006 (todas las vistas)
- TS-012 (API o WebSocket del servidor)

---

### **TI-008: Implementar Gestión de Configuración desde UI**

**Descripción Técnica:**
- Vista de configuración para parámetros del servidor (opcional avanzado):
  - Timeout de inactividad
  - Timeout de ACK
  - Intervalo de monitoreo
  - Políticas de retención de datos
- Solo accesible con credenciales admin (autenticación básica)
- Validación de valores antes de guardar
- Aplicación de cambios sin reiniciar servidor (si es posible)

**Criterios de Aceptación:**
- [ ] Vista de configuración protegida con autenticación
- [ ] Validación de todos los parámetros
- [ ] Cambios guardados en BD o archivo config
- [ ] Confirmación antes de aplicar cambios críticos
- [ ] Log de cambios de configuración

**Dependencias:**
- TI-001 (diseño)
- TS-011 (configuración del servidor)
- TS-012 (API)

---

### **TI-009: Implementar Alertas y Notificaciones en UI**

**Descripción Técnica:**
- Sistema de notificaciones en la UI para eventos importantes:
  - Cliente cambia de estado (UP → DOWN o viceversa)
  - Availability de un cliente cae bajo 99.9%
  - Mensaje enviado recibe ACK o TIMEOUT
  - Capacidad de un cliente supera 90%
- Notificaciones emergentes (toasts) en esquina de la pantalla
- Panel de notificaciones con historial
- Opción para marcar como leídas

**Criterios de Aceptación:**
- [ ] Notificaciones aparecen automáticamente para eventos configurados
- [ ] Diseño no intrusivo (se puede cerrar fácilmente)
- [ ] Historial de notificaciones accesible
- [ ] Configuración de qué eventos generan notificación
- [ ] Sonido opcional para alertas críticas

**Dependencias:**
- TI-002 a TI-006 (vistas donde se generan eventos)
- TI-007 (tiempo real)

---

### **TI-010: Pruebas de Usabilidad y Compatibilidad**

**Descripción Técnica:**
- Realizar pruebas de la interfaz gráfica:
  1. **Usabilidad**: ¿Es intuitiva? ¿Se entienden los elementos?
  2. **Compatibilidad navegadores**: Chrome, Firefox, Edge
  3. **Responsive**: Probar en diferentes resoluciones
  4. **Performance**: Tiempo de carga, uso de memoria
  5. **Accesibilidad**: Contraste de colores, navegación por teclado
- Pruebas con usuarios reales (compañeros de clase)
- Recopilar feedback y realizar mejoras

**Criterios de Aceptación:**
- [ ] UI funciona correctamente en los 3 navegadores principales
- [ ] Responsive en resoluciones desde 1280x720 a 1920x1080
- [ ] Tiempo de carga inicial < 3 segundos
- [ ] Feedback de usuarios recopilado y documentado
- [ ] Mejoras implementadas basadas en feedback

**Dependencias:**
- TI-002 a TI-009 (todas las funcionalidades de UI)

---

## 5. TAREAS DE DOCUMENTACIÓN {#tareas-documentacion}

### **DOC-001: Documentación de Arquitectura del Sistema**

**Descripción Técnica:**
- Crear documento de arquitectura con:
  1. **Diagrama de arquitectura general**: Clientes, servidor, BD
  2. **Diagrama de componentes**: Módulos del sistema
  3. **Diagrama de secuencia**: Flujos principales de comunicación
  4. **Decisiones de diseño**: Justificación de tecnologías y patrones
  5. **Estrategia de concurrencia**: Threading model explicado
- Formato: PDF o Markdown con diagramas exportados
- Usar herramientas: Draw.io, Lucidchart, PlantUML

**Criterios de Aceptación:**
- [ ] Documento completo con todos los diagramas
- [ ] Diagramas claros y profesionales
- [ ] Decisiones de diseño justificadas técnicamente
- [ ] Referencias a estándares y buenas prácticas
- [ ] Formato profesional y bien estructurado

**Dependencias:**
- Todas las tareas de implementación (para documentar decisiones reales)

---

### **DOC-002: Manual de Instalación y Configuración**

**Descripción Técnica:**
- Crear guía paso a paso para instalar y configurar el sistema:
  1. **Requisitos previos**: SO, librerías, herramientas
  2. **Instalación de dependencias**: Comandos exactos
  3. **Configuración de BD**: Inicialización y conexión
  4. **Configuración del servidor**: Edición de config files
  5. **Configuración de clientes**: Setup en cada nodo
  6. **Verificación de instalación**: Tests básicos
- Instrucciones diferentes para Windows y Linux
- Screenshots de pasos críticos

**Criterios de Aceptación:**
- [ ] Manual probado por persona sin conocimiento previo del sistema
- [ ] Todos los comandos y paths correctos
- [ ] Screenshots incluidos para pasos críticos
- [ ] Troubleshooting de problemas comunes
- [ ] Estimado de tiempo de instalación

**Dependencias:**
- Todas las tareas de implementación

---

### **DOC-003: Manual de Usuario de la Interfaz Gráfica**

**Descripción Técnica:**
- Guía de uso de la interfaz gráfica:
  1. **Introducción**: Propósito del sistema
  2. **Dashboard**: Cómo interpretar la información
  3. **Vista de cliente**: Análisis de métricas individuales
  4. **Envío de mensajes**: Cómo enviar y verificar ACK
  5. **Reportes de availability**: Interpretación de gráficos
  6. **Resolución de problemas**: Qué hacer si un cliente no reporta
- Capturas de pantalla de cada vista
- Casos de uso comunes

**Criterios de Aceptación:**
- [ ] Manual cubre todas las funcionalidades de la UI
- [ ] Screenshots actualizados de todas las vistas
- [ ] Lenguaje claro para usuarios no técnicos
- [ ] Casos de uso prácticos incluidos
- [ ] Índice y navegación del documento

**Dependencias:**
- TI-002 a TI-009 (UI completada)

---

### **DOC-004: Documentación de API**

**Descripción Técnica:**
- Documentar API del servidor para comunicación con UI:
  - Especificación de cada endpoint/método
  - Parámetros de entrada y tipos
  - Estructura de respuestas JSON
  - Códigos de error HTTP
  - Ejemplos de requests y responses
- Formato: Swagger/OpenAPI o Markdown estructurado
- Herramientas: Swagger Editor, Postman

**Criterios de Aceptación:**
- [ ] Todos los endpoints documentados
- [ ] Ejemplos de request/response para cada endpoint
- [ ] Especificación de códigos de error
- [ ] Documentación auto-generada o actualizable
- [ ] Pruebas con herramienta como Postman incluidas

**Dependencias:**
- TS-012 (API implementada)

---

### **DOC-005: Documentación de Protocolo de Comunicación**

**Descripción Técnica:**
- Documentar protocolo TCP/IP usado entre cliente y servidor:
  1. **Estructura de mensajes JSON**: Todos los tipos
  2. **Flujo de handshake**: Conexión inicial
  3. **Flujo de métricas**: Envío periódico
  4. **Flujo de mensajería bidireccional**: Server → Client → ACK
  5. **Manejo de desconexiones**: Reconexión
  6. **Manejo de errores**: Timeouts, mensajes inválidos
- Diagramas de secuencia para cada flujo
- Ejemplos de mensajes reales (JSON completo)

**Criterios de Aceptación:**
- [ ] Protocolo completamente especificado
- [ ] Diagramas de secuencia para todos los flujos
- [ ] Ejemplos JSON de cada tipo de mensaje
- [ ] Especificación de timeouts y reintentos
- [ ] Casos de error documentados

**Dependencias:**
- TC-003, TC-005, TC-007 (cliente)
- TS-004, TS-008, TS-009 (servidor)

---

### **DOC-006: Documentación de Base de Datos**

**Descripción Técnica:**
- Documentar esquema y uso de la base de datos:
  1. **Diagrama ER**: Entidades y relaciones
  2. **Diccionario de datos**: Descripción de cada tabla y campo
  3. **Índices y constraints**: Listado completo
  4. **Consultas más comunes**: SQL con explicación
  5. **Procedimientos de mantenimiento**: Backup, limpieza
  6. **Estimaciones de crecimiento**: Proyección de tamaño de BD
- Incluir script SQL completo de creación

**Criterios de Aceptación:**
- [ ] Diagrama ER claro y completo
- [ ] Todas las tablas y campos documentados
- [ ] Scripts SQL incluidos y probados
- [ ] Procedimientos de mantenimiento explicados
- [ ] Estrategia de respaldo documentada

**Dependencias:**
- TD-001 a TD-006 (BD completada)

---

### **DOC-007: Guía de Resolución de Problemas (Troubleshooting)**

**Descripción Técnica:**
- Documento con problemas comunes y soluciones:
  1. Cliente no conecta al servidor
  2. Cliente reporta métricas incorrectas
  3. Servidor no detecta cliente inactivo
  4. ACK no se recibe
  5. Interfaz no actualiza datos
  6. Base de datos crece demasiado
  7. Performance degradada
  8. Errores en logs
- Para cada problema: síntomas, causas, solución paso a paso

**Criterios de Aceptación:**
- [ ] Mínimo 10 problemas comunes documentados
- [ ] Soluciones verificadas y funcionales
- [ ] Comandos de diagnóstico incluidos
- [ ] Referencias a logs y mensajes de error
- [ ] Contacto o escalación para problemas no resueltos

**Dependencias:**
- Experiencia de implementación y pruebas

---

### **DOC-008: Documento de Código Fuente (JavaDoc/Docstrings)**

**Descripción Técnica:**
- Documentar código fuente con comentarios estándar:
  - **Python**: Docstrings en formato Google/NumPy
  - **Java**: JavaDoc
  - **C#**: XML Documentation Comments
- Documentar:
  - Todas las clases: propósito, atributos
  - Todos los métodos públicos: parámetros, retorno, excepciones
  - Funciones complejas: algoritmo explicado
- Generar documentación HTML con herramientas (Sphinx, Doxygen)

**Criterios de Aceptación:**
- [ ] Todas las clases y métodos públicos documentados
- [ ] Formato estándar según lenguaje
- [ ] Documentación HTML generada automáticamente
- [ ] Ejemplos de uso en comentarios de funciones principales
- [ ] Coverage de documentación ≥ 90%

**Dependencias:**
- Todas las tareas de código

---

### **DOC-009: Reporte de Pruebas y Resultados**

**Descripción Técnica:**
- Crear reporte completo de pruebas realizadas:
  1. **Pruebas unitarias**: Coverage, resultados
  2. **Pruebas de integración**: Escenarios probados
  3. **Pruebas de carga**: Benchmarks y resultados
  4. **Pruebas de usabilidad**: Feedback de usuarios
  5. **Pruebas de availability**: Verificación de ≥ 99.9%
- Incluir capturas de tests pasando
- Métricas de calidad: cobertura, bugs encontrados

**Criterios de Aceptación:**
- [ ] Reporte estructurado con todas las categorías de pruebas
- [ ] Resultados cuantitativos (números, porcentajes)
- [ ] Screenshots de tests ejecutándose
- [ ] Análisis de bugs encontrados y resueltos
- [ ] Conclusiones sobre calidad del sistema

**Dependencias:**
- TC-011, TS-014, TD-007, TI-010 (todas las pruebas)

---

### **DOC-010: Presentación para Defensa del Proyecto**

**Descripción Técnica:**
- Crear presentación PowerPoint/Google Slides para defensa:
  1. **Introducción**: Objetivos del proyecto
  2. **Arquitectura**: Diagramas principales
  3. **Implementación**: Tecnologías y decisiones clave
  4. **Demo en vivo**: Plan de demostración
  5. **Métricas y resultados**: Performance, availability
  6. **Desafíos y soluciones**: Problemas enfrentados
  7. **Conclusiones**: Aprendizajes
- Duración estimada: 15-20 minutos
- Slides visuales con poco texto

**Criterios de Aceptación:**
- [ ] Presentación de 15-20 slides
- [ ] Contenido técnico pero comprensible
- [ ] Diagramas y screenshots de calidad
- [ ] Plan de demo ensayado
- [ ] Preparación para preguntas técnicas

**Dependencias:**
- Proyecto completado
- DOC-001 a DOC-009 (para extraer contenido)

---

## 6. PLAN DE IMPLEMENTACIÓN POR FASES {#plan-implementacion-fases}

### **FASE 1: FUNDAMENTOS Y COMUNICACIÓN BÁSICA (Semana 1-2)**

**Objetivo:** Establecer comunicación TCP/IP básica entre cliente y servidor.

**Tareas Críticas:**
- TC-001: Socket Cliente TCP/IP
- TC-002: Recolección de Métricas de Disco
- TC-003: Serialización JSON
- TS-001: Socket Servidor TCP/IP
- TS-002: Gestor de Conexiones Concurrentes
- TS-003: Registro Automático de Clientes
- TD-001: Diseñar Esquema de Base de Datos
- TD-002: Implementar Capa de Acceso a Datos
- TD-003: Script de Inicialización de BD

**Entregables:**
- Cliente conecta al servidor
- Cliente envía métricas en JSON
- Servidor recibe y registra cliente
- Base de datos inicializada

**Criterio de completitud:** Cliente envía métricas, servidor las recibe y registra en BD.

---

### **FASE 2: FUNCIONALIDADES CORE DEL SERVIDOR (Semana 3)**

**Objetivo:** Implementar lógica de negocio del servidor.

**Tareas Críticas:**
- TC-004: Envío Periódico de Métricas
- TS-004: Recepción y Procesamiento de Métricas
- TS-005: Detector de Nodos Inactivos
- TS-006: Cálculo de Métricas Globales
- TS-007: Cálculo de Growth Rate
- TS-010: Mecanismo de Availability

**Entregables:**
- Métricas enviadas periódicamente
- Servidor detecta clientes inactivos
- Métricas globales calculadas
- Availability tracking funcional

**Criterio de completitud:** Servidor procesa métricas de 9 clientes concurrentes y calcula métricas globales.

---

### **FASE 3: COMUNICACIÓN BIDIRECCIONAL Y ACK (Semana 4)**

**Objetivo:** Implementar mensajería de servidor a cliente con confirmación.

**Tareas Críticas:**
- TC-005: Recepción de Mensajes del Servidor
- TC-006: Almacenamiento en Archivo .log
- TC-007: Envío de ACK
- TS-008: Envío de Mensajes a Clientes
- TS-009: Recepción de ACKs
- TD-004: Tabla sent_messages

**Entregables:**
- Servidor envía mensajes a clientes
- Cliente guarda en .log y envía ACK
- Servidor registra ACKs recibidos

**Criterio de completitud:** Mensaje enviado → guardado en .log → ACK recibido en < 2 segundos.

---

### **FASE 4: INTERFAZ GRÁFICA BÁSICA (Semana 5)**

**Objetivo:** Crear interfaz de monitoreo básica.

**Tareas Críticas:**
- TI-001: Diseñar Wireframes
- TI-002: Dashboard Principal
- TI-003: Vista de Cliente Individual
- TI-007: Actualización en Tiempo Real
- TS-012: API para Interfaz Gráfica

**Entregables:**
- UI muestra estado de todos los clientes
- Vista detallada de cliente individual
- Actualización automática cada 5 segundos

**Criterio de completitud:** Dashboard muestra 9 clientes con métricas actualizadas en tiempo real.

---

### **FASE 5: FUNCIONALIDADES AVANZADAS DE UI (Semana 6)**

**Objetivo:** Completar todas las vistas de la interfaz.

**Tareas Críticas:**
- TI-004: Vista de Métricas Globales
- TI-005: Vista de Mensajería
- TI-006: Vista de Availability
- TI-009: Alertas y Notificaciones

**Entregables:**
- Vista de métricas globales con gráficos
- Interfaz de envío de mensajes
- Vista de availability con timeline
- Sistema de notificaciones

**Criterio de completitud:** Todas las vistas funcionales y navegables.

---

### **FASE 6: ROBUSTEZ Y CONFIABILIDAD (Semana 7)**

**Objetivo:** Mejorar confiabilidad y manejo de errores.

**Tareas Críticas:**
- TC-008: Archivo de Configuración
- TC-009: Sistema de Logging
- TC-010: Shutdown Graceful
- TS-011: Configuración del Servidor
- TS-013: Sistema de Logging del Servidor
- TD-005: Estrategia de Respaldo
- TD-006: Limpieza de Datos Históricos

**Entregables:**
- Configuración parametrizable
- Logging completo en ambos lados
- Shutdown limpio sin pérdida de datos
- Backups automáticos

**Criterio de completitud:** Sistema se recupera de fallos sin pérdida de datos.

---

### **FASE 7: PRUEBAS Y OPTIMIZACIÓN (Semana 8)**

**Objetivo:** Validar funcionamiento y performance.

**Tareas Críticas:**
- TC-011: Pruebas de Integración del Cliente
- TS-014: Pruebas de Carga del Servidor
- TD-007: Pruebas de BD
- TI-010: Pruebas de Usabilidad
- Verificación de availability ≥ 99.9%

**Entregables:**
- Suite completa de tests
- Reporte de benchmarks
- Bugs identificados y corregidos

**Criterio de completitud:** Todas las pruebas pasan, availability verificada.

---

### **FASE 8: DOCUMENTACIÓN Y ENTREGA (Semana 9)**

**Objetivo:** Completar documentación y preparar entrega.

**Tareas Críticas:**
- DOC-001 a DOC-010: Toda la documentación
- Revisión final de código
- Empaquetado de entregables

**Entregables:**
- Documentación completa
- Manuales de instalación y uso
- Presentación para defensa
- Código fuente con comentarios

**Criterio de completitud:** Paquete completo listo para entrega y defensa.

---

## 7. RIESGOS TÉCNICOS Y MITIGACIÓN {#riesgos-tecnicos}

### **RIESGO 1: Problemas de Concurrencia y Race Conditions**

**Probabilidad:** ALTA  
**Impacto:** ALTO

**Descripción:**
Manejo de 9 clientes concurrentes puede causar race conditions en:
- Actualización del `ConnectionManager`
- Escritura en base de datos
- Cálculo de métricas globales

**Síntomas:**
- Datos inconsistentes en BD
- Crashes aleatorios
- Deadlocks

**Mitigación:**
1. **Usar estructuras thread-safe**: `queue.Queue`, locks, semáforos
2. **Transaction isolation en BD**: Nivel READ_COMMITTED mínimo
3. **Pruebas de concurrencia**: Simular 9 clientes agresivamente
4. **Logging detallado**: Para debug de race conditions
5. **Code review**: Revisión de secciones críticas

**Contingencia:**
- Simplificar concurrencia usando async/await en lugar de threads
- Usar message queues para serializar operaciones críticas

---

### **RIESGO 2: Pérdida de Conexión entre Cliente y Servidor**

**Probabilidad:** MEDIA  
**Impacto:** MEDIO

**Descripción:**
En red LAN puede haber desconexiones temporales por:
- Problemas de switch/router
- Firewall bloqueando puertos
- Cable de red desconectado

**Síntomas:**
- Cliente no puede enviar métricas
- Servidor marca cliente como DOWN incorrectamente
- Pérdida de datos de monitoreo

**Mitigación:**
1. **Reconexión automática en cliente**: Backoff exponencial
2. **Keep-alive en sockets**: SO_KEEPALIVE con timeout corto
3. **Buffer de métricas**: Cliente almacena métricas localmente si no puede enviar
4. **Timeouts configurables**: No marcar como DOWN muy rápido
5. **Alertas de desconexión**: Notificar inmediatamente en UI

**Contingencia:**
- Modo offline del cliente que almacena métricas en archivo local
- Re-sincronización al reconectar

---

### **RIESGO 3: Crecimiento Descontrolado de la Base de Datos**

**Probabilidad:** ALTA  
**Impacto:** MEDIO

**Descripción:**
Si clientes envían métricas cada 30 segundos:
- 9 clientes × 120 métricas/hora × 24 horas = 25,920 registros/día
- En 1 mes: ~778,000 registros
- Sin limpieza, BD crece indefinidamente

**Síntomas:**
- Queries lentas
- Espacio en disco agotado
- Aplicación se ralentiza

**Mitigación:**
1. **Política de retención**: Eliminar datos > 30 días automáticamente
2. **Índices apropiados**: En columnas de timestamp
3. **Particionamiento de tablas**: Por fecha (si BD lo soporta)
4. **Archivado**: Mover datos antiguos a archivos CSV comprimidos
5. **Monitoreo de tamaño**: Alerta si BD supera tamaño esperado

**Contingencia:**
- Limpieza manual de emergencia
- Migrar a BD más robusta (PostgreSQL en lugar de SQLite)

---

### **RIESGO 4: Detección Tardía de Nodos Inactivos**

**Probabilidad:** MEDIA  
**Impacto:** MEDIO

**Descripción:**
Si timeout es muy largo, nodos caídos no se detectan rápidamente.
Si timeout es muy corto, falsos positivos.

**Síntomas:**
- Cliente caído aún aparece como UP
- Cliente activo marcado como DOWN incorrectamente

**Mitigación:**
1. **Timeout inteligente**: 3 × report_interval + margen de 15 segundos
2. **Monitoreo activo cada 15 segundos**: Thread dedicado
3. **Pruebas con diferentes escenarios**: Simular caídas y latencia
4. **Configuración ajustable**: Permitir tuning del timeout
5. **Logs detallados**: Para ajustar timeout basado en comportamiento real

**Contingencia:**
- Implementar ping/heartbeat activo del servidor a clientes
- Doble verificación antes de marcar como DOWN

---

### **RIESGO 5: ACKs No Recibidos o Perdidos**

**Probabilidad:** MEDIA  
**Impacto:** BAJO

**Descripción:**
ACK puede no llegar por:
- Pérdida de conexión después de enviar mensaje
- Cliente crashea antes de enviar ACK
- ACK perdido en la red (poco probable en TCP)

**Síntomas:**
- Mensajes marcados como TIMEOUT incorrectamente
- Estadísticas de ACK infladas

**Mitigación:**
1. **Timeout de ACK razonable**: 30 segundos es suficiente en LAN
2. **Logs de ACK**: Verificar si realmente no se envió o no se recibió
3. **Reintentos**: Servidor puede reenviar mensaje si no recibe ACK (opcional)
4. **Monitoring**: Dashboard muestra tasa de ACK recibidos
5. **Pruebas de red**: Simular pérdida de paquetes

**Contingencia:**
- Implementar sistema de confirmación doble
- Guardar timestamp de cuando cliente guardó el mensaje en .log

---

### **RIESGO 6: Performance de la Interfaz Gráfica**

**Probabilidad:** MEDIA  
**Impacto:** BAJO

**Descripción:**
Actualización cada 5 segundos con gráficos complejos puede:
- Consumir mucha memoria en navegador
- Hacer UI lenta o no responsiva
- Degradar experiencia de usuario

**Síntomas:**
- UI se congela durante actualizaciones
- Alto uso de CPU del navegador
- Memoria crece continuamente (memory leak)

**Mitigación:**
1. **Actualizaciones incrementales**: Solo actualizar datos que cambiaron
2. **Virtual scrolling**: Para tablas grandes
3. **Debouncing de eventos**: Evitar renders excesivos
4. **Web Workers**: Para procesamiento pesado fuera del thread principal
5. **Profiling y optimización**: Usar Chrome DevTools para identificar cuellos de botella

**Contingencia:**
- Aumentar intervalo de actualización a 10 segundos
- Simplificar gráficos o usar lazy loading

---

### **RIESGO 7: Portabilidad entre Windows y Linux**

**Probabilidad:** MEDIA  
**Impacto:** MEDIO

**Descripción:**
Código puede funcionar en un SO pero no en otro:
- Detección de disco (diferentes APIs)
- Paths de archivos (\ vs /)
- Permisos de archivos
- Disponibilidad de librerías

**Síntomas:**
- Aplicación funciona en desarrollo pero no en producción
- Errores de "archivo no encontrado"
- Métricas incorrectas en un SO

**Mitigación:**
1. **Librerías multiplataforma**: `psutil`, `pathlib`
2. **Pruebas en ambos SO**: Configurar VM o dual boot
3. **Paths relativos**: Evitar hardcoded paths absolutos
4. **Detección de SO en runtime**: Código condicional si es necesario
5. **Documentación clara**: Especificar diferencias por SO

**Contingencia:**
- Proveer builds separados para cada SO
- Usar Docker para consistencia

---

### **RIESGO 8: Seguridad: Conexiones No Autorizadas**

**Probabilidad:** BAJA  
**Impacto:** MEDIO

**Descripción:**
En práctica académica seguridad no es prioridad, pero:
- Cliente malicioso puede conectarse
- Datos sensibles en texto plano
- Ataques de denegación de servicio

**Síntomas:**
- Cliente desconocido conectado
- Datos corruptos en BD
- Servidor sobrecargado

**Mitigación:**
1. **Whitelist de IPs**: Solo permitir IPs conocidas
2. **Validación de client_id**: Formato estricto CLIENT_001-009
3. **Límite de conexiones**: Máximo 9 clientes
4. **Validación de mensajes**: Rechazar JSON malformado o inválido
5. **Rate limiting**: Limitar frecuencia de mensajes

**Contingencia:**
- Implementar autenticación básica (token/password)
- SSL/TLS para encriptar comunicación (opcional avanzado)

---

## 8. PREGUNTAS DE DEFENSA TÉCNICA {#preguntas-defensa}

### **ARQUITECTURA Y DISEÑO**

**P1: ¿Por qué eligieron sockets TCP en lugar de UDP?**
**Respuesta esperada:**
TCP garantiza entrega ordenada y confiable de mensajes, esencial para:
- Métricas no se pierdan
- ACKs lleguen correctamente
- Orden de mensajes preservado
UDP sería más rápido pero requeriría implementar control de confiabilidad manualmente.

---

**P2: ¿Cómo manejan la concurrencia en el servidor con 9 clientes simultáneos?**
**Respuesta esperada:**
- Thread pool o thread por cliente para manejar conexiones
- Estructuras de datos thread-safe (locks, queues)
- ConnectionManager usa locks para operaciones críticas
- Base de datos con transacciones para consistencia
- Evitamos race conditions con sincronización apropiada

---

**P3: ¿Qué pasaría si un décimo cliente intenta conectarse?**
**Respuesta esperada:**
- Servidor valida número de clientes en ConnectionManager.is_full()
- Si ya hay 9, rechaza la conexión con mensaje de error
- Cliente recibe notificación y no intenta reconectar
- Registrado en logs del servidor para auditoría

---

### **COMUNICACIÓN Y PROTOCOLO**

**P4: ¿Cómo detectan si un mensaje JSON está completo al recibirlo por socket?**
**Respuesta esperada:**
Dos opciones:
1. **Delimitador**: Cada mensaje termina en `\n`, leemos hasta encontrarlo
2. **Prefijo de longitud**: Primeros 4 bytes indican tamaño del mensaje, luego leemos esa cantidad exacta

Implementamos opción 1 por simplicidad, cada JSON en una línea.

---

**P5: ¿Qué ocurre si el cliente se cae justo después de recibir un mensaje pero antes de enviar el ACK?**
**Respuesta esperada:**
- Servidor espera ACK durante 30 segundos (timeout)
- Si no llega, marca mensaje como TIMEOUT en tabla sent_messages
- Cuando cliente reconecta, no recibe el mensaje nuevamente (no hay retry)
- Sistema registra el evento para análisis posterior
- Mejora futura: implementar persistencia de mensajes pendientes en cliente

---

**P6: ¿Cómo garantizan que las métricas se envían exactamente cada 30 segundos?**
**Respuesta esperada:**
- Timer/Scheduler en thread separado con intervalo configurable
- Usamos `time.sleep()` o `Timer` con ajuste del tiempo transcurrido
- Si el envío demora, ajustamos el próximo sleep para compensar
- Tolerancia de ±1 segundo es aceptable
- Logging de cada envío para verificar timing

---

### **BASE DE DATOS Y PERSISTENCIA**

**P7: ¿Por qué eligen SQLite/MySQL/PostgreSQL para este proyecto?**
**Respuesta esperada:**
- **SQLite**: Simple, sin servidor separado, bueno para desarrollo y práctica académica
- **MySQL/PostgreSQL**: Si necesitamos concurrencia robusta y proyecto crece
- Para 9 clientes, SQLite es suficiente
- Esquema diseñado para ser portable entre las tres

---

**P8: ¿Cómo evitan que la base de datos crezca indefinidamente?**
**Respuesta esperada:**
- Política de retención: eliminar métricas > 30 días automáticamente
- Proceso de limpieza diario (cron job o task scheduler)
- Opcionalmente archivar datos antiguos antes de eliminar
- Índices en columnas de timestamp para queries eficientes
- Monitoreo del tamaño de BD

---

**P9: ¿Qué índices crearon en la base de datos y por qué?**
**Respuesta esperada:**
- `idx_metrics_client_id`: Para filtrar métricas por cliente rápidamente
- `idx_metrics_recorded_at`: Para consultas de rango de fechas
- `idx_messages_client_id`: Para historial de mensajes por cliente
- `idx_events_timestamp`: Para calcular availability en ventanas de tiempo
Índices mejoran performance de SELECT pero ralentizan INSERT ligeramente.

---

### **MONITOREO Y MÉTRICAS**

**P10: ¿Cómo calculan el Growth Rate del espacio usado?**
**Respuesta esperada:**
```
growth_rate = (used_actual - used_anterior) / tiempo_transcurrido
```
En MB/hora:
```python
growth_rate_mb_per_hour = ((used_now - used_prev) / (1024**2)) / (time_diff_seconds / 3600)
```
Requiere al menos 2 mediciones con intervalo mínimo (ej: 5 minutos) para ser significativo.

---

**P11: ¿Cómo calculan la disponibilidad (availability) de cada cliente?**
**Respuesta esperada:**
```
availability = (uptime / (uptime + downtime)) * 100
```
- Registramos cada cambio de estado (UP ↔ DOWN) con timestamp
- Calculamos duración en cada estado
- Sumamos uptime y downtime en ventana de tiempo (ej: 24h)
- Para ≥ 99.9%: downtime máximo = 86.4 segundos en 24h

---

**P12: ¿Cómo determinan que un cliente está inactivo?**
**Respuesta esperada:**
- Thread InactivityMonitor ejecuta cada 15 segundos
- Compara `current_time - last_seen_at` con timeout configurado
- Timeout = `report_interval * 3 + 15 segundos` (buffer de seguridad)
- Si excede, marca cliente como DOWN y actualiza BD
- Cliente que vuelve a reportar automáticamente pasa a UP

---

### **INTERFAZ GRÁFICA**

**P13: ¿Cómo actualiza la interfaz gráfica los datos en tiempo real?**
**Respuesta esperada:**
Opción implementada: **Polling HTTP**
- Frontend hace request GET cada 5 segundos al API del servidor
- Recibe datos actualizados y actualiza DOM
- Alternativa: WebSockets para push real-time (más complejo)
- Indicador visual de última actualización para transparencia

---

**P14: ¿Qué pasa si la interfaz gráfica está abierta pero el servidor se cae?**
**Respuesta esperada:**
- Requests de polling fallan con error de red
- Frontend muestra mensaje de error "Servidor no disponible"
- UI intenta reconectar automáticamente cada 10 segundos
- Datos antiguos siguen visibles pero marcados como desactualizados
- Cuando servidor vuelve, actualización se reanuda automáticamente

---

### **CONFIABILIDAD Y ROBUSTEZ**

**P15: ¿Cómo garantizan availability ≥ 99.9%?**
**Respuesta esperada:**
99.9% significa máximo 1.44 minutos de downtime en 24 horas.
- Reconexión automática del cliente (downtime mínimo)
- Detección rápida de inactividad (cada 15 segundos)
- Sistema de monitoreo que alerta si availability cae
- Logs detallados para debug de problemas
- Pruebas de stress para verificar estabilidad

---

**P16: ¿Qué pasa si el servidor se reinicia? ¿Se pierden datos?**
**Respuesta esperada:**
- Métricas ya almacenadas en BD persisten
- Clientes detectan desconexión y reconectan automáticamente
- Al reconectar, clientes se re-registran automáticamente
- Estado de conexiones se recupera de BD (last_seen, status)
- Mensajes pendientes sin ACK se marcan como TIMEOUT
- No hay pérdida de datos históricos

---

**P17: ¿Cómo manejan errores de red transitorios?**
**Respuesta esperada:**
- **En cliente**: Reconexión automática con backoff exponencial (1s, 2s, 4s...)
- **En servidor**: Timeout en operaciones de socket, logs de errores
- **En ambos**: Manejo de excepciones sin crashear aplicación
- Buffer local en cliente para métricas no enviadas (opcional)
- Logging detallado para diagnóstico

---

### **IMPLEMENTACIÓN Y TECNOLOGÍAS**

**P18: ¿Qué lenguaje de programación usaron y por qué?**
**Respuesta esperada:**
[Ajustar según implementación real]
- **Python**: Fácil de usar, librerías robustas (`socket`, `psutil`, `sqlite3`), ideal para prototipo rápido
- **Java**: Robusto, buen soporte de concurrencia, multiplataforma
- **C#**: Excelente para Windows, WPF para UI
Elegimos por: experiencia previa, disponibilidad de librerías, requisitos del proyecto.

---

**P19: ¿Qué librerías externas utilizaron?**
**Respuesta esperada:**
[Ejemplo para Python]
- `socket`: Comunicación TCP/IP nativa
- `psutil`: Obtención de métricas de disco multiplataforma
- `sqlite3`: Base de datos
- `threading` / `concurrent.futures`: Concurrencia
- `json`: Serialización de mensajes
- `tkinter` / `Flask` + UI web: Interfaz gráfica

---

**P20: ¿El código es portable a otros sistemas operativos?**
**Respuesta esperada:**
Sí, diseñado para ser portable:
- Usamos librerías multiplataforma (`psutil` en lugar de APIs específicas)
- Paths con `pathlib` (maneja \ y / automáticamente)
- Probado en Windows y Linux
- Documentación incluye instrucciones para cada SO
- Único ajuste: detección de primer disco puede variar (C:\ vs /)

---

### **DECISIONES DE DISEÑO**

**P21: ¿Por qué el cliente guarda mensajes en .log en lugar de base de datos?**
**Respuesta esperada:**
Según especificación del PDF:
- Cliente debe guardar en archivo .log
- Simplicidad: no requiere BD en cada cliente
- Portabilidad: archivos de texto son universales
- Auditoría: fácil de revisar sin herramientas
- Rotación automática para evitar crecimiento excesivo

---

**P22: ¿Por qué usan JSON en lugar de otro formato (XML, Protobuf, etc.)?**
**Respuesta esperada:**
- JSON es legible por humanos (importante para debug)
- Amplio soporte en todos los lenguajes
- Ligero y suficiente para este proyecto
- Fácil de parsear y validar
- Protobuf sería más eficiente pero innecesariamente complejo para 9 clientes

---

**P23: ¿Cómo decidieron el intervalo de envío de métricas (30 segundos)?**
**Respuesta esperada:**
- Balance entre frecuencia de actualización y carga de red/BD
- 30 segundos es suficiente para monitoreo no crítico
- Configurable en archivo config para ajustar según necesidad
- Muy corto (<10s) genera mucho tráfico
- Muy largo (>5min) pierde granularidad

---

### **PRUEBAS Y VALIDACIÓN**

**P24: ¿Qué pruebas realizaron para validar el sistema?**
**Respuesta esperada:**
1. **Unitarias**: Cada función/clase aisladamente
2. **Integración**: Flujo completo cliente → servidor → BD → UI
3. **Carga**: 9 clientes concurrentes enviando métricas
4. **Stress**: Simular desconexiones, reconexiones masivas
5. **Usabilidad**: Usuarios reales probando la UI
6. **Availability**: Verificar ≥ 99.9% en operación real

---

**P25: ¿Cómo validaron que el cálculo de métricas globales es correcto?**
**Respuesta esperada:**
- Pruebas con datos conocidos (ej: 3 clientes con valores específicos)
- Verificación manual de sumas y porcentajes
- Comparación con cálculo en Excel/Python separado
- Pruebas de borde: todos clientes DOWN, solo uno UP, etc.
- Logs detallados de cálculos intermedios

---

### **DESAFÍOS Y APRENDIZAJES**

**P26: ¿Cuál fue el mayor desafío técnico del proyecto?**
**Respuesta esperada:**
[Ajustar según experiencia real]
- Manejo de concurrencia y race conditions
- Sincronización entre múltiples threads sin deadlocks
- Detección confiable de nodos inactivos
- Performance de la UI con actualizaciones frecuentes
- Diseño de protocolo robusto contra errores de red

---

**P27: ¿Qué harían diferente si tuvieran que empezar el proyecto de nuevo?**
**Respuesta esperada:**
[Reflexión técnica]
- Usar framework async (asyncio) en lugar de threads
- Diseñar esquema de BD con más anticipación
- Implementar pruebas desde el inicio (TDD)
- Mejor separación de responsabilidades (arquitectura más limpia)
- Documentar decisiones de diseño desde el principio

---

**P28: ¿Qué mejoras futuras implementarían?**
**Respuesta esperada:**
- Autenticación y autorización (seguridad)
- Soporte para más de 9 clientes (clustering)
- Métricas adicionales (CPU, memoria, red)
- Panel de alertas configurable
- Exportación de reportes en PDF
- Soporte para múltiples discos por cliente
- Configuración de alertas personalizadas

---

**P29: ¿El sistema escalaría a 100 clientes? ¿Qué cambios harían?**
**Respuesta esperada:**
Limitaciones actuales:
- Thread por cliente no escala bien
- SQLite limitado en concurrencia

Cambios necesarios:
- Async I/O (asyncio, Node.js) en lugar de threads
- Message queue (RabbitMQ, Kafka) para desacoplar
- BD más robusta (PostgreSQL con replicación)
- Load balancer para múltiples instancias de servidor
- Caché (Redis) para datos frecuentes

---

**P30: ¿Cómo medirían el éxito de este sistema en producción?**
**Respuesta esperada:**
Métricas clave:
- **Availability real**: ≥ 99.9% sostenido en el tiempo
- **Latencia**: Métricas llegan al servidor en < 1 segundo
- **ACK rate**: ≥ 99% de mensajes reciben ACK
- **Uptime del servidor**: 24/7 sin caídas
- **Precisión de métricas**: Comparar con herramientas nativas del SO
- **Usabilidad**: Feedback de usuarios de la UI

---

## RESUMEN DE DEPENDENCIAS CRÍTICAS

```
RUTA CRÍTICA DEL PROYECTO:

1. Sockets básicos (TC-001, TS-001)
   ↓
2. Base de datos (TD-001, TD-002, TD-003)
   ↓
3. Comunicación de métricas (TC-002, TC-003, TC-004, TS-003, TS-004)
   ↓
4. Monitoreo y agregación (TS-005, TS-006, TS-010)
   ↓
5. Mensajería bidireccional (TC-005, TC-006, TC-007, TS-008, TS-009)
   ↓
6. API para UI (TS-012)
   ↓
7. Interfaz gráfica (TI-002, TI-003, TI-007)
   ↓
8. Pruebas y validación (TC-011, TS-014, TD-007, TI-010)
   ↓
9. Documentación (DOC-001 a DOC-010)
```

---

## ESTIMACIÓN DE ESFUERZO

**Total estimado:** 9 semanas (full-time) o 18 semanas (part-time)

**Distribución por componente:**
- **Nodo Cliente:** 15%
- **Nodo Servidor:** 35%
- **Base de Datos:** 10%
- **Interfaz Gráfica:** 25%
- **Pruebas:** 10%
- **Documentación:** 5%

**Equipo recomendado:** 2-3 desarrolladores

---

## CONCLUSIÓN

Este plan de implementación proporciona una hoja de ruta detallada para completar el proyecto "Storage Cluster con Nodo Central de Monitoreo" cumpliendo estrictamente con los requerimientos del documento PDF.

Cada tarea está descompuesta con descripción técnica, criterios de aceptación claros y dependencias explícitas. El plan por fases asegura progreso incremental y visible.

Los riesgos técnicos están identificados con estrategias de mitigación concretas, y las preguntas de defensa preparan al equipo para demostrar comprensión profunda del sistema.

**Éxito del proyecto requiere:**
- ✅ Seguimiento estricto de requerimientos del PDF
- ✅ Gestión cuidadosa de concurrencia
- ✅ Pruebas exhaustivas en cada fase
- ✅ Documentación continua durante desarrollo
- ✅ Validación temprana de availability ≥ 99.9%

---

**Documento generado:** Marzo 2, 2026  
**Versión:** 1.0  
**Estado:** COMPLETO - Listo para implementación
