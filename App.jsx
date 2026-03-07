import Dashboard from './Dashboard'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>🖥️ Storage Cluster Monitor</h1>
        <p>Sistema de Monitoreo Distribuido</p>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  )
}

export default App