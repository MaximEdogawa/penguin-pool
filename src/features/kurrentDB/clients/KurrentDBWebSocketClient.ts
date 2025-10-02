export interface KurrentDBWebSocketConfig {
  wsUrl: string
  httpUrl: string
  credentials: {
    apiKey: string
    secretKey: string
  }
  reconnectOptions?: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
  }
}

export interface KurrentDBEvent {
  id: string
  type: string
  data: Record<string, unknown>
  metadata: {
    timestamp: string
    version: number
    streamName: string
  }
}

export interface KurrentDBStream {
  name: string
  events: KurrentDBEvent[]
  metadata: {
    createdAt: string
    updatedAt: string
    version: number
    tags: string[]
    owner: string
  }
}

export class KurrentDBWebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private readonly subscriptions = new Map<string, Set<(event: KurrentDBEvent) => void>>()
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' =
    'disconnected'
  private readonly config: KurrentDBWebSocketConfig
  private messageQueue: Array<{ action: string; data: unknown }> = []
  private isReconnecting = false

  constructor(config: KurrentDBWebSocketConfig) {
    this.config = {
      ...config,
      reconnectOptions: {
        maxAttempts: 5,
        initialDelay: 1000,
        maxDelay: 30000,
        ...config.reconnectOptions,
      },
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      this.connectionStatus = 'connecting'

      try {
        const authToken = `${this.config.credentials.apiKey}:${this.config.credentials.secretKey}`
        const wsUrl = `${this.config.wsUrl}?auth=${encodeURIComponent(authToken)}`

        // Connecting to WebSocket
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          // WebSocket connected
          this.connectionStatus = 'connected'
          this.reconnectAttempts = 0
          this.isReconnecting = false

          // Process queued messages
          this.processMessageQueue()

          resolve()
        }

        this.ws.onmessage = event => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch {
            // Failed to parse WebSocket message
          }
        }

        this.ws.onclose = () => {
          // WebSocket disconnected
          this.connectionStatus = 'disconnected'

          if (!this.isReconnecting) {
            this.handleReconnect()
          }
        }

        this.ws.onerror = error => {
          // WebSocket error
          this.connectionStatus = 'disconnected'
          reject(error)
        }

        // Set connection timeout
        setTimeout(() => {
          if (this.connectionStatus === 'connecting') {
            this.ws?.close()
            reject(new Error('Connection timeout'))
          }
        }, 10000)
      } catch (error) {
        this.connectionStatus = 'disconnected'
        reject(error)
      }
    })
  }

  private handleMessage(message: unknown) {
    if (typeof message === 'object' && message !== null && 'type' in message) {
      const { type, streamName, event, data } = message as {
        type: string
        streamName?: string
        event?: KurrentDBEvent
        data?: unknown
      }

      switch (type) {
        case 'event':
          if (streamName && event && this.subscriptions.has(streamName)) {
            // Notify all subscribers of this stream
            this.subscriptions.get(streamName)?.forEach(callback => callback(event))
          }
          break

        case 'stream_update':
          // Handle stream metadata updates
          if (streamName) {
            this.handleStreamUpdate(streamName, data)
          }
          break

        case 'error':
          // KurrentDB error
          break

        default:
        // Unknown message type
      }
    }
  }

  private handleStreamUpdate(_streamName: string, _data: unknown) {
    // Handle stream metadata updates
    // Stream update
  }

  private processMessageQueue() {
    const messagesToProcess = [...this.messageQueue]
    this.messageQueue.length = 0

    messagesToProcess.forEach(message => {
      if (message && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message))
      }
    })
  }

  private queueMessage(action: string, data: unknown) {
    this.messageQueue.push({ action, data })

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.processMessageQueue()
    }
  }

  subscribeToStream(streamName: string, callback: (event: KurrentDBEvent) => void): () => void {
    if (!this.subscriptions.has(streamName)) {
      this.subscriptions.set(streamName, new Set())

      // Send subscription message to KurrentDB
      this.queueMessage('subscribe', { stream: streamName })
    }

    this.subscriptions.get(streamName)!.add(callback)

    // Return unsubscribe function
    return () => {
      const streamSubs = this.subscriptions.get(streamName)
      if (streamSubs) {
        streamSubs.delete(callback)
        if (streamSubs.size === 0) {
          this.subscriptions.delete(streamName)
          // Send unsubscribe message
          this.queueMessage('unsubscribe', { stream: streamName })
        }
      }
    }
  }

  subscribeToAllStreams(callback: (event: KurrentDBEvent) => void): () => void {
    return this.subscribeToStream('*', callback)
  }

  async appendToStream(
    streamName: string,
    event: { type: string; data: Record<string, unknown> }
  ): Promise<{ success: boolean; eventId: string }> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    const message = {
      action: 'append_event',
      data: {
        stream: streamName,
        event: {
          type: event.type,
          data: event.data,
          metadata: {
            timestamp: new Date().toISOString(),
            version: 1,
          },
        },
      },
    }

    this.ws.send(JSON.stringify(message))

    // For now, return a mock response
    // In a real implementation, KurrentDB would send back the event ID
    return {
      success: true,
      eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  async readStream(
    streamName: string,
    options: { limit?: number; from?: number } = {}
  ): Promise<KurrentDBEvent[]> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    const message = {
      action: 'read_stream',
      data: {
        stream: streamName,
        options,
      },
    }

    this.ws.send(JSON.stringify(message))

    // For now, return empty array
    // In a real implementation, KurrentDB would send back the events
    return []
  }

  async listStreams(): Promise<KurrentDBStream[]> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    const message = {
      action: 'list_streams',
      data: {},
    }

    this.ws.send(JSON.stringify(message))

    // For now, return empty array
    // In a real implementation, KurrentDB would send back the streams
    return []
  }

  async deleteStream(streamName: string): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    const message = {
      action: 'delete_stream',
      data: { stream: streamName },
    }

    this.ws.send(JSON.stringify(message))
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.config.reconnectOptions!.maxAttempts!) {
      // Max reconnection attempts reached
      return
    }

    this.isReconnecting = true
    this.connectionStatus = 'reconnecting'
    this.reconnectAttempts++

    const delay = Math.min(
      this.config.reconnectOptions!.initialDelay! * Math.pow(2, this.reconnectAttempts - 1),
      this.config.reconnectOptions!.maxDelay!
    )

    // Attempting to reconnect

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect()
      } catch {
        // Reconnection failed
        this.handleReconnect()
      }
    }, delay)
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.isReconnecting = false
    this.connectionStatus = 'disconnected'

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.subscriptions.clear()
    this.messageQueue = []
  }

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'reconnecting' {
    return this.connectionStatus
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.ws?.readyState === WebSocket.OPEN
  }
}
