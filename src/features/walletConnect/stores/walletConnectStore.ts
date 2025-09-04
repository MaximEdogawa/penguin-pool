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
      // Only initialize if not already done
      if (!chiaWalletConnectService.isInitialized()) {
        await chiaWalletConnectService.initialize()
      }
      await restoreSession()
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
      const result = await chiaWalletConnectService.disconnect()

      if (result.success) {
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
      } else {
        error.value = result.error || 'Disconnect failed'
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  const restoreSession = async (): Promise<void> => {
    try {
      const currentSession = walletConnectService.getSession()
      const isCurrentlyConnected = walletConnectService.isConnected()

      if (currentSession && isCurrentlyConnected) {
        session.value = currentSession
        accounts.value = extractAccountsFromSession(currentSession)
        isConnected.value = true

        // Get wallet info
        walletInfo.value = await walletConnectService.getWalletInfo()

        // Set up event listeners
        setupEventListeners()
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

      return await walletConnectService.sendRequest(method, params)
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
      return await walletConnectService.getWalletInfo()
    } catch (err) {
      console.error('Failed to get wallet info:', err)
      return null
    }
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
    walletConnectService.addEventListener('session_delete', handleSessionDelete)
    walletConnectService.addEventListener('session_expire', handleSessionExpire)
    walletConnectService.addEventListener('session_update', handleSessionUpdate)

    // Connection events
    walletConnectService.addEventListener('session_approve', handleSessionApprove)
    walletConnectService.addEventListener('session_reject', handleSessionReject)
  }

  const removeEventListeners = (): void => {
    walletConnectService.removeEventListener('session_delete')
    walletConnectService.removeEventListener('session_expire')
    walletConnectService.removeEventListener('session_update')
    walletConnectService.removeEventListener('session_approve')
    walletConnectService.removeEventListener('session_reject')
  }

  const handleSessionDelete = (event: WalletConnectEvent): void => {
    console.log('Session deleted:', event)
    isConnected.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    walletInfo.value = null

    // Logout user from the app
    const userStore = useUserStore()
    userStore.logout()
  }

  const handleSessionExpire = (event: WalletConnectEvent): void => {
    console.log('Session expired:', event)
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
    console.log('Session updated:', event)
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

  const handleSessionApprove = (event: WalletConnectEvent): void => {
    console.log('Session approved:', event)
    // Session is already handled in connect method
  }

  const handleSessionReject = (event: WalletConnectEvent): void => {
    console.log('Session rejected:', event)
    error.value = 'Wallet connection was rejected'
    isConnecting.value = false
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
    startConnection,

    // Chia-specific methods
    getChiaConnectionState,
    getPairings,
    makeChiaRequest,
  }
})
