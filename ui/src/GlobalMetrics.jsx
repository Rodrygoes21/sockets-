import { useState, useEffect } from 'react'

function GlobalMetrics() {
  const [globalData, setGlobalData] = useState(null)
  const [growthRate, setGrowthRate] = useState(null)
  const [availability, setAvailability] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGlobalMetrics = async () => {
    try {
      // Fetch todas las métricas en paralelo
      const [globalRes, growthRes, availRes] = await Promise.all([
        fetch('/api/metrics/global'),
        fetch('/api/metrics/growth-rate'),
        fetch('/api/metrics/availability?hours=24')
      ])

      if (!globalRes.ok || !growthRes.ok || !availRes.ok) {
        throw new Error('Error al obtener métricas globales')
      }

      const globalData = await globalRes.json()
      const growthData = await growthRes.json()
      const availData = await availRes.json()

      setGlobalData(globalData.data)
      setGrowthRate(growthData.data)
      setAvailability(availData.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching global metrics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch inicial
    fetchGlobalMetrics()

    // Actualizar cada 10 segundos
    const interval = setInterval(() => {
      fetchGlobalMetrics()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="global-metrics loading">
        <div className="spinner"></div>
        <p>Cargando métricas globales...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="global-metrics error">
        <p className="error-message">⚠️ Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="global-metrics">
      <div className="metrics-header">
        <h2>📊 Métricas Globales del Cluster</h2>
        <p className="metrics-subtitle">Agregación en tiempo real de todos los clientes activos</p>
      </div>

      <div className="metrics-grid">
        {/* Capacidad Total */}
        <div className="metric-card capacity">
          <div className="metric-icon">💾</div>
          <div className="metric-content">
            <h3>Capacidad Total</h3>
            <div className="metric-value">
              {globalData?.totalCapacityGB || 0}
              <span className="metric-unit">GB</span>
            </div>
            <div className="metric-subtitle">
              {globalData?.activeClientsCount || 0} clientes activos
            </div>
          </div>
        </div>

        {/* Espacio Usado */}
        <div className="metric-card used">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Espacio Usado</h3>
            <div className="metric-value">
              {globalData?.usedCapacityGB || 0}
              <span className="metric-unit">GB</span>
            </div>
            <div className="metric-subtitle">
              {globalData?.utilizationPercent || 0}% utilización
            </div>
          </div>
        </div>

        {/* Espacio Libre */}
        <div className="metric-card free">
          <div className="metric-icon">📉</div>
          <div className="metric-content">
            <h3>Espacio Libre</h3>
            <div className="metric-value">
              {globalData?.freeCapacityGB || 0}
              <span className="metric-unit">GB</span>
            </div>
            <div className="metric-subtitle">
              {(100 - parseFloat(globalData?.utilizationPercent || 0)).toFixed(2)}% disponible
            </div>
          </div>
        </div>

        {/* Tasa de Crecimiento */}
        <div className="metric-card growth">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Tasa de Crecimiento</h3>
            <div className="metric-value">
              {growthRate?.growthRateMBPerHour || 0}
              <span className="metric-unit">MB/h</span>
            </div>
            <div className="metric-subtitle">
              {growthRate?.growthRateGBPerDay || 0} GB/día
            </div>
          </div>
        </div>

        {/* Disponibilidad (Availability) */}
        <div className={`metric-card availability ${availability?.meetsRequirement ? 'meets-requirement' : 'below-requirement'}`}>
          <div className="metric-icon">
            {availability?.meetsRequirement ? '✅' : '⚠️'}
          </div>
          <div className="metric-content">
            <h3>Disponibilidad</h3>
            <div className="metric-value">
              {availability?.availabilityPercent || 0}
              <span className="metric-unit">%</span>
            </div>
            <div className="metric-subtitle">
              {availability?.meetsRequirement 
                ? 'Cumple requisito ≥99.9%' 
                : 'Por debajo de 99.9%'}
            </div>
          </div>
        </div>

        {/* Uptime Promedio */}
        <div className="metric-card uptime">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <h3>Uptime Promedio</h3>
            <div className="metric-value">
              {availability?.averageUptimeHours || 0}
              <span className="metric-unit">h</span>
            </div>
            <div className="metric-subtitle">
              Últimas {availability?.periodAnalyzedHours || 24} horas
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Utilización Visual */}
      <div className="utilization-bar-container">
        <h3>Utilización del Cluster</h3>
        <div className="utilization-bar">
          <div 
            className="utilization-fill"
            style={{ width: `${globalData?.utilizationPercent || 0}%` }}
          >
            <span className="utilization-text">
              {globalData?.utilizationPercent || 0}%
            </span>
          </div>
        </div>
        <div className="utilization-legend">
          <span className="legend-item">
            <span className="legend-color used"></span>
            Usado: {globalData?.usedCapacityGB || 0} GB
          </span>
          <span className="legend-item">
            <span className="legend-color free"></span>
            Libre: {globalData?.freeCapacityGB || 0} GB
          </span>
        </div>
      </div>
    </div>
  )
}

export default GlobalMetrics
