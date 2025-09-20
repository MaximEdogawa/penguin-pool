import { environment } from '@/shared/config/environment'
import { SignClient } from '@walletconnect/sign-client'

export interface WebSocketConnectionResult {
  client: InstanceType<typeof SignClient>
  isConnected: boolean
  error?: Error
}

export interface WebSocketConnectionOptions {
  projectId: string
  relayUrl?: string
  maxRetries?: number
  retryDelay?: number
  enableRetry?: boolean
}

export class WalletConnectWebSocketService {
  private static instance: WalletConnectWebSocketService | null = null
  private currentClient: InstanceType<typeof SignClient> | null = null
  private connectionOptions: WebSocketConnectionOptions

  constructor(options: WebSocketConnectionOptions) {
    this.connectionOptions = {
      relayUrl: 'wss://relay.walletconnect.org',
      maxRetries: 5,
      retryDelay: 2000,
      enableRetry: true,
      ...options,
    }
  }

  static getInstance(options?: WebSocketConnectionOptions): WalletConnectWebSocketService {
    if (!WalletConnectWebSocketService.instance) {
      if (!options) {
        throw new Error('WebSocket service options required for first initialization')
      }
      WalletConnectWebSocketService.instance = new WalletConnectWebSocketService(options)
    }
    return WalletConnectWebSocketService.instance
  }

  /**
   * Create a WebSocket connection with custom retry logic
   */
  async createConnection(): Promise<WebSocketConnectionResult> {
    try {
      console.log('Creating WalletConnect WebSocket connection with retry logic...')

      // Custom retry mechanism
      let lastError: Error | null = null
      const maxRetries = this.connectionOptions.enableRetry
        ? this.connectionOptions.maxRetries || 5
        : 0

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt === 0) {
            console.log(`WebSocket connection attempt ${attempt + 1}/${maxRetries + 1}...`)
          }

          const client = await this.establishWebSocketConnection()

          if (client && this.currentClient) {
            console.log('WebSocket connection established successfully')
            return {
              client: this.currentClient,
              isConnected: true,
            }
          }

          throw new Error('Failed to establish WebSocket connection')
        } catch (error) {
          lastError = error as Error
          console.warn(`WebSocket connection attempt ${attempt + 1} failed:`, error)

          // If this is not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const baseDelay = this.connectionOptions.retryDelay || 2000
            const exponentialDelay = baseDelay * Math.pow(2, attempt)
            const jitter = Math.random() * 1000 // Add jitter to prevent thundering herd
            const delay = Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds

            console.log(`Waiting ${delay}ms before retry...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      // All retries failed
      console.error('WebSocket connection failed after all retries:', lastError)
      return {
        client: this.currentClient!,
        isConnected: false,
        error: lastError || new Error('Connection failed after all retries'),
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
      return {
        client: this.currentClient!,
        isConnected: false,
        error: error as Error,
      }
    }
  }

  /**
   * Establish the actual WebSocket connection
   */
  private async establishWebSocketConnection(): Promise<InstanceType<typeof SignClient>> {
    try {
      console.log(`Attempting WebSocket connection to: ${this.connectionOptions.relayUrl}`)

      // Check if we already have a connected client
      if (this.currentClient && this.currentClient.core.relayer.connected) {
        console.log('Reusing existing connected WebSocket client')
        return this.currentClient
      }

      // Create SignClient with enhanced error handling
      const client = await SignClient.init({
        projectId: this.connectionOptions.projectId,
        relayUrl: this.connectionOptions.relayUrl,
        metadata: {
          name: 'Penguin Pool',
          description: 'Chia mining pool interface',
          url: environment.wallet.walletConnect.metadata.url,
          icons: [...environment.wallet.walletConnect.metadata.icons],
        },
        logger: 'error',
      })

      // Set up connection event handlers
      client.core.relayer.on('relayer_connect', () => {
        console.log('WebSocket connected to WalletConnect relay')
      })

      client.core.relayer.on('relayer_disconnect', (error: unknown) => {
        console.warn('WebSocket disconnected from WalletConnect relay:', error)
      })

      client.core.relayer.on('relayer_error', (error: unknown) => {
        console.error('WebSocket relay error:', error)
      })

      // Test the connection by starting the client
      await client.core.start()

      // Wait for connection to be established with a timeout
      const connectionTimeout = 10000 // 10 seconds
      const startTime = Date.now()

      while (!client.core.relayer.connected && Date.now() - startTime < connectionTimeout) {
        await new Promise(resolve => setTimeout(resolve, 100)) // Wait 100ms
      }

      // Verify connection is working
      const isConnected = client.core.relayer.connected
      if (!isConnected) {
        // Give it one more chance with a longer wait
        console.log('Connection not ready, waiting additional 2 seconds...')
        await new Promise(resolve => setTimeout(resolve, 2000))

        const finalCheck = client.core.relayer.connected
        if (!finalCheck) {
          throw new Error('WebSocket connection established but not connected')
        }
      }

      this.currentClient = client
      console.log('WebSocket connection verified and ready')
      return client
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error)
      throw error
    }
  }

  /**
   * Reconnect with retry logic
   */
  async reconnect(): Promise<WebSocketConnectionResult> {
    console.log('Attempting WebSocket reconnection...')

    // Clean up existing connection
    if (this.currentClient) {
      try {
        // Note: core.stop() might not exist in all versions
        // We'll just set the client to null for cleanup
        console.log('Cleaning up existing WebSocket client')
      } catch (error) {
        console.warn('Error stopping existing client:', error)
      }
      this.currentClient = null
    }

    // Create new connection with retry
    return await this.createConnection()
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.currentClient?.core.relayer.connected || false
  }

  /**
   * Get current client
   */
  getClient(): InstanceType<typeof SignClient> | null {
    return this.currentClient
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.currentClient) {
      try {
        // Note: core.stop() might not exist in all versions
        // We'll just set the client to null for cleanup
        console.log('WebSocket connection cleaned up')
      } catch (error) {
        console.warn('Error during WebSocket cleanup:', error)
      }
      this.currentClient = null
    }
  }

  /**
   * Update connection options
   */
  updateOptions(options: Partial<WebSocketConnectionOptions>): void {
    this.connectionOptions = { ...this.connectionOptions, ...options }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean
    client: InstanceType<typeof SignClient> | null
    options: WebSocketConnectionOptions
  } {
    return {
      isConnected: this.isConnected(),
      client: this.currentClient,
      options: this.connectionOptions,
    }
  }
}

/**
 * Factory function to create WebSocket service with default options
 */
export function createWebSocketService(projectId: string): WalletConnectWebSocketService {
  return WalletConnectWebSocketService.getInstance({
    projectId,
    relayUrl: 'wss://relay.walletconnect.org',
    maxRetries: 5,
    retryDelay: 2000,
    enableRetry: true,
  })
}

/**
 * Hook for using WebSocket connection in Vue components
 * This can be used in Vue components that need WebSocket connection management
 */
export function useWebSocketConnection(projectId: string) {
  const service = createWebSocketService(projectId)

  return {
    service,
    createConnection: () => service.createConnection(),
    reconnect: () => service.reconnect(),
    isConnected: () => service.isConnected(),
    getClient: () => service.getClient(),
    cleanup: () => service.cleanup(),
  }
}
