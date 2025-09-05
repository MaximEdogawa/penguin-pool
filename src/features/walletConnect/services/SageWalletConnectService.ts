import { environment } from '@/shared/config/environment'
import { SignClient } from '@walletconnect/sign-client'
import type { PairingTypes, SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { Web3Modal } from '@web3modal/standalone'
import { SageMethods } from '../constants/sage-methods'
import { CHIA_CHAIN_ID, CHIA_METADATA, REQUIRED_NAMESPACES } from '../constants/wallet-connect'
import type {
  CommandParams,
  CommandResponse,
  HandlerContext,
  WalletConnectCommand,
} from '../types/command.types'
import type { SageConnectionState } from '../types/sage-rpc.types'
import type {
  ConnectionResult,
  DisconnectResult,
  SageWalletInfo,
  WalletConnectEvent,
  WalletConnectEventType,
  WalletConnectSession,
} from '../types/walletConnect.types'
import { commandHandler } from './CommandHandler'

export class SageWalletConnectService {
  public client: InstanceType<typeof SignClient> | null = null
  public web3Modal: Web3Modal | null = null
  private eventListeners: Map<string, (event: WalletConnectEvent) => void> = new Map()
  private pairings: PairingTypes.Struct[] = []
  private session: SessionTypes.Struct | null = null
  private fingerprint: string | null = null
  private static isInitializing = false

  /**
   * Initialize the Wallet Connect client
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing WalletConnect service...')
      console.log('Project ID:', environment.wallet.walletConnect.projectId)

      if (this.client) {
        console.log('WalletConnect client already initialized, skipping...')
        return
      }

      if (SageWalletConnectService.isInitializing) {
        console.log('WalletConnect initialization already in progress, waiting...')
        // Wait for initialization to complete
        while (SageWalletConnectService.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        // Check if client was initialized by another instance
        if (
          typeof window !== 'undefined' &&
          (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
        ) {
          this.client = (window as unknown as Record<string, unknown>)
            .__WALLETCONNECT_SIGN_CLIENT__ as InstanceType<typeof SignClient>
          return
        }
      }

      if (
        !environment.wallet.walletConnect.projectId ||
        environment.wallet.walletConnect.projectId === 'your_wallet_connect_project_id_here'
      ) {
        console.error(
          'WalletConnect Project ID not configured:',
          environment.wallet.walletConnect.projectId
        )
        throw new Error(
          'WalletConnect Project ID is not configured. Please set a valid project ID.'
        )
      }

      SageWalletConnectService.isInitializing = true

      // Check if SignClient is already initialized globally
      if (
        typeof window !== 'undefined' &&
        (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
      ) {
        console.log('SignClient already initialized globally, reusing...')
        this.client = (window as unknown as Record<string, unknown>)
          .__WALLETCONNECT_SIGN_CLIENT__ as InstanceType<typeof SignClient>
      } else {
        // Initialize the SignClient
        this.client = await SignClient.init({
          projectId: environment.wallet.walletConnect.projectId,
          metadata: CHIA_METADATA,
          relayUrl: 'wss://relay.walletconnect.com',
        })

        // Store globally to prevent re-initialization
        if (typeof window !== 'undefined') {
          ;(window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__ =
            this.client
        }
      }

      // Initialize Web3Modal
      this.web3Modal = new Web3Modal({
        projectId: environment.wallet.walletConnect.projectId,
        standaloneChains: [CHIA_CHAIN_ID],
        walletConnectVersion: 2,
      })

      this.setupEventListeners()
      await this.checkPersistedState()

      console.log('WalletConnect initialized successfully')
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        projectId: environment.wallet.walletConnect.projectId,
        environment: import.meta.env.MODE,
      })
      throw error
    } finally {
      SageWalletConnectService.isInitializing = false
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
        optionalNamespaces: REQUIRED_NAMESPACES,
      })

      console.log('Connect - URI generated', {
        uri: uri?.substring(0, 50) + '...',
      })

      if (uri) {
        this.web3Modal.openModal({ uri })
        console.log('Connect - Modal opened, waiting for approval')

        const session = await approval()
        console.log('Connect - Session approved', { topic: session.topic })

        this.onSessionConnected(session)
        this.pairings = this.client.pairing.getAll({ active: true })
        this.web3Modal.closeModal()

        console.log('Connect - Connection complete')
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
        optionalNamespaces: REQUIRED_NAMESPACES,
      })

      console.log('StartConnection - URI generated', {
        uri: uri?.substring(0, 50) + '...',
      })

      if (uri) {
        // Wrap the approval function to handle session connection
        const wrappedApproval = async () => {
          const session = await approval()
          if (session) {
            this.onSessionConnected(session)
            this.pairings = this.client!.pairing.getAll({ active: true })
          }
          return session
        }

        return { uri, approval: wrappedApproval }
      }

      console.warn('StartConnection - No URI generated')
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
  async getWalletInfo(): Promise<SageWalletInfo | null> {
    console.log('getWalletInfo called - session:', !!this.session, 'fingerprint:', this.fingerprint)

    if (!this.session) {
      console.warn('Cannot get wallet info: no session')
      console.log('Session details:', this.session)
      return null
    }

    // If no fingerprint, try to extract it from session
    if (!this.fingerprint) {
      console.log('No fingerprint found, attempting to extract from session')
      this.onSessionConnected(this.session)
    }

    if (!this.fingerprint) {
      console.warn('Cannot get wallet info: no fingerprint available')
      return null
    }

    console.log('Getting wallet info for fingerprint:', this.fingerprint)

    try {
      // Extract address from session accounts
      const accounts = this.extractAccounts(this.session)
      const chiaAccount = accounts.find(
        account => account.startsWith('xch') || account.startsWith('txch')
      )
      const fallbackAddress = chiaAccount || `chia:testnet:${this.fingerprint}`

      console.log('Session accounts:', accounts)
      console.log('Chia account found:', chiaAccount)
      console.log('Fallback address:', fallbackAddress)

      // Try to get real wallet data using RPC calls
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

      console.log('Attempting to get wallet info using RPC calls...')

      try {
        // Get current address
        try {
          console.log('Getting current address...')
          const addressResponse = await this.request<{ address: string }>(
            SageMethods.CHIA_GET_ADDRESS,
            {}
          )
          if (addressResponse && addressResponse.address) {
            address = addressResponse.address
            console.log('Current address:', address)
          }
        } catch (addressError) {
          console.warn('Failed to get current address:', addressError)
          // Keep fallback address
        }

        // Get wallet balance - temporarily skip due to hex decoding issues
        // TODO: Find the correct method/parameters for getting native XCH balance
        try {
          console.log('Skipping wallet balance RPC call due to hex decoding issues...')
          // For now, use a default balance structure
          balance = {
            confirmed_wallet_balance: 0,
            unconfirmed_wallet_balance: 0,
            spendable_balance: 0,
            pending_change: 0,
            max_send_amount: 0,
            unspent_coin_count: 0,
            pending_coin_removal_count: 0,
          }
          console.log('Using default balance structure:', balance)
        } catch (error) {
          console.error('Failed to set default balance:', error)
        }

        // Return wallet info with real data
        const walletInfo: SageWalletInfo = {
          address,
          balance,
          fingerprint: parseInt(this.fingerprint),
          isConnected: true,
        }

        console.log('Returning wallet info:', walletInfo)
        return walletInfo
      } catch (error) {
        console.error('Failed to get wallet info:', error)
        // Return basic info with fallback values
        const walletInfo: SageWalletInfo = {
          address: fallbackAddress,
          balance: {
            confirmed_wallet_balance: 0,
            unconfirmed_wallet_balance: 0,
            spendable_balance: 0,
            pending_change: 0,
            max_send_amount: 0,
            unspent_coin_count: 0,
            pending_coin_removal_count: 0,
          },
          fingerprint: parseInt(this.fingerprint),
          isConnected: true,
        }
        return walletInfo
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
    console.log(`RPC request attempt: ${method}`, {
      hasClient: !!this.client,
      hasSession: !!this.session,
      hasFingerprint: !!this.fingerprint,
      sessionTopic: this.session?.topic,
    })

    if (!this.client) {
      throw new Error('WalletConnect is not initialized')
    }
    if (!this.session) {
      throw new Error('Session is not connected')
    }
    if (!this.fingerprint) {
      throw new Error('Fingerprint is not loaded')
    }

    console.log(`Making RPC request: ${method}`, data)

    try {
      const result = await this.client.request<{ data: T } | { error: Record<string, unknown> }>({
        topic: this.session.topic,
        chainId: CHIA_CHAIN_ID,
        request: {
          method,
          params: { fingerprint: parseInt(this.fingerprint), ...data },
        },
      })

      console.log(`RPC response for ${method}:`, result)

      // Handle different response types
      if (typeof result === 'string') {
        // Some methods return strings directly (like chip0002_chainId)
        return result
      }

      if ('error' in result) {
        console.error(`RPC error for ${method}:`, result.error)
        throw new Error(JSON.stringify(result.error))
      }

      return result.data
    } catch (error) {
      console.error(`RPC request failed for ${method}:`, error)
      throw error
    }
  }

  /**
   * Handle wallet connect commands using the command handler
   */
  async handleCommand<TParams extends CommandParams, TResponse extends CommandResponse>(
    command: WalletConnectCommand,
    params: TParams
  ): Promise<TResponse> {
    if (!this.session || !this.fingerprint) {
      throw new Error('Wallet not connected')
    }

    const context: HandlerContext = {
      fingerprint: parseInt(this.fingerprint),
      session: {
        topic: this.session.topic,
        chainId: CHIA_CHAIN_ID,
      },
    }

    return await commandHandler.handleCommand(command, params, context)
  }

  /**
   * Execute a wallet command with proper error handling
   */
  async executeCommand<TParams extends CommandParams, TResponse extends CommandResponse>(
    command: WalletConnectCommand,
    params: TParams
  ): Promise<{ success: boolean; data?: TResponse; error?: string }> {
    try {
      const data = await this.handleCommand<TParams, TResponse>(command, params)
      return { success: true, data }
    } catch (error) {
      console.error(`Command ${command} failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command failed',
      }
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): SageConnectionState {
    console.log(
      'getConnectionState called - session:',
      !!this.session,
      'fingerprint:',
      this.fingerprint
    )
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
  async refreshWalletInfo(): Promise<SageWalletInfo | null> {
    console.log('Refreshing wallet info...')
    return await this.getWalletInfo()
  }

  /**
   * Test RPC connection with a simple method
   */
  async testRpcConnection(): Promise<boolean> {
    try {
      if (!this.session || !this.fingerprint) {
        console.log('No session or fingerprint available for RPC test')
        return false
      }

      console.log('Testing RPC connection...')
      // Test with a simple method like get_sync_status
      const response = await this.client!.request<boolean>({
        topic: this.session.topic,
        chainId: CHIA_CHAIN_ID,
        request: {
          method: SageMethods.CHIP0002_CONNECT,
          params: { fingerprint: parseInt(this.fingerprint) },
        },
      })
      console.log('RPC test successful:', response)
      return true
    } catch (error) {
      console.error('RPC connection test failed:', error)
      return false
    }
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
    console.log('Session connected, namespaces:', session.namespaces)

    const allNamespaceAccounts = session.namespaces
      ? Object.values(session.namespaces)
          .map(namespace => namespace.accounts)
          .flat()
      : []

    console.log('All namespace accounts:', allNamespaceAccounts)

    this.session = session

    // Try different ways to extract fingerprint
    if (allNamespaceAccounts.length > 0) {
      const firstAccount = allNamespaceAccounts[0]
      console.log('First account:', firstAccount)

      // Try splitting by ':' and taking the last part
      const parts = firstAccount.split(':')
      console.log('Account parts:', parts)

      if (parts.length >= 3) {
        this.fingerprint = parts[2]
      } else if (parts.length >= 2) {
        this.fingerprint = parts[1]
      } else {
        this.fingerprint = parts[0]
      }
    } else {
      // If no accounts found, try to extract from session topic or use a fallback
      console.log('No accounts found, using session topic as fallback')
      this.fingerprint = session.topic.substring(0, 8) // Use first 8 chars of topic as fallback
    }

    // Ensure fingerprint is set
    if (!this.fingerprint) {
      console.log('No fingerprint extracted, using session topic')
      this.fingerprint = session.topic.substring(0, 8)
    }

    console.log('Session connected', {
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

    console.log('Checking persisted state...')
    this.pairings = this.client.pairing.getAll({ active: true })
    console.log('Active pairings:', this.pairings.length)

    // Check if we already have a session
    if (this.session) {
      console.log('Session already exists, skipping restoration')
      return
    }

    // Try to restore session from persisted state
    console.log('Session length:', this.client.session.length)
    if (this.client.session.length) {
      const lastKeyIndex = this.client.session.keys.length - 1
      const session = this.client.session.get(this.client.session.keys[lastKeyIndex])
      console.log('Retrieved session:', session)

      // Check if session is still valid (not expired)
      if (session && session.expiry > Date.now() / 1000) {
        console.log('Session is valid, restoring...')
        this.onSessionConnected(session)
        this.emitEvent('session_restored', session)
      } else {
        console.log('Session expired, cleaning up')
        // Session expired, clean up
        this.reset()
      }
    } else {
      console.log('No persisted sessions found')
    }
  }

  private setupEventListeners() {
    if (!this.client) return

    this.client.on('session_update', ({ topic, params }) => {
      console.log('Session update', { topic, params })
      const { namespaces } = params
      const session = this.client!.session.get(topic)
      const updatedSession = { ...session, namespaces }
      this.onSessionConnected(updatedSession)
      this.emitEvent('session_update', { topic, params })
    })

    this.client.on('session_delete', ({ topic }) => {
      console.log('Session deleted', { topic })
      this.reset()
      this.emitEvent('session_delete', { topic })
    })

    this.client.on('session_event', (...args) => {
      console.log('Session event', args)
    })

    this.client.on('session_proposal', proposal => {
      console.log('Session proposal', {
        id: proposal.id,
        proposer: 'Unknown', // Simplified for now
      })
    })

    // Note: session_approve and session_reject are not standard WalletConnect v2 events
    // These would be handled through the connection flow

    this.client.on('session_expire', ({ topic }) => {
      console.log('Session expired', { topic })
      this.reset()
      this.emitEvent('session_expire', { topic })
    })

    this.client.on('session_request', event => {
      console.log('Session request', event)
      this.emitEvent('session_request', event)
    })

    this.client.on('session_request_sent', event => {
      console.log('Session request sent', event)
      this.emitEvent('session_request_sent', event)
    })

    // Note: session_response is not a standard WalletConnect v2 event
    // This would be handled through the request/response flow
  }

  private extractAccounts(session: SessionTypes.Struct): string[] {
    return session.namespaces
      ? Object.values(session.namespaces)
          .map(namespace => namespace.accounts)
          .flat()
      : []
  }

  private mapSession(session: SessionTypes.Struct): WalletConnectSession {
    return {
      topic: session.topic,
      pairingTopic: session.pairingTopic || '',
      relay: session.relay || { protocol: 'irn' },
      namespaces: session.namespaces,
      acknowledged: session.acknowledged,
      controller: session.controller,
      expiry: session.expiry,
      requiredNamespaces: session.requiredNamespaces,
      optionalNamespaces: session.optionalNamespaces,
      self: session.self || {
        publicKey: '',
        metadata: {
          name: 'Penguin Pool',
          description: 'Decentralized lending platform',
          url: 'https://penguin.pool',
          icons: [],
        },
      },
      peer: session.peer,
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
export const sageWalletConnectService = new SageWalletConnectService()
