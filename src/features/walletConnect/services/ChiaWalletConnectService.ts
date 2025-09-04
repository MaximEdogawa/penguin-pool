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
  WalletConnectEventType,
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
        console.log('WalletConnect client already initialized, skipping...')
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
        // If no client, just reset state
        this.reset()
        return { success: true }
      }

      if (this.session) {
        await this.client.disconnect({
          topic: this.session.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        })
      }

      this.reset()
      return { success: true }
    } catch (error) {
      console.error('Disconnect failed:', error)
      // Even if disconnect fails, reset the local state
      this.reset()
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed',
      }
    }
  }

  /**
   * Force reset - clears all data and requires new connection
   */
  async forceReset(): Promise<void> {
    try {
      if (this.client && this.session) {
        await this.client.disconnect({
          topic: this.session.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        })
      }
    } catch (error) {
      console.warn('Error during force reset disconnect:', error)
    }

    // Clear all event listeners
    this.eventListeners.clear()

    // Reset all state
    this.reset()
    this.client = null
    this.web3Modal = null
    this.pairings = []
  }

  /**
   * Get wallet information
   */
  async getWalletInfo(): Promise<ChiaWalletInfo | null> {
    if (!this.session || !this.fingerprint) {
      console.warn('Cannot get wallet info: no session or fingerprint')
      return null
    }

    try {
      // Extract address from session accounts as fallback
      const accounts = this.extractAccounts(this.session)
      const chiaAccount = accounts.find(account => account.startsWith('xch'))
      const fallbackAddress = chiaAccount || `chia:testnet:${this.fingerprint}`

      let address = fallbackAddress
      let balance = {
        confirmed_wallet_balance: 0,
        unconfirmed_wallet_balance: 0,
        spendable_balance: 0,
        pending_change: 0,
        max_send_amount: 0,
        unspent_coin_count: 0,
        pending_coin_removal_count: 0,
      }

      // Try to get wallet info using the correct RPC methods
      try {
        // First, try to get wallets to find the correct wallet ID
        const walletsResponse = await this.request<{
          wallets: Array<{ id: number; type: number; name: string }>
        }>('chia_getWallets', { includeData: false })

        // Find the XCH wallet (type 0 is usually the main XCH wallet)
        const xchWallet = walletsResponse.wallets.find(wallet => wallet.type === 0)
        const walletId = xchWallet?.id || 1

        console.log('Found XCH wallet:', xchWallet, 'using walletId:', walletId)

        // Try to get current address
        try {
          const addressResponse = await this.request<GetCurrentAddressResponse>(
            'chia_getCurrentAddress',
            { walletId }
          )
          address = addressResponse.address
          console.log('Got current address:', address)
        } catch (error) {
          console.warn(
            'getCurrentAddress not supported, using fallback address:',
            fallbackAddress,
            error
          )
        }

        // Try to get wallet balance
        try {
          const balanceResponse = await this.request<GetWalletBalanceResponse>(
            'chia_getWalletBalance',
            { walletId }
          )
          balance = balanceResponse.walletBalance
          console.log('Got wallet balance:', balance)
        } catch (error) {
          console.warn('getWalletBalance not supported, using zero balance', error)
        }

        // If balance is still 0, try alternative methods
        if (balance.confirmed_wallet_balance === 0) {
          try {
            // Try to get sync status first
            const syncResponse = await this.request<{ synced: boolean; syncing: boolean }>(
              'chia_getSyncStatus',
              {}
            )
            console.log('Sync status:', syncResponse)

            // Try to get balance using different method
            const balanceResponse2 = await this.request<{ walletBalance: Record<string, unknown> }>(
              'chia_getWalletBalance',
              { walletId, includeData: true }
            )
            if (balanceResponse2.walletBalance) {
              balance = balanceResponse2.walletBalance as typeof balance
              console.log('Got wallet balance (alternative method):', balance)
            }
          } catch (error) {
            console.warn('Alternative balance methods failed:', error)
          }
        }
      } catch (error) {
        console.warn('getWallets not supported, using fallback methods:', error)
      }

      const walletInfo = {
        fingerprint: parseInt(this.fingerprint),
        address,
        balance,
        isConnected: true,
      }

      console.log('Wallet info retrieved:', walletInfo)
      return walletInfo
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

  /**
   * Get current session
   */
  getSession(): WalletConnectSession | null {
    if (!this.session) return null
    return this.mapSession(this.session)
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return !!this.session && this.session.expiry > Date.now() / 1000
  }

  /**
   * Refresh wallet info (useful for getting updated balance)
   */
  async refreshWalletInfo(): Promise<ChiaWalletInfo | null> {
    // console.log('Refreshing wallet info...')
    return await this.getWalletInfo()
  }

  /**
   * Get current network info
   */
  getNetworkInfo(): { chainId: string; isTestnet: boolean } {
    const chainId = CHIA_CHAIN_ID
    const isTestnet = chainId.includes('testnet')
    return { chainId, isTestnet }
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

    // Check if we already have a session
    if (this.session) return

    // Try to restore session from persisted state
    if (this.client.session.length) {
      const lastKeyIndex = this.client.session.keys.length - 1
      const session = this.client.session.get(this.client.session.keys[lastKeyIndex])

      // Check if session is still valid (not expired)
      if (session && session.expiry > Date.now() / 1000) {
        this.onSessionConnected(session)
        this.emitEvent('session_restored', session)
      } else {
        // Session expired, clean up
        this.reset()
      }
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
      this.emitEvent('session_update', { topic, params })
    })

    this.client.on('session_delete', ({ topic }) => {
      debugWalletConnect.logConnectionFlow('Session deleted', { topic })
      this.reset()
      this.emitEvent('session_delete', { topic })
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
      this.emitEvent('session_approve', session)
    })

    this.client.on('session_reject', event => {
      debugWalletConnect.logError('Session rejected', event)
      this.emitEvent('session_reject', event)
    })

    this.client.on('session_expire', ({ topic }) => {
      debugWalletConnect.logConnectionFlow('Session expired', { topic })
      this.reset()
      this.emitEvent('session_expire', { topic })
    })

    this.client.on('session_request', event => {
      debugWalletConnect.logConnectionFlow('Session request', event)
      this.emitEvent('session_request', event)
    })

    this.client.on('session_request_sent', event => {
      debugWalletConnect.logConnectionFlow('Session request sent', event)
      this.emitEvent('session_request_sent', event)
    })

    this.client.on('session_response', event => {
      debugWalletConnect.logConnectionFlow('Session response', event)
      this.emitEvent('session_response', event)
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
      const walletConnectEvent: WalletConnectEvent = {
        type: event as WalletConnectEventType,
        data,
      }
      callback(walletConnectEvent)
    }
  }
}

// Export singleton instance
export const chiaWalletConnectService = new ChiaWalletConnectService()
