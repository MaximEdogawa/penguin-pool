/**
 * WalletConnect V2 Usage Example
 *
 * This file demonstrates how to use the new simplified WalletConnect implementation
 * with improved iOS support and automatic reconnection.
 */

import { useWalletConnect } from '../composables/useWalletConnect'
import { useWalletConnectStore } from '../stores/walletConnectStore'

// Example 1: Using the Store (Recommended for most use cases)
export function useWalletConnectWithStore() {
  const store = useWalletConnectStore()

  // Initialize WalletConnect
  const initializeWallet = async () => {
    try {
      await store.initialize()
      console.log('✅ WalletConnect initialized')
    } catch (error) {
      console.error('❌ Failed to initialize WalletConnect:', error)
    }
  }

  // Connect to wallet
  const connectWallet = async () => {
    try {
      const result = await store.connect()
      if (result.success) {
        console.log('✅ Wallet connected:', result.session)
        console.log('📊 Accounts:', store.accounts)
        console.log('🔗 Chain ID:', store.chainId)
      } else {
        console.error('❌ Connection failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Connection error:', error)
    }
  }

  // Disconnect from wallet
  const disconnectWallet = async () => {
    try {
      const result = await store.disconnect()
      if (result.success) {
        console.log('✅ Wallet disconnected')
      } else {
        console.error('❌ Disconnect failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Disconnect error:', error)
    }
  }

  // Make a request to the wallet
  const makeWalletRequest = async (method: string, params: unknown[]) => {
    try {
      if (!store.isConnected) {
        throw new Error('Not connected to wallet')
      }

      const result = await store.service.request(method, params)
      console.log('✅ Wallet request successful:', result)
      return result
    } catch (error) {
      console.error('❌ Wallet request failed:', error)
      throw error
    }
  }

  return {
    // State
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    isInitialized: store.isInitialized,
    session: store.session,
    accounts: store.accounts,
    chainId: store.chainId,
    error: store.error,
    walletInfo: store.walletInfo,

    // Computed
    hasChiaAccount: store.hasChiaAccount,
    primaryAccount: store.primaryAccount,

    // Methods
    initializeWallet,
    connectWallet,
    disconnectWallet,
    makeWalletRequest,
    loadWalletInfo: store.loadWalletInfo,
    refreshWalletInfo: store.refreshWalletInfo,
    testConnection: store.testConnection,
  }
}

// Example 2: Using Composables Directly (For advanced use cases)
export function useWalletConnectWithComposables() {
  const walletConnect = useWalletConnect()
  // Connection state is managed by the walletConnect composable

  // Initialize WalletConnect
  const initializeWallet = async () => {
    try {
      // WalletConnect is auto-initialized, just check if it's ready
      if (walletConnect.isInitialized.value) {
        console.log('✅ WalletConnect already initialized')
      } else {
        console.log('⏳ WalletConnect initializing...')
      }
      console.log('✅ WalletConnect initialized')
    } catch (error) {
      console.error('❌ Failed to initialize WalletConnect:', error)
    }
  }

  // Connect to wallet
  const connectWallet = async () => {
    try {
      const result = await walletConnect.connect()
      if (result.success) {
        console.log('✅ Wallet connected:', result.session)
        console.log('📊 Accounts:', walletConnect.accounts.value)
        console.log('🔗 Chain ID:', walletConnect.chainId.value)
      } else {
        console.error('❌ Connection failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Connection error:', error)
    }
  }

  // Disconnect from wallet
  const disconnectWallet = async () => {
    try {
      const result = await walletConnect.disconnect()
      if (result.success) {
        console.log('✅ Wallet disconnected')
      } else {
        console.error('❌ Disconnect failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Disconnect error:', error)
    }
  }

  // Make a request to the wallet
  const makeWalletRequest = async (method: string, params: unknown[]) => {
    try {
      if (!walletConnect.isConnected.value) {
        throw new Error('Not connected to wallet')
      }

      // Use the service directly for requests
      const { useWalletConnectService } = await import('../services/WalletConnectService')
      const service = useWalletConnectService
      const result = await service.request(method, params)
      console.log('✅ Wallet request successful:', result)
      return result
    } catch (error) {
      console.error('❌ Wallet request failed:', error)
      throw error
    }
  }

  return {
    // State
    isConnected: walletConnect.isConnected,
    isConnecting: walletConnect.isConnecting,
    isInitialized: walletConnect.isInitialized,
    session: walletConnect.session,
    accounts: walletConnect.accounts,
    chainId: walletConnect.chainId,
    error: walletConnect.error,

    // Methods
    initializeWallet,
    connectWallet,
    disconnectWallet,
    makeWalletRequest,
  }
}

// Example 3: iOS-Specific Usage
export function useWalletConnectForIOS() {
  const store = useWalletConnectStore()

  // iOS-specific initialization
  const initializeForIOS = async () => {
    try {
      console.log('🍎 Initializing WalletConnect for iOS...')

      // The service automatically detects iOS and applies optimizations
      await store.initialize()

      console.log('✅ WalletConnect initialized for iOS')
      console.log('📱 iOS optimizations applied:')
      console.log('  - Extended timeouts')
      console.log('  - WebSocket relay priority')
      console.log('  - Enhanced reconnection logic')
      console.log('  - Improved error handling')
    } catch (error) {
      console.error('❌ iOS initialization failed:', error)
      throw error
    }
  }

  // iOS-specific connection with retry logic
  const connectForIOS = async (maxRetries = 3) => {
    let attempts = 0

    while (attempts < maxRetries) {
      try {
        console.log(`🍎 iOS connection attempt ${attempts + 1}/${maxRetries}`)

        const result = await store.connect()

        if (result.success) {
          console.log('✅ iOS wallet connected successfully')
          return result
        } else {
          throw new Error(result.error || 'Connection failed')
        }
      } catch (error) {
        attempts++
        console.warn(`⚠️ iOS connection attempt ${attempts} failed:`, error)

        if (attempts >= maxRetries) {
          console.error('❌ All iOS connection attempts failed')
          throw error
        }

        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempts) * 1000
        console.log(`⏰ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return {
    // State
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    isInitialized: store.isInitialized,
    session: store.session,
    accounts: store.accounts,
    chainId: store.chainId,
    error: store.error,

    // Methods
    initializeForIOS,
    connectForIOS,
    disconnectWallet: store.disconnect,
    makeWalletRequest: (method: string, params: unknown[]) => store.service.request(method, params),
  }
}

// Example 4: Event Handling
export function useWalletConnectEvents() {
  const store = useWalletConnectStore()

  // Setup event listeners
  const setupEventListeners = () => {
    // Listen for connection events
    store.service.on('session_connected', (event: unknown) => {
      console.log('🔗 Wallet connected:', (event as Record<string, unknown>).data)
      // Handle successful connection
    })

    store.service.on('session_disconnected', (event: unknown) => {
      console.log('🔌 Wallet disconnected:', (event as Record<string, unknown>).data)
      // Handle disconnection
    })

    store.service.on('session_reject', (event: unknown) => {
      console.log('❌ Connection rejected:', (event as Record<string, unknown>).data)
      // Handle rejection
    })

    store.service.on('session_proposal', (event: unknown) => {
      console.log('📋 Session proposal:', (event as Record<string, unknown>).data)
      // Handle session proposal
    })
  }

  // Remove event listeners
  const removeEventListeners = () => {
    store.service.off('session_connected')
    store.service.off('session_disconnected')
    store.service.off('session_reject')
    store.service.off('session_proposal')
  }

  return {
    setupEventListeners,
    removeEventListeners,
    store,
  }
}
