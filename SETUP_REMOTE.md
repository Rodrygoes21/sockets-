# ==============================================================================
# 🖥️ INSTRUCCIONES PARA OTRA COMPUTADORA
# ==============================================================================

## OPCIÓN 1: Cliente Remoto Conectándose a Este Servidor

### EN ESTA COMPUTADORA (Servidor):

1. **Ejecutar verificación:**
   ```powershell
   .\scripts\check_system.ps1
   ```
   - Anota tu IP local (ejemplo: 192.168.1.10)

2. **Iniciar el sistema completo:**
   ```powershell
   .\scripts\start_all.ps1
   ```

3. **Configurar firewall** (solo primera vez):
   - Windows Defender Firewall → "Permitir una aplicación"
   - Buscar y permitir "Node.js" en red privada
   - O ejecutar:
   ```powershell
   New-NetFirewallRule -DisplayName "Storage Cluster TCP" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "Storage Cluster API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```

### EN LA OTRA COMPUTADORA (Cliente):

1. **Copiar carpeta `client/` completa** a la otra PC
   - Usar USB, carpeta compartida, o correo
   - La carpeta incluye: src/, package.json, README.md

2. **Abrir PowerShell en la carpeta client/**
   ```powershell
   cd ruta\donde\copiaste\client
   ```

3. **Instalar dependencias:**
   ```powershell
   npm install
   ```

4. **Configurar IP del servidor:**
   
   Opción A - Variable de entorno (RECOMENDADO):
   ```powershell
   $env:SERVER_HOST = "192.168.1.10"  # Tu IP local
   node src/index.js
   ```

   Opción B - Editar archivo config.js:
   - Abrir: `client/src/config.js`
   - Cambiar línea 8:
     ```javascript
     // De:
     const SERVER_HOST = process.env.SERVER_HOST || 'localhost';
     
     // A:
     const SERVER_HOST = '192.168.1.10';  // IP de tu computadora
     ```

5. **Iniciar cliente:**
   ```powershell
   node src/index.js
   ```

6. **Verificar conexión:**
   - Deberías ver: "✅ Conectado al servidor Storage Cluster"
   - En tu PC en http://localhost:5173 verás el nuevo cliente

---

## OPCIÓN 2: Sistema Completo en Otra Computadora

### Requisitos en la otra PC:
- Node.js v14+ instalado
- MongoDB instalado y corriendo
- Git instalado

### Pasos:

1. **Clonar repositorio:**
   ```powershell
   git clone https://github.com/Rodrygoes21/sockets-.git
   cd sockets-
   ```

2. **Cambiar al branch correcto:**
   ```powershell
   git checkout feature/funcionalidades-tecnicas-criticas
   
   # O si ya fue mergeado a main:
   git checkout main
   git pull
   ```

3. **Instalar todas las dependencias:**
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

4. **Verificar sistema:**
   ```powershell
   .\scripts\check_system.ps1
   ```

5. **Iniciar MongoDB:**
   ```powershell
   Start-Service MongoDB
   # O: mongod --dbpath C:\data\db
   ```

6. **Iniciar todo:**
   ```powershell
   .\scripts\start_all.ps1
   ```

7. **Abrir dashboard:**
   ```
   http://localhost:5173
   ```

---

## 🧪 PRUEBAS RÁPIDAS

### Probar Cliente Remoto:

**En tu PC:**
```powershell
# Ver clientes conectados
curl http://localhost:3000/api/clients
```

**En la otra PC:**
```powershell
# El cliente debe reportar métricas cada 30 segundos
# Verás logs como:
# ✅ Métricas enviadas al servidor
```

### Probar con Múltiples Clientes Remotos:

**En la otra PC, abrir VARIAS terminales:**

Terminal 1:
```powershell
$env:CLIENT_NAME = "RemoteClient_1"
$env:SERVER_HOST = "192.168.1.10"
node src/index.js
```

Terminal 2:
```powershell
$env:CLIENT_NAME = "RemoteClient_2"
$env:SERVER_HOST = "192.168.1.10"
node src/index.js
```

Terminal 3:
```powershell
$env:CLIENT_NAME = "RemoteClient_3"
$env:SERVER_HOST = "192.168.1.10"
node src/index.js
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### "Cannot connect to server"
1. Verificar que el servidor TCP está corriendo (puerto 5000)
2. Verificar la IP es correcta: `ipconfig` en tu PC
3. Verificar firewall permite conexiones
4. Ambas PCs deben estar en la misma red

### "ECONNREFUSED"
- El servidor no está iniciado o el puerto es incorrecto
- Verificar: `netstat -ano | findstr :5000`

### Cliente conecta pero no aparece en dashboard
- Esperar 5-10 segundos (auto-refresh)
- Verificar en consola del servidor si el cliente se registró
- Verificar MongoDB está corriendo

---

## 📸 DEMO DE DOS COMPUTADORAS

### Guión recomendado:

1. **Mostrar tu PC:**
   - Dashboard con sistema completo corriendo
   - Métricas globales funcionando

2. **Conectar desde otra PC:**
   - Ejecutar cliente remoto
   - MOSTRAR en tu PC cómo aparece instantáneamente

3. **Iniciar varios clientes remotos:**
   - 3-4 terminales en la otra PC
   - MOSTRAR en tu PC la tabla creciendo

4. **Enviar mensaje desde tu PC:**
   - Usar formulario en dashboard
   - MOSTRAR en la otra PC cómo recibe el mensaje

5. **Detener cliente:**
   - Ctrl+C en la otra PC
   - MOSTRAR después de 105s se marca como DOWN

**¡Impresiona al profesor! 🎓**
