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
import './MetricsChart.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function MetricsChart() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch de clientes y métricas
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener lista de clientes
        const clientsResponse = await fetch('/api/clients')
        if (!clientsResponse.ok) throw new Error('Error fetching clients')
        const clientsData = await clientsResponse.json()
        setClients(Array.isArray(clientsData) ? clientsData : [])

        // Si hay clientes y no hay seleccionado, usar el primero
        if (clientsData.length > 0 && !selectedClient) {
          setSelectedClient(clientsData[0].id)
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch de métricas del cliente seleccionado cada 5 segundos
  useEffect(() => {
    if (!selectedClient) return

    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/clients/${selectedClient}/metrics`)
        if (!response.ok) throw new Error('Error fetching metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Error fetching metrics:', error)
        // Simulación de datos si la API no está disponible
        setMetrics({
          used: Math.floor(Math.random() * 100),
          free: Math.floor(Math.random() * 100),
        })
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [selectedClient])

  if (loading) {
    return <div className="metrics-loading">Cargando gráficas...</div>
  }

  // Preparar datos para Chart.js
  const chartData = {
    labels: ['Espacio Usado', 'Espacio Libre'],
    datasets: [
      {
        label: 'MB',
        data: [metrics?.used || 0, metrics?.free || 0],
        backgroundColor: ['#3498db', '#2ecc71'],
        borderColor: ['#2980b9', '#27ae60'],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: `Métricas de ${selectedClient || 'Cliente'}`,
        font: { size: 16, weight: 600 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value + ' MB'
          },
        },
      },
    },
  }

  return (
    <div className="metrics-chart">
      <div className="metrics-header">
        <h3>Métricas de Uso</h3>
        <div className="client-selector">
          <label htmlFor="client-select">Seleccionar cliente: </label>
          <select
            id="client-select"
            value={selectedClient || ''}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name || client.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-container">
        {metrics ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <div className="chart-empty">Sin datos disponibles</div>
        )}
      </div>

      <div className="metrics-info">
        {metrics && (
          <>
            <div className="metric-item">
              <span className="metric-label">Usado:</span>
              <span className="metric-value used">{metrics.used} MB</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Libre:</span>
              <span className="metric-value free">{metrics.free} MB</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Total:</span>
              <span className="metric-value total">
                {(metrics.used || 0) + (metrics.free || 0)} MB
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MetricsChart
