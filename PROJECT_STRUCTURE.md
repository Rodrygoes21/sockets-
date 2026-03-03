# ESTRUCTURA DE CARPETAS DEL PROYECTO

## STORAGE CLUSTER CON NODO CENTRAL DE MONITOREO

---

## 1. ESTRUCTURA GENERAL DEL PROYECTO

```
storage-cluster/
│
├── README.md
├── .gitignore
├── requirements.txt (Python) / pom.xml (Java) / packages.config (C#)
├── LICENSE
│
├── client/                      # Código del Nodo Cliente
│   ├── src/
│   │   ├── main.py / Main.java / Program.cs
│   │   ├── config/
│   │   │   ├── config_manager.py
│   │   │   └── client_config.json
│   │   ├── network/
│   │   │   ├── socket_client.py
│   │   │   ├── message_serializer.py
│   │   │   └── connection_handler.py
│   │   ├── metrics/
│   │   │   ├── disk_monitor.py
│   │   │   └── metrics_collector.py
│   │   ├── messaging/
│   │   │   ├── message_receiver.py
│   │   │   ├── message_processor.py
│   │   │   ├── log_writer.py
│   │   │   └── ack_sender.py
│   │   └── utils/
│   │       ├── logger.py
│   │       └── constants.py
│   │
│   ├── tests/
│   │   ├── test_socket_client.py
│   │   ├── test_metrics_collector.py
│   │   ├── test_message_processor.py
│   │   └── integration/
│   │       └── test_client_integration.py
│   │
│   ├── logs/                    # Logs de la aplicación cliente
│   │   ├── client_app.log
│   │   └── client_messages.log
│   │
│   ├── config/
│   │   ├── client_config.json
│   │   └── logging_config.ini
│   │
│   └── scripts/
│       ├── start_client.sh
│       └── install_dependencies.sh
│
├── server/                      # Código del Nodo Servidor Central
│   ├── src/
│   │   ├── main.py / Main.java / Program.cs
│   │   ├── config/
│   │   │   ├── config_manager.py
│   │   │   └── server_config.json
│   │   ├── network/
│   │   │   ├── socket_server.py
│   │   │   ├── connection_manager.py
│   │   │   ├── client_handler.py
│   │   │   └── message_protocol.py
│   │   ├── business_logic/
│   │   │   ├── metrics_processor.py
│   │   │   ├── metrics_aggregator.py
│   │   │   ├── inactivity_monitor.py
│   │   │   ├── availability_calculator.py
│   │   │   └── growth_rate_calculator.py
│   │   ├── messaging/
│   │   │   ├── message_sender.py
│   │   │   ├── ack_handler.py
│   │   │   └── message_manager.py
│   │   ├── database/
│   │   │   ├── db_manager.py
│   │   │   ├── dao/
│   │   │   │   ├── client_dao.py
│   │   │   │   ├── metrics_dao.py
│   │   │   │   ├── global_metrics_dao.py
│   │   │   │   ├── message_dao.py
│   │   │   │   └── availability_dao.py
│   │   │   └── models/
│   │   │       ├── client.py
│   │   │       ├── metric.py
│   │   │       ├── message.py
│   │   │       └── availability_event.py
│   │   ├── api/
│   │   │   ├── rest_api.py
│   │   │   ├── routes/
│   │   │   │   ├── clients_routes.py
│   │   │   │   ├── metrics_routes.py
│   │   │   │   ├── messages_routes.py
│   │   │   │   └── availability_routes.py
│   │   │   └── middleware/
│   │   │       ├── error_handler.py
│   │   │       └── cors_handler.py
│   │   └── utils/
│   │       ├── logger.py
│   │       ├── constants.py
│   │       └── helpers.py
│   │
│   ├── tests/
│   │   ├── test_socket_server.py
│   │   ├── test_connection_manager.py
│   │   ├── test_metrics_aggregator.py
│   │   ├── test_inactivity_monitor.py
│   │   ├── test_api.py
│   │   └── integration/
│   │       ├── test_server_integration.py
│   │       └── test_load.py
│   │
│   ├── logs/                    # Logs del servidor
│   │   ├── server_app.log
│   │   ├── connections.log
│   │   ├── metrics.log
│   │   └── errors.log
│   │
│   ├── config/
│   │   ├── server_config.json
│   │   └── logging_config.ini
│   │
│   └── scripts/
│       ├── start_server.sh
│       ├── install_dependencies.sh
│       └── cleanup_old_logs.sh
│
├── database/                    # Scripts y datos de base de datos
│   ├── init_database.sql
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_indexes.sql
│   │   └── 003_add_views.sql
│   ├── seeds/                   # Datos de prueba (opcional)
│   │   └── test_data.sql
│   ├── backups/                 # Backups automáticos
│   │   └── .gitkeep
│   ├── data/                    # Archivos de base de datos
│   │   └── storage_cluster.db
│   └── scripts/
│       ├── backup_database.sh
│       ├── restore_database.sh
│       └── cleanup_old_data.sql
│
├── ui/                          # Interfaz Gráfica
│   ├── web/                     # Opción Web
│   │   ├── index.html
│   │   ├── css/
│   │   │   ├── styles.css
│   │   │   └── dashboard.css
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   ├── dashboard.js
│   │   │   ├── client_view.js
│   │   │   ├── global_metrics.js
│   │   │   ├── messaging.js
│   │   │   ├── availability.js
│   │   │   └── api_client.js
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   └── icons/
│   │   └── lib/                 # Librerías de terceros
│   │       ├── chart.js
│   │       └── moment.js
│   │
│   └── desktop/                 # Opción Desktop (si aplica)
│       ├── src/
│       │   ├── main_window.py
│       │   ├── dashboard_view.py
│       │   ├── client_detail_view.py
│       │   └── messaging_view.py
│       └── resources/
│           ├── icons/
│           └── styles.qss
│
├── docs/                        # Documentación
│   ├── 01 - Practica 1 Implementacion de Sockets .pdf
│   ├── PLAN_IMPLEMENTACION.md
│   ├── ARQUITECTURA_TECNICA.md
│   ├── DATABASE_DESIGN.md
│   ├── PROTOCOL_SPECIFICATION.md
│   ├── API_DOCUMENTATION.md
│   ├── USER_MANUAL.md
│   ├── INSTALLATION_GUIDE.md
│   ├── TROUBLESHOOTING.md
│   ├── diagrams/
│   │   ├── architecture_diagram.png
│   │   ├── sequence_diagrams.png
│   │   ├── er_diagram.png
│   │   └── class_diagrams.png
│   └── presentation/
│       ├── defensa_proyecto.pptx
│       └── demo_screenshots/
│
├── tests/                       # Pruebas de integración E2E
│   ├── integration/
│   │   ├── test_client_server_communication.py
│   │   └── test_full_flow.py
│   ├── load/
│   │   ├── test_9_concurrent_clients.py
│   │   └── benchmark_results.txt
│   └── fixtures/
│       ├── mock_metrics_data.json
│       └── mock_clients.json
│
├── scripts/                     # Scripts de utilidad
│   ├── setup_environment.sh
│   ├── deploy_client.sh
│   ├── deploy_server.sh
│   ├── run_all_tests.sh
│   ├── generate_docs.sh
│   └── simulate_clients.py       # Simulador de 9 clientes para pruebas
│
├── config/                      # Configuraciones globales
│   ├── development.json
│   ├── production.json
│   └── test.json
│
└── deployment/                  # Archivos de despliegue
    ├── docker/
    │   ├── Dockerfile.client
    │   ├── Dockerfile.server
    │   └── docker-compose.yml
    ├── systemd/
    │   ├── storage-cluster-server.service
    │   └── storage-cluster-client.service
    └── ansible/                 # Automatización de despliegue (opcional)
        ├── playbook.yml
        └── inventory.ini
```

---

## 2. DESCRIPCIÓN DETALLADA DE CARPETAS

### 2.1 `/client` - Nodo Cliente

**Propósito:** Código fuente del cliente que se ejecuta en cada servidor regional.

**Subcarpetas:**
- **`src/`**: Código fuente principal
  - **`config/`**: Gestión de configuración
  - **`network/`**: Socket cliente y protocolo de comunicación
  - **`metrics/`**: Recolección de métricas de disco
  - **`messaging/`**: Recepción de mensajes, escritura en .log, envío de ACK
  - **`utils/`**: Utilidades y constantes

- **`tests/`**: Pruebas unitarias e integración del cliente

- **`logs/`**: Archivos de log generados
  - `client_app.log`: Logs de la aplicación
  - `client_messages.log`: Mensajes recibidos del servidor

- **`config/`**: Archivos de configuración
  - `client_config.json`: Parámetros del cliente
  - `logging_config.ini`: Configuración de logging

- **`scripts/`**: Scripts de inicio y utilidades

---

### 2.2 `/server` - Nodo Servidor Central

**Propósito:** Código fuente del servidor que centraliza el monitoreo.

**Subcarpetas:**
- **`src/`**: Código fuente principal
  - **`config/`**: Gestión de configuración
  - **`network/`**: Socket servidor, gestor de conexiones, handlers
  - **`business_logic/`**: Lógica de negocio (agregación, monitoreo, cálculos)
  - **`messaging/`**: Envío de mensajes y manejo de ACKs
  - **`database/`**: Capa de acceso a datos (DAOs, modelos)
  - **`api/`**: API REST para la interfaz gráfica
  - **`utils/`**: Utilidades

- **`tests/`**: Pruebas unitarias, integración y carga

- **`logs/`**: Archivos de log categorizados

- **`config/`**: Configuración del servidor

- **`scripts/`**: Scripts de gestión

---

### 2.3 `/database` - Base de Datos

**Propósito:** Scripts de base de datos y almacenamiento.

**Contenido:**
- **`init_database.sql`**: Script de inicialización completa
- **`migrations/`**: Scripts de migración versionados
- **`seeds/`**: Datos de prueba
- **`backups/`**: Directorio para backups automáticos
- **`data/`**: Archivos de base de datos (SQLite)
- **`scripts/`**: Scripts de mantenimiento (backup, restore, limpieza)

---

### 2.4 `/ui` - Interfaz Gráfica

**Propósito:** Código de la interfaz de usuario.

**Subcarpetas:**

**Opción A: UI Web**
- **`web/`**: Aplicación web
  - `index.html`: Página principal
  - **`css/`**: Estilos
  - **`js/`**: JavaScript para interacción
  - **`assets/`**: Recursos (imágenes, iconos)
  - **`lib/`**: Librerías de terceros (Chart.js, etc.)

**Opción B: UI Desktop**
- **`desktop/`**: Aplicación de escritorio
  - **`src/`**: Código de vistas y ventanas
  - **`resources/`**: Recursos visuales

---

### 2.5 `/docs` - Documentación

**Propósito:** Documentación técnica y académica del proyecto.

**Contenido:**
- PDF del enunciado oficial
- Documentos Markdown de diseño (arquitectura, BD, API)
- Manuales de usuario e instalación
- Diagramas (arquitectura, secuencia, ER, clases)
- Presentación para defensa
- Screenshots de demostración

---

### 2.6 `/tests` - Pruebas End-to-End

**Propósito:** Pruebas de integración que involucran cliente, servidor y BD.

**Contenido:**
- **`integration/`**: Pruebas de flujo completo
- **`load/`**: Pruebas de carga con 9 clientes concurrentes
- **`fixtures/`**: Datos de prueba simulados

---

### 2.7 `/scripts` - Scripts de Utilidad

**Propósito:** Scripts para configuración, despliegue y automatización.

**Ejemplos:**
- `setup_environment.sh`: Instalar dependencias
- `deploy_client.sh`: Desplegar cliente en nodos
- `run_all_tests.sh`: Ejecutar todas las pruebas
- `simulate_clients.py`: Simulador de 9 clientes para testing

---

### 2.8 `/config` - Configuraciones Globales

**Propósito:** Archivos de configuración por ambiente.

**Contenido:**
- `development.json`: Configuración para desarrollo
- `production.json`: Configuración para producción
- `test.json`: Configuración para pruebas

---

### 2.9 `/deployment` - Despliegue

**Propósito:** Archivos para facilitar el despliegue en diferentes ambientes.

**Contenido:**
- **`docker/`**: Dockerfiles y docker-compose
- **`systemd/`**: Services para Linux
- **`ansible/`**: Automatización de despliegue (opcional avanzado)

---

## 3. ARCHIVOS DE CONFIGURACIÓN PRINCIPALES

### 3.1 `client_config.json`

```json
{
  "client_id": "CLIENT_001",
  "server_ip": "192.168.1.100",
  "server_port": 5000,
  "report_interval_seconds": 30,
  "connection_timeout_seconds": 10,
  "reconnection_enabled": true,
  "max_reconnection_attempts": -1,
  "reconnection_backoff_seconds": [1, 2, 4, 8, 16, 30],
  "log_directory": "./logs",
  "log_max_size_mb": 10,
  "log_retention_count": 5,
  "disk_to_monitor": "first"
}
```

---

### 3.2 `server_config.json`

```json
{
  "server_ip": "0.0.0.0",
  "server_port": 5000,
  "max_clients": 9,
  "inactivity_timeout_seconds": 105,
  "ack_timeout_seconds": 30,
  "monitoring_interval_seconds": 15,
  "availability_window_hours": 24,
  "database": {
    "type": "sqlite",
    "path": "./database/data/storage_cluster.db",
    "connection_pool_size": 10
  },
  "api": {
    "enabled": true,
    "host": "0.0.0.0",
    "port": 8080
  },
  "log_directory": "./logs",
  "log_max_size_mb": 50,
  "log_retention_count": 10
}
```

---

### 3.3 `.gitignore`

```gitignore
# Archivos de Base de Datos
database/data/*.db
database/backups/*.db
database/backups/*.gz

# Logs
*.log
logs/
*.log.*

# Configuraciones locales (no commitear IPs reales)
config/production.json
**/client_config.json
**/server_config.json

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv
pip-log.txt
pip-delete-this-directory.txt

# Java
*.class
*.jar
*.war
target/

# C#
bin/
obj/
*.exe
*.dll

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Temporal
tmp/
temp/
*.tmp
```

---

### 3.4 `requirements.txt` (Python)

```txt
# Networking y concurrencia
# (librerías estándar de Python, no necesitan instalación)

# Métricas del sistema
psutil==5.9.5

# Base de datos
# (sqlite3 viene incluido en Python)

# API REST
flask==2.3.2
flask-cors==4.0.0

# Testing
pytest==7.4.0
pytest-cov==4.1.0

# Utilities
python-dateutil==2.8.2
```

---

## 4. CONVENCIONES DE NOMBRES

### 4.1 Archivos y Carpetas

- **Carpetas:** snake_case en minúsculas
  - Ejemplo: `business_logic`, `database`, `api`

- **Archivos Python:** snake_case en minúsculas
  - Ejemplo: `socket_client.py`, `metrics_aggregator.py`

- **Archivos de configuración:** snake_case
  - Ejemplo: `client_config.json`, `logging_config.ini`

- **Scripts:** snake_case con extensión apropiada
  - Ejemplo: `start_server.sh`, `backup_database.sh`

---

### 4.2 Código

**Python:**
- **Clases:** PascalCase
  - Ejemplo: `ClientSocket`, `MetricsAggregator`

- **Funciones y métodos:** snake_case
  - Ejemplo: `get_disk_metrics()`, `send_message()`

- **Constantes:** UPPER_SNAKE_CASE
  - Ejemplo: `MAX_CLIENTS`, `DEFAULT_TIMEOUT`

**Java:**
- **Clases:** PascalCase
  - Ejemplo: `ClientSocket`, `MetricsAggregator`

- **Métodos:** camelCase
  - Ejemplo: `getDiskMetrics()`, `sendMessage()`

- **Constantes:** UPPER_SNAKE_CASE
  - Ejemplo: `MAX_CLIENTS`, `DEFAULT_TIMEOUT`

---

## 5. FLUJO DE DESARROLLO RECOMENDADO

### Fase 1: Setup Inicial
```bash
# 1. Crear estructura de carpetas
mkdir -p client/src/config client/src/network client/tests
mkdir -p server/src/config server/src/network server/tests
mkdir -p database/data database/backups
mkdir -p ui/web/css ui/web/js
mkdir -p docs/diagrams

# 2. Inicializar base de datos
sqlite3 database/data/storage_cluster.db < database/init_database.sql

# 3. Instalar dependencias
pip install -r requirements.txt
```

### Fase 2: Desarrollo del Cliente
```bash
cd client/src
# Desarrollar módulos en este orden:
# 1. config_manager
# 2. socket_client
# 3. disk_monitor
# 4. message_serializer
# 5. metrics_collector

# Ejecutar pruebas
cd ../tests
pytest test_socket_client.py
```

### Fase 3: Desarrollo del Servidor
```bash
cd server/src
# Desarrollar módulos en este orden:
# 1. socket_server
# 2. connection_manager
# 3. database DAOs
# 4. metrics_processor
# 5. inactivity_monitor
# 6. api

# Ejecutar pruebas
cd ../tests
pytest
```

### Fase 4: Integración y UI
```bash
# Pruebas de integración
cd tests/integration
pytest test_full_flow.py

# Desarrollar UI
cd ui/web
# Abrir index.html en navegador
```

---

## 6. COMANDOS DE GESTIÓN DEL PROYECTO

### Iniciar Servidor
```bash
cd server
python src/main.py
# o
./scripts/start_server.sh
```

### Iniciar Cliente
```bash
cd client
python src/main.py
# o
./scripts/start_client.sh
```

### Ejecutar Todas las Pruebas
```bash
./scripts/run_all_tests.sh
# o manualmente:
pytest client/tests -v
pytest server/tests -v
pytest tests/integration -v
```

### Backup de Base de Datos
```bash
cd database
./scripts/backup_database.sh
```

### Limpieza de Datos Antiguos
```bash
sqlite3 database/data/storage_cluster.db < database/scripts/cleanup_old_data.sql
```

### Generar Documentación de Código
```bash
# Python con Sphinx
cd docs
sphinx-build -b html . _build

# Java con JavaDoc
javadoc -d docs/api -sourcepath server/src
```

---

## 7. CHECKLIST DE ENTREGA

### Estructura de Carpetas
- [ ] Todas las carpetas creadas según estructura
- [ ] `.gitignore` configurado correctamente
- [ ] `README.md` completo con instrucciones

### Código Fuente
- [ ] Cliente implementado y funcional
- [ ] Servidor implementado y funcional
- [ ] Código comentado y documentado
- [ ] Sin código muerto o debug prints

### Base de Datos
- [ ] Script `init_database.sql` probado
- [ ] Migraciones documentadas
- [ ] Scripts de backup/restore funcionales

### Interfaz Gráfica
- [ ] Todas las vistas implementadas
- [ ] Actualización en tiempo real funciona
- [ ] Responsive y usable

### Pruebas
- [ ] Pruebas unitarias del cliente
- [ ] Pruebas unitarias del servidor
- [ ] Pruebas de integración end-to-end
- [ ] Pruebas de carga con 9 clientes
- [ ] Coverage ≥ 80%

### Documentación
- [ ] Documento de arquitectura completo
- [ ] Manual de instalación probado
- [ ] Manual de usuario
- [ ] API documentada
- [ ] Diagramas incluidos
- [ ] Presentación para defensa preparada

### Configuración
- [ ] Archivos de ejemplo incluidos
- [ ] Configuración parametrizable
- [ ] Instrucciones de configuración claras

### Despliegue
- [ ] Scripts de despliegue probados
- [ ] Instrucciones de instalación en README
- [ ] Dependencias listadas correctamente

---

## 8. TAMAÑOS ESTIMADOS

```
Estimación de tamaño del proyecto completo:

Código fuente:
- Cliente:      ~3,000 líneas   (~15 archivos)
- Servidor:     ~5,000 líneas   (~30 archivos)
- UI:           ~2,000 líneas   (~10 archivos)
- Tests:        ~2,000 líneas   (~20 archivos)
Total código:   ~12,000 líneas

Base de datos:
- Scripts SQL:  ~1,000 líneas
- Datos (30d):  ~100 MB

Documentación:
- Markdown:     ~10,000 palabras
- Diagramas:    ~10 archivos PNG
- Presentación: ~20 slides

Total proyecto (sin logs ni backups): ~50 MB
```

---

## 9. RECOMENDACIONES FINALES

### ✅ HACER:
- Mantener estructura clara y organizada
- Separar responsabilidades por carpetas
- Usar paths relativos para portabilidad
- Versionar todo con Git
- Documentar decisiones importantes en commits

### ❌ NO HACER:
- Mezclar código de cliente y servidor
- Commitear archivos de configuración con IPs reales
- Commitear logs o bases de datos
- Hardcodear paths absolutos
- Dejar código comentado o temporal

---

**Documento generado:** Marzo 2, 2026  
**Versión:** 1.0  
**Estado:** COMPLETO
