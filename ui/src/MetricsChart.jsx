import { useState, useEffect } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

function MetricsChart() {
  const [clients, setClients] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Obtener lista de clientes disponibles
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const clientsList = data.data || []
      setClients(clientsList)
      
      // Seleccionar el primer cliente conectado automáticamente
      if (clientsList.length > 0 && !selectedClientId) {
        const connectedClient = clientsList.find(c => c.status === 'connected')
        setSelectedClientId(connectedClient?.clientId || clientsList[0].clientId)
      }
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err.message)
    }
  }

  // Obtener métricas del cliente seleccionado
  const fetchMetrics = async () => {
    if (!selectedClientId) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/metrics/${selectedClientId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMetrics(data.data)
      setLastUpdate(new Date().toLocaleTimeString())
      setError(null)
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch inicial
  useEffect(() => {
    fetchClients()
  }, [])

  // Fetch métricas cuando cambia el cliente seleccionado
  useEffect(() => {
    if (selectedClientId) {
      fetchMetrics()
    }
  }, [selectedClientId])

  // Auto-actualización cada 5 segundos
  useEffect(() => {
    if (!selectedClientId) return

    const interval = setInterval(() => {
      fetchMetrics()
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedClientId])

  const handleClientChange = (event) => {
    setSelectedClientId(event.target.value)
    setLoading(true)
  }

  // Preparar datos para la gráfica
  const getChartData = () => {
    if (!metrics || !metrics.disk) {
      return null
    }

    const diskUsed = metrics.disk
    const diskFree = 100 - diskUsed

    return {
      labels: ['Espacio en Disco'],
      datasets: [
        {
          label: 'Usado (%)',
          data: [diskUsed],
          backgroundColor: 'rgba(239, 68, 68, 0.7)', // Rojo
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
        },
        {
          label: 'Libre (%)',
          data: [diskFree],
          backgroundColor: 'rgba(16, 185, 129, 0.7)', // Verde
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
      title: {
        display: true,
        text: 'Uso de Disco - Espacio Usado vs Disponible',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + '%'
          },
        },
        title: {
          display: true,
          text: 'Porcentaje (%)',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
    },
  }

  const chartData = getChartData()

  if (loading && !metrics) {
    return (
      <div className="metrics-chart loading">
        <div className="spinner"></div>
        <p>Cargando métricas...</p>
      </div>
    )
  }

  return (
    <div className="metrics-chart">
      <div className="metrics-chart-header">
        <h2>📊 Métricas de Almacenamiento</h2>
        
        <div className="client-selector">
          <label htmlFor="client-select">Seleccionar Cliente:</label>
          <select
            id="client-select"
            value={selectedClientId}
            onChange={handleClientChange}
            disabled={clients.length === 0}
          >
            {clients.length === 0 ? (
              <option value="">No hay clientes disponibles</option>
            ) : (
              clients.map((client) => (
                <option key={client.clientId} value={client.clientId}>
                  {client.name || client.clientId} - {client.status}
                </option>
              ))
            )}
          </select>
        </div>

        {lastUpdate && (
          <span className="last-update">
            Última actualización: {lastUpdate}
          </span>
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ Error al cargar métricas: {error}
        </div>
      )}

      {!selectedClientId ? (
        <div className="empty-state">
          <p>Selecciona un cliente para ver sus métricas</p>
        </div>
      ) : !chartData ? (
        <div className="empty-state">
          <p>No hay métricas disponibles para este cliente</p>
        </div>
      ) : (
        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
          
          {metrics && (
            <div className="metrics-summary">
              <h3>Resumen de Métricas</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">CPU</span>
                  <span className="metric-value">{metrics.cpu?.toFixed(2)}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Memoria</span>
                  <span className="metric-value">{metrics.memory?.toFixed(2)}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Disco Usado</span>
                  <span className="metric-value disk-used">{metrics.disk?.toFixed(2)}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Uptime</span>
                  <span className="metric-value">
                    {(metrics.uptime / 3600).toFixed(2)} hrs
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MetricsChart
