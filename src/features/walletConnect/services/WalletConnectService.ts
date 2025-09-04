import { SignClient } from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'
import { environment } from '@/shared/config/environment'
import type {
  WalletConnectConfig,
  WalletConnectSession,
  ConnectionResult,
  DisconnectResult,
  WalletConnectEvent,
  ChiaWalletInfo,
} from '../types/walletConnect.types'

export class WalletConnectService {
  public client: InstanceType<typeof SignClient> | null = null
  private config: WalletConnectConfig
  private eventListeners: Map<string, (event: WalletConnectEvent) => void> = new Map()

  constructor() {
    this.config = {
      projectId: environment.wallet.walletConnect.projectId,
      metadata: {
        ...environment.wallet.walletConnect.metadata,
        icons: [...environment.wallet.walletConnect.metadata.icons],
      },
      chains: ['chia:testnet', 'chia:mainnet'],
      methods: [
        'chia_getBalance',
        'chia_getAddress',
        'chia_signMessage',
        'chia_sendTransaction',
        'chia_getTransactions',
      ],
      events: ['accountsChanged', 'chainChanged', 'disconnect'],
    }
  }

  /**
   * Initialize the Wallet Connect client
   */
  async initialize(): Promise<void> {
    try {
      // Check if already initialized
      if (this.client) {
        console.log('Wallet Connect client already initialized')
        return
      }

      if (
        !this.config.projectId ||
        this.config.projectId === 'your_wallet_connect_project_id_here'
      ) {
        console.warn('Wallet Connect Project ID is not set. Using demo mode.')
        // For demo mode, we'll skip real Wallet Connect initialization
        return
      }

      this.client = await SignClient.init({
        projectId: this.config.projectId,
        metadata: this.config.metadata,
        relayUrl: 'wss://relay.walletconnect.com',
      })

      this.setupEventListeners()
    } catch (error) {
      console.error('Failed to initialize Wallet Connect:', error)
      throw error
    }
  }

  /**
   * Connect to a wallet
   */
  async connect(): Promise<ConnectionResult> {
    try {
      if (!this.client) {
        await this.initialize()
      }

      if (!this.client) {
        throw new Error('Wallet Connect client not initialized')
      }

      const { uri, approval } = await this.client.connect({
        optionalNamespaces: {
          chia: {
            methods: this.config.methods || [],
            chains: this.config.chains || [],
            events: this.config.events || [],
          },
        },
      })

      // Store URI for QR code display
      this.emitEvent('session_proposal', { uri })

      // Wait for approval
      const session = await approval()

      // Store session
      this.storeSession(session)

      // Extract accounts
      const accounts = this.extractAccounts(session)

      return {
        success: true,
        session: this.mapSession(session),
        accounts,
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }
    }
  }

  /**
   * Start connection process and get URI for QR code display
   */
  async startConnection(): Promise<{ uri: string; approval: () => Promise<unknown> } | null> {
    try {
      // Check if we're in demo mode
      if (
        !this.config.projectId ||
        this.config.projectId === 'your_wallet_connect_project_id_here'
      ) {
        console.log('Demo mode: generating fake connection data')
        return {
          uri: 'wc:demo-connection-uri-for-testing@2?relay-protocol=irn&symKey=demo1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          approval: async () => {
            // Simulate approval delay
            await new Promise(resolve => setTimeout(resolve, 3000))
            return {
              topic: 'demo-session-12345',
              accounts: ['xch1demo123456789abcdefghijklmnopqrstuvwxyz'],
              namespaces: {
                chia: {
                  accounts: ['xch1demo123456789abcdefghijklmnopqrstuvwxyz'],
                  methods: this.config.methods || [],
                  events: this.config.events || [],
                },
              },
            }
          },
        }
      }

      if (!this.client) {
        await this.initialize()
      }

      if (!this.client) {
        throw new Error('Wallet Connect client not initialized')
      }

      const { uri, approval } = await this.client.connect({
        optionalNamespaces: {
          chia: {
            methods: this.config.methods || [],
            chains: this.config.chains || [],
            events: this.config.events || [],
          },
        },
      })

      if (!uri) {
        throw new Error('Failed to generate connection URI')
      }

      return { uri, approval }
    } catch (error) {
      console.error('Failed to start connection:', error)
      return null
    }
  }

  /**
   * Disconnect from the current session
   */
  async disconnect(): Promise<DisconnectResult> {
    try {
      if (!this.client) {
        return { success: true }
      }

      const session = this.getStoredSession()
      if (session) {
        await this.client.disconnect({
          topic: session.topic,
          reason: {
            code: 6000,
            message: 'User disconnected',
          },
        })
      }

      this.clearStoredSession()
      this.emitEvent('session_delete', {})

      return { success: true }
    } catch (error) {
      console.error('Disconnect failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      }
    }
  }

  /**
   * Get current session
   */
  getSession(): WalletConnectSession | null {
    return this.getStoredSession()
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    const session = this.getStoredSession()
    return session !== null && session.expiry > Date.now() / 1000
  }

  /**
   * Get wallet info for Chia network
   */
  async getWalletInfo(): Promise<ChiaWalletInfo | null> {
    try {
      // Check if we're in demo mode
      if (
        !this.config.projectId ||
        this.config.projectId === 'your_wallet_connect_project_id_here'
      ) {
        console.log('Demo mode: returning fake wallet info')
        return {
          address: 'xch1demo123456789abcdefghijklmnopqrstuvwxyz',
          publicKey: 'demo-public-key-1234567890abcdef',
          network: environment.blockchain.chia.network as 'mainnet' | 'testnet',
        }
      }

      const session = this.getStoredSession()
      if (!session || !this.client) {
        return null
      }

      // Extract Chia address from session
      const accounts = this.extractAccounts(session)
      const chiaAccount = accounts.find(account => account.startsWith('xch'))

      if (!chiaAccount) {
        return null
      }

      return {
        address: chiaAccount,
        publicKey: session.peer.publicKey,
        network: environment.blockchain.chia.network as 'mainnet' | 'testnet',
      }
    } catch (error) {
      console.error('Failed to get wallet info:', error)
      return null
    }
  }

  /**
   * Send a request to the connected wallet
   */
  async sendRequest(method: string, params: unknown[] = []): Promise<unknown> {
    try {
      if (!this.client) {
        throw new Error('Wallet Connect client not initialized')
      }

      const session = this.getStoredSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await this.client.request({
        topic: session.topic,
        chainId: `chia:${environment.blockchain.chia.network}`,
        request: {
          method,
          params,
        },
      })

      return response
    } catch (error) {
      console.error('Request failed:', error)
      throw error
    }
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: (event: WalletConnectEvent) => void): void {
    this.eventListeners.set(event, callback)
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string): void {
    this.eventListeners.delete(event)
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return

    this.client.on('session_proposal', (event: unknown) => {
      this.emitEvent('session_proposal', event)
    })

    // Note: session_approve and session_reject are not standard events in Wallet Connect v2
    // These would be handled through the connection flow

    this.client.on('session_delete', (event: unknown) => {
      this.clearStoredSession()
      this.emitEvent('session_delete', event)
    })

    this.client.on('session_update', (event: unknown) => {
      this.emitEvent('session_update', event)
    })

    this.client.on('session_expire', (event: unknown) => {
      this.clearStoredSession()
      this.emitEvent('session_expire', event)
    })
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(type: string, data: unknown): void {
    const event: WalletConnectEvent = { type: type as WalletConnectEventType, data }
    this.eventListeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Event listener error:', error)
      }
    })
  }

  /**
   * Extract accounts from session
   */
  private extractAccounts(session: SessionTypes.Struct): string[] {
    const accounts: string[] = []

    Object.values(session.namespaces).forEach(namespace => {
      if (namespace.accounts) {
        accounts.push(...namespace.accounts)
      }
    })

    return accounts
  }

  /**
   * Map Wallet Connect session to our interface
   */
  private mapSession(session: SessionTypes.Struct): WalletConnectSession {
    return {
      topic: session.topic,
      pairingTopic: session.pairingTopic,
      relay: session.relay,
      namespaces: session.namespaces,
      requiredNamespaces: session.requiredNamespaces,
      optionalNamespaces: session.optionalNamespaces,
      self: session.self,
      peer: session.peer,
      acknowledged: session.acknowledged,
      controller: session.controller,
      expiry: session.expiry,
    }
  }

  /**
   * Store session in localStorage
   */
  private storeSession(session: SessionTypes.Struct): void {
    try {
      const sessionData = this.mapSession(session)
      localStorage.setItem('walletconnect_session', JSON.stringify(sessionData))
    } catch (error) {
      console.error('Failed to store session:', error)
    }
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): WalletConnectSession | null {
    try {
      const sessionData = localStorage.getItem('walletconnect_session')
      if (!sessionData) return null

      const session = JSON.parse(sessionData) as WalletConnectSession

      // Check if session is expired
      if (session.expiry <= Date.now() / 1000) {
        this.clearStoredSession()
        return null
      }

      return session
    } catch (error) {
      console.error('Failed to get stored session:', error)
      return null
    }
  }

  /**
   * Clear stored session
   */
  private clearStoredSession(): void {
    try {
      localStorage.removeItem('walletconnect_session')
    } catch (error) {
      console.error('Failed to clear stored session:', error)
    }
  }
}

// Export singleton instance
export const walletConnectService = new WalletConnectService()
