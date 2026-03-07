/**
 * Cliente TCP con Reconexión Automática
 * Maneja conexión TCP, envío de métricas, recepción de mensajes y ACKs
 */

const net = require('net');
const EventEmitter = require('events');
const logger = require('./logger');
const config = require('./config');
const MetricsCollector = require('./metricsCollector');
const MessageHandler = require('./messageHandler');

class TCPClient extends EventEmitter {
  constructor() {
    super();
    
    this.clientId = config.clientId;
    this.socket = null;
    this.connected = false;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.metricsInterval = null;
    this.reconnectTimeout = null;
    
    // Componentes
    this.metricsCollector = new MetricsCollector();
    this.messageHandler = new MessageHandler(this.clientId);
    
    // Estado
    this.registrationSent = false;
    this.lastMetricsSent = null;
  }

  /**
   * Inicia la conexión al servidor
   */
  async connect() {
    if (this.connected || this.reconnecting) {
      logger.warn('Ya existe una conexión activa o en proceso');
      return;
    }

    this.reconnecting = true;

    try {
      logger.info(`🔌 Conectando a ${config.server.host}:${config.server.port}...`);

      // Crear socket TCP
      this.socket = new net.Socket();
      this.socket.setEncoding('utf8');

      // Configurar eventos del socket
      this.setupSocketEvents();

      // Conectar al servidor
      this.socket.connect(config.server.port, config.server.host);

    } catch (error) {
      logger.error('Error al iniciar conexión', {
        error: error.message,
        stack: error.stack
      });
      this.scheduleReconnect();
    }
  }

  /**
   * Configura los event handlers del socket
   */
  setupSocketEvents() {
    // Conexión establecida
    this.socket.on('connect', () => {
      this.onConnect();
    });

    // Datos recibidos
    this.socket.on('data', (data) => {
      this.onData(data);
    });

    // Conexión cerrada
    this.socket.on('close', (hadError) => {
      this.onClose(hadError);
    });

    // Error en socket
    this.socket.on('error', (error) => {
      this.onError(error);
    });

    // Timeout
    this.socket.on('timeout', () => {
      logger.warn('Timeout en socket');
      this.socket.end();
    });
  }

  /**
   * Handler: Conexión establecida
   */
  async onConnect() {
    this.connected = true;
    this.reconnecting = false;
    this.reconnectAttempts = 0;
    this.messageHandler.clearBuffer();

    logger.logConnection('connected', {
      host: config.server.host,
      port: config.server.port
    });

    // Emitir evento
    this.emit('connected');

    // Enviar registro inicial
    await this.sendRegistration();

    // Iniciar envío periódico de métricas
    this.startMetricsReporting();

    // Mostrar info del disco
    const diskInfo = await this.metricsCollector.getDiskInfo();
    if (diskInfo) {
      logger.info('💾 Información del disco monitoreado:', diskInfo);
    }
  }

  /**
   * Handler: Datos recibidos del servidor
   */
  onData(data) {
    try {
      // Procesar datos recibidos
      const messages = this.messageHandler.processIncomingData(data);

      // Manejar cada mensaje
      for (const message of messages) {
        logger.debug('Mensaje recibido', { messageType: message.message_type });

        // Procesar mensaje y obtener respuesta (ACK)
        const response = this.messageHandler.handleMessage(message);

        // Enviar respuesta si existe
        if (response) {
          this.sendMessage(response);
        }
      }

    } catch (error) {
      logger.error('Error al procesar datos recibidos', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handler: Conexión cerrada
   */
  onClose(hadError) {
    const wasConnected = this.connected;
    this.connected = false;
    this.registrationSent = false;

    // Detener envío de métricas
    this.stopMetricsReporting();

    if (hadError) {
      logger.logConnection('closed_with_error');
    } else {
      logger.logConnection('closed');
    }

    // Emitir evento
    this.emit('disconnected', hadError);

    // Intentar reconectar si estaba conectado previamente
    if (wasConnected) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handler: Error en socket
   */
  onError(error) {
    // Evitar logging de errores de reconexión comunes
    if (error.code === 'ECONNREFUSED') {
      logger.debug('Conexión rechazada, reintentando...', {
        code: error.code,
        attempt: this.reconnectAttempts + 1
      });
    } else if (error.code === 'ETIMEDOUT') {
      logger.warn('Timeout de conexión', { code: error.code });
    } else {
      logger.error('Error en socket', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
    }

    this.emit('error', error);
  }

  /**
   * Envía el mensaje de registro inicial
   */
  async sendRegistration() {
    try {
      if (this.registrationSent) {
        return;
      }

      const registerMessage = this.messageHandler.createRegisterMessage();
      await this.sendMessage(registerMessage);

      this.registrationSent = true;
      logger.info('✅ Mensaje de registro enviado', {
        clientId: this.clientId
      });

    } catch (error) {
      logger.error('Error al enviar registro', {
        error: error.message
      });
    }
  }

  /**
   * Inicia el envío periódico de métricas
   */
  startMetricsReporting() {
    // Limpiar interval anterior si existe
    this.stopMetricsReporting();

    logger.info(`📊 Iniciando reporte de métricas cada ${config.intervals.metrics / 1000}s`);

    // Enviar métricas inmediatamente
    this.sendMetrics();

    // Programar envío periódico
    this.metricsInterval = setInterval(() => {
      this.sendMetrics();
    }, config.intervals.metrics);
  }

  /**
   * Detiene el envío periódico de métricas
   */
  stopMetricsReporting() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
      logger.debug('Reporte de métricas detenido');
    }
  }

  /**
   * Recolecta y envía métricas al servidor
   */
  async sendMetrics() {
    if (!this.connected) {
      logger.debug('No conectado, saltando envío de métricas');
      return;
    }

    try {
      // Recolectar métricas del disco
      const metrics = await this.metricsCollector.collectDiskMetrics();

      // Crear mensaje de métricas
      const metricsMessage = this.messageHandler.createMetricsReport(metrics);

      // Enviar al servidor
      await this.sendMessage(metricsMessage);

      this.lastMetricsSent = Date.now();

      // Log detallado en modo debug
      if (config.logging.level === 'debug') {
        const formatted = this.metricsCollector.formatMetricsForDisplay(metrics);
        logger.debug('📈 Métricas enviadas:', formatted);
      } else {
        logger.info('📈 Métricas enviadas', {
          utilization: metrics.utilization_percent.toFixed(2) + '%',
          growthRate: metrics.growth_rate.toFixed(2) + ' MB/h'
        });
      }

    } catch (error) {
      logger.error('Error al enviar métricas', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Envía un mensaje al servidor
   * @param {Object} message - Mensaje a enviar
   * @returns {Promise<boolean>}
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.socket) {
        reject(new Error('No hay conexión activa'));
        return;
      }

      try {
        const serialized = this.messageHandler.serializeMessage(message);
        
        this.socket.write(serialized, (error) => {
          if (error) {
            logger.error('Error al enviar mensaje', {
              error: error.message,
              messageType: message.message_type
            });
            reject(error);
          } else {
            logger.debug('Mensaje enviado', {
              type: message.message_type,
              size: serialized.length
            });
            resolve(true);
          }
        });

      } catch (error) {
        logger.error('Error al serializar mensaje', {
          error: error.message,
          message
        });
        reject(error);
      }
    });
  }

  /**
   * Programa un intento de reconexión
   */
  scheduleReconnect() {
    // Verificar si hay límite de intentos
    if (config.reconnect.maxAttempts > 0 && 
        this.reconnectAttempts >= config.reconnect.maxAttempts) {
      logger.error('❌ Máximo de intentos de reconexión alcanzado', {
        attempts: this.reconnectAttempts,
        maxAttempts: config.reconnect.maxAttempts
      });
      this.emit('max_reconnect_attempts');
      return;
    }

    this.reconnectAttempts++;

    // Backoff exponencial (máximo 60 segundos)
    const delay = Math.min(
      config.intervals.reconnect * Math.pow(1.5, this.reconnectAttempts - 1),
      60000
    );

    logger.info(`🔄 Reconectando en ${(delay / 1000).toFixed(1)}s (intento ${this.reconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Desconecta del servidor de forma limpia
   */
  async disconnect() {
    logger.info('Cerrando conexión...');

    // Detener métricas
    this.stopMetricsReporting();

    // Cancelar reconexión pendiente
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Cerrar socket
    if (this.socket) {
      this.socket.end();
      this.socket.destroy();
      this.socket = null;
    }

    this.connected = false;
    this.reconnecting = false;

    logger.info('✅ Desconectado');
  }

  /**
   * Obtiene el estado actual del cliente
   */
  getStatus() {
    return {
      clientId: this.clientId,
      connected: this.connected,
      reconnecting: this.reconnecting,
      reconnectAttempts: this.reconnectAttempts,
      registrationSent: this.registrationSent,
      lastMetricsSent: this.lastMetricsSent,
      server: {
        host: config.server.host,
        port: config.server.port
      }
    };
  }
}

module.exports = TCPClient;
