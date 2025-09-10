import { useUserStore } from '@/entities/user/store/userStore'
import { sessionManager } from '@/shared/services/sessionManager'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getWalletInfo,
  testRpcConnection as testRpcConnectionQuery,
} from '../queries/walletQueries'
import { sageWalletConnectService } from '../services/SageWalletConnectService'
import type {
  ChiaConnectionState,
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
      // Set up event listeners immediately before any initialization
      setupEventListeners()

      if (!sageWalletConnectService.isInitialized()) {
        await sageWalletConnectService.initialize()
      } else {
        console.log('WalletConnect service already initialized')
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

      const result = await sageWalletConnectService.connect(pairing)

      if (result.success && result.session) {
        session.value = result.session
        accounts.value = result.accounts || []
        chainId.value = sageWalletConnectService.getNetworkInfo().chainId
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
      // Clear wallet state first
      isConnected.value = false
      session.value = null
      accounts.value = []
      chainId.value = null
      walletInfo.value = null
      error.value = null

      removeEventListeners()

      // Use centralized session manager for comprehensive clearing
      await sessionManager.clearAllSessionData({
        clearWalletConnect: true,
        clearUserData: true,
        clearThemeData: true,
        clearPWAStorage: true,
        clearServiceWorker: true,
        clearAllCaches: false, // Don't clear all caches, just session-related ones
      })

      // Reset the wallet connect service after clearing storage
      await sageWalletConnectService.forceReset()

      console.log('Wallet disconnect completed successfully')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      error.value = errorMessage
      console.error('Error during wallet disconnect:', err)
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
        chainId.value = sageWalletConnectService.getNetworkInfo().chainId
        isConnected.value = true
        setupEventListeners()

        // Fetch wallet info when restoring session
        try {
          const fetchedWalletInfo = await getWalletInfo()
          if (fetchedWalletInfo.success && fetchedWalletInfo.data) {
            walletInfo.value = fetchedWalletInfo.data

            // Sync with user store if user is not already authenticated
            const userStore = useUserStore()
            if (!userStore.isAuthenticated && fetchedWalletInfo.data.address) {
              try {
                if (fetchedWalletInfo.data.fingerprint) {
                  await userStore.login(fetchedWalletInfo.data.fingerprint, 'wallet-user')
                } else {
                  await userStore.login(fetchedWalletInfo.data.address, 'wallet-user')
                }
                console.log('User auto-logged in with restored wallet info')
              } catch (loginError) {
                console.warn('Failed to auto-login with restored wallet info:', loginError)
              }
            }
          } else {
            console.error(
              'Failed to fetch wallet info during session restore:',
              fetchedWalletInfo.error
            )
          }
        } catch (walletInfoError) {
          console.warn('Failed to fetch wallet info during session restore:', walletInfoError)
          // Don't fail the entire restore process if wallet info fetch fails
        }
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

  const getNetworkInfo = () => {
    return sageWalletConnectService.getNetworkInfo()
  }

  const testRpcConnection = async (): Promise<boolean> => {
    try {
      const result = await testRpcConnectionQuery()
      if (!result.success) {
        console.error('Failed to test RPC connection:', result.error)
        return false
      }
      return result.data || false
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
    sageWalletConnectService.on('session_request', handleSessionRequest)
  }

  const removeEventListeners = (): void => {
    sageWalletConnectService.off('session_delete')
    sageWalletConnectService.off('session_expire')
    sageWalletConnectService.off('session_update')
    sageWalletConnectService.off('session_restored')
    sageWalletConnectService.off('session_approve')
    sageWalletConnectService.off('session_reject')
    sageWalletConnectService.off('session_request')
  }

  const handleSessionDelete = (): void => {
    isConnected.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    walletInfo.value = null
    const userStore = useUserStore()
    userStore.logout()
  }

  const handleSessionExpire = (): void => {
    isConnected.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    walletInfo.value = null
    const userStore = useUserStore()
    userStore.logout()
  }

  const handleSessionUpdate = (event: WalletConnectEvent): void => {
    if (event.data && typeof event.data === 'object' && 'namespaces' in event.data) {
      const eventData = event.data as { namespaces: Record<string, unknown> }
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

  const handleSessionApprove = (): void => {}

  const handleSessionReject = (event: WalletConnectEvent): void => {
    console.log('Session rejected:', event)
    error.value = 'Wallet connection was rejected'
    isConnecting.value = false
  }

  const handleSessionRequest = (event: WalletConnectEvent): void => {
    console.log('Session request received:', event)
    // Handle session request - this could be a method call from the wallet
    // The request is handled by the CommandHandler in the service
    // This listener prevents the "no listeners" error
  }

  const handleSessionRestored = async (): Promise<void> => {
    try {
      const currentSession = sageWalletConnectService.getSession()
      if (currentSession) {
        session.value = currentSession
        accounts.value = extractAccountsFromSession(currentSession)
        chainId.value = sageWalletConnectService.getNetworkInfo().chainId
        isConnected.value = true

        const fetchedWalletInfo = await getWalletInfo()
        if (fetchedWalletInfo.success && fetchedWalletInfo.data) {
          walletInfo.value = fetchedWalletInfo.data

          // Sync with user store if user is not already authenticated
          const userStore = useUserStore()
          if (!userStore.isAuthenticated && fetchedWalletInfo.data.address) {
            try {
              if (fetchedWalletInfo.data.fingerprint) {
                await userStore.login(fetchedWalletInfo.data.fingerprint, 'wallet-user')
              } else {
                await userStore.login(fetchedWalletInfo.data.address, 'wallet-user')
              }
              console.log('User auto-logged in with restored wallet info from event')
            } catch (loginError) {
              console.warn('Failed to auto-login with restored wallet info from event:', loginError)
            }
          }
        } else {
          console.error(
            'Failed to fetch wallet info during session restore from event:',
            fetchedWalletInfo.error
          )
        }
      }
    } catch (err) {
      console.error('Failed to restore session from event:', err)
    }
  }

  const getChiaConnectionState = computed((): ChiaConnectionState => {
    return sageWalletConnectService.getConnectionState()
  })

  const getPairings = computed(() => {
    return sageWalletConnectService.getPairings()
  })

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

  const executeCommand = async <TParams extends Record<string, unknown>, TResponse>(
    command: string,
    params: TParams
  ): Promise<{ success: boolean; data?: TResponse; error?: string }> => {
    try {
      const result = await sageWalletConnectService.request<TResponse>(
        command as string,
        params as Record<string, unknown>
      )
      return {
        success: !!result?.data,
        data: result?.data,
        error: result?.data ? undefined : 'Command execution failed',
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
