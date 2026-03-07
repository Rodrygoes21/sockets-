import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import MetricsChart from './MetricsChart'
import MessageForm from './MessageForm'
import './App.css'

function App() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Verificar conexión al servidor
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/health', {
          signal: AbortSignal.timeout(2000)
        })
        setIsConnected(response.ok)
      } catch (error) {
        setIsConnected(false)
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Dashboard Clientes</h1>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </header>
      <main className="app-main">
        <Dashboard />
        <MetricsChart />
        <MessageForm />
      </main>
      <footer className="app-footer">
        <p>Sistema de Distribución de Sockets - Sprint 1</p>
      </footer>
    </div>
  )
}

export default App
