import { useUserStore } from '@/entities/user/store/userStore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { sageWalletConnectService } from '../services/SageWalletConnectService'
import type { CommandParams, WalletConnectCommand } from '../types/command.types'
import type {
  ChiaConnectionState,
  ChiaWalletInfo,
  ConnectionResult,
  DisconnectResult,
  SageWalletInfo,
  WalletConnectEvent,
  WalletConnectSession,
  WalletConnectState,
} from '../types/walletConnect.types'

export const useWalletConnectStore = defineStore('walletConnect', () => {
  // State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const session = ref<WalletConnectSession | null>(null)
  const accounts = ref<string[]>([])
  const chainId = ref<string | null>(null)
  const error = ref<string | null>(null)
  const walletInfo = ref<SageWalletInfo | null>(null)

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

  // Actions
  const initialize = async (): Promise<void> => {
    try {
      console.log('Initializing WalletConnect store...')

      // Only initialize if not already done
      if (!sageWalletConnectService.isInitialized()) {
        console.log('Initializing WalletConnect service...')
        await sageWalletConnectService.initialize()
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

      const result = await sageWalletConnectService.connect(pairing)

      if (result.success && result.session) {
        session.value = result.session
        accounts.value = result.accounts || []
        isConnected.value = true
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
      // Ensure service is initialized before starting connection
      if (!sageWalletConnectService.isInitialized()) {
        await sageWalletConnectService.initialize()
      }

      return await sageWalletConnectService.startConnection()
    } catch (err) {
      console.error('Failed to start connection:', err)
      return null
    }
  }

  const disconnect = async (): Promise<DisconnectResult> => {
    try {
      // Use force reset to ensure complete cleanup
      await sageWalletConnectService.forceReset()

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
      const currentSession = sageWalletConnectService.getSession()
      const isCurrentlyConnected = sageWalletConnectService.isConnected()

      if (currentSession && isCurrentlyConnected) {
        session.value = currentSession
        accounts.value = extractAccountsFromSession(currentSession)
        isConnected.value = true
        setupEventListeners()
      } else {
        console.log('No valid session to restore')
      }
    } catch (err) {
      console.error('Failed to restore session:', err)
      // Clear invalid session
      await disconnect()
    }
  }

  const sendRequest = async (
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<unknown> => {
    try {
      if (!isConnected.value) {
        throw new Error('Not connected to wallet')
      }

      return await sageWalletConnectService.request(method, params)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed'
      error.value = errorMessage
      throw err
    }
  }

  const clearError = (): void => {
    error.value = null
  }

  const getWalletInfo = async (): Promise<SageWalletInfo | null> => {
    try {
      return await sageWalletConnectService.getWalletInfo()
    } catch (err) {
      console.error('Failed to get wallet info:', err)
      return null
    }
  }

  const refreshWalletInfo = async (): Promise<ChiaWalletInfo | null> => {
    try {
      console.log('Refreshing wallet info...')
      const info = await sageWalletConnectService.refreshWalletInfo()
      if (info) {
        walletInfo.value = { ...info }
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
    return sageWalletConnectService.getNetworkInfo()
  }

  const testRpcConnection = async (): Promise<boolean> => {
    try {
      return await sageWalletConnectService.testRpcConnection()
    } catch (err) {
      console.error('Failed to test RPC connection:', err)
      return false
    }
  }

  // Helper function to extract accounts from session
  const extractAccountsFromSession = (session: WalletConnectSession): string[] => {
    const accounts: string[] = []

    if (session.namespaces) {
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
    }

    return accounts
  }

  const setupEventListeners = (): void => {
    // Session events
    sageWalletConnectService.on('session_delete', handleSessionDelete)
    sageWalletConnectService.on('session_expire', handleSessionExpire)
    sageWalletConnectService.on('session_update', handleSessionUpdate)
    sageWalletConnectService.on('session_restored', handleSessionRestored)

    // Connection events
    sageWalletConnectService.on('session_approve', handleSessionApprove)
    sageWalletConnectService.on('session_reject', handleSessionReject)
  }

  const removeEventListeners = (): void => {
    sageWalletConnectService.off('session_delete')
    sageWalletConnectService.off('session_expire')
    sageWalletConnectService.off('session_update')
    sageWalletConnectService.off('session_restored')
    sageWalletConnectService.off('session_approve')
    sageWalletConnectService.off('session_reject')
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
    if (event.data && typeof event.data === 'object' && 'namespaces' in event.data) {
      const eventData = event.data as { namespaces: Record<string, unknown> }
      // Extract updated accounts
      const updatedAccounts: string[] = []
      if (eventData.namespaces) {
        Object.values(eventData.namespaces).forEach((namespace: unknown) => {
          if (
            namespace &&
            typeof namespace === 'object' &&
            'accounts' in namespace &&
            Array.isArray((namespace as { accounts: unknown }).accounts)
          ) {
            updatedAccounts.push(...(namespace as { accounts: string[] }).accounts)
          }
        })
      }
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
      const currentSession = sageWalletConnectService.getSession()
      if (currentSession) {
        session.value = currentSession
        accounts.value = extractAccountsFromSession(currentSession)
        isConnected.value = true

        // Get wallet info
        walletInfo.value = await sageWalletConnectService.getWalletInfo()
      }
    } catch (err) {
      console.error('Failed to restore session from event:', err)
    }
  }

  // Chia-specific methods
  const getChiaConnectionState = computed((): ChiaConnectionState => {
    return sageWalletConnectService.getConnectionState()
  })

  const getPairings = computed(() => {
    return sageWalletConnectService.getPairings()
  })

  // Chia-specific RPC methods
  const makeChiaRequest = async <T>(method: string, data: Record<string, unknown>): Promise<T> => {
    try {
      const result = await sageWalletConnectService.request<T>(method, data)
      if (!result) {
        throw new Error('Request failed: No response received')
      }
      if ('error' in result) {
        throw new Error(`Request failed: ${JSON.stringify(result.error)}`)
      }
      return result.data
    } catch (err) {
      console.error(`Chia RPC request failed (${method}):`, err)
      throw err
    }
  }

  // Command execution methods
  const executeCommand = async <TParams extends Record<string, unknown>, TResponse>(
    command: string,
    params: TParams
  ): Promise<{ success: boolean; data?: TResponse; error?: string }> => {
    try {
      const result = await sageWalletConnectService.executeCommand(
        command as WalletConnectCommand,
        params as CommandParams
      )
      return {
        success: result.success,
        data: result.data as TResponse,
        error: result.error,
      }
    } catch (err) {
      console.error(`Command execution failed (${command}):`, err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Command execution failed',
      }
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
    testRpcConnection,
    executeCommand,
  }
})
