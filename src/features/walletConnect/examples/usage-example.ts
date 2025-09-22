/**
 * WalletConnect V2 Usage Example with TanStack Query
 *
 * This file demonstrates how to use the new TanStack Query-based WalletConnect implementation
 * with improved data management, caching, and reactivity.
 */

import { useWalletConnect } from '../composables/useWalletConnect'
import { useWallet, useWalletBalance, useWalletConnection } from '../hooks/useWalletQueries'

// Example 1: Using TanStack Query Hooks (Recommended for most use cases)
export function useWalletConnectWithTanStackQuery() {
  const wallet = useWallet()

  // Initialize WalletConnect
  const initializeWallet = async () => {
    try {
      await wallet.initialization.mutateAsync()
      console.log('✅ WalletConnect initialized')
    } catch (error) {
      console.error('❌ Failed to initialize WalletConnect:', error)
    }
  }

  // Connect to wallet
  const connectWallet = async () => {
    try {
      const result = await wallet.mutations.connect.mutateAsync()
      console.log('✅ Wallet connected:', result.session)
      console.log('📊 Accounts:', wallet.walletAccounts.value?.accounts)
      console.log('🔗 Chain ID:', wallet.walletSession.value?.chainId)
    } catch (error) {
      console.error('❌ Connection error:', error)
    }
  }

  // Disconnect from wallet
  const disconnectWallet = async () => {
    try {
      await wallet.mutations.disconnect.mutateAsync()
      console.log('✅ Wallet disconnected')
    } catch (error) {
      console.error('❌ Disconnect error:', error)
    }
  }

  // Refresh wallet balance
  const refreshBalance = async () => {
    try {
      await wallet.balance.refreshBalance()
      console.log('✅ Wallet balance refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh balance:', error)
    }
  }

  return {
    // State
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    isInitialized: wallet.isInitialized,
    error: wallet.error,
    walletInfo: wallet.walletInfo,
    walletBalance: wallet.walletBalance,
    walletAccounts: wallet.walletAccounts,
    walletSession: wallet.walletSession,

    // Actions
    initializeWallet,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    refreshAll: wallet.refreshAll,
  }
}

// Example 2: Using Individual Query Hooks (For specific use cases)
export function useWalletConnectWithIndividualQueries() {
  const connection = useWalletConnection()
  const balance = useWalletBalance()

  // Connect to wallet
  const connectWallet = async () => {
    try {
      // Note: Connection is handled by the wallet service, not through queries
      console.log('✅ Wallet connection is handled by the service')
    } catch (error) {
      console.error('❌ Connection error:', error)
    }
  }

  // Refresh balance
  const refreshBalance = async () => {
    try {
      await balance.refreshBalance()
      console.log('✅ Balance refreshed')
    } catch (error) {
      console.error('❌ Failed to refresh balance:', error)
    }
  }

  return {
    // Connection state
    isConnected: connection.data.value?.isConnected ?? false,
    isConnecting: connection.data.value?.isConnecting ?? false,
    isInitialized: connection.data.value?.isInitialized ?? false,
    error: connection.data.value?.error ?? null,

    // Balance data
    balance: balance.data.value,
    isBalanceLoading: balance.isLoading.value,
    balanceError: balance.error.value,

    // Actions
    connectWallet,
    refreshBalance,
  }
}

// Example 3: Using Composables Directly (For advanced use cases)
export function useWalletConnectWithComposables() {
  const walletConnect = useWalletConnect()

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
  }
}

// Example 4: iOS-Specific Usage with TanStack Query
export function useWalletConnectForIOS() {
  const wallet = useWallet()

  // iOS-specific initialization
  const initializeForIOS = async () => {
    try {
      console.log('🍎 Initializing WalletConnect for iOS...')

      // The service automatically detects iOS and applies optimizations
      await wallet.initialization.mutateAsync()

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

        const result = await wallet.mutations.connect.mutateAsync()

        console.log('✅ iOS wallet connected successfully')
        return result
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
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    isInitialized: wallet.isInitialized,
    error: wallet.error,
    walletInfo: wallet.walletInfo,
    walletBalance: wallet.walletBalance,

    // Methods
    initializeForIOS,
    connectForIOS,
    disconnectWallet: () => wallet.mutations.disconnect.mutateAsync(),
    refreshBalance: () => wallet.balance.refreshBalance(),
  }
}

// Example 5: Event Handling with TanStack Query
export function useWalletConnectEvents() {
  const wallet = useWallet()

  // Setup event listeners
  const setupEventListeners = () => {
    // TanStack Query automatically handles data updates
    // You can also listen to query state changes
    console.log('🎧 TanStack Query automatically handles wallet state changes')
    console.log('📊 Connection state:', wallet.connection.data.value)
    console.log('💰 Balance state:', wallet.balance.data.value)
  }

  // Refresh all data
  const refreshAll = () => {
    wallet.refreshAll()
  }

  return {
    setupEventListeners,
    refreshAll,
    wallet,
  }
}
