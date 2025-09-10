import { environment } from '@/shared/config/environment'
import { SignClient } from '@walletconnect/sign-client'
import type { PairingTypes, SessionTypes } from '@walletconnect/types'
import { Web3Modal } from '@web3modal/standalone'
import { CHIA_CHAIN_ID, CHIA_METADATA, REQUIRED_NAMESPACES } from '../constants/wallet-connect'
import {
  getAssetBalance,
  getWalletInfo,
  makeWalletRequest,
  testRpcConnection,
} from '../queries/walletQueries'
import type {
  ConnectionResult,
  DisconnectResult,
  WalletConnectEvent,
  WalletConnectEventType,
  WalletConnectSession,
} from '../types/walletConnect.types'

// Simple replacement for getSdkError to avoid @walletconnect/utils dependency
const getSdkError = (code: string) => ({
  code: 6000,
  message: code,
})

export class SageWalletConnectService {
  public client: InstanceType<typeof SignClient> | null = null
  public web3Modal: Web3Modal | null = null
  private eventListeners: Map<string, (event: WalletConnectEvent) => void> = new Map()
  private pairings: PairingTypes.Struct[] = []
  private session: SessionTypes.Struct | null = null
  private fingerprint: string | null = null
  private chainId: string | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  private static isInitializing = false

  /**
   * Try to open a URL (deep link or universal link)
   */
  private async tryOpenUrl(url: string): Promise<boolean> {
    return new Promise(resolve => {
      const startTime = Date.now()

      // Create a hidden iframe to test if the app opens
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)

      // Check if we return to the page quickly (app opened)
      const checkReturn = () => {
        const elapsed = Date.now() - startTime
        if (elapsed > 2000) {
          // If we're still here after 2 seconds, the app probably didn't open
          document.body.removeChild(iframe)
          resolve(false)
        } else {
          // Check again in 100ms
          setTimeout(checkReturn, 100)
        }
      }

      // Listen for page visibility changes
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Page went to background, app probably opened
          document.body.removeChild(iframe)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          resolve(true)
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Start checking
      setTimeout(checkReturn, 100)

      // Cleanup after 5 seconds
      setTimeout(() => {
        document.body.removeChild(iframe)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        resolve(false)
      }, 5000)
    })
  }

  /**
   * Get relay URLs
   */
  private getRelayUrls(): string[] {
    return [
      'wss://relay.walletconnect.com',
      'wss://relay.walletconnect.org',
      'wss://relay.walletconnect.io',
    ]
  }

  // Initialization configuration constants
  private static readonly INIT_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 20000,
    maxReconnectionAttempts: 5,
    reconnectionDelay: 2000,
  } as const

  // Initialization state tracking
  private static initializationPromise: Promise<void> | null = null
  private static lastInitializationError: Error | null = null

  /**
   * Check if the service is properly configured
   */
  private isProperlyConfigured(): boolean {
    return this.isConfigured() && !!environment.wallet.walletConnect.projectId
  }

  /**
   * Get existing client from global window object
   */
  private getExistingClient(): InstanceType<typeof SignClient> | null {
    if (typeof window === 'undefined') return null

    const globalClient = (window as unknown as Record<string, unknown>)
      .__WALLETCONNECT_SIGN_CLIENT__

    if (!globalClient) return null

    // Validate that the client is still functional
    try {
      const client = globalClient as InstanceType<typeof SignClient>

      // Check if client has the required methods
      if (!client.session || !client.pairing || !client.connect || !client.disconnect) {
        console.warn('Existing client is missing required methods, will reinitialize')
        return null
      }

      // Check if client has any active sessions
      console.log('Found existing client with', client.session.length, 'sessions')

      return client
    } catch (error) {
      console.warn('Existing client is corrupted, will reinitialize:', error)
      return null
    }
  }

  /**
   * Set client in global window object for persistence
   */
  private setGlobalClient(client: InstanceType<typeof SignClient>): void {
    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__ = client
    }
  }

  /**
   * Create SignClient with standard configuration
   */
  private async createSignClient(relayUrl: string): Promise<InstanceType<typeof SignClient>> {
    return await SignClient.init({
      projectId: environment.wallet.walletConnect.projectId,
      metadata: CHIA_METADATA,
      relayUrl,
    })
  }

  /**
   * Try to initialize with a specific relay URL
   */
  private async tryInitializeWithRelay(
    relayUrl: string
  ): Promise<InstanceType<typeof SignClient> | null> {
    try {
      console.log(`Attempting to initialize WalletConnect with relay: ${relayUrl}`)

      const client = await this.createSignClient(relayUrl)

      console.log(`Successfully initialized with relay: ${relayUrl}`)
      return client
    } catch (error) {
      console.warn(`Failed to initialize with relay ${relayUrl}:`, error)
      return null
    }
  }

  /**
   * Initialize with relay fallback strategy
   */
  private async initializeWithRelayFallback(): Promise<InstanceType<typeof SignClient>> {
    const relayUrls = this.getRelayUrls()

    for (let i = 0; i < relayUrls.length; i++) {
      const relayUrl = relayUrls[i]
      const client = await this.tryInitializeWithRelay(relayUrl)

      if (client) {
        return client
      }

      // Wait before trying next relay (except for the last one)
      if (i < relayUrls.length - 1) {
        console.log(
          `Waiting ${SageWalletConnectService.INIT_CONFIG.retryDelay}ms before trying next relay...`
        )
        await new Promise(resolve =>
          setTimeout(resolve, SageWalletConnectService.INIT_CONFIG.retryDelay)
        )
      }
    }

    throw new Error(`All relay connections failed. Tried ${relayUrls.length} relays.`)
  }

  /**
   * Complete initialization setup
   */
  private async completeInitialization(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    // Set up event listeners
    this.setupEventListeners()

    // Check for persisted state
    await this.checkPersistedState()

    console.log('WalletConnect initialization completed successfully')
  }

  /**
   * Complete initialization setup without restoring persisted state
   */
  private async completeInitializationWithoutRestore(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    // Set up event listeners
    this.setupEventListeners()

    // Skip persisted state restoration
    console.log('WalletConnect initialization completed without restoring persisted state')
  }

  /**
   * Initialize the Wallet Connect client with improved error handling and reliability
   */
  async initialize(): Promise<void> {
    // Return immediately if already initialized
    if (this.client) {
      console.log('WalletConnect already initialized')
      return
    }

    // Check if properly configured
    if (!this.isProperlyConfigured()) {
      const error = new Error('WalletConnect is not properly configured')
      console.error('Initialization failed:', error.message)
      throw error
    }

    // Return existing initialization promise if already in progress
    if (SageWalletConnectService.initializationPromise) {
      console.log('Initialization already in progress, waiting...')
      return SageWalletConnectService.initializationPromise
    }

    // Check for existing client in global scope
    const existingClient = this.getExistingClient()
    if (existingClient) {
      console.log('Using existing WalletConnect client from global scope')
      this.client = existingClient

      // Set up event listeners first
      this.setupEventListeners()

      // Verify the client is properly initialized
      if (!this.isProperlyInitialized()) {
        console.warn('Existing client is not properly initialized, will reinitialize')
        this.client = null
        // Fall through to normal initialization
      } else {
        // Then check for persisted state and restore session
        await this.checkPersistedState()

        console.log('Existing client restored successfully')
        return
      }
    }

    // Prevent concurrent initialization
    if (SageWalletConnectService.isInitializing) {
      const error = new Error('Initialization already in progress')
      console.warn('Concurrent initialization attempt blocked')
      throw error
    }

    // Start initialization process
    SageWalletConnectService.isInitializing = true
    SageWalletConnectService.lastInitializationError = null

    SageWalletConnectService.initializationPromise = this.performInitialization()

    try {
      await SageWalletConnectService.initializationPromise
    } catch (error) {
      SageWalletConnectService.lastInitializationError = error as Error
      // Clear session storage on initialization failure
      this.clearSessionStorage()
      throw error
    } finally {
      SageWalletConnectService.isInitializing = false
      SageWalletConnectService.initializationPromise = null
    }
  }

  /**
   * Perform the actual initialization process
   */
  private async performInitialization(): Promise<void> {
    try {
      console.log('Starting WalletConnect initialization...')

      // Try to get existing client first
      const existingClient = this.getExistingClient()
      if (existingClient) {
        this.client = existingClient
        console.log('Using existing client from global scope')
      } else {
        // Initialize new client with relay fallback
        this.client = await this.initializeWithRelayFallback()

        // Store client globally for persistence
        this.setGlobalClient(this.client)
      }

      // Complete the initialization setup
      await this.completeInitialization()
    } catch (error) {
      console.error('WalletConnect initialization failed:', error)
      throw error
    }
  }

  /**
   * Get the last initialization error (useful for debugging)
   */
  getLastInitializationError(): Error | null {
    return SageWalletConnectService.lastInitializationError
  }

  /**
   * Check if initialization is currently in progress
   */
  isInitializationInProgress(): boolean {
    return SageWalletConnectService.isInitializing
  }

  /**
   * Clear all session storage and reset state (public method)
   * This method is now primarily for internal state clearing.
   * For comprehensive session clearing, use the centralized sessionManager.
   */
  clearSessionStorage(): void {
    try {
      // Clear specific session data format
      this.clearSessionData()

      // Clear global client reference
      if (typeof window !== 'undefined') {
        delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
      }

      // Reset service state
      this.client = null
      this.session = null
      this.setFingerprint(null)
      this.setChainId(null)
      this.pairings = []
      this.eventListeners.clear()

      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = null
      }

      console.log('WalletConnect internal state cleared')
    } catch (error) {
      console.warn('Failed to clear internal state:', error)
    }
  }

  /**
   * Clear specific session data format (accounts, chainId, expiry, etc.)
   */
  private clearSessionData(): void {
    try {
      if (typeof window === 'undefined') return

      // Clear from localStorage with specific patterns
      const localStorageKeys = Object.keys(window.localStorage)
      localStorageKeys.forEach(key => {
        // Clear any keys that might contain session data
        if (
          key.includes('session') ||
          key.includes('accounts') ||
          key.includes('chainId') ||
          key.includes('expiry') ||
          key.includes('fingerprint') ||
          key.includes('topic') ||
          key.includes('timestamp') ||
          key.includes('walletconnect') ||
          key.includes('walletConnect') ||
          key.includes('wc@')
        ) {
          window.localStorage.removeItem(key)
          console.log(`Cleared session data key: ${key}`)
        }
      })

      // Clear from sessionStorage with specific patterns
      const sessionStorageKeys = Object.keys(window.sessionStorage)
      sessionStorageKeys.forEach(key => {
        if (
          key.includes('session') ||
          key.includes('accounts') ||
          key.includes('chainId') ||
          key.includes('expiry') ||
          key.includes('fingerprint') ||
          key.includes('topic') ||
          key.includes('timestamp') ||
          key.includes('walletconnect') ||
          key.includes('walletConnect') ||
          key.includes('wc@')
        ) {
          window.sessionStorage.removeItem(key)
          console.log(`Cleared session data key: ${key}`)
        }
      })

      // Specifically clear the walletConnect_session key
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('walletConnect_session')
        console.log('Cleared walletConnect_session key')
      }

      console.log('Cleared specific session data')
    } catch (error) {
      console.warn('Failed to clear session data:', error)
    }
  }

  /**
   * Clear PWA storage synchronously (IndexedDB, WebSQL, etc.)
   */
  private clearPWAStorageSync(): void {
    if (typeof window === 'undefined') return

    // Clear IndexedDB (async but fire and forget)
    if ('indexedDB' in window) {
      indexedDB
        .databases()
        .then(databases => {
          for (const db of databases) {
            if (db.name && (db.name.includes('walletconnect') || db.name.includes('wc@'))) {
              indexedDB.deleteDatabase(db.name)
              console.log(`Cleared IndexedDB database: ${db.name}`)
            }
          }
        })
        .catch((error: unknown) => {
          console.warn('Failed to clear IndexedDB:', error)
        })
    }

    // Clear WebSQL (legacy)
    if ('openDatabase' in window) {
      // WebSQL is deprecated but some older browsers might still use it
      const db = (
        window as unknown as {
          openDatabase: (
            name: string,
            version: string,
            displayName: string,
            size: number
          ) => unknown
        }
      ).openDatabase('walletconnect', '1.0', 'WalletConnect DB', 2 * 1024 * 1024)
      if (db) {
        ;(
          db as {
            transaction: (callback: (tx: { executeSql: (sql: string) => void }) => void) => void
          }
        ).transaction((tx: { executeSql: (sql: string) => void }) => {
          tx.executeSql('DROP TABLE IF EXISTS sessions')
          tx.executeSql('DROP TABLE IF EXISTS pairings')
        })
        console.log('Cleared WebSQL database')
      }
    }

    // Clear caches (async but fire and forget)
    if ('caches' in window) {
      caches
        .keys()
        .then(cacheNames => {
          for (const cacheName of cacheNames) {
            if (cacheName.includes('walletconnect') || cacheName.includes('wc@')) {
              caches
                .delete(cacheName)
                .then(() => {
                  console.log(`Cleared cache: ${cacheName}`)
                })
                .catch((error: unknown) => {
                  console.warn(`Failed to clear cache ${cacheName}:`, error)
                })
            }
          }
        })
        .catch((error: unknown) => {
          console.warn('Failed to clear caches:', error)
        })
    }

    // Clear any custom PWA storage (async but fire and forget)
    if ('navigator' in window && 'storage' in navigator) {
      if ('clear' in navigator.storage) {
        ;(navigator.storage as { clear: () => Promise<void> })
          .clear()
          .then(() => {
            console.log('Cleared navigator.storage')
          })
          .catch((error: unknown) => {
            console.warn('Failed to clear navigator.storage:', error)
          })
      }
    }
  }

  /**
   * Clear PWA storage asynchronously (for use in async contexts)
   */
  private async clearPWAStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    // Clear IndexedDB
    if ('indexedDB' in window) {
      try {
        // List all databases and clear them
        const databases = await indexedDB.databases()
        for (const db of databases) {
          if (db.name && (db.name.includes('walletconnect') || db.name.includes('wc@'))) {
            indexedDB.deleteDatabase(db.name)
            console.log(`Cleared IndexedDB database: ${db.name}`)
          }
        }
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error)
      }
    }

    // Clear WebSQL (legacy)
    if ('openDatabase' in window) {
      try {
        // WebSQL is deprecated but some older browsers might still use it
        const db = (
          window as unknown as {
            openDatabase: (
              name: string,
              version: string,
              displayName: string,
              size: number
            ) => unknown
          }
        ).openDatabase('walletconnect', '1.0', 'WalletConnect DB', 2 * 1024 * 1024)
        if (db) {
          ;(
            db as {
              transaction: (callback: (tx: { executeSql: (sql: string) => void }) => void) => void
            }
          ).transaction((tx: { executeSql: (sql: string) => void }) => {
            tx.executeSql('DROP TABLE IF EXISTS sessions')
            tx.executeSql('DROP TABLE IF EXISTS pairings')
          })
          console.log('Cleared WebSQL database')
        }
      } catch (error) {
        console.warn('Failed to clear WebSQL:', error)
      }
    }

    // Clear any other storage mechanisms
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        for (const cacheName of cacheNames) {
          if (cacheName.includes('walletconnect') || cacheName.includes('wc@')) {
            await caches.delete(cacheName)
            console.log(`Cleared cache: ${cacheName}`)
          }
        }
      } catch (error) {
        console.warn('Failed to clear caches:', error)
      }
    }

    // Clear any custom PWA storage
    if ('navigator' in window && 'storage' in navigator) {
      try {
        if ('clear' in navigator.storage) {
          await (navigator.storage as { clear: () => Promise<void> }).clear()
          console.log('Cleared navigator.storage')
        }
      } catch (error) {
        console.warn('Failed to clear navigator.storage:', error)
      }
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
          error: 'WalletConnect is not configured',
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

      console.log('Starting WalletConnect connection...')

      // Add connection timeout and retry logic
      const connectionPromise = this.client.connect({
        pairingTopic: pairing?.topic,
        optionalNamespaces: REQUIRED_NAMESPACES,
      })

      // Add timeout to prevent hanging connections
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
      })

      const { uri, approval } = (await Promise.race([connectionPromise, timeoutPromise])) as {
        uri: string
        approval: () => Promise<unknown>
      }
      console.log('WalletConnect connection initiated, URI generated:', !!uri)

      if (!uri) {
        throw new Error('No connection URI generated')
      }

      // Open Web3Modal for all platforms
      if (this.web3Modal) {
        this.web3Modal.openModal({ uri })
      }
      console.log('Waiting for wallet approval...')

      // Add timeout for approval process
      const approvalPromise = approval()
      const approvalTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Wallet approval timeout after 45 seconds')), 45000)
      })

      const session = (await Promise.race([
        approvalPromise,
        approvalTimeoutPromise,
      ])) as SessionTypes.Struct
      console.log('Wallet approval successful, session established')

      // Verify session is valid before proceeding
      if (!session || !session.topic) {
        throw new Error('Invalid session received from wallet')
      }

      this.onSessionConnected(session)
      this.pairings = this.client.pairing.getAll({ active: true })
      this.web3Modal?.closeModal()

      return {
        success: true,
        session: this.mapSession(this.session!),
        accounts: this.extractAccounts(this.session!),
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      this.web3Modal?.closeModal()
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
        this.clearSessionStorage()
        return { success: true }
      }

      if (this.session) {
        await this.client.disconnect({
          topic: this.session.topic,
          reason: getSdkError('USER_DISCONNECTED'),
        })
      }

      this.clearSessionStorage()
      this.stopConnectionMonitoring()

      return { success: true }
    } catch (error) {
      console.error('Disconnect failed:', error)
      this.clearSessionStorage()
      this.stopConnectionMonitoring()
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
      console.error('Error during force reset disconnect:', error)
    }

    // Clear all session storage and reset state
    this.clearSessionStorage()
    this.reset()
    this.stopConnectionMonitoring()

    // Reinitialize without restoring persisted state
    if (this.client) {
      await this.completeInitializationWithoutRestore()
    }
  }

  /**
   * Make request to wallet (for backward compatibility)
   */
  async request<T>(
    method: string,
    data: Record<string, unknown>
  ): Promise<{ data: T } | undefined> {
    const result = await makeWalletRequest<T>(method, data)
    return result.success ? { data: result.data! } : undefined
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
   * Check if client is properly initialized with event listeners
   */
  isProperlyInitialized(): boolean {
    if (!this.client) return false

    try {
      // Check if client has the required properties and is functional
      return !!(
        this.client.session &&
        this.client.pairing &&
        typeof this.client.on === 'function' &&
        typeof this.client.connect === 'function' &&
        typeof this.client.disconnect === 'function'
      )
    } catch (error) {
      console.warn('Error checking client initialization:', error)
      return false
    }
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
   * Get current network info
   */
  getNetworkInfo(): { chainId: string; isTestnet: boolean } {
    const chainId = this.chainId || CHIA_CHAIN_ID
    const isTestnet = chainId.includes('testnet')
    return { chainId, isTestnet }
  }

  /**
   * Get current fingerprint
   */
  getFingerprint(): string | null {
    return this.fingerprint
  }

  /**
   * Set fingerprint and emit update event if changed
   */
  setFingerprint(fingerprint: string | null): void {
    const previousFingerprint = this.fingerprint
    this.fingerprint = fingerprint

    if (previousFingerprint !== fingerprint) {
      console.log('Fingerprint updated:', { previous: previousFingerprint, current: fingerprint })
      this.emitEvent('fingerprint_updated', { previous: previousFingerprint, current: fingerprint })
    }
  }

  /**
   * Get current chain ID
   */
  getChainId(): string | null {
    return this.chainId
  }

  /**
   * Set chain ID and emit update event if changed
   */
  setChainId(chainId: string | null): void {
    const previousChainId = this.chainId
    this.chainId = chainId

    if (previousChainId !== chainId) {
      console.log('Chain ID updated:', { previous: previousChainId, current: chainId })
      this.emitEvent('chainid_updated', { previous: previousChainId, current: chainId })
    }
  }

  /**
   * Get session, fingerprint, chainId, and client together for easy access
   * Throws an error if any required values are missing
   */
  getConnectionInfo(): {
    session: WalletConnectSession
    fingerprint: string
    chainId: string
    client: InstanceType<typeof SignClient>
  } {
    if (!this.isInitialized()) {
      throw new Error('WalletConnect is not initialized')
    }

    if (!this.isConnected()) {
      throw new Error('Wallet not connected')
    }

    const session = this.getSession()
    if (!session) {
      throw new Error('No active session')
    }

    const fingerprint = this.getFingerprint()
    if (!fingerprint) {
      throw new Error('Fingerprint is not loaded')
    }

    const chainId = this.getChainId()
    if (!chainId) {
      throw new Error('Chain ID is not loaded')
    }

    const client = this.getClient()
    if (!client) {
      throw new Error('WalletConnect client not available')
    }

    return {
      session,
      fingerprint,
      chainId,
      client,
    }
  }

  /**
   * Get the WalletConnect client for making requests
   */
  getClient(): InstanceType<typeof SignClient> | null {
    return this.client
  }

  async getWalletInfo() {
    const result = await getWalletInfo()
    if (!result.success) {
      console.error('Service getWalletInfo failed:', result.error)
      throw new Error(result.error)
    }
    return result.data
  }

  async getAssetBalance() {
    const result = await getAssetBalance()
    if (!result.success) {
      console.error('Service getWalletInfo failed:', result.error)
      throw new Error(result.error)
    }
    return result.data
  }

  /**
   * Get current connection state (for backward compatibility)
   */
  getConnectionState(): {
    isConnected: boolean
    isConnecting: boolean
    fingerprint: number | undefined
    address: undefined
    balance: undefined
  } {
    return {
      isConnected: this.isConnected(),
      isConnecting: false,
      fingerprint: this.fingerprint ? parseInt(this.fingerprint) : undefined,
      address: undefined,
      balance: undefined,
    }
  }

  /**
   * Check WebSocket connection health
   */
  async checkConnectionHealth(): Promise<{ healthy: boolean; error?: string }> {
    try {
      if (!this.client) {
        return { healthy: false, error: 'Client not initialized' }
      }

      if (!this.session) {
        return { healthy: false, error: 'No active session' }
      }

      // Check if session is still valid (not expired)
      const now = Math.floor(Date.now() / 1000)
      if (this.session.expiry && this.session.expiry < now) {
        return { healthy: false, error: 'Session expired' }
      }

      // Only check pairings if we have an active session
      // This is a lightweight check that doesn't make network requests
      const pairings = this.client.pairing.getAll({ active: true })
      if (pairings.length === 0 && this.session) {
        // If we have a session but no active pairings, it might be a temporary issue
        return { healthy: true } // Don't consider this a failure
      }

      return { healthy: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Don't log every health check failure as an error, only log significant issues
      if (errorMessage.includes('isValidRequest') || errorMessage.includes('request()')) {
        console.warn('Connection health check warning:', errorMessage)
      } else {
        console.error('Connection health check failed:', errorMessage)
      }

      return { healthy: false, error: errorMessage }
    }
  }

  /**
   * Retry connection with exponential backoff
   */
  async retryConnection(maxRetries: number = 2): Promise<ConnectionResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Connection attempt ${attempt}/${maxRetries}`)
        const result = await this.connect()

        if (result.success) {
          console.log('Connection successful on attempt', attempt)
          return result
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`Connection failed, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error(`Connection attempt ${attempt} failed:`, error)

        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Connection failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          }
        }
      }
    }

    return {
      success: false,
      error: 'Connection failed after all retry attempts',
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  async handleWebSocketReconnection(): Promise<boolean> {
    try {
      if (!this.client) {
        console.log('No client available for reconnection')
        return false
      }

      console.log('Attempting WebSocket reconnection...')

      // Check if we have an active session
      if (this.session) {
        console.log('Session exists, checking if reconnection is needed...')

        // Only reconnect if session is actually expired or invalid
        const now = Math.floor(Date.now() / 1000)
        if (this.session.expiry && this.session.expiry < now) {
          console.log('Session expired, attempting reconnection...')
        } else {
          console.log('Session is still valid, skipping reconnection')
          return true
        }
      }

      // Try to reconnect by reinitializing the client
      console.log('Reinitializing WalletConnect client...')
      await this.initialize()

      // Check if we can restore the session
      if (this.session) {
        console.log('Session restored after reconnection')
        return true
      }

      console.log('Reconnection completed but no active session')
      return false
    } catch (error) {
      console.error('WebSocket reconnection failed:', error)
      return false
    }
  }

  /**
   * Monitor connection health and auto-reconnect if needed
   */
  startConnectionMonitoring(): void {
    if (typeof window === 'undefined') return

    let consecutiveFailures = 0
    const maxConsecutiveFailures = 3
    let checkInterval = 60000

    const performHealthCheck = async () => {
      if (!this.isConnected()) {
        clearInterval(this.healthCheckInterval!)
        return
      }

      try {
        const health = await this.checkConnectionHealth()
        if (health.healthy) {
          consecutiveFailures = 0
          checkInterval = 60000 // Reset interval
        } else {
          consecutiveFailures++
          console.warn(
            `Connection health check failed (${consecutiveFailures}/${maxConsecutiveFailures})`
          )

          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.warn('Multiple consecutive health check failures, attempting reconnection...')
            await this.handleWebSocketReconnection()
            consecutiveFailures = 0
            checkInterval = 120000 // Wait longer after reconnection attempt
          } else {
            checkInterval = Math.min(checkInterval * 1.5, 300000)
          }
        }
      } catch (error) {
        console.error('Connection monitoring error:', error)
        consecutiveFailures++
        checkInterval = Math.min(checkInterval * 1.5, 300000)
      }

      // Schedule next check
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = setTimeout(performHealthCheck, checkInterval)
      }
    }

    // Start the first health check
    this.healthCheckInterval = setTimeout(performHealthCheck, checkInterval)
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
   * Execute a wallet command (for backward compatibility)
   */
  async executeCommand(command: string, params: Record<string, unknown>) {
    return await this.request(command, params)
  }

  /**
   * Test RPC connection (for backward compatibility)
   */
  async testRpcConnection(): Promise<boolean> {
    const result = await testRpcConnection()
    if (!result.success) {
      console.error('Service testRpcConnection failed:', result.error)
      return false
    }
    return result.data || false
  }

  /**
   * Update fingerprint and chainId from session data
   */
  private updateFingerprintAndChainIdFromSession(session: SessionTypes.Struct) {
    const allNamespaceAccounts =
      session.namespaces && typeof session.namespaces === 'object'
        ? Object.values(session.namespaces)
            .map(namespace => namespace.accounts)
            .flat()
        : []

    let extractedFingerprint: string | null = null
    let extractedChainId: string | null = null

    if (allNamespaceAccounts.length > 0) {
      const firstAccount = allNamespaceAccounts[0]
      const parts = firstAccount.split(':')

      if (parts.length >= 3) {
        extractedChainId = `${parts[0]}:${parts[1]}`
        extractedFingerprint = parts[2]
      } else if (parts.length >= 2) {
        extractedChainId = `${parts[0]}:${parts[1]}`
        extractedFingerprint = parts[1]
      } else {
        extractedFingerprint = parts[0]
        extractedChainId = CHIA_CHAIN_ID
      }
    } else {
      extractedFingerprint = session.topic.substring(0, 8)
      extractedChainId = CHIA_CHAIN_ID
    }

    // Ensure fingerprint is set
    if (!extractedFingerprint) {
      extractedFingerprint = session.topic.substring(0, 8)
    }

    // Update service state using setters
    this.setFingerprint(extractedFingerprint)
    this.setChainId(extractedChainId)
  }

  private onSessionConnected(session: SessionTypes.Struct) {
    const allNamespaceAccounts =
      session.namespaces && typeof session.namespaces === 'object'
        ? Object.values(session.namespaces)
            .map(namespace => namespace.accounts)
            .flat()
        : []
    this.session = session

    // Update fingerprint and chainId from session
    this.updateFingerprintAndChainIdFromSession(session)

    // Store session data in PWA storage
    if (typeof window !== 'undefined') {
      try {
        const sessionData = {
          topic: session.topic,
          fingerprint: this.fingerprint,
          chainId: this.chainId,
          accounts: allNamespaceAccounts,
          expiry: session.expiry,
          timestamp: Date.now(),
        }
        localStorage.setItem('walletConnect_session', JSON.stringify(sessionData))
        console.log('Session data stored in PWA storage:', sessionData)
      } catch (error) {
        console.warn('Failed to store session data in PWA storage:', error)
      }
    }

    console.log('Session connected:', {
      topic: session.topic,
      fingerprint: this.fingerprint,
      chainId: this.chainId,
      accounts: allNamespaceAccounts,
    })

    // Start connection monitoring for this session
    this.startConnectionMonitoring()
  }

  private reset() {
    this.session = null
    this.setFingerprint(null)
    this.setChainId(null)

    // Clear session data from PWA storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('walletConnect_session')
        console.log('Session data cleared from PWA storage')
      } catch (error) {
        console.warn('Failed to clear session data from PWA storage:', error)
      }
    }
  }

  private async checkPersistedState() {
    if (!this.client) {
      throw new Error('WalletConnect is not initialized')
    }

    this.pairings = this.client.pairing.getAll({ active: true })

    if (this.session) {
      return
    }

    // First try to restore from WalletConnect's internal storage
    if (this.client.session.length) {
      const lastKeyIndex = this.client.session.keys.length - 1
      const session = this.client.session.get(this.client.session.keys[lastKeyIndex])

      if (session && session.expiry > Date.now() / 1000) {
        this.onSessionConnected(session)
        this.emitEvent('session_restored', session)
        return
      } else {
        this.reset()
      }
    }

    // If no WalletConnect session, try to restore from PWA storage
    if (typeof window !== 'undefined') {
      try {
        const storedSessionData = localStorage.getItem('walletConnect_session')
        if (storedSessionData) {
          const sessionData = JSON.parse(storedSessionData)

          // Check if session is still valid
          if (sessionData.expiry && sessionData.expiry > Date.now() / 1000) {
            console.log('Restoring session from PWA storage:', sessionData)

            // Restore fingerprint and chainId from stored session data
            this.setFingerprint(sessionData.fingerprint)
            this.setChainId(sessionData.chainId)

            // Create a minimal session object for compatibility
            const restoredSession = {
              topic: sessionData.topic,
              expiry: sessionData.expiry,
              namespaces: {
                chia: {
                  accounts: sessionData.accounts,
                  methods: [],
                  events: [],
                },
              },
              pairingTopic: '',
              relay: { protocol: 'irn' },
              acknowledged: true,
              controller: '',
              requiredNamespaces: {},
              optionalNamespaces: {},
              self: {
                publicKey: '',
                metadata: {
                  name: 'Penguin Pool',
                  description: 'Decentralized lending platform',
                  url: 'https://penguin.pool',
                  icons: [],
                },
              },
              peer: {
                publicKey: '',
                metadata: {
                  name: 'Sage Wallet',
                  description: 'Chia wallet',
                  url: 'https://sagewallet.io',
                  icons: [],
                },
              },
            } as SessionTypes.Struct

            this.session = restoredSession
            this.emitEvent('session_restored', restoredSession)
            console.log('Session restored from PWA storage successfully')
            return
          } else {
            console.log('Stored session expired, clearing PWA storage')
            localStorage.removeItem('walletConnect_session')
          }
        }
      } catch (error) {
        console.warn('Failed to restore session from PWA storage:', error)
        localStorage.removeItem('walletConnect_session')
      }
    }
  }

  private setupEventListeners() {
    if (!this.client) return

    // Remove existing listeners first to prevent duplicates
    // Note: WalletConnect doesn't have removeAllListeners, so we'll just set up new ones
    // The client should handle duplicate listeners gracefully

    this.client.on('session_update', ({ topic, params }) => {
      const { namespaces } = params
      const session = this.client!.session.get(topic)
      const updatedSession = { ...session, namespaces }

      // Update fingerprint and chainId if they changed
      this.updateFingerprintAndChainIdFromSession(updatedSession)

      this.emitEvent('session_update', { topic, params })
    })

    this.client.on('session_delete', ({ topic }) => {
      this.reset()
      this.emitEvent('session_delete', { topic })
    })

    this.client.on('session_event', (...args) => {
      this.emitEvent('session_event', args)
    })

    this.client.on('session_proposal', proposal => {
      this.emitEvent('session_proposal', proposal)
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
