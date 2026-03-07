#!/usr/bin/env node

/**
 * Punto de Entrada del Cliente TCP
 * Inicializa el cliente y maneja el ciclo de vida
 */

const TCPClient = require('./client');
const logger = require('./logger');
const config = require('./config');

// Banner de inicio
function printBanner() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║           STORAGE CLUSTER - CLIENTE TCP                           ║
║           Nodo Regional de Monitoreo de Disco                     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
`);
  
  console.log(`Cliente ID: ${config.clientId}`);
  console.log(`Servidor: ${config.server.host}:${config.server.port}`);
  console.log(`Intervalo de métricas: ${config.intervals.metrics / 1000}s`);
  console.log(`Nivel de log: ${config.logging.level}`);
  console.log(`Ambiente: ${config.env}`);
  console.log('─'.repeat(71));
  console.log('');
}

// Crear instancia del cliente
let client;

/**
 * Inicia el cliente
 */
async function start() {
  try {
    printBanner();
    
    logger.info('🚀 Iniciando cliente TCP...', {
      clientId: config.clientId,
      server: `${config.server.host}:${config.server.port}`,
      environment: config.env
    });

    // Crear cliente
    client = new TCPClient();

    // Configurar event handlers
    setupEventHandlers();

    // Conectar al servidor
    await client.connect();

    logger.info('✅ Cliente iniciado correctamente');

  } catch (error) {
    logger.error('❌ Error al iniciar cliente', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Configura los manejadores de eventos del cliente
 */
function setupEventHandlers() {
  // Conexión establecida
  client.on('connected', () => {
    logger.info('✅ Conectado al servidor');
    console.log('✅ Estado: CONECTADO\n');
  });

  // Desconexión
  client.on('disconnected', (hadError) => {
    logger.warn('⚠️  Desconectado del servidor', { hadError });
    console.log('⚠️  Estado: DESCONECTADO\n');
  });

  // Error
  client.on('error', (error) => {
    // Solo log en modo debug para errores de reconexión
    if (error.code !== 'ECONNREFUSED') {
      logger.error('Error en cliente', {
        error: error.message,
        code: error.code
      });
    }
  });

  // Máximo de intentos de reconexión alcanzado
  client.on('max_reconnect_attempts', () => {
    logger.error('❌ No se pudo establecer conexión después de múltiples intentos');
    console.log('\n❌ Error: No se pudo conectar al servidor');
    console.log('Verifica que el servidor esté corriendo en:');
    console.log(`  ${config.server.host}:${config.server.port}\n`);
    
    // Esperar un momento antes de salir para que se escriban los logs
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

/**
 * Maneja el cierre graceful del cliente
 */
async function shutdown(signal) {
  logger.info(`\n📴 Señal ${signal} recibida, cerrando cliente...`);
  console.log(`\n📴 Cerrando cliente (${signal})...`);

  try {
    if (client) {
      await client.disconnect();
    }

    logger.info('✅ Cliente cerrado correctamente');
    console.log('✅ Cliente cerrado correctamente\n');

    // Dar tiempo para que se escriban los logs
    setTimeout(() => {
      process.exit(0);
    }, 500);

  } catch (error) {
    logger.error('Error al cerrar cliente', {
      error: error.message
    });
    process.exit(1);
  }
}

/**
 * Maneja errores no capturados
 */
function setupErrorHandlers() {
  // Errores no capturados
  process.on('uncaughtException', (error) => {
    logger.error('❌ Excepción no capturada', {
      error: error.message,
      stack: error.stack
    });
    console.error('\n❌ Error crítico:', error.message);
    
    // Intentar cerrar limpiamente
    if (client) {
      client.disconnect().finally(() => {
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });

  // Promesas rechazadas no manejadas
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Promise rechazada no manejada', {
      reason: reason,
      promise: promise
    });
    console.error('\n❌ Promise rechazada:', reason);
  });

  // Señales de sistema
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Windows-specific
  if (process.platform === 'win32') {
    process.on('SIGBREAK', () => shutdown('SIGBREAK'));
  }
}

/**
 * Muestra el estado del cliente periódicamente (solo en modo debug)
 */
function startStatusMonitor() {
  if (config.logging.level === 'debug') {
    setInterval(() => {
      if (client) {
        const status = client.getStatus();
        logger.debug('Estado del cliente', status);
      }
    }, 60000); // Cada minuto
  }
}

// Configurar manejadores de errores
setupErrorHandlers();

// Iniciar cliente
start().then(() => {
  // Iniciar monitor de estado si está en modo debug
  startStatusMonitor();
});

// Exportar para testing
module.exports = { start, shutdown };
