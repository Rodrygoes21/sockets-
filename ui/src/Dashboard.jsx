import { useState, useEffect } from 'react'
import './Dashboard.css'

function Dashboard() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setClients(Array.isArray(data) ? data : [])
        setError(null)
        setLastUpdate(new Date())
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    // Fetch inicial
    fetchClients()

    // Fetch cada 5 segundos
    const interval = setInterval(fetchClients, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'activo':
        return '#27ae60'
      case 'disconnected':
      case 'inactivo':
        return '#e74c3c'
      case 'idle':
      case 'reposo':
        return '#f39c12'
      default:
        return '#95a5a6'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES')
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h2>Clientes Conectados</h2>
          <p className="client-count">{clients.length} clientes activos</p>
        </div>
        <div className="header-meta">
          <p className="last-update">
            Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && clients.length === 0 ? (
        <div className="loading-message">
          <p>Cargando clientes...</p>
        </div>
      ) : (
        <div className="table-container">
          {clients.length > 0 ? (
            <table className="clients-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Última Métrica</th>
                  <th>Última Actualización</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr key={client.id || index} className="table-row">
                    <td className="cell-id">
                      <code>{client.id}</code>
                    </td>
                    <td className="cell-name">{client.name || 'Sin nombre'}</td>
                    <td className="cell-status">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(client.status) }}
                      >
                        {client.status || 'desconocido'}
                      </span>
                    </td>
                    <td className="cell-metric">
                      {client.lastMetric ? (
                        <span className="metric-value">
                          {typeof client.lastMetric === 'object'
                            ? JSON.stringify(client.lastMetric)
                            : client.lastMetric}
                        </span>
                      ) : (
                        <span className="metric-empty">-</span>
                      )}
                    </td>
                    <td className="cell-timestamp">
                      {formatDate(client.lastUpdate || client.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-message">
              <p>No hay clientes conectados en este momento</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
