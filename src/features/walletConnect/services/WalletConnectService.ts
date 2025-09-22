/**
 * WalletConnect Service
 *
 * This service provides a unified interface for connecting to Chia blockchain networks
 * using WalletConnect v2.
 */

import { useUserStore } from '@/entities/user/store/userStore'
import {
  CHIA_MAINNET_CHAIN_ID,
  CHIA_TESTNET_CHAIN_ID,
  environment,
} from '@/shared/config/environment'
import { WalletConnectModal, type WalletConnectModalConfig } from '@walletconnect/modal'
import { SignClient } from '@walletconnect/sign-client'
import type { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { reactive } from 'vue'
import {
  useIOSWalletConnection,
  type SignClientInterface,
} from '../composables/useIOSWalletConnection'

// Define WalletConnect network interface
interface WalletConnectNetwork {
  id: string
  name: string
  rpcUrls: {
    default: { http: string[] }
  }
  blockExplorers: {
    default: { name: string; url: string }
  }
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

// Define Chia network configurations
const chiaMainnet: WalletConnectNetwork = {
  id: CHIA_MAINNET_CHAIN_ID,
  name: 'Chia Mainnet',
  rpcUrls: {
    default: { http: ['https://mainnet.chia.net'] },
  },
  blockExplorers: {
    default: { name: 'Spacescan', url: 'https://spacescan.io' },
  },
  nativeCurrency: {
    name: 'Chia',
    symbol: 'XCH',
    decimals: 12,
  },
}

const chiaTestnet: WalletConnectNetwork = {
  id: CHIA_TESTNET_CHAIN_ID,
  name: 'Chia Testnet',
  rpcUrls: {
    default: { http: ['https://testnet.chia.net'] },
  },
  blockExplorers: {
    default: { name: 'Spacescan Testnet', url: 'https://testnet.spacescan.io' },
  },
  nativeCurrency: {
    name: 'Testnet Chia',
    symbol: 'TXCH',
    decimals: 12,
  },
}

// All supported networks (only Chia networks)
const networks: [WalletConnectNetwork, ...WalletConnectNetwork[]] = [
  // Chia networks
  chiaMainnet,
  chiaTestnet,
]

export interface WalletConnectState {
  isConnected: boolean
  isConnecting: boolean
  isInitialized: boolean
  session: SessionTypes.Struct | null
  accounts: string[]
  chainId: string | null
  error: string | null
  currentNetwork: WalletConnectNetwork | null
}

export interface ConnectionResult {
  success: boolean
  session?: SessionTypes.Struct
  accounts?: string[]
  error?: string
}

export interface DisconnectResult {
  success: boolean
  error?: string
}

/**
 * WalletConnect Service with Chia Support
 *
 * This service provides a unified interface for connecting to Chia blockchain networks
 * using WalletConnect v2.
 */
export class WalletConnectService {
  private signClient: InstanceType<typeof SignClient> | null = null
  private modal: WalletConnectModal | null = null
  private state = reactive<WalletConnectState>({
    isConnected: false,
    isConnecting: false,
    isInitialized: false,
    session: null,
    accounts: [],
    chainId: null,
    error: null,
    currentNetwork: null,
  })
  private eventListeners: Map<string, (data: unknown) => void> = new Map()
  private isInitializing = false
  private initializationPromise: Promise<void> | null = null
  private iosConnection = useIOSWalletConnection()

  constructor() {
    // Initialize on construction
    this.initialize()
  }

  /**
   * Initialize WalletConnect with Chia support
   */
  async initialize(): Promise<void> {
    if (this.isInitializing) {
      return this.initializationPromise!
    }

    if (this.signClient) {
      console.log('✅ WalletConnect already initialized')
      return
    }

    this.isInitializing = true
    this.initializationPromise = this.performInitialization()

    try {
      await this.initializationPromise
      console.log('✅ WalletConnect initialized successfully')
    } catch (error) {
      console.error('❌ WalletConnect initialization failed:', error)
      this.state.error = error instanceof Error ? error.message : 'Initialization failed'
      throw error
    } finally {
      this.isInitializing = false
      this.initializationPromise = null
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      // Validate configuration
      this.validateConfiguration()

      // Initialize SignClient with base options
      const baseSignClientOptions: SignClientTypes.Options = {
        projectId: environment.wallet.walletConnect.projectId,
        metadata: {
          name: environment.wallet.walletConnect.metadata.name,
          description: environment.wallet.walletConnect.metadata.description,
          url: environment.wallet.walletConnect.metadata.url || 'https://penguin-pool.com',
          icons: [...(environment.wallet.walletConnect.metadata.icons || [])],
        },
      }

      // Get iOS-specific options if needed
      const signClientOptions = this.iosConnection.getSignClientOptions(
        baseSignClientOptions as unknown as Record<string, unknown>
      ) as unknown as SignClientTypes.Options

      this.signClient = await SignClient.init(signClientOptions)

      // Set up global error handling to prevent page reloads
      this.setupGlobalErrorHandling()

      // Set up event listeners immediately after SignClient creation
      this.setupEventListeners()

      // Initialize iOS-specific relay healing if on iOS
      if (this.iosConnection.state.value.isIOS) {
        this.iosConnection.initializeRelayHealing(this.signClient as unknown as SignClientInterface)
      }

      // Initialize Modal with base configuration
      const baseModalOptions: WalletConnectModalConfig = {
        projectId: environment.wallet.walletConnect.projectId,
        chains: [CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID],
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '1000',
        },
      }

      // Get iOS-specific modal options if needed
      const modalOptions = this.iosConnection.getModalOptions(
        baseModalOptions as unknown as Record<string, unknown>
      ) as unknown as WalletConnectModalConfig

      this.modal = new WalletConnectModal(modalOptions)

      // Set up iOS-specific connection monitoring
      if (this.iosConnection.state.value.isIOS) {
        this.iosConnection.setupConnectionMonitoring(
          this.signClient as unknown as SignClientInterface,
          () => {
            this.state.isConnected = false
            this.state.session = null
            this.emitEvent('disconnect', { reason: 'Connection lost' })
          }
        )
      }

      // Check for existing sessions and restore state
      await this.restoreExistingSessions()

      // Update state
      this.state.isInitialized = true
      this.state.error = null

      console.log('✅ WalletConnect initialization completed')
    } catch (error) {
      console.error('❌ WalletConnect initialization failed:', error)
      this.state.error = error instanceof Error ? error.message : 'Initialization failed'
      throw error
    }
  }

  private validateConfiguration(): void {
    if (!environment.wallet.walletConnect.projectId) {
      throw new Error('WalletConnect Project ID is not configured')
    }
    console.log('✅ WalletConnect configuration validated')
  }

  /**
   * Restore existing sessions from WalletConnect storage
   */
  private async restoreExistingSessions(): Promise<void> {
    if (!this.signClient) {
      console.log('⚠️ SignClient not available for session restoration')
      return
    }

    try {
      console.log('🔄 Checking for existing sessions...')

      // Get all active sessions
      const sessions = this.signClient.session.getAll()
      console.log('📋 Found sessions:', sessions.length)

      if (sessions.length === 0) {
        console.log('ℹ️ No existing sessions found')
        return
      }

      // Find the most recent session (usually the last one)
      const activeSession = sessions[sessions.length - 1]
      console.log('🔍 Restoring session:', activeSession.topic)

      // Check if the session is still valid
      if (activeSession && activeSession.expiry > Date.now() / 1000) {
        console.log('✅ Valid session found, restoring state...')

        // Update state with restored session data
        this.state.isConnected = true
        this.state.session = activeSession

        // Extract wallet information from session
        const accounts =
          activeSession.namespaces?.chia?.accounts?.map(
            (account: string) => account.split(':')[2]
          ) || []

        let chainId = activeSession.namespaces?.chia?.chains?.[0]?.split(':')[2] || null

        // If no chainId from chains array, try to get it from the account string
        if (!chainId && accounts.length > 0) {
          const accountString = activeSession.namespaces?.chia?.accounts?.[0]
          if (accountString) {
            const parts = accountString.split(':')
            if (parts.length >= 2) {
              chainId = parts[1] // Extract chainId from account string like "chia:testnet:address"
            }
          }
        }

        // If still no chainId, use a default (testnet)
        if (!chainId) {
          chainId = 'testnet'
          console.log('⚠️ No chainId found in restored session, using default testnet')
        }

        this.state.accounts = accounts
        this.state.chainId = chainId
        this.state.currentNetwork = this.getNetworkById(chainId)
        this.state.error = null

        console.log('✅ Session restored successfully:', {
          topic: activeSession.topic,
          accounts,
          chainId,
          network: this.state.currentNetwork?.name,
        })

        // Update user store authentication state
        const userStore = useUserStore()
        if (accounts.length > 0) {
          // Use the first account as the wallet identifier
          const walletIdentifier = accounts[0]
          await userStore.login(walletIdentifier)
          console.log('✅ User authentication state updated after session restoration')
        }

        // Emit restore event
        this.emitEvent('session_restore', activeSession)
      } else {
        console.log('⚠️ Session expired or invalid, not restoring')
      }
    } catch (error) {
      console.error('❌ Failed to restore existing sessions:', error)
      // Don't throw error, just log it - session restoration is not critical
    }
  }

  /**
   * Set up global error handling to prevent page reloads
   */
  private setupGlobalErrorHandling(): void {
    try {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', event => {
        console.error('🚨 Unhandled promise rejection:', event.reason)

        // Check if it's a WebSocket or WalletConnect related error
        const errorMessage = event.reason?.message || event.reason?.toString() || ''
        if (
          errorMessage.includes('WebSocket') ||
          errorMessage.includes('relay') ||
          errorMessage.includes('WalletConnect') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('network')
        ) {
          console.warn('🚨 WebSocket/WalletConnect error caught, preventing page reload')
          event.preventDefault() // Prevent the default behavior (page reload)
        }
      })

      // Handle uncaught errors
      window.addEventListener('error', event => {
        console.error('🚨 Uncaught error:', event.error)

        // Check if it's a WebSocket or WalletConnect related error
        const errorMessage = event.error?.message || event.message || ''
        if (
          errorMessage.includes('WebSocket') ||
          errorMessage.includes('relay') ||
          errorMessage.includes('WalletConnect') ||
          errorMessage.includes('connection') ||
          errorMessage.includes('network')
        ) {
          console.warn('🚨 WebSocket/WalletConnect error caught, preventing page reload')
          event.preventDefault() // Prevent the default behavior (page reload)
        }
      })

      // Handle WebSocket errors specifically
      window.addEventListener('error', event => {
        if (event.target && (event.target as HTMLElement).tagName === 'SCRIPT') {
          const src = (event.target as HTMLScriptElement).src
          if (src && src.includes('.map')) {
            console.warn('🚨 Source map error ignored:', src)
            event.preventDefault()
          }
        }
      })

      console.log('🚨 Global error handling set up to prevent page reloads')
    } catch (error) {
      console.error('🚨 Error setting up global error handling:', error)
    }
  }

  private setupEventListeners(): void {
    if (!this.signClient) return

    // Listen for session events
    this.signClient.on('session_event', (event: unknown) => {
      try {
        console.log('🔗 WalletConnect session event:', event)
        this.emitEvent('session_event', event)
      } catch (error) {
        console.error('🚨 Error in session_event handler:', error)
      }
    })

    // Listen for session requests
    this.signClient.on('session_request', (event: unknown) => {
      try {
        console.log('📨 WalletConnect session request:', event)
        this.emitEvent('session_request', event)
      } catch (error) {
        console.error('🚨 Error in session_request handler:', error)
      }
    })

    // Listen for session update
    this.signClient.on('session_update', (event: unknown) => {
      try {
        console.log('🔄 WalletConnect session update:', event)
        const eventData = event as { topic?: string }
        this.state.session = eventData.topic
          ? this.signClient?.session.get(eventData.topic) || null
          : null
        this.state.accounts =
          this.state.session?.namespaces?.chia?.accounts?.map(
            (account: string) => account.split(':')[2]
          ) || []
        this.state.chainId =
          this.state.session?.namespaces?.chia?.chains?.[0]?.split(':')[2] || null
        this.state.currentNetwork = this.getNetworkById(this.state.chainId)
        this.emitEvent('session_update', event)
      } catch (error) {
        console.error('🚨 Error in session_update handler:', error)
      }
    })

    // Listen for session delete
    this.signClient.on('session_delete', (event: unknown) => {
      console.log('🔌 WalletConnect session deleted:', event)
      this.state.isConnected = false
      this.state.isConnecting = false
      this.state.session = null
      this.state.accounts = []
      this.state.chainId = null
      this.state.currentNetwork = null
      this.state.error = null
      this.emitEvent('session_delete', event)
    })

    // Listen for connection events
    this.signClient.on('session_connect', (event: unknown) => {
      try {
        console.log('🔗 WalletConnect connected:', event)
        const eventData = event as { session?: SessionTypes.Struct }
        this.state.isConnected = true
        this.state.isConnecting = false
        this.state.session = eventData.session || null
        this.state.accounts =
          eventData.session?.namespaces?.chia?.accounts?.map(
            (account: string) => account.split(':')[2]
          ) || []
        this.state.chainId = eventData.session?.namespaces?.chia?.chains?.[0]?.split(':')[2] || null
        this.state.currentNetwork = this.getNetworkById(this.state.chainId)
        this.state.error = null
        this.emitEvent('connect', event)
      } catch (error) {
        console.error('🚨 Error in session_connect handler:', error)
      }
    })

    // Listen for relayer events
    if (this.signClient.core && this.signClient.core.relayer) {
      this.signClient.core.relayer.on('relayer_connect', () => {
        try {
          console.log('🛜 Relayer connected - WebSocket reestablished')
          this.emitEvent('relayer_connect', { timestamp: Date.now() })
        } catch (error) {
          console.error('🚨 Error in relayer_connect handler:', error)
        }
      })

      this.signClient.core.relayer.on('relayer_disconnect', (error: unknown) => {
        try {
          console.warn('🛑 Relayer disconnected - WebSocket lost:', error)
          this.emitEvent('relayer_disconnect', { error, timestamp: Date.now() })
        } catch (eventError) {
          console.error('🚨 Error in relayer_disconnect handler:', eventError)
        }
      })

      this.signClient.core.relayer.on('relayer_error', (error: unknown) => {
        try {
          console.error('❌ Relayer error:', error)
          this.emitEvent('relayer_error', { error, timestamp: Date.now() })
        } catch (eventError) {
          console.error('🚨 Error in relayer_error handler:', eventError)
        }
      })
    }

    // Listen for disconnection events
    this.signClient.on('session_delete', (event: unknown) => {
      console.log('🔌 WalletConnect disconnected:', event)
      this.state.isConnected = false
      this.state.isConnecting = false
      this.state.session = null
      this.state.accounts = []
      this.state.chainId = null
      this.state.currentNetwork = null
      this.state.error = null
      this.emitEvent('disconnect', event)
    })

    // Listen for errors
    this.signClient.on('session_event', (event: unknown) => {
      const eventData = event as { error?: { message?: string } }
      if (eventData.error) {
        console.error('❌ WalletConnect error:', event)
        this.state.error = eventData.error?.message || 'Unknown error'
        this.emitEvent('error', event)
      }
    })

    // Note: session_restore is not a real WalletConnect event
    // We handle session restoration manually in restoreExistingSessions()
  }

  private getNetworkById(chainId: string | null): WalletConnectNetwork | null {
    if (!chainId) return null
    const normalizedChainId = chainId.startsWith('chia:') ? chainId : `chia:${chainId}`
    return networks.find(network => network.id === normalizedChainId) || null
  }

  /**
   * Get network information
   */
  getNetworkInfo(): {
    chainId: string | null
    network: WalletConnectNetwork | null
    isTestnet: boolean
  } {
    const isTestnet =
      this.state.chainId?.includes('testnet') || this.state.chainId?.includes('test') || false
    return {
      chainId: this.state.chainId,
      network: this.state.currentNetwork,
      isTestnet,
    }
  }

  /**
   * Make a request to the wallet
   */
  async request<T = unknown>(method: string, params: unknown[]): Promise<T> {
    if (!this.signClient || !this.state.session) {
      throw new Error('WalletConnect not connected')
    }

    try {
      console.log('🔗 WalletConnect request:', { method, params })

      const result = await this.signClient.request({
        topic: this.state.session.topic as string,
        chainId: `chia:${this.state.chainId || ''}`,
        request: {
          method,
          params,
        },
      })

      console.log('✅ WalletConnect response:', result)
      return result as T
    } catch (error) {
      console.error('❌ WalletConnect request failed:', error)
      throw error
    }
  }

  private emitEvent(event: string, data: unknown): void {
    const callback = this.eventListeners.get(event)
    if (callback) {
      callback(data)
    }
  }

  /**
   * Connect to wallet
   */
  async connect(): Promise<ConnectionResult> {
    if (!this.signClient || !this.modal) {
      throw new Error('WalletConnect not initialized')
    }

    try {
      this.state.isConnecting = true
      this.state.error = null

      console.log('🔗 Connecting to wallet...')

      // Create connection proposal
      const { uri, approval } = await this.signClient.connect({
        requiredNamespaces: {
          chia: {
            methods: [
              'chia_sign_message',
              'chia_send_transaction',
              'chia_getAddress',
              'chia_signMessageByAddress',
              'chip0002_connect',
              'chip0002_chainId',
              'chip0002_getPublicKeys',
              'chip0002_filterUnlockedCoins',
              'chip0002_getAssetCoins',
              'chip0002_getAssetBalance',
              'chip0002_signCoinSpends',
              'chip0002_signMessage',
              'chip0002_sendTransaction',
              'chia_createOffer',
              'chia_takeOffer',
              'chia_cancelOffer',
              'chia_getNfts',
              'chia_send',
              'chia_bulkMintNfts',
            ],
            chains: [CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
      })

      if (uri) {
        console.log('📱 Opening WalletConnect modal with URI')

        // Use iOS modal for iOS devices, standard modal for others
        if (this.iosConnection.state.value.isIOS) {
          // For iOS, emit a custom event to show the custom modal
          window.dispatchEvent(new CustomEvent('show_ios_modal', { detail: { uri } }))
        } else {
          this.modal?.openModal({ uri })
        }

        // Wait for approval with iOS-specific timeout
        console.log('⏳ Waiting for wallet approval...')
        const timeout = this.iosConnection.getConnectionTimeout(60000) // 1 minute base, 2 minutes for iOS
        console.log(`⏰ Using timeout: ${timeout}ms (iOS: ${this.iosConnection.state.value.isIOS})`)

        const session = await Promise.race([
          approval(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout - please try again')), timeout)
          ),
        ])
        console.log('✅ Wallet approved, session received:', session)
        console.log('🔍 Session structure:', {
          namespaces: session.namespaces,
          chia: session.namespaces?.chia,
          accounts: session.namespaces?.chia?.accounts,
          chains: session.namespaces?.chia?.chains,
        })

        // Close modal
        if (this.iosConnection.state.value.isIOS) {
          window.dispatchEvent(new CustomEvent('hide_ios_modal'))
        } else {
          this.modal?.closeModal()
        }

        // Update state with session data
        this.state.isConnected = true
        this.state.isConnecting = false
        this.state.session = session

        // Extract wallet information from session
        const accounts =
          session.namespaces?.chia?.accounts?.map((account: string) => account.split(':')[2]) || []

        console.log('🔍 Session namespaces:', session.namespaces)
        console.log('🔍 Chia namespace:', session.namespaces?.chia)
        console.log('🔍 Chia chains:', session.namespaces?.chia?.chains)
        console.log('🔍 Chia accounts:', session.namespaces?.chia?.accounts)

        let chainId = session.namespaces?.chia?.chains?.[0]?.split(':')[2] || null

        // If no chainId from chains array, try to get it from the account string
        if (!chainId && accounts.length > 0) {
          const accountString = session.namespaces?.chia?.accounts?.[0]
          if (accountString) {
            const parts = accountString.split(':')
            if (parts.length >= 2) {
              chainId = parts[1] // Extract chainId from account string like "chia:testnet:address"
              console.log('🔍 Extracted chainId from account string:', chainId)
            }
          }
        }

        // If still no chainId, use a default (testnet)
        if (!chainId) {
          chainId = 'testnet'
          console.log('⚠️ No chainId found in session, using default testnet')
        }

        console.log('🔍 Final chainId:', chainId)

        this.state.accounts = accounts
        this.state.chainId = chainId
        this.state.currentNetwork = this.getNetworkById(chainId)
        this.state.error = null

        console.log('📝 Extracted wallet info:', {
          accounts,
          chainId,
          network: this.state.currentNetwork?.name,
          sessionTopic: session.topic,
        })

        return {
          success: true,
          session,
          accounts,
        }
      }

      return { success: false, error: 'No connection URI generated' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      this.state.error = errorMessage
      this.state.isConnecting = false
      console.error('❌ Connection failed:', error)
      if (this.iosConnection.state.value.isIOS) {
        window.dispatchEvent(new CustomEvent('hide_ios_modal'))
      } else {
        this.modal?.closeModal()
      }

      // Get iOS-specific error message if needed
      const finalErrorMessage = this.iosConnection.getIOSErrorMessage(errorMessage)

      this.state.error = finalErrorMessage
      return { success: false, error: finalErrorMessage }
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<DisconnectResult> {
    if (!this.signClient || !this.state.session) {
      return { success: true }
    }

    try {
      console.log('🔌 Disconnecting from wallet...')
      await this.signClient.disconnect({
        topic: this.state.session.topic as string,
        reason: {
          code: 6000,
          message: 'User disconnected',
        },
      })

      this.state.isConnected = false
      this.state.isConnecting = false
      this.state.session = null
      this.state.accounts = []
      this.state.chainId = null
      this.state.currentNetwork = null
      this.state.error = null

      // Cleanup iOS connection monitoring
      if (this.iosConnection.state.value.isIOS) {
        this.iosConnection.cleanupConnectionMonitoring()
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect failed'
      console.error('❌ Disconnect failed:', error)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(chainId: string): Promise<boolean> {
    if (!this.signClient || !this.state.session) {
      throw new Error('WalletConnect not connected')
    }

    try {
      console.log(`🔄 Switching to network: ${chainId}`)

      // Update session with new chain
      await this.signClient.update({
        topic: this.state.session.topic as string,
        namespaces: {
          chia: {
            chains: [`chia:${chainId}`],
            methods: [
              'chia_sign_message',
              'chia_send_transaction',
              'chia_getAddress',
              'chia_signMessageByAddress',
              'chip0002_connect',
              'chip0002_chainId',
              'chip0002_getPublicKeys',
              'chip0002_filterUnlockedCoins',
              'chip0002_getAssetCoins',
              'chip0002_getAssetBalance',
              'chip0002_signCoinSpends',
              'chip0002_signMessage',
              'chip0002_sendTransaction',
              'chia_createOffer',
              'chia_takeOffer',
              'chia_cancelOffer',
              'chia_getNfts',
              'chia_send',
              'chia_bulkMintNfts',
            ],
            events: ['chainChanged', 'accountsChanged'],
            accounts: [`chia:${chainId}:${this.state.accounts[0] || ''}`],
          },
        },
      })

      this.state.chainId = chainId
      this.state.currentNetwork = this.getNetworkById(chainId)

      return true
    } catch (error) {
      console.error('❌ Network switch failed:', error)
      this.state.error = error instanceof Error ? error.message : 'Network switch failed'
      return false
    }
  }

  /**
   * Get current state
   */
  getState(): WalletConnectState {
    return this.state
  }

  /**
   * Wait for initialization to complete
   */
  async waitForInitialization(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise
    }
  }

  /**
   * Get reactive state for watching
   */
  getReactiveState() {
    return this.state
  }

  /**
   * Get connection information for wallet requests
   */
  getConnectionInfo(): {
    session: SessionTypes.Struct
    fingerprint: string
    chainId: string
    client: InstanceType<typeof SignClient>
  } {
    if (!this.signClient || !this.state.session) {
      throw new Error('WalletConnect not connected')
    }

    // Extract fingerprint from the first account or use a default
    const fingerprint = this.state.accounts[0] || '0'

    return {
      session: this.state.session,
      fingerprint,
      chainId: `chia:${this.state.chainId || 'testnet'}`,
      client: this.signClient,
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.isConnected
  }

  /**
   * Check if connecting
   */
  isConnecting(): boolean {
    return this.state.isConnecting
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.state.isInitialized
  }

  /**
   * Get current accounts
   */
  getAccounts(): string[] {
    return [...this.state.accounts]
  }

  /**
   * Get current chain ID
   */
  getChainId(): string | null {
    return this.state.chainId
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): WalletConnectNetwork | null {
    return this.state.currentNetwork
  }

  /**
   * Get all supported networks
   */
  getSupportedNetworks(): WalletConnectNetwork[] {
    return [...networks]
  }

  /**
   * Get networks by type (only Chia supported)
   */
  getNetworksByType(type: 'chia'): WalletConnectNetwork[] {
    return networks.filter(network => {
      if (type === 'chia') {
        return network.id.startsWith('chia:')
      }
      return false
    })
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: unknown) => void): void {
    this.eventListeners.set(event, callback)
  }

  /**
   * Remove event listener
   */
  off(event: string): void {
    this.eventListeners.delete(event)
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.eventListeners.clear()

    // Clean up iOS-specific relay healing
    if (this.iosConnection.state.value.isIOS) {
      this.iosConnection.cleanupRelayHealing()
    }

    this.state = {
      isConnected: false,
      isConnecting: false,
      isInitialized: false,
      session: null,
      accounts: [],
      chainId: null,
      error: null,
      currentNetwork: null,
    }
    console.log('🧹 WalletConnect service cleaned up')
  }
}

// Export singleton instance
export const useWalletConnectService = new WalletConnectService()
