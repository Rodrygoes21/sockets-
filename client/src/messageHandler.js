/**
 * Manejador de Mensajes del Servidor
 * Procesa mensajes entrantes y genera ACKs
 */

const logger = require('./logger');
const config = require('./config');

class MessageHandler {
  constructor(clientId) {
    this.clientId = clientId;
    this.messageBuffer = '';
  }

  /**
   * Procesa datos recibidos del servidor
   * Los mensajes vienen como JSON separados por líneas
   * @param {Buffer} data - Datos recibidos
   * @returns {Array<Object>} Array de mensajes parseados
   */
  processIncomingData(data) {
    try {
      // Agregar al buffer
      this.messageBuffer += data.toString();

      // Separar mensajes por líneas
      const lines = this.messageBuffer.split('\n');
      
      // Guardar la última línea incompleta en el buffer
      this.messageBuffer = lines.pop() || '';

      // Parsear y procesar cada mensaje completo
      const messages = [];
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            messages.push(message);
          } catch (parseError) {
            logger.warn('Error al parsear mensaje', {
              error: parseError.message,
              line: line.substring(0, 100) // Primeros 100 caracteres
            });
          }
        }
      }

      return messages;

    } catch (error) {
      logger.error('Error al procesar datos entrantes', {
        error: error.message,
        bufferLength: this.messageBuffer.length
      });
      return [];
    }
  }

  /**
   * Maneja un mensaje del servidor
   * @param {Object} message - Mensaje parseado
   * @returns {Object|null} ACK a enviar o null
   */
  handleMessage(message) {
    try {
      logger.debug('Procesando mensaje', { message });

      switch (message.message_type) {
        case 'SERVER_NOTIFICATION':
          return this.handleServerNotification(message);
        
        case 'SERVER_COMMAND':
          return this.handleServerCommand(message);
        
        case 'PING':
          return this.handlePing(message);
        
        default:
          logger.warn('Tipo de mensaje desconocido', {
            messageType: message.message_type,
            messageId: message.message_id
          });
          
          // Enviar ACK genérico de todas formas
          return this.createAck(message.message_id, 'RECEIVED');
      }

    } catch (error) {
      logger.error('Error al manejar mensaje', {
        error: error.message,
        message
      });
      return null;
    }
  }

  /**
   * Maneja notificaciones del servidor
   * @param {Object} message
   * @returns {Object} ACK
   */
  handleServerNotification(message) {
    const { message_id, content, timestamp } = message;

    // Guardar en log de mensajes
    logger.logServerMessage(message_id, content, 'RECEIVED');

    logger.info('📨 Notificación del servidor recibida', {
      messageId: message_id,
      content: content.substring(0, 100), // Primeros 100 chars
      timestamp
    });

    // Crear y enviar ACK
    return this.createAck(message_id, 'RECEIVED');
  }

  /**
   * Maneja comandos del servidor
   * @param {Object} message
   * @returns {Object} ACK
   */
  handleServerCommand(message) {
    const { message_id, command, params } = message;

    logger.info('⚡ Comando del servidor recibido', {
      messageId: message_id,
      command,
      params
    });

    // Aquí se pueden implementar comandos específicos
    // Por ahora solo registramos y enviamos ACK
    logger.logServerMessage(
      message_id, 
      `COMANDO: ${command}${params ? ' - Params: ' + JSON.stringify(params) : ''}`,
      'RECEIVED'
    );

    let status = 'RECEIVED';

    // Procesar comandos conocidos
    switch (command) {
      case 'STOP_METRICS':
        logger.warn('Comando STOP_METRICS recibido');
        status = 'EXECUTED';
        break;
      
      case 'START_METRICS':
        logger.info('Comando START_METRICS recibido');
        status = 'EXECUTED';
        break;
      
      case 'SHUTDOWN':
        logger.warn('Comando SHUTDOWN recibido');
        status = 'EXECUTED';
        // Aquí podríamos emitir un evento para shutdown graceful
        break;
      
      default:
        logger.warn(`Comando desconocido: ${command}`);
        status = 'RECEIVED';
    }

    return this.createAck(message_id, status);
  }

  /**
   * Maneja mensajes PING del servidor
   * @param {Object} message
   * @returns {Object} PONG response
   */
  handlePing(message) {
    logger.debug('PING recibido, enviando PONG');
    
    return {
      message_type: 'PONG',
      client_id: this.clientId,
      timestamp: new Date().toISOString(),
      ping_timestamp: message.timestamp
    };
  }

  /**
   * Crea un mensaje ACK
   * @param {string} messageId - ID del mensaje original
   * @param {string} status - Estado (RECEIVED, EXECUTED, ERROR)
   * @returns {Object} Mensaje ACK
   */
  createAck(messageId, status = 'RECEIVED') {
    return {
      message_type: 'ACK',
      client_id: this.clientId,
      message_id: messageId,
      timestamp: new Date().toISOString(),
      status: status
    };
  }

  /**
   * Crea un mensaje de registro inicial
   * @returns {Object} Mensaje de registro
   */
  createRegisterMessage() {
    return {
      message_type: 'CLIENT_REGISTER',
      client_id: this.clientId,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crea un mensaje de reporte de métricas
   * @param {Object} metrics - Métricas del disco
   * @returns {Object} Mensaje de métricas
   */
  createMetricsReport(metrics) {
    return {
      message_type: 'METRICS_REPORT',
      client_id: this.clientId,
      timestamp: new Date().toISOString(),
      metrics: {
        total_capacity: metrics.total_capacity,
        used_capacity: metrics.used_capacity,
        free_capacity: metrics.free_capacity,
        utilization_percent: metrics.utilization_percent,
        growth_rate: metrics.growth_rate
      }
    };
  }

  /**
   * Serializa un mensaje a JSON + newline para envío
   * @param {Object} message
   * @returns {string}
   */
  serializeMessage(message) {
    return JSON.stringify(message) + '\n';
  }

  /**
   * Limpia el buffer de mensajes (útil al reconectar)
   */
  clearBuffer() {
    this.messageBuffer = '';
    logger.debug('Buffer de mensajes limpiado');
  }
}

module.exports = MessageHandler;
