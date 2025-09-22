/**
 * WalletConnect Service
 *
 * This service provides a unified interface for connecting to Chia blockchain networks
 * using WalletConnect v2.
 */

import {
  CHIA_MAINNET_CHAIN_ID,
  CHIA_TESTNET_CHAIN_ID,
  environment,
} from '@/shared/config/environment'
import { WalletConnectModal, type WalletConnectModalConfig } from '@walletconnect/modal'
import { SignClient } from '@walletconnect/sign-client'
import type { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { reactive } from 'vue'

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
  private isIOS = false
  private customModalElement: HTMLElement | null = null
  private connectionMonitor: NodeJS.Timeout | null = null
  private lastHeartbeat: number = 0

  constructor() {
    // Detect iOS
    this.isIOS = this.detectIOS()
    console.log('🍎 iOS detected:', this.isIOS)

    // Initialize on construction
    this.initialize()
  }

  /**
   * Detect if running on iOS
   */
  private detectIOS(): boolean {
    if (typeof window === 'undefined') return false

    const userAgent = window.navigator.userAgent.toLowerCase()
    return (
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    )
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

      // Initialize SignClient with iOS-specific options
      const signClientOptions: SignClientTypes.Options = {
        projectId: environment.wallet.walletConnect.projectId,
        metadata: {
          name: environment.wallet.walletConnect.metadata.name,
          description: environment.wallet.walletConnect.metadata.description,
          url: environment.wallet.walletConnect.metadata.url || 'https://penguin-pool.com',
          icons: [...(environment.wallet.walletConnect.metadata.icons || [])],
        },
      }

      // Add iOS-specific options
      if (this.isIOS) {
        signClientOptions.relayUrl = 'wss://relay.walletconnect.com'
        signClientOptions.metadata = {
          name: 'Penguin Pool (iOS)',
          description: 'Penguin Pool - Chia Lending Platform (iOS Optimized)',
          url: environment.wallet.walletConnect.metadata.url || 'https://penguin-pool.com',
          icons: [...(environment.wallet.walletConnect.metadata.icons || [])],
        }
        console.log('🍎 Using iOS-optimized SignClient configuration')
      }

      this.signClient = await SignClient.init(signClientOptions)

      // Initialize Modal with iOS-specific configuration
      const modalOptions: WalletConnectModalConfig = {
        projectId: environment.wallet.walletConnect.projectId,
        chains: [CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID],
        themeMode: 'light',
        themeVariables: {
          '--wcm-z-index': '1000',
        },
      }

      // Add iOS-specific modal options
      if (this.isIOS) {
        modalOptions.enableExplorer = false
        modalOptions.themeVariables = {
          ...modalOptions.themeVariables,
          '--wcm-z-index': '1000',
          '--wcm-background-color': '#ffffff',
          '--wcm-accent-color': '#3b82f6',
          '--wcm-accent-fill-color': '#ffffff',
          '--wcm-overlay-background-color': 'rgba(0, 0, 0, 0.5)',
        }
        console.log('🍎 Using iOS-optimized modal configuration')
      }

      this.modal = new WalletConnectModal(modalOptions)

      // Set up event listeners
      this.setupEventListeners()

      // Set up iOS-specific connection monitoring
      if (this.isIOS) {
        this.setupIOSConnectionMonitoring()
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

  private setupEventListeners(): void {
    if (!this.signClient) return

    // Listen for session events
    this.signClient.on('session_event', (event: unknown) => {
      console.log('🔗 WalletConnect session event:', event)
      this.emitEvent('session_event', event)
    })

    // Listen for session update
    this.signClient.on('session_update', (event: unknown) => {
      console.log('🔄 WalletConnect session update:', event)
      const eventData = event as { topic?: string }
      this.state.session = eventData.topic
        ? this.signClient?.session.get(eventData.topic) || null
        : null
      this.state.accounts =
        this.state.session?.namespaces?.chia?.accounts?.map(
          (account: string) => account.split(':')[2]
        ) || []
      this.state.chainId = this.state.session?.namespaces?.chia?.chains?.[0]?.split(':')[2] || null
      this.state.currentNetwork = this.getNetworkById(this.state.chainId)
      this.emitEvent('session_update', event)
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
    })

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

    // Handle both formats: 'chia:mainnet' and 'mainnet'
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

        // iOS-specific modal handling
        if (this.isIOS) {
          // Use custom iOS modal for better copy functionality
          this.showIOSModal(uri)
        } else {
          // Open standard modal with URI for QR code display
          this.modal?.openModal({ uri })
        }

        // Wait for approval with iOS-specific timeout
        console.log('⏳ Waiting for wallet approval...')
        const timeout = this.isIOS ? 120000 : 60000 // 2 minutes for iOS, 1 minute for others
        console.log(`⏰ Using timeout: ${timeout}ms (iOS: ${this.isIOS})`)

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

        // Close modal with delay for iOS to ensure proper cleanup
        if (this.isIOS) {
          setTimeout(() => this.hideIOSModal(), 1000)
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
      if (this.isIOS) {
        this.hideIOSModal()
      } else {
        this.modal?.closeModal()
      }

      // Provide iOS-specific error messages
      let finalErrorMessage = errorMessage
      if (this.isIOS && errorMessage.includes('timeout')) {
        finalErrorMessage =
          'Connection timed out on iOS. Please try again and ensure your wallet app is open.'
      } else if (this.isIOS && errorMessage.includes('rejected')) {
        finalErrorMessage =
          'Connection was rejected. Please try again and ensure you approve the connection in your wallet app.'
      } else if (this.isIOS) {
        finalErrorMessage = `iOS connection error: ${errorMessage}. Please try again.`
      }

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
      if (this.isIOS) {
        this.cleanupConnectionMonitoring()
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
   * Get iOS detection status
   */
  getIOSStatus(): boolean {
    return this.isIOS
  }

  /**
   * Get iOS-specific connection instructions
   */
  getIOSInstructions(): string[] {
    if (!this.isIOS) return []

    return [
      '1. Make sure your Chia wallet app is installed and updated',
      '2. Open your Chia wallet app before connecting',
      '3. Scan the QR code or tap the deep link',
      '4. Approve the connection in your wallet app',
      '5. Wait for the connection to complete (may take up to 2 minutes)',
      '6. If it hangs, try closing and reopening your wallet app',
    ]
  }

  /**
   * iOS-friendly copy to clipboard function
   */
  async copyToClipboard(text: string): Promise<boolean> {
    if (!this.isIOS) {
      // Use standard clipboard API for non-iOS
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (error) {
        console.error('❌ Failed to copy to clipboard:', error)
        return false
      }
    }

    // iOS-specific copy implementation
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-999999px'
      textarea.style.top = '-999999px'
      document.body.appendChild(textarea)

      // Select and copy
      textarea.focus()
      textarea.select()
      const successful = document.execCommand('copy')

      // Clean up
      document.body.removeChild(textarea)

      if (successful) {
        console.log('✅ Text copied to clipboard (iOS method)')
        return true
      } else {
        console.error('❌ Failed to copy to clipboard (iOS method)')
        return false
      }
    } catch (error) {
      console.error('❌ iOS copy failed:', error)
      return false
    }
  }

  /**
   * Show custom iOS modal
   */
  private showIOSModal(uri: string): void {
    if (!this.isIOS) return

    // Create modal element
    const modalHTML = `
      <div id="ios-wallet-modal" class="ios-wallet-modal-overlay">
        <div class="ios-wallet-modal">
          <div class="modal-header">
            <h3>Connect to Wallet</h3>
            <button id="ios-modal-close" class="close-button">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="modal-content">
            <div class="qr-section">
              <div class="qr-container">
                <div id="ios-qr-code" class="qr-code"></div>
              </div>
              <p class="qr-instructions">Scan this QR code with your Chia wallet app</p>
            </div>
            <div class="uri-section">
              <div class="uri-container">
                <input id="ios-uri-input" value="${uri}" readonly class="uri-input" />
                <button id="ios-copy-button" class="copy-button">
                  <i class="pi pi-copy"></i>
                  Copy
                </button>
              </div>
              <p class="uri-instructions">Or copy the connection string above</p>
            </div>
            <div class="ios-instructions">
              <h4>iOS Instructions:</h4>
              <ol>
                <li>Make sure your Chia wallet app is installed and updated</li>
                <li>Open your Chia wallet app before connecting</li>
                <li>Scan the QR code or copy the connection string</li>
                <li>Approve the connection in your wallet app</li>
                <li>Wait for the connection to complete</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    `

    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    this.customModalElement = document.getElementById('ios-wallet-modal')

    // Add event listeners
    const closeButton = document.getElementById('ios-modal-close')
    const copyButton = document.getElementById('ios-copy-button')
    const uriInput = document.getElementById('ios-uri-input') as HTMLInputElement

    closeButton?.addEventListener('click', () => this.hideIOSModal())
    this.customModalElement?.addEventListener('click', e => {
      if (e.target === this.customModalElement) {
        this.hideIOSModal()
      }
    })

    copyButton?.addEventListener('click', async () => {
      if (uriInput) {
        uriInput.select()
        const success = await this.copyToClipboard(uri)
        if (success) {
          copyButton.innerHTML = '<i class="pi pi-check"></i> Copied!'
          setTimeout(() => {
            copyButton.innerHTML = '<i class="pi pi-copy"></i> Copy'
          }, 2000)
        }
      }
    })

    // Generate QR code
    this.generateQRCode(uri)
  }

  /**
   * Hide custom iOS modal
   */
  private hideIOSModal(): void {
    if (this.customModalElement) {
      this.customModalElement.remove()
      this.customModalElement = null
    }
  }

  /**
   * Generate QR code for iOS modal
   */
  private async generateQRCode(uri: string): Promise<void> {
    try {
      // Dynamic import to avoid bundling QRCode in main bundle
      const QRCode = await import('qrcode')
      const qrCodeElement = document.getElementById('ios-qr-code')

      if (qrCodeElement) {
        const qrCodeDataURL = await QRCode.toDataURL(uri, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        qrCodeElement.innerHTML = `<img src="${qrCodeDataURL}" alt="QR Code" />`
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  /**
   * Set up iOS-specific connection monitoring
   */
  private setupIOSConnectionMonitoring(): void {
    if (!this.isIOS) return

    console.log('🍎 Setting up iOS connection monitoring')

    // Monitor connection every 10 seconds
    this.connectionMonitor = setInterval(() => {
      this.monitorIOSConnection()
    }, 10000)

    // Monitor page visibility changes (iOS Safari specific)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('🍎 Page hidden, pausing connection monitoring')
        this.pauseConnectionMonitoring()
      } else {
        console.log('🍎 Page visible, resuming connection monitoring')
        this.resumeConnectionMonitoring()
      }
    })

    // Monitor page focus changes
    window.addEventListener('focus', () => {
      console.log('🍎 Window focused, checking connection')
      this.monitorIOSConnection()
    })

    // Monitor beforeunload for cleanup
    window.addEventListener('beforeunload', () => {
      this.cleanupConnectionMonitoring()
    })
  }

  /**
   * Monitor iOS connection health
   */
  private monitorIOSConnection(): void {
    if (!this.isIOS || !this.signClient) return

    try {
      // Check if we have an active session
      const sessions = this.signClient.session.getAll()
      const hasActiveSession = sessions.length > 0

      if (hasActiveSession && this.state.isConnected) {
        // Update heartbeat timestamp
        this.lastHeartbeat = Date.now()

        // Check if session is still valid
        const activeSession = sessions[0]
        const now = Math.floor(Date.now() / 1000)

        if (activeSession.expiry && activeSession.expiry < now) {
          console.warn('🍎 Session expired, disconnecting')
          this.disconnect()
          return
        }

        // Try to ping the session to check connectivity
        this.pingSession(activeSession)
      }
    } catch (error) {
      console.error('🍎 Connection monitoring error:', error)
    }
  }

  /**
   * Ping session to check connectivity
   */
  private async pingSession(session: { topic: string }): Promise<void> {
    try {
      // Send a simple ping request to check if the connection is alive
      await this.signClient?.request({
        topic: session.topic,
        chainId: 'chia:testnet',
        request: {
          method: 'chip0002_chainId',
          params: [],
        },
      })
      console.log('🍎 Connection ping successful')
    } catch (error) {
      console.warn('🍎 Connection ping failed:', error)
      // If ping fails, try to recover the connection
      this.recoverIOSConnection()

      // Also handle WebSocket issues
      this.handleIOSWebSocketIssues()
    }
  }

  /**
   * Recover iOS connection
   */
  private async recoverIOSConnection(): Promise<void> {
    if (!this.isIOS || !this.signClient) return

    console.log('🍎 Attempting to recover iOS connection')

    try {
      // Try to restore existing sessions
      const sessions = this.signClient.session.getAll()
      if (sessions.length > 0) {
        console.log('🍎 Found existing session, attempting to restore')
        await this.restoreExistingSessions()
      } else {
        console.log('🍎 No existing sessions found, connection may need to be re-established')
        this.state.isConnected = false
        this.state.session = null
        this.emitEvent('disconnect', { reason: 'Connection lost' })
      }
    } catch (error) {
      console.error('🍎 Connection recovery failed:', error)
      this.state.error = 'Connection lost. Please try reconnecting.'
    }
  }

  /**
   * Pause connection monitoring
   */
  private pauseConnectionMonitoring(): void {
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor)
      this.connectionMonitor = null
    }
  }

  /**
   * Resume connection monitoring
   */
  private resumeConnectionMonitoring(): void {
    if (this.isIOS && !this.connectionMonitor) {
      this.connectionMonitor = setInterval(() => {
        this.monitorIOSConnection()
      }, 10000)
    }
  }

  /**
   * Cleanup connection monitoring
   */
  private cleanupConnectionMonitoring(): void {
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor)
      this.connectionMonitor = null
    }
  }

  /**
   * Handle iOS WebSocket connection issues
   */
  private handleIOSWebSocketIssues(): void {
    if (!this.isIOS) return

    console.log('🍎 Handling iOS WebSocket issues')

    // Add a retry mechanism for WebSocket connections
    const retryConnection = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(`🍎 WebSocket retry attempt ${i + 1}/${retries}`)

          // Try to reinitialize the connection
          if (this.signClient) {
            // Force a reconnection by creating a new session
            const sessions = this.signClient.session.getAll()
            if (sessions.length > 0) {
              console.log('🍎 Attempting to restore session after WebSocket issue')
              await this.restoreExistingSessions()
              return
            }
          }

          // If no sessions, wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
        } catch (error) {
          console.warn(`🍎 WebSocket retry ${i + 1} failed:`, error)
          if (i === retries - 1) {
            console.error('🍎 All WebSocket retry attempts failed')
            this.state.error = 'WebSocket connection failed. Please refresh the page and try again.'
          }
        }
      }
    }

    // Start retry process
    retryConnection()
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
