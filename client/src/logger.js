/**
 * Configuración de Winston Logger
 * Maneja logging a consola y archivos con rotación
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Asegurar que existe el directorio de logs
const logsDir = path.dirname(config.logging.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Formato personalizado para consola
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return msg;
  })
);

// Formato para archivos (JSON estructurado)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Crear logger principal
const logger = winston.createLogger({
  level: config.logging.level,
  format: fileFormat,
  defaultMeta: { clientId: config.clientId },
  transports: [
    // Consola
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Archivo principal (todos los logs)
    new winston.transports.File({
      filename: config.logging.logFile,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Archivo de errores
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 3
    })
  ]
});

// Logger especializado para mensajes del servidor
const messagesLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, message, ...meta }) => {
      // Formato legible para mensajes del servidor
      let log = `\n${'='.repeat(80)}\n`;
      log += `[${timestamp}] MENSAJE DEL SERVIDOR\n`;
      log += `${'='.repeat(80)}\n`;
      
      if (meta.messageId) {
        log += `Message ID: ${meta.messageId}\n`;
      }
      
      log += `Contenido: ${message}\n`;
      
      if (meta.status) {
        log += `Estado: ${meta.status}\n`;
      }
      
      log += `${'='.repeat(80)}\n`;
      
      return log;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: config.logging.messagesLogFile,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 10
    })
  ]
});

// Método helper para logging de eventos importantes
logger.logEvent = (event, data = {}) => {
  logger.info(`[EVENT] ${event}`, data);
};

// Método helper para logging de métricas
logger.logMetrics = (metrics) => {
  logger.debug('[METRICS]', metrics);
};

// Método helper para logging de conexión
logger.logConnection = (status, data = {}) => {
  const level = status === 'connected' ? 'info' : 'warn';
  logger.log(level, `[CONNECTION] ${status.toUpperCase()}`, data);
};

// Método helper para mensajes del servidor
logger.logServerMessage = (messageId, content, status = 'RECEIVED') => {
  messagesLogger.info(content, { messageId, status });
  logger.info(`Mensaje del servidor recibido: ${messageId}`);
};

// Manejar errores del logger
logger.on('error', (error) => {
  console.error('Error en el logger:', error);
});

messagesLogger.on('error', (error) => {
  console.error('Error en el logger de mensajes:', error);
});

module.exports = logger;
