import { SignClient } from '@walletconnect/sign-client'
import type { SessionTypes, PairingTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { Web3Modal } from '@web3modal/standalone'
import { environment } from '@/shared/config/environment'
import { REQUIRED_NAMESPACES, CHIA_METADATA, CHIA_CHAIN_ID } from '../constants/chia-wallet-connect'
import { debugWalletConnect } from '../utils/debug'
import type {
  WalletConnectSession,
  ConnectionResult,
  DisconnectResult,
  WalletConnectEvent,
  ChiaWalletInfo,
} from '../types/walletConnect.types'
import type {
  ChiaConnectionState,
  GetCurrentAddressResponse,
  GetWalletBalanceResponse,
} from '../types/chia-rpc.types'

export class ChiaWalletConnectService {
  public client: InstanceType<typeof SignClient> | null = null
  public web3Modal: Web3Modal | null = null
  private eventListeners: Map<string, (event: WalletConnectEvent) => void> = new Map()
  private pairings: PairingTypes.Struct[] = []
  private session: SessionTypes.Struct | null = null
  private fingerprint: string | null = null

  /**
   * Initialize the Wallet Connect client
   */
  async initialize(): Promise<void> {
    try {
      if (this.client) {
        return
      }

      if (
        !environment.wallet.walletConnect.projectId ||
        environment.wallet.walletConnect.projectId === 'your_wallet_connect_project_id_here'
      ) {
        console.warn('WalletConnect Project ID is not set. Using demo mode.')
        return
      }

      // Initialize the SignClient
      this.client = await SignClient.init({
        projectId: environment.wallet.walletConnect.projectId,
        metadata: CHIA_METADATA,
        relayUrl: 'wss://relay.walletconnect.com',
      })

      // Initialize Web3Modal
      this.web3Modal = new Web3Modal({
        projectId: environment.wallet.walletConnect.projectId,
        standaloneChains: [CHIA_CHAIN_ID],
        walletConnectVersion: 2,
      })

      this.setupEventListeners()
      await this.checkPersistedState()
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error)
      throw error
    }
  }

  /**
   * Connect to a Chia wallet
   */
  async connect(pairing?: { topic: string }): Promise<ConnectionResult> {
    try {
      if (!this.client) {
        await this.initialize()
      }

      if (!this.client) {
        throw new Error('WalletConnect is not initialized')
      }

      if (!this.web3Modal) {
        throw new Error('Web3Modal is not initialized')
      }

      const { uri, approval } = await this.client.connect({
        pairingTopic: pairing?.topic,
        requiredNamespaces: REQUIRED_NAMESPACES,
      })

      debugWalletConnect.logConnectionFlow('Connect - URI generated', {
        uri: uri?.substring(0, 50) + '...',
      })

      if (uri) {
        this.web3Modal.openModal({ uri })
        debugWalletConnect.logConnectionFlow('Connect - Modal opened, waiting for approval')

        const session = await approval()
        debugWalletConnect.logSuccess('Connect - Session approved', { topic: session.topic })

        this.onSessionConnected(session)
        this.pairings = this.client.pairing.getAll({ active: true })
        this.web3Modal.closeModal()

        debugWalletConnect.logSuccess('Connect - Connection complete')
      }

      return {
        success: true,
        session: this.mapSession(this.session!),
        accounts: this.extractAccounts(this.session!),
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
      if (!this.client) {
        await this.initialize()
      }

      if (!this.client) {
        return null
      }

      const { uri, approval } = await this.client.connect({
        requiredNamespaces: REQUIRED_NAMESPACES,
      })

      debugWalletConnect.logConnectionFlow('StartConnection - URI generated', {
        uri: uri?.substring(0, 50) + '...',
      })

      if (uri) {
        return { uri, approval }
      }

      debugWalletConnect.logWarning('StartConnection - No URI generated')
      return null
    } catch (error) {
      console.error('Failed to start connection:', error)
      return null
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<DisconnectResult> {
    try {
      if (!this.client) {
        throw new Error('WalletConnect is not initialized')
      }

      if (!this.session) {
        throw new Error('Session is not connected')
      }

      await this.client.disconnect({
        topic: this.session.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      })

      this.reset()
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
   * Get wallet information
   */
  async getWalletInfo(): Promise<ChiaWalletInfo | null> {
    if (!this.session || !this.fingerprint) {
      return null
    }

    try {
      // Get current address
      const addressResponse = await this.request<GetCurrentAddressResponse>(
        'chia_getCurrentAddress',
        {
          walletId: 1, // XCH wallet
        }
      )

      // Get wallet balance
      const balanceResponse = await this.request<GetWalletBalanceResponse>(
        'chia_getWalletBalance',
        {
          walletId: 1, // XCH wallet
        }
      )

      return {
        fingerprint: parseInt(this.fingerprint),
        address: addressResponse.address,
        balance: balanceResponse.walletBalance,
        isConnected: true,
      }
    } catch (error) {
      console.error('Failed to get wallet info:', error)
      return null
    }
  }

  /**
   * Make RPC request to Chia wallet
   */
  async request<T>(method: string, data: Record<string, unknown>): Promise<T> {
    if (!this.client) {
      throw new Error('WalletConnect is not initialized')
    }
    if (!this.session) {
      throw new Error('Session is not connected')
    }
    if (!this.fingerprint) {
      throw new Error('Fingerprint is not loaded')
    }

    const result = await this.client.request<{ data: T } | { error: Record<string, unknown> }>({
      topic: this.session.topic,
      chainId: CHIA_CHAIN_ID,
      request: {
        method,
        params: { fingerprint: parseInt(this.fingerprint), ...data },
      },
    })

    if ('error' in result) {
      throw new Error(JSON.stringify(result.error))
    }

    return result.data
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ChiaConnectionState {
    return {
      isConnected: !!this.session,
      isConnecting: false,
      fingerprint: this.fingerprint ? parseInt(this.fingerprint) : undefined,
      address: undefined, // Will be populated when needed
      balance: undefined, // Will be populated when needed
    }
  }

  /**
   * Get available pairings
   */
  getPairings(): PairingTypes.Struct[] {
    return this.pairings
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return !!this.client
  }

  // Private methods

  private onSessionConnected(session: SessionTypes.Struct) {
    const allNamespaceAccounts = Object.values(session.namespaces)
      .map(namespace => namespace.accounts)
      .flat()

    this.session = session
    this.fingerprint = allNamespaceAccounts[0]?.split(':')[2] || null

    debugWalletConnect.logSuccess('Session connected', {
      topic: session.topic,
      accounts: allNamespaceAccounts,
      fingerprint: this.fingerprint,
    })
  }

  private reset() {
    this.session = null
    this.fingerprint = null
  }

  private async checkPersistedState() {
    if (!this.client) {
      throw new Error('WalletConnect is not initialized')
    }

    this.pairings = this.client.pairing.getAll({ active: true })

    if (this.session) return

    if (this.client.session.length) {
      const lastKeyIndex = this.client.session.keys.length - 1
      const session = this.client.session.get(this.client.session.keys[lastKeyIndex])
      this.onSessionConnected(session)
    }
  }

  private setupEventListeners() {
    if (!this.client) return

    this.client.on('session_update', ({ topic, params }) => {
      debugWalletConnect.logConnectionFlow('Session update', { topic, params })
      const { namespaces } = params
      const session = this.client!.session.get(topic)
      const updatedSession = { ...session, namespaces }
      this.onSessionConnected(updatedSession)
    })

    this.client.on('session_delete', ({ topic }) => {
      debugWalletConnect.logConnectionFlow('Session deleted', { topic })
      this.reset()
    })

    this.client.on('session_event', (...args) => {
      debugWalletConnect.logConnectionFlow('Session event', args)
    })

    this.client.on('session_proposal', proposal => {
      debugWalletConnect.logConnectionFlow('Session proposal', {
        id: proposal.id,
        proposer: proposal.proposer.metadata.name,
      })
    })

    this.client.on('session_approve', session => {
      debugWalletConnect.logSuccess('Session approved', { topic: session.topic })
    })

    this.client.on('session_reject', event => {
      debugWalletConnect.logError('Session rejected', event)
    })
  }

  private extractAccounts(session: SessionTypes.Struct): string[] {
    return Object.values(session.namespaces)
      .map(namespace => namespace.accounts)
      .flat()
  }

  private mapSession(session: SessionTypes.Struct): WalletConnectSession {
    return {
      topic: session.topic,
      peer: session.peer,
      namespaces: session.namespaces,
      acknowledged: session.acknowledged,
      controller: session.controller,
      expiry: session.expiry,
      requiredNamespaces: session.requiredNamespaces,
      optionalNamespaces: session.optionalNamespaces,
    }
  }

  // Event handling
  on(event: string, callback: (event: WalletConnectEvent) => void) {
    this.eventListeners.set(event, callback)
  }

  off(event: string) {
    this.eventListeners.delete(event)
  }

  private emitEvent(event: string, data: unknown) {
    const callback = this.eventListeners.get(event)
    if (callback) {
      callback(data)
    }
  }
}

// Export singleton instance
export const chiaWalletConnectService = new ChiaWalletConnectService()
