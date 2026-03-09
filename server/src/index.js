const net = require('net');
const EventEmitter = require('events');
const DatabaseManager = require('../database/db');

/**
 * Servidor TCP para Storage Cluster
 * Gestiona conexiones de múltiples clientes (3-5) y procesa métricas
 */
class StorageClusterServer extends EventEmitter {
    constructor(port = 5000, maxClients = 5, databaseManager = null) {
        super();
        this.port = port;
        this.maxClients = maxClients;
        this.clients = new Map(); // clientId -> { socket, info, metrics, lastSeen }
        this.clientIdCounter = 1;
        this.server = null;
        this.db = databaseManager;
        this.inactivityMonitorInterval = null;
        this.INACTIVITY_TIMEOUT = 105000; // 105 segundos (30s × 3 + 15s buffer)
        this.MONITOR_CHECK_INTERVAL = 15000; // Revisar cada 15 segundos
    }

    /**
     * Inicia el servidor TCP
     */
    async start() {
        // Conectar a MongoDB si está disponible
        if (this.db) {
            try {
                await this.db.connect();
                console.log('✅ Servidor TCP conectado a MongoDB\n');
            } catch (error) {
                console.warn('⚠️  MongoDB no disponible, continuando sin persistencia');
            }
        }

        this.server = net.createServer((socket) => {
            this.handleNewConnection(socket);
        });

        this.server.on('error', (err) => {
            console.error('❌ Error del servidor:', err.message);
            this.emit('error', err);
        });

        this.server.listen(this.port, () => {
            console.log('═══════════════════════════════════════════════════');
            console.log('🚀 Storage Cluster Server - TCP Mode');
            console.log('═══════════════════════════════════════════════════');
            console.log(`📡 Puerto: ${this.port}`);
            console.log(`👥 Clientes máximos: ${this.maxClients}`);
            console.log(`⏰ Iniciado: ${new Date().toISOString()}`);
            console.log(`🔍 Monitor de inactividad: ${this.INACTIVITY_TIMEOUT / 1000}s timeout`);
            console.log('═══════════════════════════════════════════════════\n');
            this.emit('started', { port: this.port });
            
            // Iniciar monitor de inactividad
            this.startInactivityMonitor();
        });
    }

    /**
     * Maneja una nueva conexión de cliente
     */
    handleNewConnection(socket) {
        // Verificar límite de clientes
        if (this.clients.size >= this.maxClients) {
            console.log('⚠️  Conexión rechazada - Límite de clientes alcanzado');
            socket.write(JSON.stringify({
                type: 'ERROR',
                message: 'Servidor completo. Máximo de clientes alcanzado.',
                timestamp: Date.now()
            }));
            socket.end();
            return;
        }

        // Asignar ID único al cliente
        const clientId = `CLIENT_${this.clientIdCounter++}`;
        const clientInfo = {
            id: clientId,
            socket: socket,
            address: `${socket.remoteAddress}:${socket.remotePort}`,
            connectedAt: new Date(),
            lastSeen: new Date(),
            metrics: [],
            pendingAcks: new Map(), // messageId -> pendingAck
            status: 'connected'
        };

        this.clients.set(clientId, clientInfo);
        
        // Registrar cliente en MongoDB
        if (this.db && this.db.isConnected()) {
            this.db.registerClient({
                clientId: clientId,
                address: clientInfo.address,
                connectedAt: clientInfo.connectedAt
            }).catch(err => console.error('Error registrando cliente en DB:', err.message));
        }

        console.log(`✅ Cliente conectado: ${clientId}`);
        console.log(`   📍 Dirección: ${clientInfo.address}`);
        console.log(`   👥 Clientes activos: ${this.clients.size}/${this.maxClients}\n`);

        // Enviar confirmación de conexión
        this.sendMessage(clientId, {
            message_type: 'SERVER_NOTIFICATION',
            message_id: Date.now(),
            message: 'Conexión establecida exitosamente. Por favor registre su cliente.',
            clientId: clientId,
            timestamp: new Date().toISOString()
        });

        // Configurar manejo de datos
        let buffer = '';
        socket.on('data', (data) => {
            buffer += data.toString();
            
            // Procesar mensajes completos (separados por saltos de línea)
            let messages = buffer.split('\n');
            buffer = messages.pop(); // Guardar mensaje incompleto

            messages.forEach((message) => {
                if (message.trim()) {
                    this.handleClientMessage(clientId, message);
                }
            });
        });

        // Manejo de desconexión
        socket.on('end', () => {
            this.handleClientDisconnect(clientId, 'Cliente desconectado');
        });

        socket.on('error', (err) => {
            console.error(`❌ Error en ${clientId}: ${err.message}`);
            this.handleClientDisconnect(clientId, `Error: ${err.message}`);
        });

        this.emit('clientConnected', { clientId, address: clientInfo.address });
    }

    /**
     * Procesa mensajes recibidos de los clientes
     */
    handleClientMessage(clientId, messageStr) {
        try {
            const message = JSON.parse(messageStr);
            const client = this.clients.get(clientId);

            if (!client) {
                console.error(`⚠️  Cliente no encontrado: ${clientId}`);
                return;
            }

            // Actualizar lastSeen al recibir cualquier mensaje
            client.lastSeen = new Date();
            client.status = 'connected';

            // Soportar ambos formatos: type y message_type
            const messageType = message.type || message.message_type;
            console.log(`📨 Mensaje de ${clientId}: ${messageType}`);

            switch (messageType) {
                case 'METRICS':
                case 'METRICS_REPORT':
                    this.processMetrics(clientId, message);
                    break;

                case 'CLIENT_REGISTER':
                    // Confirmar registro del cliente
                    this.sendMessage(clientId, {
                        message_type: 'SERVER_NOTIFICATION',
                        message_id: Date.now(),
                        message: `Cliente ${clientId} registrado exitosamente`,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`✅ Cliente ${clientId} registrado\n`);
                    break;

                case 'ACK':
                    this.processAck(clientId, message);
                    break;

                case 'PING':
                    this.sendMessage(clientId, {
                        message_type: 'PING',
                        message_id: Date.now(),
                        timestamp: new Date().toISOString()
                    });
                    break;

                case 'STATUS':
                    this.sendClientStatus(clientId);
                    break;

                default:
                    console.log(`⚠️  Tipo de mensaje desconocido: ${messageType}`);
                    this.sendMessage(clientId, {
                        message_type: 'ERROR',
                        message_id: Date.now(),
                        message: `Tipo de mensaje no soportado: ${messageType}`,
                        timestamp: new Date().toISOString()
                    });
            }

            this.emit('messageReceived', { clientId, message });

        } catch (err) {
            console.error(`❌ Error procesando mensaje de ${clientId}:`, err.message);
            this.sendMessage(clientId, {
                message_type: 'ERROR',
                message_id: Date.now(),
                message: 'Formato de mensaje inválido',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Procesa métricas recibidas de un cliente
     */
    processMetrics(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const metrics = {
            ...message.metrics,
            receivedAt: Date.now(),
            clientId: clientId
        };

        // Guardar métricas
        client.metrics.push(metrics);

        // Mantener solo las últimas 100 métricas por cliente
        if (client.metrics.length > 100) {
            client.metrics.shift();
        }

        // Guardar en MongoDB
        if (this.db && this.db.isConnected()) {
            this.db.saveMetrics({
                clientId: clientId,
                metrics: metrics,
                receivedAt: metrics.receivedAt
            }).catch(err => console.error('Error guardando métricas en DB:', err.message));
        }

        console.log(`📊 Métricas de ${clientId}:`);
        
        // Mostrar métricas según el formato recibido
        if (metrics.cpu !== undefined) {
            console.log(`   CPU: ${metrics.cpu}%`);
            console.log(`   Memoria: ${metrics.memory}%`);
            console.log(`   Disco: ${metrics.disk}%`);
            console.log(`   Uptime: ${metrics.uptime}s\n`);
        } else if (metrics.total_capacity !== undefined) {
            console.log(`   Capacidad Total: ${(metrics.total_capacity / 1024).toFixed(2)} GB`);
            console.log(`   Usado: ${(metrics.used_capacity / 1024).toFixed(2)} GB`);
            console.log(`   Libre: ${(metrics.free_capacity / 1024).toFixed(2)} GB`);
            console.log(`   Utilización: ${metrics.utilization_percent.toFixed(2)}%`);
            console.log(`   Tasa de Crecimiento: ${metrics.growth_rate.toFixed(2)} MB/h\n`);
        }

        // Enviar ACK en el formato del cliente
        const messageId = message.message_id || message.messageId || Date.now();
        this.sendMessage(clientId, {
            message_type: 'ACK',
            message_id: messageId,
            status: 'RECEIVED',
            message: 'Métricas recibidas correctamente',
            timestamp: new Date().toISOString()
        });

        this.emit('metricsReceived', { clientId, metrics });
    }

    /**
     * Procesa ACK de un cliente
     */
    processAck(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const messageId = message.message_id || message.messageId;
        if (client.pendingAcks.has(messageId)) {
            client.pendingAcks.delete(messageId);
            console.log(`✓ ACK recibido de ${clientId} para mensaje ${messageId}\n`);
            this.emit('ackReceived', { clientId, messageId });
        }
    }

    /**
     * Envía un mensaje a un cliente específico
     */
    sendMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || !client.socket || client.socket.destroyed) {
            console.error(`❌ No se puede enviar mensaje a ${clientId}`);
            return false;
        }

        try {
            const messageStr = JSON.stringify(message) + '\n';
            client.socket.write(messageStr);

            // Si es un mensaje que requiere ACK, guardarlo
            if (message.type !== 'ACK' && message.type !== 'PONG') {
                const messageId = message.messageId || Date.now();
                client.pendingAcks.set(messageId, {
                    message,
                    sentAt: Date.now()
                });
            }

            return true;
        } catch (err) {
            console.error(`❌ Error enviando mensaje a ${clientId}:`, err.message);
            return false;
        }
    }

    /**
     * Envía un mensaje a todos los clientes conectados
     */
    broadcast(message) {
        console.log(`📢 Broadcasting: ${message.type}`);
        let sent = 0;
        this.clients.forEach((client, clientId) => {
            if (this.sendMessage(clientId, message)) {
                sent++;
            }
        });
        console.log(`   Enviado a ${sent}/${this.clients.size} clientes\n`);
        return sent;
    }

    /**
     * Envía el estado actual al cliente
     */
    sendClientStatus(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;

        const status = {
            type: 'STATUS',
            clientId: clientId,
            connectedAt: client.connectedAt,
            metricsCount: client.metrics.length,
            pendingAcks: client.pendingAcks.size,
            serverStats: {
                totalClients: this.clients.size,
                maxClients: this.maxClients,
                uptime: process.uptime()
            },
            timestamp: Date.now()
        };

        this.sendMessage(clientId, status);
    }

    /**
     * Maneja la desconexión de un cliente
     */
    handleClientDisconnect(clientId, reason) {
        const client = this.clients.get(clientId);
        if (!client) return;

        console.log(`👋 Cliente desconectado: ${clientId}`);
        console.log(`   Razón: ${reason}`);
        console.log(`   👥 Clientes activos: ${this.clients.size - 1}/${this.maxClients}\n`);

        // Actualizar en MongoDB
        if (this.db && this.db.isConnected()) {
            this.db.disconnectClient(clientId, reason)
                .catch(err => console.error('Error actualizando cliente en DB:', err.message));
        }

        // Limpiar socket
        if (client.socket && !client.socket.destroyed) {
            client.socket.destroy();
        }

        this.clients.delete(clientId);
        this.emit('clientDisconnected', { clientId, reason });
    }

    /**
     * Obtiene información de todos los clientes conectados
     */
    getClientsInfo() {
        const info = [];
        this.clients.forEach((client, clientId) => {
            info.push({
                id: clientId,
                address: client.address,
                connectedAt: client.connectedAt,
                metricsCount: client.metrics.length,
                pendingAcks: client.pendingAcks.size
            });
        });
        return info;
    }

    /**
     * Inicia el monitor de inactividad de clientes
     * Revisa cada 15 segundos si algún cliente lleva más de 105 segundos sin reportar
     */
    startInactivityMonitor() {
        console.log('🔍 Iniciando monitor de inactividad...\n');
        
        this.inactivityMonitorInterval = setInterval(() => {
            this.checkInactiveClients();
        }, this.MONITOR_CHECK_INTERVAL);
    }

    /**
     * Detiene el monitor de inactividad
     */
    stopInactivityMonitor() {
        if (this.inactivityMonitorInterval) {
            clearInterval(this.inactivityMonitorInterval);
            this.inactivityMonitorInterval = null;
            console.log('⏹️  Monitor de inactividad detenido');
        }
    }

    /**
     * Revisa clientes inactivos y los marca como DOWN
     */
    checkInactiveClients() {
        const now = new Date();
        let inactiveCount = 0;

        this.clients.forEach((client, clientId) => {
            const timeSinceLastSeen = now - client.lastSeen;
            
            // Si el cliente lleva más del timeout sin reportar, marcarlo como DOWN
            if (timeSinceLastSeen > this.INACTIVITY_TIMEOUT && client.status === 'connected') {
                console.log(`⚠️  Cliente inactivo detectado: ${clientId}`);
                console.log(`   Último contacto: ${client.lastSeen.toISOString()}`);
                console.log(`   Tiempo sin reportar: ${(timeSinceLastSeen / 1000).toFixed(0)}s\n`);
                
                // Marcar como DOWN en memoria
                client.status = 'DOWN';
                inactiveCount++;
                
                // Actualizar en MongoDB
                if (this.db && this.db.isConnected()) {
                    this.db.updateClientStatus(clientId, 'DOWN')
                        .catch(err => console.error('Error actualizando estado en DB:', err.message));
                }
                
                // Emitir evento
                this.emit('clientInactive', { clientId, timeSinceLastSeen });
                
                // Notificar al cliente (si está conectado)
                try {
                    this.sendMessage(clientId, {
                        message_type: 'WARNING',
                        message_id: Date.now(),
                        message: 'Cliente marcado como inactivo por no reportar métricas',
                        timestamp: new Date().toISOString()
                    });
                } catch (err) {
                    console.error(`Error enviando notificación a ${clientId}:`, err.message);
                }
            }
            
            // Si el cliente vuelve a reportar (lastSeen actualizado), marcarlo como UP
            if (timeSinceLastSeen <= this.INACTIVITY_TIMEOUT && client.status === 'DOWN') {
                console.log(`✅ Cliente reactivado: ${clientId}\n`);
                client.status = 'connected';
                
                if (this.db && this.db.isConnected()) {
                    this.db.updateClientStatus(clientId, 'connected')
                        .catch(err => console.error('Error actualizando estado en DB:', err.message));
                }
            }
        });

        if (inactiveCount > 0) {
            console.log(`📊 Resumen: ${inactiveCount} cliente(s) marcado(s) como inactivo(s)\n`);
        }
    }

    /**
     * Detiene el servidor
     */
    async stop() {
        console.log('\n🛑 Deteniendo servidor...');
        
        // Detener monitor de inactividad
        this.stopInactivityMonitor();
        
        // Desconectar todos los clientes
        this.clients.forEach((client, clientId) => {
            this.sendMessage(clientId, {
                type: 'SHUTDOWN',
                message: 'Servidor apagándose',
                timestamp: Date.now()
            });
            client.socket.end();
        });

        // Cerrar servidor TCP
        if (this.server) {
            this.server.close(() => {
                console.log('✅ Servidor TCP detenido correctamente');
                this.emit('stopped');
            });
        }
        
        // Desconectar MongoDB
        if (this.db && this.db.isConnected()) {
            await this.db.disconnect();
        }
        
        console.log('✅ Servidor detenido completamente\n');
    }
}

// ============================================
// Inicialización del servidor
// ============================================

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    const MAX_CLIENTS = process.env.MAX_CLIENTS || 5;
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'storage_cluster';

    // Crear instancia de DatabaseManager
    const db = new DatabaseManager(MONGODB_URI, MONGODB_DB_NAME);
    
    // Crear servidor con base de datos
    const server = new StorageClusterServer(PORT, MAX_CLIENTS, db);

    // Eventos del servidor
    server.on('clientConnected', ({ clientId, address }) => {
        console.log(`🔔 Evento: Cliente ${clientId} conectado desde ${address}`);
    });

    server.on('metricsReceived', ({ clientId, metrics }) => {
        console.log(`🔔 Evento: Métricas recibidas de ${clientId}`);
    });

    server.on('clientInactive', ({ clientId, timeSinceLastSeen }) => {
        console.log(`🔔 Evento: Cliente ${clientId} inactivo (${(timeSinceLastSeen / 1000).toFixed(0)}s sin reportar)`);
    });

    server.on('clientDisconnected', ({ clientId, reason }) => {
        console.log(`🔔 Evento: Cliente ${clientId} desconectado - ${reason}`);
    });

    // Iniciar servidor
    server.start();

    // Manejo de señales de terminación
    process.on('SIGINT', () => {
        console.log('\n\n⚠️  Señal SIGINT recibida');
        server.stop();
        setTimeout(() => process.exit(0), 1000);
    });

    process.on('SIGTERM', () => {
        console.log('\n\n⚠️  Señal SIGTERM recibida');
        server.stop();
        setTimeout(() => process.exit(0), 1000);
    });
}

module.exports = StorageClusterServer;
