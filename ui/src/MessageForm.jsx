import { useState, useEffect } from 'react'

function MessageForm() {
  const [clients, setClients] = useState([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message: string }
  const [sentMessages, setSentMessages] = useState([])

  // Obtener lista de clientes disponibles
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setClients(data.data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      showFeedback('error', 'Error al cargar clientes: ' + err.message)
    }
  }

  useEffect(() => {
    fetchClients()
    // Actualizar lista de clientes cada 10 segundos
    const interval = setInterval(fetchClients, 10000)
    return () => clearInterval(interval)
  }, [])

  const showFeedback = (type, message) => {
    setFeedback({ type, message })
    // Auto-ocultar el feedback después de 5 segundos
    setTimeout(() => {
      setFeedback(null)
    }, 5000)
  }

  const validateForm = () => {
    if (!selectedClientId) {
      showFeedback('error', 'Por favor selecciona un cliente')
      return false
    }

    if (!messageText.trim()) {
      showFeedback('error', 'Por favor escribe un mensaje')
      return false
    }

    if (messageText.trim().length < 3) {
      showFeedback('error', 'El mensaje debe tener al menos 3 caracteres')
      return false
    }

    if (messageText.length > 500) {
      showFeedback('error', 'El mensaje no puede exceder 500 caracteres')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          message: messageText.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      // Mostrar feedback de éxito
      showFeedback('success', `Mensaje enviado correctamente a ${getClientName(selectedClientId)}`)

      // Agregar mensaje a la lista de enviados
      const newMessage = {
        id: Date.now(),
        clientId: selectedClientId,
        clientName: getClientName(selectedClientId),
        message: messageText.trim(),
        timestamp: new Date().toLocaleString('es-BO'),
        status: 'sent',
      }
      setSentMessages([newMessage, ...sentMessages])

      // Limpiar formulario
      setMessageText('')
    } catch (err) {
      console.error('Error sending message:', err)
      showFeedback('error', 'Error al enviar mensaje: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getClientName = (clientId) => {
    const client = clients.find((c) => c.clientId === clientId)
    return client?.name || clientId
  }

  const handleClientChange = (e) => {
    setSelectedClientId(e.target.value)
    setFeedback(null) // Limpiar feedback al cambiar cliente
  }

  const handleMessageChange = (e) => {
    setMessageText(e.target.value)
    if (feedback?.type === 'error') {
      setFeedback(null) // Limpiar error al escribir
    }
  }

  const clearMessage = () => {
    setMessageText('')
    setFeedback(null)
  }

  const connectedClients = clients.filter((c) => c.status === 'connected')

  return (
    <div className="message-form-container">
      <div className="message-form-card">
        <div className="message-form-header">
          <h2>✉️ Enviar Mensaje</h2>
          <p>Envía mensajes a los clientes conectados</p>
        </div>

        {/* Feedback de éxito/error */}
        {feedback && (
          <div className={`feedback-message feedback-${feedback.type}`}>
            <span className="feedback-icon">
              {feedback.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span className="feedback-text">{feedback.message}</span>
            <button
              className="feedback-close"
              onClick={() => setFeedback(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="message-form">
          {/* Selector de cliente */}
          <div className="form-group">
            <label htmlFor="client-select">
              Cliente destinatario <span className="required">*</span>
            </label>
            <select
              id="client-select"
              value={selectedClientId}
              onChange={handleClientChange}
              disabled={loading || clients.length === 0}
              required
            >
              <option value="">
                {clients.length === 0
                  ? 'No hay clientes disponibles'
                  : 'Selecciona un cliente...'}
              </option>
              {connectedClients.length > 0 && (
                <optgroup label="Conectados">
                  {connectedClients.map((client) => (
                    <option key={client.clientId} value={client.clientId}>
                      {client.name || client.clientId}
                    </option>
                  ))}
                </optgroup>
              )}
              {clients.filter((c) => c.status !== 'connected').length > 0 && (
                <optgroup label="No conectados">
                  {clients
                    .filter((c) => c.status !== 'connected')
                    .map((client) => (
                      <option key={client.clientId} value={client.clientId}>
                        {client.name || client.clientId} ({client.status})
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            {connectedClients.length > 0 && (
              <small className="form-hint">
                {connectedClients.length} cliente(s) conectado(s)
              </small>
            )}
          </div>

          {/* Textarea del mensaje */}
          <div className="form-group">
            <label htmlFor="message-text">
              Mensaje <span className="required">*</span>
            </label>
            <textarea
              id="message-text"
              value={messageText}
              onChange={handleMessageChange}
              disabled={loading}
              placeholder="Escribe tu mensaje aquí..."
              rows={5}
              maxLength={500}
              required
            />
            <div className="form-footer">
              <small className="form-hint">
                {messageText.length}/500 caracteres
              </small>
              {messageText && (
                <button
                  type="button"
                  onClick={clearMessage}
                  className="btn-clear"
                  disabled={loading}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !selectedClientId || !messageText.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Enviando...
                </>
              ) : (
                <>
                  <span>📤</span>
                  Enviar Mensaje
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de mensajes enviados */}
      {sentMessages.length > 0 && (
        <div className="sent-messages-card">
          <div className="sent-messages-header">
            <h3>📋 Mensajes Enviados</h3>
            <span className="messages-count">{sentMessages.length}</span>
          </div>
          <div className="sent-messages-list">
            {sentMessages.map((msg) => (
              <div key={msg.id} className="message-item">
                <div className="message-item-header">
                  <span className="message-client">
                    👤 {msg.clientName}
                  </span>
                  <span className="message-timestamp">{msg.timestamp}</span>
                </div>
                <div className="message-item-body">
                  <p>{msg.message}</p>
                </div>
                <div className="message-item-footer">
                  <span className="message-status">✅ Enviado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageForm
