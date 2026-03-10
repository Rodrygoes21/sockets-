# 🧪 GUÍA RÁPIDA DE PRUEBAS - Storage Cluster

## ⚡ PRUEBA EN ESTE DISPOSITIVO (5 minutos)

### 1️⃣ Verificar Requisitos Previos
```powershell
# Verificar Node.js (debe ser v14+)
node --version

# Verificar npm
npm --version

# Verificar MongoDB (debe estar corriendo)
Get-Process -Name "mongod" -ErrorAction SilentlyContinue
# Si no está corriendo: Start-Service MongoDB
```

### 2️⃣ Iniciar el Sistema Completo
```powershell
# En terminal PowerShell en la raíz del proyecto
cd C:\Users\HP\Downloads\univalle-2026\SISTEMAS-DISTRIBUIDOS\sockets

# Iniciar TODO (MongoDB, TCP Server, API, UI)
.\scripts\start_all.ps1
```

**Espera 10 segundos** a que todos los servicios se inicien.

### 3️⃣ Verificar que Todo Funciona
Deberías ver **4 ventanas nuevas**:
- ✅ TCP Server (puerto 5000)
- ✅ API REST (puerto 3000)  
- ✅ UI React (puerto 5173)

**Abre en el navegador:**
```
http://localhost:5173
```

### 4️⃣ Iniciar Clientes de Prueba

**Terminal 1 - Cliente Individual:**
```powershell
cd client
node src/index.js
```

**Terminal 2 - 9 Clientes Simultáneos:**
```powershell
.\scripts\test_9_clients.ps1
```

### 5️⃣ Verificar en el Dashboard
En http://localhost:5173 deberías ver:

✅ **Métricas Globales** (arriba):
- Capacidad Total del cluster
- Espacio Usado/Libre
- Tasa de Crecimiento (MB/hora)
- Disponibilidad (≥99.9%)
- Uptime promedio

✅ **Gráficas** con Chart.js mostrando métricas por cliente

✅ **Formulario de Mensajes** para enviar a clientes

✅ **Tabla de Clientes** con 9-10 clientes conectados

### 6️⃣ Probar Funcionalidades

**A. Monitor de Inactividad:**
1. Detén UN cliente (Ctrl+C en su ventana)
2. Espera 2 minutos (105 segundos)
3. Verifica que el cliente se marca como "DOWN" en el dashboard

**B. Métricas en Tiempo Real:**
1. Observa las métricas actualizándose cada 5 segundos
2. Las gráficas deben mostrar datos de todos los clientes
3. Las métricas globales se suman correctamente

**C. Envío de Mensajes:**
1. En el formulario, selecciona un cliente
2. Escribe un mensaje de prueba
3. Envía y verifica el feedback

### 7️⃣ Detener Todo
```powershell
# Detener clientes de prueba
.\scripts\stop_9_clients.ps1

# Detener todo el sistema
.\scripts\stop_all.ps1
```

---

## 🖥️ PRUEBA EN OTRA COMPUTADORA

### Opción A: Clonar desde GitHub

**1. En la otra computadora:**
```powershell
# Clonar repositorio
git clone https://github.com/Rodrygoes21/sockets-.git
cd sockets-

# Cambiar a la rama con funcionalidades
git checkout feature/funcionalidades-tecnicas-criticas
```

**2. Instalar dependencias:**
```powershell
# Servidor
cd server
npm install
cd ..

# Cliente
cd client
npm install
cd ..

# UI
cd ui
npm install
cd ..
```

**3. Iniciar MongoDB:**
```powershell
# Opción 1: Como servicio
Start-Service MongoDB

# Opción 2: Manual
mongod --dbpath C:\data\db
```

**4. Seguir pasos 2-7 de la sección anterior**

---

### Opción B: Conectar Cliente Remoto a este Servidor

**EN ESTE DISPOSITIVO (Servidor):**

1. **Obtener tu IP local:**
```powershell
ipconfig | Select-String "IPv4"
# Ejemplo: 192.168.1.10
```

2. **Iniciar servidor:**
```powershell
.\scripts\start_all.ps1
```

**EN LA OTRA COMPUTADORA (Solo Cliente):**

1. **Copiar carpeta client/** a la otra PC (USB o compartir red)

2. **Instalar dependencias:**
```powershell
cd client
npm install
```

3. **Configurar IP del servidor:**
```powershell
# Editar client/src/config.js
# Cambiar SERVER_HOST de 'localhost' a la IP del servidor
# Ejemplo: const SERVER_HOST = '192.168.1.10'
```

4. **Iniciar cliente:**
```powershell
node src/index.js
```

5. **Verificar conexión:**
   - En la otra PC deberías ver "✅ Conectado al servidor"
   - En tu PC en http://localhost:5173 verás el nuevo cliente

---

## 📊 CHECKLIST DE FUNCIONALIDADES A PROBAR

### Funcionalidades Críticas:
- [ ] Sistema completo se inicia con un solo comando
- [ ] 9 clientes conectan simultáneamente
- [ ] Dashboard muestra métricas globales agregadas
- [ ] Tasa de crecimiento se calcula (MB/hora)
- [ ] Disponibilidad muestra ≥99.9%
- [ ] Monitor de inactividad detecta clientes caídos (105s)
- [ ] Clientes inactivos se marcan como DOWN
- [ ] Gráficas muestran datos de todos los clientes
- [ ] Formulario envía mensajes correctamente
- [ ] Auto-refresh funciona (cada 5-10 segundos)

### API REST Endpoints:
```powershell
# Probar en otra terminal:

# Clientes conectados
curl http://localhost:3000/api/clients

# Métricas globales
curl http://localhost:3000/api/metrics/global

# Growth Rate
curl http://localhost:3000/api/metrics/growth-rate

# Availability
curl http://localhost:3000/api/metrics/availability
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS RÁPIDOS

### MongoDB no inicia
```powershell
# Opción 1: Servicio Windows
Start-Service MongoDB

# Opción 2: Manual con ruta personalizada
mongod --dbpath "C:\data\db"
```

### Puerto ya en uso
```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :5000
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# Matar proceso
Stop-Process -Id <PID> -Force
```

### Clientes no conectan
```powershell
# Verificar que el servidor TCP está corriendo
Get-Process -Name "node" | Where-Object { $_.Id -ne $PID }

# Verificar firewall (permitir Node.js)
# Windows Defender Firewall → Permitir una app
```

### UI no carga
```powershell
# Verificar que Vite está corriendo en puerto 5173
# Abrir: http://localhost:5173

# Si no funciona, iniciar manualmente:
cd ui
npm run dev
```

---

## ⏱️ TIEMPOS ESPERADOS

- **Instalación completa**: 5-10 minutos
- **Inicio del sistema**: 10-15 segundos
- **Conexión de 9 clientes**: 5-10 segundos
- **Primera carga del dashboard**: 2-3 segundos
- **Actualización de métricas**: cada 5-10 segundos
- **Detección de inactividad**: 105 segundos (1min 45s)

---

## 📸 CAPTURAS PARA LA DEFENSA

Tomar screenshots de:
1. ✅ Dashboard con 9 clientes conectados
2. ✅ Métricas globales mostrando capacidad total
3. ✅ Gráfica de Chart.js con datos de múltiples clientes
4. ✅ Availability mostrando ≥99.9%
5. ✅ Cliente marcado como DOWN después de 105s
6. ✅ Ventanas de comandos mostrando los 9 clientes
7. ✅ Respuestas JSON de los endpoints API

---

## 🎯 DEMO RECOMENDADA (5 minutos)

1. **Minuto 1**: Mostrar `start_all.ps1` iniciando todo
2. **Minuto 2**: Abrir dashboard, explicar métricas globales
3. **Minuto 3**: Ejecutar `test_9_clients.ps1`, mostrar 9 conexiones
4. **Minuto 4**: Mostrar auto-refresh y gráficas en tiempo real
5. **Minuto 5**: Detener un cliente, esperar detección de inactividad

**¡Éxito! 🎉**
