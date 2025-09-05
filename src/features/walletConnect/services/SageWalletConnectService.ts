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
      if (this.client) {
        console.log('WalletConnect client already initialized, skipping...')
        return
      }

      // Check if WalletConnect is properly configured
      if (!this.isConfigured()) {
        console.warn(
          'WalletConnect Project ID is not configured. WalletConnect features will be disabled.'
        )
        console.warn('Please set VITE_WALLET_CONNECT_PROJECT_ID in your environment variables.')
        return
      }

      if (SageWalletConnectService.isInitializing) {
        while (SageWalletConnectService.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        if (
          typeof window !== 'undefined' &&
          (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
        ) {
          this.client = (window as unknown as Record<string, unknown>)
            .__WALLETCONNECT_SIGN_CLIENT__ as InstanceType<typeof SignClient>
          return
        }
      }

      SageWalletConnectService.isInitializing = true

      if (
        typeof window !== 'undefined' &&
        (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
      ) {
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

      this.setupEventListeners()
      await this.checkPersistedState()
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
      if (!this.isConfigured()) {
        return {
          success: false,
          error:
            'WalletConnect is not configured. Please set VITE_WALLET_CONNECT_PROJECT_ID environment variable.',
        }
      }

      if (!this.client) {
        await this.initialize()
      }

      if (!this.client) {
        return {
          success: false,
          error: 'WalletConnect is not initialized',
        }
      }

      if (!this.web3Modal) {
        console.warn('Web3Modal is not initialized. WalletConnect features may be limited.')
        // Continue without Web3Modal - use direct connection
      }

      const { uri, approval } = await this.client.connect({
        pairingTopic: pairing?.topic,
        optionalNamespaces: REQUIRED_NAMESPACES,
      })

      if (uri) {
        if (this.web3Modal) {
          this.web3Modal.openModal({ uri })
          const session = await approval()
          this.onSessionConnected(session)
          this.pairings = this.client.pairing.getAll({ active: true })
          this.web3Modal.closeModal()
        } else {
          // Direct connection without Web3Modal
          console.log('Connection URI:', uri)
          const session = await approval()
          this.onSessionConnected(session)
          this.pairings = this.client.pairing.getAll({ active: true })
        }
      }

      return {
        success: true,
        session: this.mapSession(this.session!),
        accounts: this.extractAccounts(this.session!),
      }
    } catch (error) {
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
      if (!this.isConfigured()) {
        console.warn('WalletConnect is not configured. Cannot start connection.')
        return null
      }

      if (!this.client) {
        await this.initialize()
      }

      if (!this.client) {
        return null
      }

      const { uri, approval } = await this.client.connect({
        optionalNamespaces: REQUIRED_NAMESPACES,
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
    if (!this.session) return null
    if (!this.fingerprint) this.onSessionConnected(this.session)
    if (!this.fingerprint) return null

    const result = await this.getCurrentAddress()

    const walletInfo: SageWalletInfo = {
      address: result!.address || '',
      balance: null,
      fingerprint: parseInt(this.fingerprint),
      isConnected: true,
    }
    return walletInfo
  }

  /**
   * Make request to wallet
   */
  async request<T>(
    method: string,
    data: Record<string, unknown>
  ): Promise<{ data: T } | undefined> {
    try {
      if (!this.client) {
        throw new Error('WalletConnect is not initialized')
      }
      if (!this.session) {
        throw new Error('Session is not connected')
      }
      if (!this.fingerprint) {
        throw new Error('Fingerprint is not loaded')
      }
      const result = await this.client.request<T | { error: Record<string, unknown> }>({
        topic: this.session.topic,
        chainId: CHIA_CHAIN_ID,
        request: {
          method,
          params: { fingerprint: parseInt(this.fingerprint), ...data },
        },
      })

      if (result && typeof result === 'object' && 'error' in result) {
        console.error(`Response from wallet for ${method} is not a valid response`, result)
        return undefined
      }
      console.log(`Response from wallet for ${method}: `, result)
      return { data: result as T }
    } catch (error) {
      console.error(`request failed for ${method}:`, error)
    }
    return
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

  async getCurrentAddress(): Promise<{ address: string } | null> {
    try {
      const result = await this.request<{ address: string }>(SageMethods.CHIA_GET_ADDRESS, {})
      return result?.data || null
    } catch (addressError) {
      console.warn('Failed to get current address:', addressError)
    }
    return null
  }

  /**
   * Get current connection state
   */
  getConnectionState(): SageConnectionState {
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
   * Check if WalletConnect is properly configured
   */
  isConfigured(): boolean {
    return !!(
      environment.wallet.walletConnect.projectId &&
      environment.wallet.walletConnect.projectId !== 'your_wallet_connect_project_id_here' &&
      environment.wallet.walletConnect.projectId.trim() !== ''
    )
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
   * Test RPC connection with a simple method
   */
  async testRpcConnection(): Promise<boolean> {
    try {
      if (!this.session || !this.fingerprint) {
        console.log('No session or fingerprint available for RPC test')
        return false
      }

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

  private onSessionConnected(session: SessionTypes.Struct) {
    const allNamespaceAccounts =
      session.namespaces && typeof session.namespaces === 'object'
        ? Object.values(session.namespaces)
            .map(namespace => namespace.accounts)
            .flat()
        : []
    this.session = session

    if (allNamespaceAccounts.length > 0) {
      const firstAccount = allNamespaceAccounts[0]

      const parts = firstAccount.split(':')

      if (parts.length >= 3) {
        this.fingerprint = parts[2]
      } else if (parts.length >= 2) {
        this.fingerprint = parts[1]
      } else {
        this.fingerprint = parts[0]
      }
    } else {
      this.fingerprint = session.topic.substring(0, 8) // Use first 8 chars of topic as fallback
    }

    // Ensure fingerprint is set
    if (!this.fingerprint) {
      this.fingerprint = session.topic.substring(0, 8)
    }
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

    if (this.session) {
      console.log('Session already exists, skipping restoration')
      return
    }

    if (this.client.session.length) {
      const lastKeyIndex = this.client.session.keys.length - 1
      const session = this.client.session.get(this.client.session.keys[lastKeyIndex])

      if (session && session.expiry > Date.now() / 1000) {
        this.onSessionConnected(session)
        this.emitEvent('session_restored', session)
      } else {
        this.reset()
      }
    } else {
      console.log('No persisted sessions found')
    }
  }

  private setupEventListeners() {
    if (!this.client) return

    this.client.on('session_update', ({ topic, params }) => {
      const { namespaces } = params
      const session = this.client!.session.get(topic)
      const updatedSession = { ...session, namespaces }
      this.onSessionConnected(updatedSession)
      this.emitEvent('session_update', { topic, params })
    })

    this.client.on('session_delete', ({ topic }) => {
      this.reset()
      this.emitEvent('session_delete', { topic })
    })

    this.client.on('session_event', (...args) => {
      console.log('Session event', args)
    })

    this.client.on('session_proposal', proposal => {
      console.log('Session proposal', {
        id: proposal.id,
        proposer: 'Unknown',
      })
    })

    this.client.on('session_expire', ({ topic }) => {
      this.reset()
      this.emitEvent('session_expire', { topic })
    })

    this.client.on('session_request', event => {
      this.emitEvent('session_request', event)
    })

    this.client.on('session_request_sent', event => {
      this.emitEvent('session_request_sent', event)
    })
  }

  private extractAccounts(session: SessionTypes.Struct): string[] {
    return session.namespaces && typeof session.namespaces === 'object'
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

export const sageWalletConnectService = new SageWalletConnectService()
