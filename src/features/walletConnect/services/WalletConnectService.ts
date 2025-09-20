import { environment, isIOS } from '@/shared/config/environment'
import { SignClient } from '@walletconnect/sign-client'
import type { PairingTypes, SessionTypes } from '@walletconnect/types'
import { Web3Modal } from '@web3modal/standalone'
import { CHIA_CHAIN_ID, REQUIRED_NAMESPACES } from '../constants/wallet-connect'
import { getAssetBalance, getWalletInfo, testRpcConnection } from '../queries/walletQueries'
import type {
  ConnectionResult,
  DisconnectResult,
  WalletConnectEvent,
  WalletConnectEventType,
  WalletConnectSession,
} from '../types/walletConnect.types'
import { WalletConnectRetryService } from './WalletConnectRetryService'

const getSdkError = (code: string) => ({
  code: 6000,
  message: code,
})

export class WalletConnectService {
  public client: InstanceType<typeof SignClient> | null = null
  public web3Modal: Web3Modal | null = null
  private eventListeners: Map<string, (event: WalletConnectEvent) => void> = new Map()
  private pairings: PairingTypes.Struct[] = []
  private session: SessionTypes.Struct | null = null
  private fingerprint: string | null = null
  private chainId: string | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private isInitializing = false

  private initializationPromise: Promise<void> | null = null
  private lastInitializationError: Error | null = null

  // Event listeners management
  private eventListenersSetup = false
  private retryService = new WalletConnectRetryService()

  constructor() {
    // Simple constructor - no platform-specific initialization needed
  }

  /**
   * Initialize WalletConnect
   *
   * Flow Steps:
   * 1. Check if already initialized
   * 2. Validate configuration
   * 3. Handle concurrent initialization
   * 4. Try to restore existing client
   * 5. Create new client if needed
   * 6. Complete initialization
   */
  async initialize(): Promise<void> {
    // Step 1: Check if already initialized
    if (this.client) {
      console.log('✅ WalletConnect already initialized')
      return
    }

    // Step 2: Validate configuration
    this.validateConfiguration()

    // Step 3: Handle concurrent initialization
    if (this.initializationPromise) {
      console.log('⏳ Initialization already in progress, waiting...')
      return await this.waitForConcurrentInitialization()
    }

    // Step 4: Try to restore existing client
    const wasRestored = await this.tryRestoreExistingClient()
    if (wasRestored) {
      return
    }

    // Step 5: Create new client and complete initialization
    await this.createAndInitializeClient()
  }

  /**
   * Step 2: Validate WalletConnect configuration
   */
  private validateConfiguration(): void {
    if (!this.isProperlyConfigured()) {
      const error = new Error('WalletConnect is not properly configured')
      console.error('❌ Initialization failed:', error.message)
      throw error
    }
    console.log('✅ Configuration validated')
  }

  /**
   * Step 3: Handle concurrent initialization attempts
   */
  private async waitForConcurrentInitialization(): Promise<void> {
    try {
      return await this.initializationPromise!
    } catch (error) {
      console.warn('⚠️ Previous initialization failed, retrying...', error)
      this.initializationPromise = null
      this.isInitializing = false
      throw error
    }
  }

  /**
   * Step 4: Try to restore existing client from global scope
   */
  private async tryRestoreExistingClient(): Promise<boolean> {
    const existingClient = this.getExistingClient()
    if (!existingClient) {
      console.log('📝 No existing client found, will create new one')
      return false
    }

    console.log('🔄 Found existing client, attempting to restore...')
    this.client = existingClient
    this.setupEventListeners()

    if (!this.isProperlyInitialized()) {
      console.warn('⚠️ Existing client is corrupted, will reinitialize')
      this.client = null
      this.initializationPromise = null
      return false
    }

    await this.checkPersistedState()
    console.log('✅ Existing client restored successfully')
    return true
  }

  /**
   * Step 5: Create new client and complete initialization
   */
  private async createAndInitializeClient(): Promise<void> {
    if (this.isInitializing) {
      const error = new Error('Initialization already in progress')
      console.warn('⚠️ Concurrent initialization attempt blocked')
      throw error
    }

    console.log('🚀 Creating new WalletConnect client...')
    this.isInitializing = true
    this.lastInitializationError = null

    // Add timeout to prevent hanging
    const timeoutMs = environment.wallet.walletConnect.connectionTimeout || 60000
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Initialization timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })

    this.initializationPromise = Promise.race([this.performInitialization(), timeoutPromise])

    try {
      await this.initializationPromise
      console.log('✅ WalletConnect client created and initialized successfully')
    } catch (error) {
      this.lastInitializationError = error as Error
      this.clearSessionStorage()
      console.error('❌ Failed to create WalletConnect client:', error)
      throw error
    } finally {
      this.isInitializing = false
      this.initializationPromise = null
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      // Try to get existing client first
      const existingClient = this.getExistingClient()
      if (existingClient) {
        console.log('🔄 Using existing client from global scope')
        this.client = existingClient
      } else {
        console.log('🆕 Creating new SignClient instance...')
        this.client = await this.createSignClient()
        this.setGlobalClient(this.client)
        console.log('✅ SignClient created successfully')
      }

      console.log('🔧 Completing initialization...')
      await this.completeInitialization()
      console.log('✅ Initialization completed successfully')
    } catch (error) {
      console.error('❌ WalletConnect initialization failed:', error)
      throw error
    }
  }

  private async createSignClient(): Promise<InstanceType<typeof SignClient>> {
    const relayUrls = environment.wallet.walletConnect.relayUrls || [
      'wss://relay.walletconnect.com',
    ]

    if (isIOS()) {
      console.log('🍎 iOS detected - using WebSocket relays first for URI generation')
      console.log('🍎 Available relay URLs:', relayUrls)
    } else {
      console.log('🖥️ Non-iOS platform - using WebSocket relay for WalletConnect')
      console.log('🖥️ Relay URL:', relayUrls[0])
    }

    // Try each relay URL until one works
    for (let i = 0; i < relayUrls.length; i++) {
      const relayUrl = relayUrls[i]

      try {
        if (isIOS()) {
          console.log(`🍎 iOS - trying relay URL ${i + 1}/${relayUrls.length}:`, relayUrl)
        }

        // Create SignClient with basic configuration
        const clientConfig = {
          projectId: environment.wallet.walletConnect.projectId,
          relayUrl: relayUrl,
          metadata: {
            name: environment.wallet.walletConnect.metadata.name,
            description: environment.wallet.walletConnect.metadata.description,
            url: environment.wallet.walletConnect.metadata.url,
            icons: [...environment.wallet.walletConnect.metadata.icons],
          },
          logger: 'error' as const,
        }

        const client = await SignClient.init(clientConfig)

        if (isIOS()) {
          console.log(`🍎 iOS - successfully connected to relay:`, relayUrl)
        }

        return client
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Check for specific provider errors
        if (
          errorMessage.includes('provider.request is not a function') ||
          errorMessage.includes('this.provider.request')
        ) {
          console.warn(`🍎 iOS - Provider error with relay ${relayUrl}, trying next relay...`)
        } else {
          console.warn(`Failed to connect to relay ${relayUrl}:`, error)
        }

        // If this is the last relay URL, throw the error
        if (i === relayUrls.length - 1) {
          throw new Error(`All relay URLs failed. Last error: ${errorMessage}`)
        }

        // Otherwise, try the next relay URL
        console.log(`Trying next relay URL...`)
      }
    }

    // This should never be reached, but just in case
    throw new Error('All relay URLs failed')
  }

  private getExistingClient(): InstanceType<typeof SignClient> | null {
    if (typeof window === 'undefined') return null

    const globalClient = (window as unknown as Record<string, unknown>)
      .__WALLETCONNECT_SIGN_CLIENT__

    if (!globalClient) return null

    try {
      const client = globalClient as InstanceType<typeof SignClient>
      if (!client.session || !client.pairing || !client.connect || !client.disconnect) {
        console.warn('Existing client is missing required methods, will reinitialize')
        return null
      }
      return client
    } catch (error) {
      console.warn('Existing client is corrupted, will reinitialize:', error)
      return null
    }
  }

  private setGlobalClient(client: InstanceType<typeof SignClient>): void {
    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__ = client
    }
  }

  private isProperlyConfigured(): boolean {
    return this.isConfigured() && !!environment.wallet.walletConnect.projectId
  }

  private isConfigured(): boolean {
    return !!environment.wallet.walletConnect.projectId
  }

  private isProperlyInitialized(): boolean {
    return !!this.client && !!this.client.core && !!this.client.core.relayer
  }

  private async completeInitialization(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    console.log('🔧 Setting up event listeners...')
    this.setupEventListeners()

    console.log('🔍 Checking for persisted sessions...')
    await this.checkPersistedState()

    console.log('📡 Starting connection monitoring...')
    this.startConnectionMonitoring()

    console.log('✅ WalletConnect initialization completed')
  }

  private async checkPersistedState(): Promise<void> {
    if (!this.client) return

    try {
      // Check for existing sessions
      const sessions = this.client.session.getAll()
      if (sessions.length > 0) {
        const session = sessions[0]

        // Validate session is not expired
        const now = Math.floor(Date.now() / 1000)
        if (session.expiry && session.expiry > now) {
          console.log(`🔗 Found valid existing session: ${session.topic}`)
          this.onSessionConnected(session)
        } else {
          console.log(`⚠️ Found expired session: ${session.topic}, cleaning up...`)
          // Clean up expired session
          try {
            await this.client.session.delete(session.topic, getSdkError('SESSION_EXPIRED'))
          } catch (deleteError) {
            console.warn('Failed to delete expired session:', deleteError)
          }
        }
      } else {
        console.log('📝 No existing sessions found, trying to restore from storage...')
        await this.restoreSessionFromStorage()
      }

      // Check for existing pairings
      const pairings = this.client.pairing.getAll()
      this.pairings = pairings
      console.log(`🔗 Found ${pairings.length} existing pairings`)
    } catch (error) {
      console.warn('⚠️ Failed to check persisted state:', error)
    }
  }

  private setupEventListeners(): void {
    if (!this.client || this.eventListenersSetup) return

    this.client.on('session_proposal', proposal => {
      console.log('📋 Session proposal received:', proposal)
      this.emitEvent('session_proposal', proposal)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.client.on('session_approve' as any, (session: SessionTypes.Struct) => {
      console.log('✅ Session approved:', session)
      this.onSessionConnected(session)
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.client.on('session_reject' as any, (reject: unknown) => {
      console.log('❌ Session rejected:', reject)
      this.emitEvent('session_reject', reject)
    })

    this.client.on('session_delete', deleteEvent => {
      console.log('🗑️ Session deleted:', deleteEvent)
      this.onSessionDisconnected()
    })

    this.client.on('session_expire', expireEvent => {
      console.log('⏰ Session expired:', expireEvent)
      this.onSessionDisconnected()
    })

    this.client.on('session_update', update => {
      console.log('🔄 Session updated:', update)
      this.emitEvent('session_update', update)
    })

    this.eventListenersSetup = true
    console.log('🎧 Event listeners setup completed')
  }

  private onSessionConnected(session: SessionTypes.Struct): void {
    this.session = session

    console.log('🔗 onSessionConnected - Session namespaces:', session.namespaces)

    // Extract and set the chain ID from the session
    const sessionChainId = this.getSessionChainId()
    console.log('🔗 onSessionConnected - Setting chain ID to:', sessionChainId)
    this.setChainId(sessionChainId)

    this.saveSessionToStorage(session)
    this.emitEvent('session_connected', session)
    this.startConnectionMonitoring()
  }

  private onSessionDisconnected(): void {
    this.session = null
    this.setFingerprint(null)
    this.setChainId(null)
    this.clearSessionStorage()
    this.emitEvent('session_disconnected', null)
    this.stopConnectionMonitoring()
  }

  /**
   * Save session to localStorage for persistence
   */
  private saveSessionToStorage(session: SessionTypes.Struct): void {
    if (typeof window === 'undefined') return

    try {
      const sessionData = {
        topic: session.topic,
        expiry: session.expiry,
        namespaces: session.namespaces,
        requiredNamespaces: session.requiredNamespaces,
        optionalNamespaces: session.optionalNamespaces,
        self: session.self,
        peer: session.peer,
        acknowledged: session.acknowledged,
        controller: session.controller,
        pairingTopic: session.pairingTopic,
        relay: session.relay,
        fingerprint: this.fingerprint,
        chainId: this.chainId,
      }

      localStorage.setItem('walletConnect_session', JSON.stringify(sessionData))
      console.log('💾 Session saved to storage')
    } catch (error) {
      console.warn('⚠️ Failed to save session to storage:', error)
    }
  }

  private emitEvent(type: WalletConnectEventType, data: unknown): void {
    const event: WalletConnectEvent = { type, data }
    this.eventListeners.forEach(callback => callback(event))
  }

  /**
   * Connect to wallet
   */
  async connect(pairing?: {
    topic: string
  }): Promise<{ uri: string; approval: () => Promise<unknown> } | null> {
    if (!this.client) {
      throw new Error('WalletConnect not initialized')
    }

    try {
      // iOS-specific connection handling
      if (isIOS()) {
        console.log('🍎 iOS connection - using extended timeout and WebSocket relay')
      }

      const connectParams = {
        optionalNamespaces: REQUIRED_NAMESPACES,
        pairingTopic: pairing?.topic,
      }

      const { uri, approval } = await this.client.connect(connectParams)

      if (uri) {
        // Open wallet app
        if (typeof window !== 'undefined') {
          if (isIOS()) {
            console.log('🍎 iOS - opening wallet app with URI:', uri.substring(0, 50) + '...')
          }
          window.open(uri, '_blank')
        }
      }

      return { uri: uri || '', approval }
    } catch (error) {
      if (isIOS()) {
        console.error('🍎 iOS connection failed:', error)
      } else {
        console.error('Connection failed:', error)
      }
      return null
    }
  }

  /**
   * Connect to wallet (legacy method for compatibility)
   */
  async connectLegacy(pairing?: { topic: string }): Promise<ConnectionResult> {
    if (!this.client) {
      throw new Error('WalletConnect not initialized')
    }

    try {
      const connectParams = {
        optionalNamespaces: REQUIRED_NAMESPACES,
        pairingTopic: pairing?.topic,
      }

      const { uri, approval } = await this.client.connect(connectParams)

      if (uri) {
        // Open wallet app
        if (typeof window !== 'undefined') {
          window.open(uri, '_blank')
        }
      }

      const session = await approval()

      if (session) {
        this.onSessionConnected(session)
        return {
          success: true,
          session: this.getSessionData(),
          accounts: this.getAccounts(),
        }
      }

      return { success: false, error: 'Connection failed' }
    } catch (error) {
      console.error('Connection failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Connection failed' }
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<DisconnectResult> {
    if (!this.client || !this.session) {
      return { success: true }
    }

    try {
      await this.client.disconnect({
        topic: this.session.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      })

      this.onSessionDisconnected()
      return { success: true }
    } catch (error) {
      console.error('Disconnect failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Disconnect failed' }
    }
  }

  /**
   * Make a request to the wallet
   */
  async request<T = unknown>(method: string, params: unknown[]): Promise<T> {
    if (!this.client || !this.session) {
      throw new Error('Not connected to wallet')
    }

    try {
      const result = await this.client.request({
        topic: this.session.topic,
        chainId: CHIA_CHAIN_ID,
        request: {
          method,
          params,
        },
      })

      return result as T
    } catch (error) {
      console.error('Request failed:', error)
      throw error
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return !!this.client && !!this.session
  }

  /**
   * Check if initialized (for compatibility)
   */
  get isInitialized(): boolean {
    return !!this.client
  }

  /**
   * Check if session is actively connected (for compatibility)
   */
  isSessionActivelyConnected(): boolean {
    if (!this.client || !this.session) {
      return false
    }

    // Check if session is still valid (not expired)
    const now = Math.floor(Date.now() / 1000)
    if (this.session.expiry && this.session.expiry <= now) {
      console.warn('⚠️ Session has expired')
      this.onSessionDisconnected()
      return false
    }

    // Check if client is properly connected
    try {
      const sessions = this.client.session.getAll()
      const activeSession = sessions.find(s => s.topic === this.session?.topic)
      return !!activeSession
    } catch (error) {
      console.warn('⚠️ Error checking session status:', error)
      return false
    }
  }

  /**
   * Get connection info (for compatibility)
   */
  getConnectionInfo(): {
    session: SessionTypes.Struct
    fingerprint: string
    chainId: string
    client: InstanceType<typeof SignClient>
  } {
    if (!this.client || !this.session) {
      throw new Error('Not connected to wallet')
    }

    // Extract chain ID from session namespaces
    const sessionChainId = this.getSessionChainId()
    console.log('🔗 getConnectionInfo - Using chain ID:', sessionChainId)
    console.log('🔗 getConnectionInfo - Session namespaces:', this.session.namespaces)

    return {
      session: this.session,
      fingerprint: this.fingerprint || '',
      chainId: sessionChainId,
      client: this.client,
    }
  }

  /**
   * Get the actual chain ID from the session
   */
  private getSessionChainId(): string {
    if (!this.session) {
      console.log('🔗 No session available, using configured chain ID:', CHIA_CHAIN_ID)
      return CHIA_CHAIN_ID
    }

    console.log('🔗 getSessionChainId - Full session:', this.session)
    console.log('🔗 getSessionChainId - Session namespaces:', this.session.namespaces)

    // Try to get chain ID from session namespaces
    const chiaNamespace = this.session.namespaces?.chia
    console.log('🔗 getSessionChainId - Chia namespace:', chiaNamespace)

    if (chiaNamespace?.chains && chiaNamespace.chains.length > 0) {
      const sessionChainId = chiaNamespace.chains[0]
      console.log('🔗 Using session chain ID:', sessionChainId)
      return sessionChainId
    }

    // Try alternative structure - sometimes chains are in a different format
    if (chiaNamespace?.accounts && chiaNamespace.accounts.length > 0) {
      const account = chiaNamespace.accounts[0]
      console.log('🔗 Found account in namespace:', account)
      // Extract chain ID from account (format: "chia:testnet:address")
      const chainId = account.split(':').slice(0, 2).join(':')
      if (chainId) {
        console.log('🔗 Using chain ID from account:', chainId)
        return chainId
      }
    }

    // Fallback to configured chain ID
    console.log('🔗 No chain ID in session namespaces, using configured chain ID:', CHIA_CHAIN_ID)
    console.log('🔗 Environment network:', import.meta.env.VITE_CHIA_NETWORK || 'testnet')
    return CHIA_CHAIN_ID
  }

  /**
   * Get fingerprint (for compatibility)
   */
  getFingerprint(): string | null {
    return this.fingerprint
  }

  /**
   * Get chain ID (for compatibility)
   */
  getChainId(): string | null {
    return this.chainId
  }

  /**
   * Start connection (for compatibility)
   */
  async startConnection(): Promise<void> {
    await this.initialize()
  }

  /**
   * Handle WebSocket reconnection (for compatibility)
   */
  async handleWebSocketReconnection(): Promise<boolean> {
    try {
      console.log('🔄 Attempting reconnection by reinitializing client...')

      // First try to restore from existing client
      if (this.client) {
        console.log('🔄 Checking existing client for active sessions...')
        const sessions = this.client.session.getAll()
        if (sessions.length > 0) {
          const activeSession = sessions[0]
          console.log('✅ Found active session, restoring...', activeSession.topic)
          this.onSessionConnected(activeSession)
          return true
        }
      }

      // If no active session, try to reinitialize
      console.log('🔄 No active session found, reinitializing client...')
      await this.initialize()

      if (this.session) {
        console.log('✅ Session restored after reconnection')
        return true
      }

      console.warn('⚠️ No session available after reconnection')
      return false
    } catch (error) {
      console.error('❌ Reconnection failed:', error)
      return false
    }
  }

  /**
   * Force reset (for compatibility)
   */
  forceReset(): void {
    console.log('Force resetting WalletConnect service...')
    this.clearSessionStorage()
    this.client = null
    this.session = null
    this.setFingerprint(null)
    this.setChainId(null)
    this.pairings = []
    this.eventListeners.clear()
    this.stopConnectionMonitoring()
    this.retryService.reset()
    this.isInitializing = false
    this.initializationPromise = null
    this.lastInitializationError = null
    this.eventListenersSetup = false
    console.log('WalletConnect service force reset completed')
  }

  /**
   * Get session data
   */
  getSession(): WalletConnectSession | null {
    if (!this.session) return null

    return {
      topic: this.session.topic,
      pairingTopic: this.session.pairingTopic,
      expiry: this.session.expiry,
      acknowledged: this.session.acknowledged,
      controller: this.session.controller,
      requiredNamespaces: this.session.requiredNamespaces,
      optionalNamespaces: this.session.optionalNamespaces,
      self: this.session.self,
      peer: this.session.peer,
      relay: this.session.relay,
      namespaces: this.session.namespaces,
    }
  }

  private getSessionData(): WalletConnectSession | undefined {
    return this.getSession() || undefined
  }

  getAccounts(): string[] {
    if (!this.session) return []

    const accounts = this.session.namespaces?.chia?.accounts || []
    return accounts.map(account => account.split(':')[2] || account)
  }

  /**
   * Get network info
   */
  getNetworkInfo(): { chainId: string; fingerprint: string | null; isTestnet: boolean } {
    const chainId = this.chainId || CHIA_CHAIN_ID
    const isTestnet = chainId !== 'chia:mainnet'

    return {
      chainId,
      fingerprint: this.fingerprint,
      isTestnet,
    }
  }

  /**
   * Get pairings
   */
  getPairings(): PairingTypes.Struct[] {
    return this.pairings
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (event: WalletConnectEvent) => void): void {
    this.eventListeners.set(event, callback)
  }

  /**
   * Remove event listener
   */
  off(event: string): void {
    this.eventListeners.delete(event)
  }

  /**
   * Start connection monitoring
   */
  startConnectionMonitoring(): void {
    if (typeof window === 'undefined') return

    const checkInterval = environment.wallet.walletConnect.healthCheckInterval || 30000

    const performHealthCheck = async () => {
      if (!this.isConnected()) {
        clearInterval(this.healthCheckInterval!)
        return
      }

      if (this.client && this.session) {
        console.log('Connection health check passed')
      } else {
        console.warn('Connection health check failed - no client or session')
      }

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = setTimeout(performHealthCheck, checkInterval)
      }
    }

    this.healthCheckInterval = setTimeout(performHealthCheck, checkInterval)
    console.log(`Connection monitoring started with ${checkInterval}ms interval`)
  }

  /**
   * Stop connection monitoring
   */
  stopConnectionMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.stopConnectionMonitoring()
    this.eventListeners.clear()
    this.retryService.reset()
    console.log('WalletConnect service cleaned up')
  }

  /**
   * Clear session storage
   */
  private clearSessionStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('walletConnect_session')
        delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
      }
      console.log('🧹 Session storage cleared')
    } catch (error) {
      console.warn('⚠️ Failed to clear session storage:', error)
    }
  }

  /**
   * Restore session from storage
   */
  private async restoreSessionFromStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const storedSessionData = localStorage.getItem('walletConnect_session')
      if (storedSessionData) {
        const sessionData = JSON.parse(storedSessionData)

        // Check if session is still valid
        const now = Math.floor(Date.now() / 1000)
        if (sessionData.expiry && sessionData.expiry > now) {
          console.log('🔄 Restoring session from storage:', sessionData.topic)

          // Restore session data
          this.setFingerprint(sessionData.fingerprint)

          // Set the chain ID from the restored session
          this.setChainId(this.getSessionChainId())

          // Create session object
          const restoredSession = {
            topic: sessionData.topic,
            expiry: sessionData.expiry,
            namespaces: sessionData.namespaces || {},
            requiredNamespaces: sessionData.requiredNamespaces || {},
            optionalNamespaces: sessionData.optionalNamespaces || {},
            self: sessionData.self || {},
            peer: sessionData.peer || {},
            acknowledged: true,
            controller: sessionData.controller || '',
            pairingTopic: sessionData.pairingTopic || '',
            relay: sessionData.relay || { protocol: 'irn' },
          } as SessionTypes.Struct

          this.session = restoredSession
          console.log('✅ Session restored from storage')
        } else {
          console.log('⚠️ Stored session has expired, clearing...')
          localStorage.removeItem('walletConnect_session')
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to restore session from storage:', error)
      localStorage.removeItem('walletConnect_session')
    }
  }

  private setFingerprint(fingerprint: string | null): void {
    this.fingerprint = fingerprint
  }

  private setChainId(chainId: string | null): void {
    this.chainId = chainId
  }

  // Legacy methods for compatibility
  async getWalletInfo() {
    try {
      // Check if we have an active session first
      if (!this.isSessionActivelyConnected()) {
        console.warn('⚠️ No active session, attempting reconnection...')
        const reconnected = await this.handleWebSocketReconnection()
        if (!reconnected) {
          throw new Error('Session not actively connected and reconnection failed')
        }
      }

      const result = await getWalletInfo()
      if (!result.success) {
        throw new Error(result.error || 'Failed to get wallet info')
      }
      return result.data
    } catch (error) {
      console.error('❌ Get wallet info failed:', error)
      throw error
    }
  }

  async getAssetBalance(assetId: string) {
    try {
      const result = await getAssetBalance(undefined, assetId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to get asset balance')
      }
      return result.data
    } catch (error) {
      console.error('Get asset balance failed:', error)
      throw error
    }
  }

  async testConnection() {
    try {
      const result = await testRpcConnection()
      return result.success
    } catch (error) {
      console.error('Test connection failed:', error)
      return false
    }
  }
}

export const useWalletConnectService = new WalletConnectService()
