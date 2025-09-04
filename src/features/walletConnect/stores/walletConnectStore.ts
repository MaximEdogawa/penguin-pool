import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chiaWalletConnectService } from '../services/ChiaWalletConnectService'
import { useUserStore } from '@/entities/user/store/userStore'
import type {
  WalletConnectState,
  WalletConnectSession,
  ConnectionResult,
  DisconnectResult,
  ChiaWalletInfo,
  WalletConnectEvent,
} from '../types/walletConnect.types'
import type { ChiaConnectionState } from '../types/chia-rpc.types'

export const useWalletConnectStore = defineStore('walletConnect', () => {
  // State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const session = ref<WalletConnectSession | null>(null)
  const accounts = ref<string[]>([])
  const chainId = ref<string | null>(null)
  const error = ref<string | null>(null)
  const walletInfo = ref<ChiaWalletInfo | null>(null)

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
    return accounts.value.some(account => account.startsWith('xch'))
  })

  const primaryAccount = computed(() => {
    return accounts.value.find(account => account.startsWith('xch')) || accounts.value[0] || null
  })

  // Actions
  const initialize = async (): Promise<void> => {
    try {
      console.log('Initializing WalletConnect store...')

      // Only initialize if not already done
      if (!chiaWalletConnectService.isInitialized()) {
        console.log('Initializing WalletConnect service...')
        await chiaWalletConnectService.initialize()
        console.log('WalletConnect service initialized')
      } else {
        console.log('WalletConnect service already initialized')
      }

      // Always try to restore session after initialization
      console.log('Attempting to restore session...')
      await restoreSession()
      console.log('Session restoration completed')
    } catch (err) {
      console.error('Failed to initialize Wallet Connect:', err)
      error.value = err instanceof Error ? err.message : 'Initialization failed'
    }
  }

  const connect = async (pairing?: { topic: string }): Promise<ConnectionResult> => {
    try {
      isConnecting.value = true
      error.value = null

      const result = await chiaWalletConnectService.connect(pairing)

      if (result.success && result.session) {
        session.value = result.session
        accounts.value = result.accounts || []
        isConnected.value = true

        // Get wallet info
        walletInfo.value = await chiaWalletConnectService.getWalletInfo()

        // Set up event listeners
        setupEventListeners()
      } else {
        error.value = result.error || 'Connection failed'
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

  const startConnection = async (): Promise<{
    uri: string
    approval: () => Promise<unknown>
  } | null> => {
    try {
      return await chiaWalletConnectService.startConnection()
    } catch (err) {
      console.error('Failed to start connection:', err)
      return null
    }
  }

  const disconnect = async (): Promise<DisconnectResult> => {
    try {
      // Use force reset to ensure complete cleanup
      await chiaWalletConnectService.forceReset()

      // Clear state
      isConnected.value = false
      session.value = null
      accounts.value = []
      chainId.value = null
      walletInfo.value = null
      error.value = null

      // Remove event listeners
      removeEventListeners()

      // Logout user from the app
      const userStore = useUserStore()
      userStore.logout()

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  const restoreSession = async (): Promise<void> => {
    try {
      const currentSession = chiaWalletConnectService.getSession()
      const isCurrentlyConnected = chiaWalletConnectService.isConnected()

      if (currentSession && isCurrentlyConnected) {
        session.value = currentSession
        accounts.value = extractAccountsFromSession(currentSession)
        isConnected.value = true

        // Get wallet info
        walletInfo.value = await chiaWalletConnectService.getWalletInfo()

        // Set up event listeners
        setupEventListeners()

        console.log('Session restored successfully:', {
          topic: currentSession.topic,
          accounts: accounts.value,
          walletInfo: walletInfo.value,
        })
      } else {
        console.log('No valid session to restore')
      }
    } catch (err) {
      console.error('Failed to restore session:', err)
      // Clear invalid session
      await disconnect()
    }
  }

  const sendRequest = async (method: string, params: unknown[] = []): Promise<unknown> => {
    try {
      if (!isConnected.value) {
        throw new Error('Not connected to wallet')
      }

      return await chiaWalletConnectService.request(method, params)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed'
      error.value = errorMessage
      throw err
    }
  }

  const clearError = (): void => {
    error.value = null
  }

  const getWalletInfo = async (): Promise<ChiaWalletInfo | null> => {
    try {
      return await chiaWalletConnectService.getWalletInfo()
    } catch (err) {
      console.error('Failed to get wallet info:', err)
      return null
    }
  }

  const refreshWalletInfo = async (): Promise<ChiaWalletInfo | null> => {
    try {
      console.log('Refreshing wallet info...')
      const info = await chiaWalletConnectService.refreshWalletInfo()
      if (info) {
        walletInfo.value = info
        console.log('Wallet info refreshed successfully:', info)
      } else {
        console.warn('No wallet info returned from refresh')
      }
      return info
    } catch (err) {
      console.error('Failed to refresh wallet info:', err)
      return null
    }
  }

  const getNetworkInfo = () => {
    return chiaWalletConnectService.getNetworkInfo()
  }

  // Helper function to extract accounts from session
  const extractAccountsFromSession = (session: WalletConnectSession): string[] => {
    const accounts: string[] = []

    Object.values(session.namespaces).forEach((namespace: unknown) => {
      if (
        namespace &&
        typeof namespace === 'object' &&
        'accounts' in namespace &&
        Array.isArray((namespace as { accounts: unknown }).accounts)
      ) {
        accounts.push(...(namespace as { accounts: string[] }).accounts)
      }
    })

    return accounts
  }

  const setupEventListeners = (): void => {
    // Session events
    chiaWalletConnectService.on('session_delete', handleSessionDelete)
    chiaWalletConnectService.on('session_expire', handleSessionExpire)
    chiaWalletConnectService.on('session_update', handleSessionUpdate)
    chiaWalletConnectService.on('session_restored', handleSessionRestored)

    // Connection events
    chiaWalletConnectService.on('session_approve', handleSessionApprove)
    chiaWalletConnectService.on('session_reject', handleSessionReject)
  }

  const removeEventListeners = (): void => {
    chiaWalletConnectService.off('session_delete')
    chiaWalletConnectService.off('session_expire')
    chiaWalletConnectService.off('session_update')
    chiaWalletConnectService.off('session_restored')
    chiaWalletConnectService.off('session_approve')
    chiaWalletConnectService.off('session_reject')
  }

  const handleSessionDelete = (): void => {
    // console.log('Session deleted:', event)
    isConnected.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    walletInfo.value = null

    // Logout user from the app
    const userStore = useUserStore()
    userStore.logout()
  }

  const handleSessionExpire = (): void => {
    // console.log('Session expired:', event)
    isConnected.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    walletInfo.value = null

    // Logout user from the app
    const userStore = useUserStore()
    userStore.logout()
  }

  const handleSessionUpdate = (event: WalletConnectEvent): void => {
    // console.log('Session updated:', event)
    // Update session data if needed
    if (event.data && event.data.namespaces) {
      // Extract updated accounts
      const updatedAccounts: string[] = []
      Object.values(event.data.namespaces).forEach((namespace: unknown) => {
        if (
          namespace &&
          typeof namespace === 'object' &&
          'accounts' in namespace &&
          Array.isArray((namespace as { accounts: unknown }).accounts)
        ) {
          updatedAccounts.push(...(namespace as { accounts: string[] }).accounts)
        }
      })
      accounts.value = updatedAccounts
    }
  }

  const handleSessionApprove = (): void => {
    // console.log('Session approved:', event)
    // Session is already handled in connect method
  }

  const handleSessionReject = (event: WalletConnectEvent): void => {
    console.log('Session rejected:', event)
    error.value = 'Wallet connection was rejected'
    isConnecting.value = false
  }

  const handleSessionRestored = async (): Promise<void> => {
    // console.log('Session restored:', event)
    try {
      const currentSession = chiaWalletConnectService.getSession()
      if (currentSession) {
        session.value = currentSession
        accounts.value = extractAccountsFromSession(currentSession)
        isConnected.value = true

        // Get wallet info
        walletInfo.value = await chiaWalletConnectService.getWalletInfo()
      }
    } catch (err) {
      console.error('Failed to restore session from event:', err)
    }
  }

  // Chia-specific methods
  const getChiaConnectionState = computed((): ChiaConnectionState => {
    return chiaWalletConnectService.getConnectionState()
  })

  const getPairings = computed(() => {
    return chiaWalletConnectService.getPairings()
  })

  // Chia-specific RPC methods
  const makeChiaRequest = async <T>(method: string, data: Record<string, unknown>): Promise<T> => {
    try {
      return await chiaWalletConnectService.request<T>(method, data)
    } catch (err) {
      console.error(`Chia RPC request failed (${method}):`, err)
      throw err
    }
  }

  return {
    // State
    isConnected,
    isConnecting,
    session,
    accounts,
    chainId,
    error,
    walletInfo,

    // Getters
    state,
    hasChiaAccount,
    primaryAccount,

    // Actions
    initialize,
    connect,
    disconnect,
    restoreSession,
    sendRequest,
    clearError,
    getWalletInfo,
    refreshWalletInfo,
    getNetworkInfo,
    startConnection,

    // Chia-specific methods
    getChiaConnectionState,
    getPairings,
    makeChiaRequest,
  }
})
