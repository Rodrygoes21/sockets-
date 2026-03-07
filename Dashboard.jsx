import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchClients = async () => {
    try {
      // Asumimos que el servidor corre en el puerto 5000 (configurado en vite.config.js o directo)
      const response = await fetch('/api/clients');
      
      if (!response.ok) {
        throw new Error('Error al conectar con el servidor');
      }

      const data = await response.json();
      // Ordenar: Primero los conectados (UP), luego por ID
      const sortedData = data.sort((a, b) => {
        if (a.status === b.status) return a.client_id.localeCompare(b.client_id);
        return a.status === 'UP' ? -1 : 1;
      });

      setClients(sortedData);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("No se pudo conectar al servidor de monitoreo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(); // Primera carga inmediata
    const interval = setInterval(fetchClients, 5000); // Polling cada 5s

    return () => clearInterval(interval); // Cleanup al desmontar
  }, []);

  // Helper para formatear bytes a GB
  const formatBytes = (bytes) => {
    if (!bytes) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Estado del Cluster</h2>
        <span className="last-update">Actualizado: {lastUpdate || '...'}</span>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Cliente</th>
              <th>Dirección IP</th>
              <th>Estado</th>
              <th>Uso de Disco</th>
              <th>% Uso</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && !loading ? (
              <tr>
                <td colSpan="5" style={{textAlign: 'center'}}>No hay clientes conectados</td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.client_id} className={client.status === 'DOWN' ? 'row-down' : ''}>
                  <td className="font-bold">{client.client_id}</td>
                  <td>{client.ip_address}:{client.port}</td>
                  <td>
                    <span className={`status-badge ${client.status.toLowerCase()}`}>
                      {client.status}
                    </span>
                  </td>
                  <td>{formatBytes(client.used_capacity)} / {formatBytes(client.total_capacity)}</td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{
                          width: `${client.utilization_percent}%`,
                          backgroundColor: client.utilization_percent > 90 ? '#d73a4a' : '#1d76db'
                        }}
                      ></div>
                      <span className="progress-text">{client.utilization_percent}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;