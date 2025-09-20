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

  // iOS-specific properties for app switching
  private isIOS = false
  private isInBackground = false
  private backgroundGracePeriod: NodeJS.Timeout | null = null
  private visibilityChangeHandler: (() => void) | null = null
  private beforeUnloadHandler: (() => void) | null = null
  private pageHideHandler: (() => void) | null = null
  private reconnectionAttempts = 0
  private maxReconnectionAttempts = 3
  private reconnectionDelay = 1000
  private isReconnecting = false
  private lastActiveTime = 0
  private connectionRestoreTimeout: NodeJS.Timeout | null = null

  private async tryOpenUrl(url: string): Promise<boolean> {
    return new Promise(resolve => {
      const startTime = Date.now()
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)

      const checkReturn = () => {
        const elapsed = Date.now() - startTime
        if (elapsed > 2000) {
          document.body.removeChild(iframe)
          resolve(false)
        } else {
          setTimeout(checkReturn, 100)
        }
      }

      const handleVisibilityChange = () => {
        if (document.hidden) {
          document.body.removeChild(iframe)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          resolve(true)
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      setTimeout(checkReturn, 100)
      setTimeout(() => {
        document.body.removeChild(iframe)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        resolve(false)
      }, 5000)
    })
  }

  private getRelayUrls(): string[] {
    // Use iOS-optimized relay URLs if on iOS
    if (this.isIOS) {
      return environment.wallet.walletConnect.ios?.relayUrls
        ? [...environment.wallet.walletConnect.ios.relayUrls]
        : [
            'wss://relay.walletconnect.org', // More reliable for iOS
            'wss://relay.walletconnect.com', // Primary relay
            'wss://relay.walletconnect.io', // Alternative relay
          ]
    }

    return [
      'wss://relay.walletconnect.com',
      'wss://relay.walletconnect.org',
      'wss://relay.walletconnect.io',
    ]
  }

  private detectIOS(): boolean {
    if (typeof window === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
  }

  /**
   * Initialize iOS-specific event handlers for app switching
   */
  private initializeIOSHandlers(): void {
    if (typeof window === 'undefined' || !this.isIOS) return

    // Handle visibility changes (app switching)
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.handleAppBackground()
      } else {
        this.handleAppForeground()
      }
    }

    // Handle page unload (cleanup)
    this.beforeUnloadHandler = () => {
      this.cleanupOnUnload()
    }

    // Handle page hide (iOS specific)
    this.pageHideHandler = () => {
      this.cleanupOnUnload()
    }

    // Add event listeners
    document.addEventListener('visibilitychange', this.visibilityChangeHandler)
    window.addEventListener('beforeunload', this.beforeUnloadHandler)
    window.addEventListener('pagehide', this.pageHideHandler)

    console.log('iOS app switching handlers initialized')
  }

  /**
   * Clean up iOS-specific event handlers
   */
  private cleanupIOSHandlers(): void {
    if (typeof window === 'undefined') return

    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler)
      this.visibilityChangeHandler = null
    }

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler)
      this.beforeUnloadHandler = null
    }

    if (this.pageHideHandler) {
      window.removeEventListener('pagehide', this.pageHideHandler)
      this.pageHideHandler = null
    }

    console.log('iOS-specific event handlers cleaned up')
  }

  /**
   * Handle app going to background
   */
  private handleAppBackground(): void {
    if (!this.isIOS) return

    console.log('App going to background, preserving connection state...')
    this.isInBackground = true
    this.lastActiveTime = Date.now()

    // Don't pause operations immediately - just mark as background
    // This allows the connection to remain active during app switching
  }

  /**
   * Handle app coming to foreground
   */
  private handleAppForeground(): void {
    if (!this.isIOS) return

    console.log('App coming to foreground, checking connection...')
    this.isInBackground = false

    // Check if we need to restore the connection
    const timeInBackground = Date.now() - this.lastActiveTime
    if (timeInBackground > 1000) {
      // If we were in background for more than 1 second
      this.restoreConnectionAfterAppSwitch()
    }
  }

  /**
   * Restore connection after app switching on iOS
   */
  private async restoreConnectionAfterAppSwitch(): Promise<void> {
    if (!this.isIOS || !this.client) return

    console.log('Restoring connection after app switch...')

    try {
      // Check if we have an active session
      if (this.session) {
        // Verify the session is still valid
        const isConnected = this.isConnected()
        if (!isConnected) {
          console.log('Session lost during app switch, attempting to restore...')

          // Try to restore the session from storage
          await this.restoreSessionFromStorage()
        } else {
          console.log('Session is still active after app switch')
        }
      } else {
        console.log('No active session to restore')
      }
    } catch (error) {
      console.error('Failed to restore connection after app switch:', error)
    }
  }

  /**
   * Restore session from storage after app switch
   */
  private async restoreSessionFromStorage(): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const storedSessionData = localStorage.getItem('walletConnect_session')
      if (storedSessionData) {
        const sessionData = JSON.parse(storedSessionData)

        // Check if session is still valid (with some tolerance for clock drift)
        const now = Math.floor(Date.now() / 1000)
        const expiryBuffer = 300 // 5 minutes buffer
        if (sessionData.expiry && sessionData.expiry > now - expiryBuffer) {
          console.log('Restoring session from storage after app switch:', sessionData)

          // Restore fingerprint and chainId from stored session data
          this.setFingerprint(sessionData.fingerprint)
          this.setChainId(sessionData.chainId)

          // Create a minimal session object for compatibility
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

          this.onSessionConnected(restoredSession)
          console.log('Session restored from storage after app switch')
        } else {
          console.log('Stored session has expired, clearing...')
          localStorage.removeItem('walletConnect_session')
        }
      }
    } catch (error) {
      console.warn('Failed to restore session from storage after app switch:', error)
      localStorage.removeItem('walletConnect_session')
    }
  }

  /**
   * Pause connection monitoring to save resources
   */
  private pauseConnectionMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      console.log('Connection monitoring paused')
    }
  }

  /**
   * Resume connection monitoring
   */
  private resumeConnectionMonitoring(): void {
    if (this.isConnected() && !this.healthCheckInterval) {
      console.log('Resuming connection monitoring...')
      this.startConnectionMonitoring()
    }
  }

  /**
   * Clean up resources on page unload
   */
  private cleanupOnUnload(): void {
    console.log('Cleaning up WalletConnect resources on unload...')

    // Stop all monitoring
    this.stopConnectionMonitoring()

    // Clear iOS handlers
    this.cleanupIOSHandlers()

    // Clear background grace period
    if (this.backgroundGracePeriod) {
      clearTimeout(this.backgroundGracePeriod)
      this.backgroundGracePeriod = null
    }

    // Clear event listeners
    this.eventListeners.clear()

    // Don't clear session data on unload - let it persist for restoration
    console.log('WalletConnect cleanup completed')
  }

  private static readonly INIT_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 20000,
    maxReconnectionAttempts: 5,
    reconnectionDelay: 2000,
  } as const

  private isProperlyConfigured(): boolean {
    return this.isConfigured() && !!environment.wallet.walletConnect.projectId
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

  private async createSignClient(relayUrl: string): Promise<InstanceType<typeof SignClient>> {
    return await SignClient.init({
      projectId: environment.wallet.walletConnect.projectId,
      metadata: CHIA_METADATA,
      relayUrl,
    })
  }

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

  private async initializeWithRelayFallback(): Promise<InstanceType<typeof SignClient>> {
    const relayUrls = this.getRelayUrls()

    for (let i = 0; i < relayUrls.length; i++) {
      const relayUrl = relayUrls[i]
      const client = await this.tryInitializeWithRelay(relayUrl)

      if (client) {
        return client
      }

      if (i < relayUrls.length - 1) {
        console.log(
          `Waiting ${WalletConnectService.INIT_CONFIG.retryDelay}ms before trying next relay...`
        )
        await new Promise(resolve =>
          setTimeout(resolve, WalletConnectService.INIT_CONFIG.retryDelay)
        )
      }
    }

    throw new Error(`All relay connections failed. Tried ${relayUrls.length} relays.`)
  }

  private async completeInitialization(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    this.setupEventListeners()
    await this.checkPersistedState()
  }
  private async completeInitializationWithoutRestore(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    this.setupEventListeners()

    console.log('WalletConnect initialization completed without restoring persisted state')
  }

  async initialize(): Promise<void> {
    if (this.client) {
      console.log('WalletConnect already initialized')
      return
    }

    // Detect iOS and initialize handlers
    this.isIOS = this.detectIOS()
    if (this.isIOS) {
      console.log('iOS detected, initializing iOS-specific handlers')
      this.initializeIOSHandlers()
    }

    if (!this.isProperlyConfigured()) {
      const error = new Error('WalletConnect is not properly configured')
      console.error('Initialization failed:', error.message)
      throw error
    }

    if (this.initializationPromise) {
      console.log('Initialization already in progress, waiting...')
      return this.initializationPromise
    }

    const existingClient = this.getExistingClient()
    if (existingClient) {
      console.log('Using existing WalletConnect client from global scope')
      this.client = existingClient
      this.setupEventListeners()

      if (!this.isProperlyInitialized()) {
        console.warn('Existing client is not properly initialized, will reinitialize')
        this.client = null
      } else {
        await this.checkPersistedState()
        console.log('Existing client restored successfully')
        return
      }
    }

    if (this.isInitializing) {
      const error = new Error('Initialization already in progress')
      console.warn('Concurrent initialization attempt blocked')
      throw error
    }

    this.isInitializing = true
    this.lastInitializationError = null
    this.initializationPromise = this.performInitialization()

    try {
      await this.initializationPromise
    } catch (error) {
      this.lastInitializationError = error as Error
      this.clearSessionStorage()
      throw error
    } finally {
      this.isInitializing = false
      this.initializationPromise = null
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      const existingClient = this.getExistingClient()
      if (existingClient) {
        this.client = existingClient
        console.log('Using existing client from global scope')
      } else {
        this.client = await this.initializeWithRelayFallback()
        this.setGlobalClient(this.client)
      }

      await this.completeInitialization()
    } catch (error) {
      console.error('WalletConnect initialization failed:', error)
      throw error
    }
  }

  getLastInitializationError(): Error | null {
    return this.lastInitializationError
  }

  isInitializationInProgress(): boolean {
    return this.isInitializing
  }

  clearSessionStorage(): void {
    try {
      this.clearSessionData()
      if (typeof window !== 'undefined') {
        delete (window as unknown as Record<string, unknown>).__WALLETCONNECT_SIGN_CLIENT__
      }

      this.client = null
      this.session = null
      this.setFingerprint(null)
      this.setChainId(null)
      this.pairings = []
      this.eventListeners.clear()

      // Reset iOS-specific state
      this.isInBackground = false
      this.reconnectionAttempts = 0
      this.isReconnecting = false

      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = null
      }

      if (this.backgroundGracePeriod) {
        clearTimeout(this.backgroundGracePeriod)
        this.backgroundGracePeriod = null
      }

      // Clean up iOS handlers
      this.cleanupIOSHandlers()

      console.log('WalletConnect internal state cleared')
    } catch (error) {
      console.warn('Failed to clear internal state:', error)
    }
  }

  private clearSessionData(): void {
    try {
      if (typeof window === 'undefined') return

      const localStorageKeys = Object.keys(window.localStorage)
      localStorageKeys.forEach(key => {
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

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('walletConnect_session')
        console.log('Cleared walletConnect_session key')
      }

      console.log('Cleared specific session data')
    } catch (error) {
      console.warn('Failed to clear session data:', error)
    }
  }

  private clearPWAStorageSync(): void {
    if (typeof window === 'undefined') return

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

      const connectionPromise = this.client.connect({
        pairingTopic: pairing?.topic,
        optionalNamespaces: REQUIRED_NAMESPACES,
      })

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
      })

      const { uri, approval } = (await Promise.race([connectionPromise, timeoutPromise])) as {
        uri: string
        approval: () => Promise<unknown>
      }

      if (!uri) {
        throw new Error('No connection URI generated')
      }

      // Open Web3Modal for all platforms
      if (this.web3Modal) {
        this.web3Modal.openModal({ uri })
      }

      // Add timeout for approval process
      const approvalPromise = approval()
      const approvalTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Wallet approval timeout after 45 seconds')), 45000)
      })

      const session = (await Promise.race([
        approvalPromise,
        approvalTimeoutPromise,
      ])) as SessionTypes.Struct

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

    this.clearSessionStorage()
    this.reset()
    this.stopConnectionMonitoring()

    if (this.client) {
      await this.completeInitializationWithoutRestore()
    }
  }

  async request<T>(
    method: string,
    data: Record<string, unknown>
  ): Promise<{ data: T } | undefined> {
    const result = await makeWalletRequest<T>(method, data)
    return result.success ? { data: result.data! } : undefined
  }

  getPairings(): PairingTypes.Struct[] {
    return this.pairings
  }

  isInitialized(): boolean {
    return !!this.client
  }

  isProperlyInitialized(): boolean {
    if (!this.client) return false

    try {
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
   * Handle WebSocket reconnection with iOS-specific optimizations
   */
  async handleWebSocketReconnection(): Promise<boolean> {
    if (this.isReconnecting) {
      console.log('Reconnection already in progress, skipping...')
      return false
    }

    this.isReconnecting = true

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

      // For iOS, use exponential backoff with jitter
      if (this.isIOS) {
        const baseDelay = this.reconnectionDelay
        const jitter = Math.random() * 1000 // Add up to 1 second of jitter
        const delay = baseDelay * Math.pow(2, this.reconnectionAttempts) + jitter

        console.log(`iOS reconnection delay: ${delay}ms (attempt ${this.reconnectionAttempts + 1})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      // Try to reconnect by reinitializing the client
      console.log('Reinitializing WalletConnect client...')
      await this.initialize()

      // Check if we can restore the session
      if (this.session) {
        console.log('Session restored after reconnection')
        this.reconnectionAttempts = 0 // Reset on success
        return true
      }

      console.log('Reconnection completed but no active session')
      return false
    } catch (error) {
      console.error('WebSocket reconnection failed:', error)
      this.reconnectionAttempts++

      // If we've exceeded max attempts, reset the counter
      if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
        console.warn('Max reconnection attempts reached, resetting counter')
        this.reconnectionAttempts = 0
      }

      return false
    } finally {
      this.isReconnecting = false
    }
  }

  /**
   * Monitor connection health and auto-reconnect if needed with iOS optimizations
   */
  startConnectionMonitoring(): void {
    if (typeof window === 'undefined') return

    let consecutiveFailures = 0
    const maxConsecutiveFailures = this.isIOS
      ? environment.wallet.walletConnect.ios?.maxConsecutiveFailures || 3
      : 3
    let checkInterval = this.isIOS
      ? environment.wallet.walletConnect.ios?.healthCheckInterval || 20000
      : 60000

    const performHealthCheck = async () => {
      // Skip health checks if in background on iOS
      if (this.isIOS && this.isInBackground) {
        console.log('Skipping health check - app in background')
        return
      }

      if (!this.isConnected()) {
        clearInterval(this.healthCheckInterval!)
        return
      }

      try {
        const health = await this.checkConnectionHealth()
        if (health.healthy) {
          consecutiveFailures = 0
          checkInterval = this.isIOS ? 20000 : 60000 // Reset interval
        } else {
          consecutiveFailures++
          console.warn(
            `Connection health check failed (${consecutiveFailures}/${maxConsecutiveFailures})`
          )

          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.warn('Multiple consecutive health check failures, attempting reconnection...')
            const reconnected = await this.handleWebSocketReconnection()
            if (reconnected) {
              consecutiveFailures = 0
              checkInterval = this.isIOS ? 30000 : 120000 // Wait longer after reconnection attempt
            } else {
              // If reconnection failed, increase interval more aggressively
              checkInterval = Math.min(checkInterval * 2, this.isIOS ? 300000 : 600000)
            }
          } else {
            checkInterval = Math.min(checkInterval * 1.5, this.isIOS ? 300000 : 600000)
          }
        }
      } catch (error) {
        console.error('Connection monitoring error:', error)
        consecutiveFailures++
        checkInterval = Math.min(checkInterval * 1.5, this.isIOS ? 300000 : 600000)
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

    // Store session data in PWA storage with iOS-specific optimizations
    if (typeof window !== 'undefined') {
      try {
        const sessionData = {
          topic: session.topic,
          fingerprint: this.fingerprint,
          chainId: this.chainId,
          accounts: allNamespaceAccounts,
          expiry: session.expiry,
          timestamp: Date.now(),
          isIOS: this.isIOS, // Store iOS flag for restoration
          version: '2.0', // Version for future compatibility
        }

        // Use both localStorage and sessionStorage for iOS reliability
        const sessionDataString = JSON.stringify(sessionData)
        localStorage.setItem('walletConnect_session', sessionDataString)

        // Also store in sessionStorage for iOS PWA reliability
        if (this.isIOS) {
          sessionStorage.setItem('walletConnect_session', sessionDataString)
        }

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
      isIOS: this.isIOS,
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
        if (this.isIOS) {
          sessionStorage.removeItem('walletConnect_session')
        }
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
        // Try localStorage first, then sessionStorage for iOS
        let storedSessionData = localStorage.getItem('walletConnect_session')
        if (!storedSessionData && this.isIOS) {
          storedSessionData = sessionStorage.getItem('walletConnect_session')
        }

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
            if (this.isIOS) {
              sessionStorage.removeItem('walletConnect_session')
            }
          }
        }
      } catch (error) {
        console.warn('Failed to restore session from PWA storage:', error)
        localStorage.removeItem('walletConnect_session')
        if (this.isIOS) {
          sessionStorage.removeItem('walletConnect_session')
        }
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

export const useWalletConnectService = new WalletConnectService()
