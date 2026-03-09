/**
 * API REST para Storage Cluster
 * Proporciona endpoints para que React consuma datos del servidor TCP y MongoDB
 */

const express = require('express');
const cors = require('cors');
const DatabaseManager = require('../database/db');

// Configuración
const PORT = process.env.API_PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'storage_cluster';

// Crear aplicación Express
const app = express();
const db = new DatabaseManager(MONGODB_URI, MONGODB_DB_NAME);

// Middleware
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Parsear JSON en el body

// Variable para rastrear estado de conexión
let dbConnected = false;

// ============================================
// Endpoints de la API
// ============================================

/**
 * GET / - Health check
 */
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Storage Cluster API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected'
    });
});

/**
 * GET /api/clients - Lista de clientes activos
 * Query params:
 *   - status: filtrar por estado (connected|disconnected)
 */
app.get('/api/clients', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({
                error: 'Database not connected',
                message: 'La base de datos no está disponible'
            });
        }

        const { status } = req.query;
        
        // Obtener todos los clientes
        const allClients = await db.getAllClients();
        
        // Filtrar por estado si se proporciona
        let clients = allClients;
        if (status) {
            clients = allClients.filter(client => client.status === status);
        }

        // Formatear respuesta
        const formattedClients = clients.map(client => ({
            clientId: client.clientId,
            address: client.address,
            status: client.status,
            connectedAt: client.connectedAt,
            lastSeen: client.lastSeen,
            disconnectedAt: client.disconnectedAt,
            disconnectReason: client.disconnectReason
        }));

        res.json({
            success: true,
            count: formattedClients.length,
            clients: formattedClients,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en GET /api/clients:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/metrics - Últimas métricas de todos los clientes
 * Query params:
 *   - limit: número de métricas por cliente (default: 10)
 */
app.get('/api/metrics', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({
                error: 'Database not connected',
                message: 'La base de datos no está disponible'
            });
        }

        const limit = parseInt(req.query.limit) || 10;

        // Obtener todos los clientes activos
        const clients = await db.getAllClients();
        
        // Obtener métricas para cada cliente
        const metricsPromises = clients.map(async (client) => {
            const metrics = await db.getLatestMetrics(client.clientId, limit);
            return {
                clientId: client.clientId,
                status: client.status,
                metricsCount: metrics.length,
                metrics: metrics.map(m => ({
                    totalCapacity: m.metrics.total_capacity,
                    usedCapacity: m.metrics.used_capacity,
                    freeCapacity: m.metrics.free_capacity,
                    utilizationPercent: m.metrics.utilization_percent,
                    growthRate: m.metrics.growth_rate,
                    receivedAt: m.receivedAt
                }))
            };
        });

        const allMetrics = await Promise.all(metricsPromises);

        res.json({
            success: true,
            clientsCount: clients.length,
            data: allMetrics,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en GET /api/metrics:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/metrics/:clientId - Métricas de un cliente específico
 * Params:
 *   - clientId: ID del cliente
 * Query params:
 *   - limit: número de métricas (default: 20)
 *   - stats: incluir estadísticas (true|false)
 */
app.get('/api/metrics/:clientId', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({
                error: 'Database not connected',
                message: 'La base de datos no está disponible'
            });
        }

        const { clientId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        const includeStats = req.query.stats === 'true';

        // Verificar que el cliente existe
        const client = await db.getClient(clientId);
        if (!client) {
            return res.status(404).json({
                error: 'Client not found',
                message: `Cliente ${clientId} no encontrado`
            });
        }

        // Obtener métricas
        const metrics = await db.getLatestMetrics(clientId, limit);

        // Formatear métricas
        const formattedMetrics = metrics.map(m => ({
            totalCapacity: m.metrics.total_capacity,
            usedCapacity: m.metrics.used_capacity,
            freeCapacity: m.metrics.free_capacity,
            utilizationPercent: m.metrics.utilization_percent,
            growthRate: m.metrics.growth_rate,
            receivedAt: m.receivedAt
        }));

        const response = {
            success: true,
            clientId: clientId,
            clientStatus: client.status,
            metricsCount: formattedMetrics.length,
            metrics: formattedMetrics,
            timestamp: new Date().toISOString()
        };

        // Incluir estadísticas si se solicita
        if (includeStats) {
            const stats = await db.getMetricsStats(clientId);
            if (stats) {
                response.statistics = {
                    totalRecords: stats.totalRecords,
                    avgUtilization: stats.avgUtilization?.toFixed(2),
                    maxUtilization: stats.maxUtilization?.toFixed(2),
                    minUtilization: stats.minUtilization?.toFixed(2),
                    avgGrowthRate: stats.avgGrowthRate?.toFixed(2)
                };
            }
        }

        res.json(response);

    } catch (error) {
        console.error(`Error en GET /api/metrics/${req.params.clientId}:`, error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * POST /api/message - Enviar mensaje a un cliente
 * Body:
 * {
 *   "clientId": "CLIENT_1",
 *   "messageType": "SERVER_COMMAND",
 *   "message": "Actualizar configuración"
 * }
 */
app.post('/api/message', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({
                error: 'Database not connected',
                message: 'La base de datos no está disponible'
            });
        }

        const { clientId, messageType, message } = req.body;

        // Validar campos requeridos
        if (!clientId || !messageType || !message) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Se requieren clientId, messageType y message'
            });
        }

        // Verificar que el cliente existe
        const client = await db.getClient(clientId);
        if (!client) {
            return res.status(404).json({
                error: 'Client not found',
                message: `Cliente ${clientId} no encontrado`
            });
        }

        // Guardar mensaje en la base de datos
        const messageData = {
            clientId: clientId,
            direction: 'sent',
            messageType: messageType,
            messageId: Date.now(),
            content: message,
            timestamp: Date.now()
        };

        await db.saveMessage(messageData);

        console.log(`📨 Mensaje guardado para ${clientId}: ${messageType}`);

        // Nota: En una implementación completa, aquí se enviaría el mensaje
        // al servidor TCP para que lo reenvíe al cliente conectado

        res.status(201).json({
            success: true,
            message: 'Mensaje guardado correctamente',
            messageId: messageData.messageId,
            clientId: clientId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en POST /api/message:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// ============================================
// Endpoints de Métricas Globales
// ============================================

/**
 * GET /api/metrics/global - Métricas agregadas del cluster
 * Suma total de capacidades de todos los clientes UP/conectados
 */
app.get('/api/metrics/global', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({
                error: 'Database not connected',
                message: 'La base de datos no está disponible'
            });
        }

        const globalMetrics = await db.getGlobalMetrics();

        res.json({
            success: true,
            data: {
                totalCapacityMB: globalMetrics.totalCapacity,
                totalCapacityGB: (globalMetrics.totalCapacity / 1024).toFixed(2),
                usedCapacityMB: globalMetrics.usedCapacity,
                usedCapacityGB: (globalMetrics.usedCapacity / 1024).toFixed(2),
                freeCapacityMB: globalMetrics.freeCapacity,
                freeCapacityGB: (globalMetrics.freeCapacity / 1024).toFixed(2),
                utilizationPercent: globalMetrics.utilizationPercent.toFixed(2),
                avgGrowthRateMBPerHour: globalMetrics.avgGrowthRate.toFixed(2),
                activeClientsCount: globalMetrics.clientsCount
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en GET /api/metrics/global:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/metrics/growth-rate - Tasa de crecimiento global del cluster
 * Calcula MB/hora de crecimiento comparando métricas actuales con hace 1 hora
 */
app.get('/api/metrics/growth-rate', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({
                error: 'Database not connected',
                message: 'La base de datos no está disponible'
            });
        }

        const growthData = await db.getGlobalGrowthRate();

        res.json({
            success: true,
            data: {
                growthRateMBPerHour: growthData.growthRateMBPerHour.toFixed(2),
                growthRateGBPerDay: ((growthData.growthRateMBPerHour * 24) / 1024).toFixed(2),
                clientsAnalyzed: growthData.clientsAnalyzed
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en GET /api/metrics/growth-rate:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/metrics/availability - Disponibilidad del cluster
 * Porcentaje de tiempo que los clientes han estado UP
 * Query params:
 *   - hours: período en horas para calcular (default: 24)
 */
app.get('/api/metrics/availability', async (req, res) => {
    try {
        if (!dbConnected) {
            return res.status(503).json({
                error: 'Database not connected',
                message: 'La base de datos no está disponible'
            });
        }

        const hours = parseInt(req.query.hours) || 24;
        const availabilityData = await db.getGlobalAvailability(hours);

        res.json({
            success: true,
            data: {
                availabilityPercent: availabilityData.availabilityPercent.toFixed(2),
                meetsRequirement: availabilityData.availabilityPercent >= 99.9,
                totalClients: availabilityData.totalClients,
                averageUptimeHours: availabilityData.averageUptimeHours.toFixed(2),
                periodAnalyzedHours: availabilityData.periodHours
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en GET /api/metrics/availability:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// ============================================
// Manejo de errores 404
// ============================================

app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Ruta ${req.method} ${req.path} no encontrada`,
        availableEndpoints: [
            'GET /',
            'GET /api/clients',
            'GET /api/metrics',
            'GET /api/metrics/:clientId',
            'GET /api/metrics/global',
            'GET /api/metrics/growth-rate',
            'GET /api/metrics/availability',
            'POST /api/message'
        ]
    });
});

// ============================================
// Inicialización
// ============================================

async function startServer() {
    try {
        console.log('═══════════════════════════════════════════════════');
        console.log('🚀 Storage Cluster API - REST Server');
        console.log('═══════════════════════════════════════════════════\n');

        // Conectar a MongoDB
        await db.connect();
        dbConnected = true;

        // Iniciar servidor Express
        app.listen(PORT, () => {
            console.log(`✅ API REST escuchando en puerto ${PORT}`);
            console.log(`📡 URL: http://localhost:${PORT}`);
            console.log(`📊 Endpoints disponibles:`);
            console.log(`   GET  /api/clients`);
            console.log(`   GET  /api/metrics`);
            console.log(`   GET  /api/metrics/:clientId`);
            console.log(`   GET  /api/metrics/global`);
            console.log(`   GET  /api/metrics/growth-rate`);
            console.log(`   GET  /api/metrics/availability`);
            console.log(`   POST /api/message`);
            console.log(`\n🔧 CORS habilitado para todas las rutas`);
            console.log(`💾 MongoDB: ${MONGODB_DB_NAME}`);
            console.log('═══════════════════════════════════════════════════\n');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor API:', error);
        process.exit(1);
    }
}

// Manejo de señales de terminación
process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Señal SIGINT recibida');
    console.log('🛑 Cerrando servidor API...');
    await db.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n⚠️  Señal SIGTERM recibida');
    console.log('🛑 Cerrando servidor API...');
    await db.disconnect();
    process.exit(0);
});

// Iniciar servidor
if (require.main === module) {
    startServer();
}

module.exports = app;
