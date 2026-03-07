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
}

module.exports = DatabaseManager;
