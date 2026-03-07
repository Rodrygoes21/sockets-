/**
 * Recolector de Métricas de Disco
 * Utiliza systeminformation para obtener métricas del primer disco
 */

const si = require('systeminformation');
const logger = require('./logger');

class MetricsCollector {
  constructor() {
    this.lastUsedCapacity = null;
    this.lastTimestamp = null;
    this.growthRate = 0;
  }

  /**
   * Recolecta métricas del primer disco detectado
   * @returns {Promise<Object>} Objeto con las métricas del disco
   */
  async collectDiskMetrics() {
    try {
      // Obtener información de todos los discos
      const disks = await si.fsSize();
      
      if (!disks || disks.length === 0) {
        throw new Error('No se detectaron discos en el sistema');
      }

      // Tomar solo el PRIMER disco (según requerimientos)
      const firstDisk = disks[0];
      
      // Extraer métricas
      const metrics = {
        total_capacity: firstDisk.size,           // Bytes
        used_capacity: firstDisk.used,            // Bytes
        free_capacity: firstDisk.available,       // Bytes
        utilization_percent: firstDisk.use        // Porcentaje (0-100)
      };

      // Calcular Growth Rate (MB/hora)
      this.calculateGrowthRate(metrics.used_capacity);
      metrics.growth_rate = this.growthRate;

      // Información adicional del disco (para logging)
      const diskInfo = {
        filesystem: firstDisk.fs,
        mount: firstDisk.mount,
        type: firstDisk.type
      };

      logger.debug('Métricas recolectadas', {
        metrics,
        diskInfo,
        totalDisksDetected: disks.length,
        diskUsed: firstDisk.use + '%'
      });

      return metrics;

    } catch (error) {
      logger.error('Error al recolectar métricas de disco', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Calcula el Growth Rate en MB/hora
   * @param {number} currentUsed - Capacidad usada actual en bytes
   */
  calculateGrowthRate(currentUsed) {
    const now = Date.now();

    if (this.lastUsedCapacity !== null && this.lastTimestamp !== null) {
      // Diferencia de espacio usado en bytes
      const usedDiff = currentUsed - this.lastUsedCapacity;
      
      // Diferencia de tiempo en milisegundos
      const timeDiff = now - this.lastTimestamp;
      
      if (timeDiff > 0) {
        // Convertir a MB/hora
        // usedDiff está en bytes, timeDiff en ms
        // MB/hora = (bytes / 1024^2) / (ms / 3600000)
        const bytesToMB = usedDiff / (1024 * 1024);
        const msToHours = timeDiff / (1000 * 60 * 60);
        
        this.growthRate = msToHours > 0 ? bytesToMB / msToHours : 0;
        
        // Redondear a 2 decimales
        this.growthRate = Math.round(this.growthRate * 100) / 100;
      }
    } else {
      // Primera medición, growth rate = 0
      this.growthRate = 0;
    }

    // Actualizar valores para próximo cálculo
    this.lastUsedCapacity = currentUsed;
    this.lastTimestamp = now;
  }

  /**
   * Obtiene información detallada del primer disco (para debugging)
   * @returns {Promise<Object>}
   */
  async getDiskInfo() {
    try {
      const disks = await si.fsSize();
      
      if (!disks || disks.length === 0) {
        return null;
      }

      const firstDisk = disks[0];
      
      return {
        filesystem: firstDisk.fs,
        mount: firstDisk.mount,
        type: firstDisk.type,
        size_gb: (firstDisk.size / (1024 ** 3)).toFixed(2),
        used_gb: (firstDisk.used / (1024 ** 3)).toFixed(2),
        available_gb: (firstDisk.available / (1024 ** 3)).toFixed(2),
        use_percent: firstDisk.use
      };
    } catch (error) {
      logger.error('Error al obtener información del disco', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Formatea las métricas para logging legible
   * @param {Object} metrics
   * @returns {Object}
   */
  formatMetricsForDisplay(metrics) {
    return {
      'Total Capacity': this.formatBytes(metrics.total_capacity),
      'Used Capacity': this.formatBytes(metrics.used_capacity),
      'Free Capacity': this.formatBytes(metrics.free_capacity),
      'Utilization': metrics.utilization_percent.toFixed(2) + '%',
      'Growth Rate': metrics.growth_rate.toFixed(2) + ' MB/hora'
    };
  }

  /**
   * Convierte bytes a formato legible (GB, MB, KB)
   * @param {number} bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes >= 1024 ** 3) {
      return (bytes / (1024 ** 3)).toFixed(2) + ' GB';
    } else if (bytes >= 1024 ** 2) {
      return (bytes / (1024 ** 2)).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    }
    return bytes + ' B';
  }

  /**
   * Reset del estado interno (útil para testing)
   */
  reset() {
    this.lastUsedCapacity = null;
    this.lastTimestamp = null;
    this.growthRate = 0;
  }
}

module.exports = MetricsCollector;
