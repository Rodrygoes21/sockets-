/**
 * Script de Inicialización de MongoDB
 * Crea las colecciones y configura índices
 */

const DatabaseManager = require('./db');

async function initializeDatabase() {
    const dbManager = new DatabaseManager();

    try {
        console.log('═══════════════════════════════════════════════════');
        console.log('🚀 Inicialización de Base de Datos - Storage Cluster');
        console.log('═══════════════════════════════════════════════════\n');

        // Conectar a MongoDB
        await dbManager.connect();

        console.log('📦 Creando colecciones e índices...\n');

        // ============================================
        // Colección: clients
        // ============================================
        console.log('📋 Colección: clients');
        const clientsCollection = dbManager.db.collection('clients');
        
        // Crear índices para clients
        await clientsCollection.createIndex({ clientId: 1 }, { unique: true });
        await clientsCollection.createIndex({ status: 1 });
        await clientsCollection.createIndex({ connectedAt: -1 });
        
        console.log('   ✅ Índices creados: clientId (unique), status, connectedAt');

        // ============================================
        // Colección: metrics
        // ============================================
        console.log('\n📋 Colección: metrics');
        const metricsCollection = dbManager.db.collection('metrics');
        
        // Crear índices para metrics
        await metricsCollection.createIndex({ clientId: 1 });
        await metricsCollection.createIndex({ receivedAt: -1 });
        await metricsCollection.createIndex({ clientId: 1, receivedAt: -1 });
        await metricsCollection.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 días
        
        console.log('   ✅ Índices creados: clientId, receivedAt, compuesto, TTL (30 días)');

        // ============================================
        // Colección: messages
        // ============================================
        console.log('\n📋 Colección: messages');
        const messagesCollection = dbManager.db.collection('messages');
        
        // Crear índices para messages
        await messagesCollection.createIndex({ clientId: 1 });
        await messagesCollection.createIndex({ timestamp: -1 });
        await messagesCollection.createIndex({ messageType: 1 });
        await messagesCollection.createIndex({ clientId: 1, timestamp: -1 });
        await messagesCollection.createIndex({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 días
        
        console.log('   ✅ Índices creados: clientId, timestamp, messageType, compuesto, TTL (30 días)');

        // ============================================
        // Verificar colecciones
        // ============================================
        console.log('\n🔍 Verificando colecciones...');
        const collections = await dbManager.db.listCollections().toArray();
        
        console.log('\n📚 Colecciones disponibles:');
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

        // ============================================
        // Insertar datos de prueba (opcional)
        // ============================================
        console.log('\n📝 Insertando datos de prueba...');
        
        // Cliente de prueba
        const testClient = {
            clientId: 'TEST_CLIENT_001',
            address: '127.0.0.1:12345',
            connectedAt: new Date(),
            status: 'connected',
            lastSeen: new Date(),
            createdAt: new Date()
        };
        
        await clientsCollection.insertOne(testClient);
        console.log('   ✅ Cliente de prueba insertado');

        // Métricas de prueba
        const testMetrics = {
            clientId: 'TEST_CLIENT_001',
            metrics: {
                total_capacity: 500000,
                used_capacity: 300000,
                free_capacity: 200000,
                utilization_percent: 60.0,
                growth_rate: 10.5
            },
            receivedAt: new Date(),
            timestamp: new Date()
        };
        
        await metricsCollection.insertOne(testMetrics);
        console.log('   ✅ Métricas de prueba insertadas');

        // Mensaje de prueba
        const testMessage = {
            clientId: 'TEST_CLIENT_001',
            direction: 'sent',
            messageType: 'SERVER_NOTIFICATION',
            messageId: Date.now(),
            content: 'Mensaje de prueba del sistema',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        await messagesCollection.insertOne(testMessage);
        console.log('   ✅ Mensaje de prueba insertado');

        // ============================================
        // Estadísticas finales
        // ============================================
        console.log('\n📊 Estadísticas de la base de datos:');
        const stats = await dbManager.getDatabaseStats();
        console.log(`   Clientes: ${stats.clients}`);
        console.log(`   Métricas: ${stats.metrics}`);
        console.log(`   Mensajes: ${stats.messages}`);
        console.log(`   Clientes conectados: ${stats.connectedClients}`);

        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ Inicialización completada exitosamente');
        console.log('═══════════════════════════════════════════════════\n');

        // Desconectar
        await dbManager.disconnect();

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error durante la inicialización:', error);
        await dbManager.disconnect();
        process.exit(1);
    }
}

// Ejecutar inicialización
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
