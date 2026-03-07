import { useState, useEffect } from 'react'
import './MessageForm.css'

function MessageForm() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null)

  // Cargar lista de clientes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients')
        if (!response.ok) throw new Error('Error fetching clients')
        const data = await response.json()
        setClients(Array.isArray(data) ? data : [])
        if (data.length > 0) {
          setSelectedClient(data[0].id)
        }
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }

    fetchClients()
  }, [])

  // Limpiar feedback después de 4 segundos
  useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timeout)
  }, [feedback])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validación básica
    if (!selectedClient || !message.trim()) {
      setFeedback({
        type: 'error',
        text: 'Selecciona un cliente y escribe un mensaje',
      })
      return
    }

    if (message.length > 500) {
      setFeedback({
        type: 'error',
        text: 'El mensaje no puede exceder 500 caracteres',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          text: message,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Agregar mensaje a la lista
      const clientName = clients.find((c) => c.id === selectedClient)?.name || selectedClient
      setMessages([
        {
          id: Date.now(),
          client: clientName,
          text: message,
          timestamp: new Date(),
          status: 'enviado',
        },
        ...messages,
      ])

      // Limpiar formulario y mostrar confirmación
      setMessage('')
      setFeedback({
        type: 'success',
        text: `Mensaje enviado a ${clientName}`,
      })
    } catch (error) {
      setFeedback({
        type: 'error',
        text: `Error: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="message-form-container">
      <div className="message-form">
        <h3>Enviar Mensaje</h3>

        {feedback && (
          <div className={`feedback ${feedback.type}`}>
            <span className={`icon ${feedback.type}`}>
              {feedback.type === 'success' ? '✓' : '✕'}
            </span>
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="client-select">Seleccionar Cliente:</label>
            <select
              id="client-select"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Selecciona un cliente --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name || client.id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensaje:</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              maxLength={500}
              disabled={loading}
              rows={4}
            />
            <div className="char-count">
              {message.length}/500
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </form>
      </div>

      {messages.length > 0 && (
        <div className="messages-history">
          <h3>Mensajes Enviados</h3>
          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className="message-item">
                <div className="message-header">
                  <span className="message-client">{msg.client}</span>
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString('es-ES')}
                  </span>
                </div>
                <div className="message-body">{msg.text}</div>
                <span className={`message-status status-${msg.status}`}>
                  {msg.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageForm
