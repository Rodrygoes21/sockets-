# Dashboard UI

Dashboard de clientes para el sistema de distribución de sockets.

## Stack
- **React 18** - Library de interfaz de usuario
- **Vite** - Build tool y dev server
- **CSS Vanilla** - Estilos sin librerías

## Características
- ✅ Tabla de clientes con actualización automática cada 5 segundos
- ✅ Mostrar: ID, nombre, estado, última métrica, última actualización
- ✅ Indicador de conexión al servidor en tiempo real
- ✅ Diseño limpio y responsivo
- ✅ Manejo de errores

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

Para que funcione correctamente, el servidor debe estar ejecutándose en `http://localhost:3000` con los endpoints:
- `GET /api/health` - Verificar estado del servidor
- `GET /api/clients` - Obtener lista de clientes

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Estructura

```
ui/
├── src/
│   ├── main.jsx          # Punto de entrada
│   ├── App.jsx           # Componente principal
│   ├── App.css           # Estilos de App
│   ├── Dashboard.jsx     # Componente del dashboard
│   ├── Dashboard.css     # Estilos del dashboard
│   └── index.css         # Estilos globales
├── index.html
├── vite.config.js
└── package.json
```

## API Esperada

### GET /api/health
Verifica la salud del servidor.

Response:
```json
{
  "status": "ok"
}
```

### GET /api/clients
Retorna lista de clientes conectados.

Response:
```json
[
  {
    "id": "client-1",
    "name": "Cliente 1",
    "status": "connected",
    "lastMetric": 42,
    "lastUpdate": "2026-03-07T10:30:00Z"
  }
]
```

## Criterios de Aceptación ✓

- [x] React + Vite funcionando
- [x] Tabla se actualiza automáticamente (cada 5 segundos)
- [x] Muestra clientes conectados
- [x] Diseño limpio y simple (sin librerías de UI)
