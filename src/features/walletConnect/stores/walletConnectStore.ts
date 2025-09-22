import type { SessionTypes } from '@walletconnect/types'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type {
  ConnectionResult,
  DisconnectResult,
  WalletConnectState,
} from '../services/WalletConnectService'
import { useWalletConnectService } from '../services/WalletConnectService'
import type { WalletInfo } from '../types/walletConnect.types'

/**
 * AppKit Wallet Store
 *
 * This store uses the AppKit service for multichain wallet support.
 */
export const useWalletConnectStore = defineStore('walletConnect', () => {
  // State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const session = ref<SessionTypes.Struct | null>(null)
  const accounts = ref<string[]>([])
  const chainId = ref<string | null>(null)
  const error = ref<string | null>(null)
  const walletInfo = ref<WalletInfo | null>(null)
  const walletConnectService = useWalletConnectService

  // Getters
  const state = computed<WalletConnectState>(() => ({
    isConnected: isConnected.value,
    isConnecting: isConnecting.value,
    isInitialized: walletConnectService.isInitialized(),
    session: session.value,
    accounts: accounts.value,
    chainId: chainId.value,
    error: error.value,
    currentNetwork: null,
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

      if (!walletConnectService.isInitialized()) {
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

  const connect = async (): Promise<ConnectionResult> => {
    try {
      isConnecting.value = true
      error.value = null

      console.log('🔗 Connecting to wallet...')
      const result = await walletConnectService.connect()

      if (result.success) {
        syncWithService()
        await loadWalletInfo()
      }

      return result
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

      // Import wallet queries dynamically to avoid circular dependencies
      const { getWalletInfo } = await import('../queries/walletQueries')

      // Fetch real wallet data
      const result = await getWalletInfo()

      if (result.success && result.data) {
        walletInfo.value = result.data
        console.log('✅ Wallet info loaded successfully:', result.data)
      } else {
        console.warn('⚠️ Failed to load wallet info:', result.error)
        // Fallback to basic info
        const info: WalletInfo = {
          fingerprint: 0,
          address: primaryAccount.value || '',
          balance: null,
          isConnected: true,
        }
        walletInfo.value = info
      }
    } catch (err) {
      console.error('❌ Failed to load wallet info:', err)
      // Fallback to basic info on error
      const info: WalletInfo = {
        fingerprint: 0,
        address: primaryAccount.value || '',
        balance: null,
        isConnected: true,
      }
      walletInfo.value = info
    }
  }

  const refreshWalletInfo = async (): Promise<void> => {
    await loadWalletInfo()
  }

  const refreshBalance = async (): Promise<void> => {
    try {
      if (!isConnected.value) {
        console.warn('⚠️ Not connected to wallet, cannot refresh balance')
        return
      }

      console.log('💰 Refreshing wallet balance...')

      // Import wallet queries dynamically to avoid circular dependencies
      const { getAssetBalance } = await import('../queries/walletQueries')

      // Fetch real balance data
      const result = await getAssetBalance()

      if (result.success && result.data && walletInfo.value) {
        walletInfo.value.balance = result.data
        console.log('✅ Wallet balance refreshed successfully:', result.data)
      } else {
        console.warn('⚠️ Failed to refresh wallet balance:', result.error)
      }
    } catch (err) {
      console.error('❌ Failed to refresh wallet balance:', err)
    }
  }

  const testConnection = async (): Promise<boolean> => {
    try {
      return walletConnectService.isConnected()
    } catch (err) {
      console.error('❌ Connection test failed:', err)
      return false
    }
  }

  const getAssetBalance = async () => {
    try {
      if (!isConnected.value) {
        throw new Error('Not connected to wallet')
      }

      // For now, return a mock balance
      // In the future, this could be enhanced to fetch actual asset balances
      return {
        confirmed: '0',
        spendable: '0',
        spendableCoinCount: 0,
      }
    } catch (err) {
      console.error('❌ Failed to get asset balance:', err)
      throw err
    }
  }

  const switchNetwork = async (chainId: string): Promise<boolean> => {
    try {
      console.log('🔄 Switching network...')
      const success = await walletConnectService.switchNetwork(chainId)

      if (success) {
        syncWithService()
        console.log('✅ Network switched successfully')
      }

      return success
    } catch (err) {
      console.error('❌ Network switch failed:', err)
      return false
    }
  }

  const forceReset = (): void => {
    console.log('🔄 Force resetting AppKit store...')
    walletConnectService.cleanup()

    // Reset local state
    isConnected.value = false
    isConnecting.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    error.value = null
    walletInfo.value = null

    console.log('✅ AppKit store reset completed')
  }

  // Event handling
  const setupEventListeners = (): void => {
    walletConnectService.on('connect', async () => {
      console.log('🔗 Wallet connected event received')
      syncWithService()
      await loadWalletInfo()
    })

    walletConnectService.on('disconnect', () => {
      console.log('🔌 Wallet disconnected event received')
      syncWithService()
      walletInfo.value = null
    })

    walletConnectService.on('error', (data: unknown) => {
      console.log('❌ Wallet error event received:', data)
      error.value = ((data as Record<string, unknown>).message as string) || 'Unknown error'
    })

    walletConnectService.on('accountsChanged', () => {
      console.log('👤 Accounts changed event received')
      syncWithService()
    })

    walletConnectService.on('chainChanged', () => {
      console.log('⛓️ Chain changed event received')
      syncWithService()
    })

    walletConnectService.on('session_restore', async () => {
      console.log('🔄 Wallet session restored event received')
      syncWithService()
      await loadWalletInfo()
    })
  }

  // Remove event listeners (for cleanup)
  const removeEventListeners = (): void => {
    walletConnectService.off('connect')
    walletConnectService.off('disconnect')
    walletConnectService.off('error')
    walletConnectService.off('accountsChanged')
    walletConnectService.off('chainChanged')
    walletConnectService.off('session_restore')
  }

  // Use removeEventListeners in cleanup
  const cleanup = (): void => {
    console.log('🧹 Cleaning up AppKit store...')
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

    console.log('✅ AppKit store cleanup completed')
  }

  // Setup event listeners on store creation
  setupEventListeners()

  return {
    // State
    state: computed(() => state.value),
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value),
    isInitialized: computed(() => walletConnectService.isInitialized()),
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
    startConnection,
    disconnect,
    loadWalletInfo,
    refreshWalletInfo,
    refreshBalance,
    testConnection,
    getAssetBalance,
    switchNetwork,
    forceReset,
    cleanup,

    // Service access (for advanced usage)
    service: walletConnectService,
  }
})
