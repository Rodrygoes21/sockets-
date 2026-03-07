# 🚀 INICIO RÁPIDO - CLIENTE TCP

## Instalación y Setup (5 minutos)

### Opción 1: Setup Automático (Recomendado)

```powershell
# Navegar a la carpeta del cliente
cd client

# Ejecutar script de setup
.\setup.ps1

# O con ID personalizado
.\setup.ps1 -ClientId CLIENT_002 -ServerHost localhost -ServerPort 5000
```

### Opción 2: Setup Manual

```powershell
# 1. Navegar a la carpeta del cliente
cd client

# 2. Instalar dependencias
npm install

# 3. Copiar configuración
copy .env.example .env

# 4. Editar .env con tu CLIENT_ID
notepad .env
```

## ▶️ Ejecutar Cliente

```powershell
# Modo producción
npm start

# Modo desarrollo (con auto-reload)
npm run dev
```

## 📊 Ver Logs en Tiempo Real

```powershell
# Log principal
Get-Content logs/client.log -Wait -Tail 20

# Solo mensajes del servidor
Get-Content logs/messages.log -Wait -Tail 10

# Solo errores
Get-Content logs/error.log -Wait -Tail 10
```

## 🛠️ Configuración Básica (.env)

```env
CLIENT_ID=CLIENT_001        # ⚠️ Cambiar para cada cliente
SERVER_HOST=localhost       # Host del servidor
SERVER_PORT=5000           # Puerto del servidor
METRICS_INTERVAL=30000     # 30 segundos
LOG_LEVEL=info            # info, debug, warn, error
```

## ✅ Verificación

El cliente está funcionando correctamente si ves:

```
✅ Conectado al servidor
✅ Mensaje de registro enviado
📈 Métricas enviadas
```

## 🐛 Troubleshooting

### Error: "ECONNREFUSED"
- El servidor no está corriendo
- Verifica que el servidor esté en `localhost:5000`

### Error: "CLIENT_ID is required"
- Falta configurar CLIENT_ID en .env
- Asegúrate que el archivo .env exista

### Error: "No se detectaron discos"
- Permisos insuficientes
- Ejecuta como administrador si es necesario

## 📚 Ver Más

- [README.md](README.md) - Documentación completa
- [../docs/](../docs/) - Documentación del proyecto

---

**¿Problemas?** Revisa los logs en `logs/client.log`
