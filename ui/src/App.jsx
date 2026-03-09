import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import MetricsChart from './MetricsChart'
import MessageForm from './MessageForm'
import GlobalMetrics from './GlobalMetrics'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🗄️ Storage Cluster Dashboard</h1>
        <p>Monitoreo en tiempo real de clientes conectados</p>
      </header>
      <main className="app-main">
        <GlobalMetrics />
        <MetricsChart />
        <MessageForm />
        <Dashboard />
      </main>
      <footer className="app-footer">
        <p>Sistema de Almacenamiento Distribuido | UNIVALLE 2026</p>
      </footer>
    </div>
  )
}

export default App
