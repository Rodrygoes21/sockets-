/**
 * MongoDB Database Manager
 * Gestiona conexión y operaciones CRUD para el Storage Cluster
 */

const { MongoClient } = require('mongodb');

class DatabaseManager {
    constructor(connectionString = 'mongodb://localhost:27017', dbName = 'storage_cluster') {
        this.connectionString = connectionString;
        this.dbName = dbName;
        this.client = null;
        this.db = null;
        this.connected = false;
    }

    /**
     * Conecta a MongoDB
     */
    async connect() {
        try {
            console.log('🔌 Conectando a MongoDB...');
            console.log(`   URI: ${this.connectionString}`);
            console.log(`   Database: ${this.dbName}`);

            this.client = new MongoClient(this.connectionString);
            await this.client.connect();
            
            this.db = this.client.db(this.dbName);
            this.connected = true;

            console.log('✅ MongoDB conectado correctamente\n');
            return true;

        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error.message);
            this.connected = false;
            throw error;
        }
    }

    /**
     * Desconecta de MongoDB
     */
    async disconnect() {
        try {
            if (this.client) {
                await this.client.close();
                this.connected = false;
                console.log('✅ MongoDB desconectado correctamente');
            }
        } catch (error) {
            console.error('❌ Error desconectando MongoDB:', error.message);
        }
    }

    /**
     * Verifica el estado de la conexión
     */
    isConnected() {
        return this.connected;
    }

    // ============================================
    // CRUD - Clientes
    // ============================================

    /**
     * Registra un nuevo cliente en la base de datos
     */
    async registerClient(clientData) {
        try {
            const collection = this.db.collection('clients');
            
            const client = {
                clientId: clientData.clientId,
                address: clientData.address,
                connectedAt: new Date(clientData.connectedAt),
                status: 'connected',
                lastSeen: new Date(),
                createdAt: new Date()
            };

            const result = await collection.insertOne(client);
            console.log(`📝 Cliente registrado en DB: ${clientData.clientId}`);
            
            return result;

        } catch (error) {
            console.error('❌ Error registrando cliente:', error.message);
            throw error;
        }
    }

    /**
     * Actualiza el estado de un cliente
     */
    async updateClientStatus(clientId, status) {
        try {
            const collection = this.db.collection('clients');
            
            const result = await collection.updateOne(
                { clientId: clientId },
                { 
                    $set: { 
                        status: status,
                        lastSeen: new Date()
                    }
                }
            );

            return result;

        } catch (error) {
            console.error('❌ Error actualizando cliente:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene información de un cliente
     */
    async getClient(clientId) {
        try {
            const collection = this.db.collection('clients');
            return await collection.findOne({ clientId: clientId });

        } catch (error) {
            console.error('❌ Error obteniendo cliente:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene todos los clientes
     */
    async getAllClients() {
        try {
            const collection = this.db.collection('clients');
            return await collection.find({}).toArray();

        } catch (error) {
            console.error('❌ Error obteniendo clientes:', error.message);
            throw error;
        }
    }

    /**
     * Marca un cliente como desconectado
     */
    async disconnectClient(clientId, reason) {
        try {
            const collection = this.db.collection('clients');
            
            const result = await collection.updateOne(
                { clientId: clientId },
                { 
                    $set: { 
                        status: 'disconnected',
                        disconnectedAt: new Date(),
                        disconnectReason: reason,
                        lastSeen: new Date()
                    }
                }
            );

            console.log(`📝 Cliente marcado como desconectado: ${clientId}`);
            return result;

        } catch (error) {
            console.error('❌ Error desconectando cliente:', error.message);
            throw error;
        }
    }

    // ============================================
    // CRUD - Métricas
    // ============================================

    /**
     * Guarda métricas de un cliente
     */
    async saveMetrics(metricsData) {
        try {
            const collection = this.db.collection('metrics');
            
            const metrics = {
                clientId: metricsData.clientId,
                metrics: metricsData.metrics,
                receivedAt: new Date(metricsData.receivedAt || Date.now()),
                timestamp: new Date()
            };

            const result = await collection.insertOne(metrics);
            console.log(`📊 Métricas guardadas en DB: ${metricsData.clientId}`);
            
            return result;

        } catch (error) {
            console.error('❌ Error guardando métricas:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene las últimas métricas de un cliente
     */
    async getLatestMetrics(clientId, limit = 10) {
        try {
            const collection = this.db.collection('metrics');
            
            return await collection
                .find({ clientId: clientId })
                .sort({ receivedAt: -1 })
                .limit(limit)
                .toArray();

        } catch (error) {
            console.error('❌ Error obteniendo métricas:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene métricas por rango de fechas
     */
    async getMetricsByDateRange(clientId, startDate, endDate) {
        try {
            const collection = this.db.collection('metrics');
            
            return await collection
                .find({
                    clientId: clientId,
                    receivedAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                })
                .sort({ receivedAt: 1 })
                .toArray();

        } catch (error) {
            console.error('❌ Error obteniendo métricas por fecha:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas agregadas de métricas
     */
    async getMetricsStats(clientId) {
        try {
            const collection = this.db.collection('metrics');
            
            const stats = await collection.aggregate([
                { $match: { clientId: clientId } },
                {
                    $group: {
                        _id: '$clientId',
                        totalRecords: { $sum: 1 },
                        avgUtilization: { $avg: '$metrics.utilization_percent' },
                        maxUtilization: { $max: '$metrics.utilization_percent' },
                        minUtilization: { $min: '$metrics.utilization_percent' },
                        avgGrowthRate: { $avg: '$metrics.growth_rate' }
                    }
                }
            ]).toArray();

            return stats[0] || null;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error.message);
            throw error;
        }
    }

    // ============================================
    // CRUD - Mensajes
    // ============================================

    /**
     * Guarda un mensaje enviado o recibido
     */
    async saveMessage(messageData) {
        try {
            const collection = this.db.collection('messages');
            
            const message = {
                clientId: messageData.clientId,
                direction: messageData.direction, // 'sent' o 'received'
                messageType: messageData.messageType || messageData.message_type,
                messageId: messageData.messageId || messageData.message_id,
                content: messageData.content || messageData.message,
                timestamp: new Date(messageData.timestamp || Date.now()),
                createdAt: new Date()
            };

            const result = await collection.insertOne(message);
            
            return result;

        } catch (error) {
            console.error('❌ Error guardando mensaje:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene el historial de mensajes de un cliente
     */
    async getClientMessages(clientId, limit = 50) {
        try {
            const collection = this.db.collection('messages');
            
            return await collection
                .find({ clientId: clientId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();

        } catch (error) {
            console.error('❌ Error obteniendo mensajes:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene todos los mensajes filtrados por tipo
     */
    async getMessagesByType(messageType, limit = 100) {
        try {
            const collection = this.db.collection('messages');
            
            return await collection
                .find({ messageType: messageType })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();

        } catch (error) {
            console.error('❌ Error obteniendo mensajes por tipo:', error.message);
            throw error;
        }
    }

    /**
     * Cuenta mensajes por cliente
     */
    async getMessageCount(clientId) {
        try {
            const collection = this.db.collection('messages');
            
            const sent = await collection.countDocuments({
                clientId: clientId,
                direction: 'sent'
            });

            const received = await collection.countDocuments({
                clientId: clientId,
                direction: 'received'
            });

            return { sent, received, total: sent + received };

        } catch (error) {
            console.error('❌ Error contando mensajes:', error.message);
            throw error;
        }
    }

    // ============================================
    // Operaciones de mantenimiento
    // ============================================

    /**
     * Limpia registros antiguos (más de N días)
     */
    async cleanOldRecords(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const metricsResult = await this.db.collection('metrics').deleteMany({
                timestamp: { $lt: cutoffDate }
            });

            const messagesResult = await this.db.collection('messages').deleteMany({
                timestamp: { $lt: cutoffDate }
            });

            console.log(`🧹 Limpieza completada:`);
            console.log(`   Métricas eliminadas: ${metricsResult.deletedCount}`);
            console.log(`   Mensajes eliminados: ${messagesResult.deletedCount}`);

            return {
                metrics: metricsResult.deletedCount,
                messages: messagesResult.deletedCount
            };

        } catch (error) {
            console.error('❌ Error limpiando registros:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas generales de la base de datos
     */
    async getDatabaseStats() {
        try {
            const stats = {
                clients: await this.db.collection('clients').countDocuments(),
                metrics: await this.db.collection('metrics').countDocuments(),
                messages: await this.db.collection('messages').countDocuments(),
                connectedClients: await this.db.collection('clients').countDocuments({ status: 'connected' })
            };

            return stats;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error.message);
            throw error;
        }
    }

    // ============================================
    // Métricas Globales Agregadas
    // ============================================

    /**
     * Calcula métricas globales del cluster (SUM de capacidades de clientes UP)
     */
    async getGlobalMetrics() {
        try {
            const metricsCollection = this.db.collection('metrics');
            const clientsCollection = this.db.collection('clients');

            // Obtener IDs de clientes conectados/UP
            const connectedClients = await clientsCollection.find({ 
                status: { $in: ['connected', 'UP'] }
            }).toArray();

            if (connectedClients.length === 0) {
                return {
                    totalCapacity: 0,
                    usedCapacity: 0,
                    freeCapacity: 0,
                    utilizationPercent: 0,
                    avgGrowthRate: 0,
                    clientsCount: 0,
                    timestamp: new Date()
                };
            }

            const clientIds = connectedClients.map(c => c.clientId);

            // Obtener las métricas más recientes de cada cliente conectado
            const latestMetrics = await metricsCollection.aggregate([
                { $match: { clientId: { $in: clientIds } } },
                { $sort: { receivedAt: -1 } },
                {
                    $group: {
                        _id: '$clientId',
                        latestMetric: { $first: '$metrics' }
                    }
                }
            ]).toArray();

            // Calcular sumas
            let totalCapacity = 0;
            let usedCapacity = 0;
            let freeCapacity = 0;
            let totalGrowthRate = 0;

            latestMetrics.forEach(item => {
                const metric = item.latestMetric;
                if (metric.total_capacity) {
                    totalCapacity += metric.total_capacity || 0;
                    usedCapacity += metric.used_capacity || 0;
                    freeCapacity += metric.free_capacity || 0;
                    totalGrowthRate += metric.growth_rate || 0;
                }
            });

            const utilizationPercent = totalCapacity > 0 
                ? (usedCapacity / totalCapacity) * 100 
                : 0;

            const avgGrowthRate = latestMetrics.length > 0 
                ? totalGrowthRate / latestMetrics.length 
                : 0;

            return {
                totalCapacity,
                usedCapacity,
                freeCapacity,
                utilizationPercent,
                avgGrowthRate,
                clientsCount: latestMetrics.length,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('❌ Error calculando métricas globales:', error.message);
            throw error;
        }
    }

    /**
     * Calcula el Growth Rate global (MB/hora) del cluster
     * Compara métricas actuales con métricas de hace 1 hora
     */
    async getGlobalGrowthRate() {
        try {
            const metricsCollection = this.db.collection('metrics');
            const now = new Date();
            const oneHourAgo = new Date(now - 60 * 60 * 1000);

            // Obtener métricas actuales
            const currentMetrics = await metricsCollection.aggregate([
                { $match: { receivedAt: { $gte: oneHourAgo } } },
                { $sort: { receivedAt: -1 } },
                {
                    $group: {
                        _id: '$clientId',
                        latestUsed: { $first: '$metrics.used_capacity' },
                        latestTime: { $first: '$receivedAt' }
                    }
                }
            ]).toArray();

            // Obtener métricas más antiguas de cada cliente
            const oldMetrics = await metricsCollection.aggregate([
                { $match: { receivedAt: { $lte: oneHourAgo } } },
                { $sort: { receivedAt: -1 } },
                {
                    $group: {
                        _id: '$clientId',
                        oldestUsed: { $first: '$metrics.used_capacity' },
                        oldestTime: { $first: '$receivedAt' }
                    }
                }
            ]).toArray();

            // Calcular crecimiento
            let totalGrowth = 0;
            let clientsWithGrowth = 0;

            currentMetrics.forEach(current => {
                const old = oldMetrics.find(o => o._id === current._id);
                if (old && current.latestUsed && old.oldestUsed) {
                    const timeDiff = (current.latestTime - old.oldestTime) / (1000 * 60 * 60); // horas
                    if (timeDiff > 0) {
                        const growth = (current.latestUsed - old.oldestUsed) / timeDiff; // MB/hora
                        totalGrowth += growth;
                        clientsWithGrowth++;
                    }
                }
            });

            const avgGrowthRate = clientsWithGrowth > 0 
                ? totalGrowth / clientsWithGrowth 
                : 0;

            return {
                growthRateMBPerHour: avgGrowthRate,
                clientsAnalyzed: clientsWithGrowth,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('❌ Error calculando growth rate global:', error.message);
            throw error;
        }
    }

    /**
     * Calcula la disponibilidad (availability) del cluster
     * Porcentaje de tiempo que los clientes han estado UP/conectados
     */
    async getGlobalAvailability(hoursBack = 24) {
        try {
            const clientsCollection = this.db.collection('clients');
            const metricsCollection = this.db.collection('metrics');
            const now = new Date();
            const startTime = new Date(now - hoursBack * 60 * 60 * 1000);

            // Obtener todos los clientes registrados
            const allClients = await clientsCollection.find({}).toArray();

            if (allClients.length === 0) {
                return {
                    availabilityPercent: 0,
                    totalClients: 0,
                    averageUptime: 0,
                    timestamp: new Date()
                };
            }

            // Calcular uptime de cada cliente basado en métricas recibidas
            let totalUptimeSeconds = 0;
            let clientsWithData = 0;

            for (const client of allClients) {
                // Contar métricas recibidas en el período
                const metricsCount = await metricsCollection.countDocuments({
                    clientId: client.clientId,
                    receivedAt: { $gte: startTime }
                });

                // Asumiendo que los clientes reportan cada 30 segundos
                // Si recibimos N métricas, el cliente estuvo activo N * 30 segundos
                const uptimeSeconds = metricsCount * 30;
                totalUptimeSeconds += uptimeSeconds;
                
                if (metricsCount > 0) {
                    clientsWithData++;
                }
            }

            const totalPossibleSeconds = hoursBack * 60 * 60 * allClients.length;
            const availabilityPercent = totalPossibleSeconds > 0
                ? (totalUptimeSeconds / totalPossibleSeconds) * 100
                : 0;

            const averageUptime = clientsWithData > 0
                ? totalUptimeSeconds / clientsWithData
                : 0;

            return {
                availabilityPercent,
                totalClients: allClients.length,
                averageUptimeSeconds: averageUptime,
                averageUptimeHours: averageUptime / 3600,
                periodHours: hoursBack,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('❌ Error calculando availability:', error.message);
            throw error;
        }
    }
}

module.exports = DatabaseManager;
