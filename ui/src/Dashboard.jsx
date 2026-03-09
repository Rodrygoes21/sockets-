import { useState, useEffect } from 'react'

function Dashboard() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setClients(data.data || [])
      setLastUpdate(new Date().toLocaleTimeString())
      setError(null)
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch inicial
    fetchClients()

    // Actualizar cada 5 segundos
    const interval = setInterval(() => {
      fetchClients()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status) => {
    const classes = {
      'connected': 'status-badge status-connected',
      'disconnected': 'status-badge status-disconnected',
      'error': 'status-badge status-error'
    }
    return classes[status] || 'status-badge'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatMetric = (value, unit = '') => {
    if (value === undefined || value === null) return 'N/A'
    return `${value.toFixed(2)}${unit}`
  }

  if (loading && clients.length === 0) {
    return (
      <div className="dashboard loading">
        <div className="spinner"></div>
        <p>Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Clientes Conectados</h2>
        <div className="dashboard-info">
          <span className="client-count">
            Total: <strong>{clients.length}</strong>
          </span>
          {lastUpdate && (
            <span className="last-update">
              Última actualización: {lastUpdate}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ Error al cargar datos: {error}
        </div>
      )}

      {clients.length === 0 ? (
        <div className="empty-state">
          <p>No hay clientes conectados</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>ID Cliente</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>CPU (%)</th>
                <th>Memoria (%)</th>
                <th>Disco (%)</th>
                <th>Uptime (hrs)</th>
                <th>Última Conexión</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.clientId}>
                  <td className="client-id">
                    <code>{client.clientId}</code>
                  </td>
                  <td className="client-name">{client.name || 'Sin nombre'}</td>
                  <td>
                    <span className={getStatusBadge(client.status)}>
                      {client.status || 'unknown'}
                    </span>
                  </td>
                  <td className="metric">
                    {client.lastMetrics?.cpu !== undefined
                      ? formatMetric(client.lastMetrics.cpu, '%')
                      : 'N/A'}
                  </td>
                  <td className="metric">
                    {client.lastMetrics?.memory !== undefined
                      ? formatMetric(client.lastMetrics.memory, '%')
                      : 'N/A'}
                  </td>
                  <td className="metric">
                    {client.lastMetrics?.disk !== undefined
                      ? formatMetric(client.lastMetrics.disk, '%')
                      : 'N/A'}
                  </td>
                  <td className="metric">
                    {client.lastMetrics?.uptime !== undefined
                      ? formatMetric(client.lastMetrics.uptime / 3600, ' hrs')
                      : 'N/A'}
                  </td>
                  <td className="timestamp">{formatDate(client.lastConnection)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Dashboard
