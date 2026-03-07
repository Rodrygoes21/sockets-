/**
 * Configuración del Cliente TCP
 * Valida y exporta configuración desde variables de entorno
 */

const Joi = require('joi');
require('dotenv').config();

// Schema de validación
const configSchema = Joi.object({
  CLIENT_ID: Joi.string().required()
    .description('ID único del cliente (ejemplo: CLIENT_001)'),
  
  SERVER_HOST: Joi.string().default('localhost')
    .description('Host del servidor TCP'),
  
  SERVER_PORT: Joi.number().integer().min(1).max(65535).default(5000)
    .description('Puerto del servidor TCP'),
  
  METRICS_INTERVAL: Joi.number().integer().min(5000).default(30000)
    .description('Intervalo de envío de métricas en milisegundos'),
  
  RECONNECT_INTERVAL: Joi.number().integer().min(1000).default(5000)
    .description('Intervalo de reconexión en milisegundos'),
  
  MAX_RECONNECT_ATTEMPTS: Joi.number().integer().min(-1).default(-1)
    .description('Máximo de intentos de reconexión (-1 = infinito)'),
  
  MESSAGE_TIMEOUT: Joi.number().integer().min(1000).default(30000)
    .description('Timeout para esperar ACK en milisegundos'),
  
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
    .description('Nivel de logging'),
  
  LOG_FILE: Joi.string().default('logs/client.log')
    .description('Archivo de log principal'),
  
  MESSAGES_LOG_FILE: Joi.string().default('logs/messages.log')
    .description('Archivo de log de mensajes recibidos'),
  
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development')
    .description('Ambiente de ejecución')
}).unknown(true); // Permite otras variables de entorno

// Cargar configuración desde env
const rawConfig = {
  CLIENT_ID: process.env.CLIENT_ID,
  SERVER_HOST: process.env.SERVER_HOST,
  SERVER_PORT: process.env.SERVER_PORT,
  METRICS_INTERVAL: process.env.METRICS_INTERVAL,
  RECONNECT_INTERVAL: process.env.RECONNECT_INTERVAL,
  MAX_RECONNECT_ATTEMPTS: process.env.MAX_RECONNECT_ATTEMPTS,
  MESSAGE_TIMEOUT: process.env.MESSAGE_TIMEOUT,
  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_FILE: process.env.LOG_FILE,
  MESSAGES_LOG_FILE: process.env.MESSAGES_LOG_FILE,
  NODE_ENV: process.env.NODE_ENV
};

// Validar configuración
const { error, value: config } = configSchema.validate(rawConfig, {
  abortEarly: false,
  stripUnknown: true
});

if (error) {
  console.error('❌ Error de configuración:');
  error.details.forEach(detail => {
    console.error(`  - ${detail.message}`);
  });
  process.exit(1);
}

// Exportar configuración validada
module.exports = {
  clientId: config.CLIENT_ID,
  server: {
    host: config.SERVER_HOST,
    port: config.SERVER_PORT
  },
  intervals: {
    metrics: config.METRICS_INTERVAL,
    reconnect: config.RECONNECT_INTERVAL
  },
  reconnect: {
    maxAttempts: config.MAX_RECONNECT_ATTEMPTS
  },
  timeouts: {
    message: config.MESSAGE_TIMEOUT
  },
  logging: {
    level: config.LOG_LEVEL,
    logFile: config.LOG_FILE,
    messagesLogFile: config.MESSAGES_LOG_FILE
  },
  env: config.NODE_ENV,
  
  // Helper para verificar si estamos en producción
  isProduction: () => config.NODE_ENV === 'production',
  isDevelopment: () => config.NODE_ENV === 'development',
  isTest: () => config.NODE_ENV === 'test'
};
