# UI - Storage Cluster Dashboard

Dashboard React para monitoreo en tiempo real del cluster de almacenamiento distribuido.

## 🚀 Tecnologías

- **React 18** - Framework UI
- **Vite** - Build tool y dev server
- **CSS Vanilla** - Estilos sin librerías externas

## 📋 Requisitos Previos

- Node.js v14 o superior
- npm v6 o superior
- API REST corriendo en `http://localhost:3000`

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

## 📊 Funcionalidades

### Dashboard
- ✅ Visualización de clientes conectados en tabla
- ✅ Actualización automática cada 5 segundos
- ✅ Muestra métricas en tiempo real:
  - ID del cliente
  - Nombre
  - Estado (conectado/desconectado)
  - CPU (%)
  - Memoria (%)
  - Disco (%)
  - Uptime (horas)
  - Última conexión

### Características
- 🔄 Auto-refresh cada 5 segundos
- 📱 Diseño responsive
- 🎨 Estilos limpios y profesionales
- ⚡ Performance optimizado
- 🚫 Sin dependencias UI adicionales

## 🏗️ Estructura del Proyecto

```
ui/
├── public/           # Archivos estáticos
├── src/
│   ├── App.jsx      # Componente principal
│   ├── Dashboard.jsx # Tabla de clientes
│   ├── App.css      # Estilos globales
│   └── main.jsx     # Entry point
├── index.html       # HTML base
├── vite.config.js   # Configuración Vite
└── package.json     # Dependencias
```

## 🔌 API Endpoints

El dashboard consume:

```javascript
GET /api/clients
```

Respuesta esperada:
```json
{
  "success": true,
  "total": 2,
  "data": [
    {
      "clientId": "client-xyz",
      "name": "Cliente 1",
      "status": "connected",
      "lastMetrics": {
        "cpu": 45.2,
        "memory": 67.8,
        "disk": 34.5,
        "uptime": 7200
      },
      "lastConnection": "2026-03-09T10:30:00.000Z"
    }
  ]
}
```

## 🎨 Estilos

- **Sin librerías CSS**: Todo con CSS vanilla
- **Variables CSS**: Tema personalizable
- **Responsive**: Mobile-first design
- **Animaciones**: Transiciones suaves

## 🔄 Auto-actualización

El dashboard implementa polling cada 5 segundos:

```javascript
useEffect(() => {
  fetchClients()
  const interval = setInterval(fetchClients, 5000)
  return () => clearInterval(interval)
}, [])
```

## 🧪 Testing

Para probar la UI:

1. Asegurarse que la API REST esté corriendo en puerto 3000
2. Asegurarse que MongoDB esté corriendo
3. Iniciar el cliente TCP para generar datos
4. Ejecutar `npm run dev`
5. Abrir navegador en `http://localhost:5173`

## 📝 Notas

- El proxy de Vite redirige `/api/*` a `http://localhost:3000`
- Los datos se actualizan automáticamente sin recargar la página
- Los estados se muestran con badges de colores:
  - 🟢 Verde: Conectado
  - 🔴 Rojo: Desconectado
  - 🟡 Amarillo: Error

## 🐛 Troubleshooting

### La tabla está vacía
- Verificar que la API esté corriendo (`curl http://localhost:3000/api/clients`)
- Verificar que MongoDB tenga datos
- Verificar consola del navegador para errores

### Error de CORS
- Verificar que la API tenga CORS habilitado
- Verificar que el proxy de Vite esté configurado correctamente

### No actualiza automáticamente
- Verificar que no haya errores en consola
- Verificar que el interval esté funcionando (breakpoint en fetchClients)

## 📦 Build para Producción

```bash
npm run build
```

Los archivos optimizados se generan en `dist/`:
- HTML minificado
- CSS bundled y minificado
- JS chunked y minificado
- Assets optimizados

## 🚀 Deploy

La carpeta `dist/` puede ser servida por cualquier servidor web estático:

```bash
# Nginx
cp -r dist/* /var/www/html/

# Servidor Node.js simple
npx serve dist

# Preview local
npm run preview
```

## 👥 Contribución

Ticket #7 - Sprint 1  
Componente: UI  
Story Points: 5  
Stack: React + Vite

---

**UNIVALLE 2026** | Sistemas Distribuidos
