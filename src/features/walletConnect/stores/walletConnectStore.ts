import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useWalletConnectService } from '../services/WalletConnectService'
import type {
  ConnectionResult,
  DisconnectResult,
  WalletConnectSession,
  WalletConnectState,
  WalletInfo,
} from '../types/walletConnect.types'

/**
 * Unified WalletConnect Store
 *
 * This store uses the unified WalletConnectService that combines
 * the best features from both the original and V2 implementations.
 */
export const useWalletConnectStore = defineStore('walletConnect', () => {
  // State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const session = ref<WalletConnectSession | null>(null)
  const accounts = ref<string[]>([])
  const chainId = ref<string | null>(null)
  const error = ref<string | null>(null)
  const walletInfo = ref<WalletInfo | null>(null)
  const walletConnectService = useWalletConnectService

  // Getters
  const state = computed<WalletConnectState>(() => ({
    isConnected: isConnected.value,
    isConnecting: isConnecting.value,
    session: session.value,
    accounts: accounts.value,
    chainId: chainId.value,
    error: error.value,
  }))

  const hasChiaAccount = computed(() => {
    return accounts.value.some(account => account.startsWith('xch') || account.startsWith('txch'))
  })

  const primaryAccount = computed(() => {
    return (
      accounts.value.find(account => account.startsWith('xch') || account.startsWith('txch')) ||
      accounts.value[0] ||
      null
    )
  })

  // Sync with service state
  const syncWithService = () => {
    const serviceState = walletConnectService.getState()
    isConnected.value = serviceState.isConnected
    isConnecting.value = serviceState.isConnecting
    session.value = serviceState.session
    accounts.value = serviceState.accounts
    chainId.value = serviceState.chainId
    error.value = serviceState.error
  }

  // Watch for service state changes
  watch(
    () => walletConnectService.getState(),
    () => {
      syncWithService()
    },
    { immediate: true, deep: true }
  )

  // Actions
  const initialize = async (): Promise<void> => {
    try {
      console.log('🚀 Initializing WalletConnect store...')

      // Set up event listeners immediately before any initialization
      setupEventListeners()

      if (!walletConnectService.isInitialized) {
        await walletConnectService.initialize()
      } else {
        console.log('WalletConnect service already initialized')
      }

      // Sync state after initialization
      syncWithService()

      console.log('✅ WalletConnect store initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Initialization failed'
      error.value = errorMessage
      console.error('❌ Failed to initialize WalletConnect store:', errorMessage)
      throw err
    }
  }

  const connect = async (pairing?: { topic: string }): Promise<ConnectionResult> => {
    try {
      isConnecting.value = true
      error.value = null

      console.log('🔗 Connecting to wallet...')
      const result = await walletConnectService.connect(pairing)

      if (result) {
        // Wait for approval
        const sessionResult = await result.approval()

        if (sessionResult) {
          const sessionData = walletConnectService.getSession()
          const accountsData = walletConnectService.getAccounts()

          session.value = sessionData
          accounts.value = accountsData
          chainId.value = walletConnectService.getNetworkInfo().chainId
          isConnected.value = true
          setupEventListeners()

          return { success: true, session: sessionData || undefined, accounts: accountsData }
        } else {
          error.value = 'Connection failed - no session received'
          return { success: false, error: 'Connection failed - no session received' }
        }
      } else {
        error.value = 'Connection failed'
        return { success: false, error: 'Connection failed' }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed'
      error.value = errorMessage
      console.error('❌ Wallet connection error:', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isConnecting.value = false
    }
  }

  const startConnection = async (): Promise<void> => {
    await initialize()
  }

  const disconnect = async (): Promise<DisconnectResult> => {
    try {
      console.log('🔌 Disconnecting from wallet...')
      const result = await walletConnectService.disconnect()

      if (result.success) {
        session.value = null
        accounts.value = []
        chainId.value = null
        isConnected.value = false
        walletInfo.value = null
        console.log('✅ Wallet disconnected successfully')
      } else {
        console.error('❌ Wallet disconnect failed:', result.error)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      console.error('❌ Wallet disconnect error:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const loadWalletInfo = async (): Promise<void> => {
    try {
      if (!isConnected.value) {
        console.warn('⚠️ Not connected to wallet, cannot load wallet info')
        return
      }

      console.log('📊 Loading wallet info...')
      const info = await walletConnectService.getWalletInfo()
      walletInfo.value = info || null
      console.log('✅ Wallet info loaded successfully')
    } catch (err) {
      console.error('❌ Failed to load wallet info:', err)
      // Don't throw error, just log it
    }
  }

  const refreshWalletInfo = async (): Promise<void> => {
    await loadWalletInfo()
  }

  const testConnection = async (): Promise<boolean> => {
    try {
      return await walletConnectService.testConnection()
    } catch (err) {
      console.error('❌ Connection test failed:', err)
      return false
    }
  }

  const getAssetBalance = async (assetId: string) => {
    try {
      if (!isConnected.value) {
        throw new Error('Not connected to wallet')
      }

      return await walletConnectService.getAssetBalance(assetId)
    } catch (err) {
      console.error('❌ Failed to get asset balance:', err)
      throw err
    }
  }

  const handleWebSocketReconnection = async (): Promise<boolean> => {
    try {
      console.log('🔄 Handling WebSocket reconnection...')
      const reconnected = await walletConnectService.handleWebSocketReconnection()

      if (reconnected) {
        // Sync state after reconnection
        syncWithService()
        console.log('✅ Reconnection successful')
      }

      return reconnected
    } catch (err) {
      console.error('❌ WebSocket reconnection failed:', err)
      return false
    }
  }

  const forceReset = (): void => {
    console.log('🔄 Force resetting WalletConnect store...')
    walletConnectService.forceReset()

    // Reset local state
    isConnected.value = false
    isConnecting.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    error.value = null
    walletInfo.value = null

    console.log('✅ WalletConnect store reset completed')
  }

  // Event handling
  const setupEventListeners = (): void => {
    walletConnectService.on('session_connected', async () => {
      console.log('🔗 Session connected event received')
      syncWithService()
      await loadWalletInfo()
    })

    walletConnectService.on('session_disconnected', () => {
      console.log('🔌 Session disconnected event received')
      syncWithService()
      walletInfo.value = null
    })

    walletConnectService.on('session_reject', () => {
      console.log('❌ Session rejected event received')
      error.value = 'Connection rejected by wallet'
    })

    walletConnectService.on('session_proposal', () => {
      console.log('📋 Session proposal event received')
      // Handle session proposal if needed
    })

    walletConnectService.on('session_update', () => {
      console.log('🔄 Session update event received')
      syncWithService()
    })
  }

  // Remove event listeners (for cleanup)
  const removeEventListeners = (): void => {
    walletConnectService.off('session_connected')
    walletConnectService.off('session_disconnected')
    walletConnectService.off('session_reject')
    walletConnectService.off('session_proposal')
    walletConnectService.off('session_update')
  }

  // Use removeEventListeners in cleanup
  const cleanup = (): void => {
    console.log('🧹 Cleaning up WalletConnect store...')
    removeEventListeners()
    walletConnectService.cleanup()

    // Reset local state
    isConnected.value = false
    isConnecting.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    error.value = null
    walletInfo.value = null

    console.log('✅ WalletConnect store cleanup completed')
  }

  // Legacy methods for compatibility
  const connectLegacy = async (pairing?: { topic: string }): Promise<ConnectionResult> => {
    try {
      isConnecting.value = true
      error.value = null

      const result = await walletConnectService.connectLegacy(pairing)

      if (result.success) {
        syncWithService()
        setupEventListeners()
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      isConnecting.value = false
    }
  }

  // Setup event listeners on store creation
  setupEventListeners()

  return {
    // State
    state: computed(() => state.value),
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value),
    isInitialized: computed(() => walletConnectService.isInitialized),
    session: computed(() => session.value),
    accounts: computed(() => accounts.value),
    chainId: computed(() => chainId.value),
    error: computed(() => error.value),
    walletInfo: computed(() => walletInfo.value),

    // Computed
    hasChiaAccount: computed(() => hasChiaAccount.value),
    primaryAccount: computed(() => primaryAccount.value),

    // Methods
    initialize,
    connect,
    connectLegacy,
    startConnection,
    disconnect,
    loadWalletInfo,
    refreshWalletInfo,
    testConnection,
    getAssetBalance,
    handleWebSocketReconnection,
    forceReset,
    cleanup,

    // Service access (for advanced usage)
    service: walletConnectService,
  }
})
