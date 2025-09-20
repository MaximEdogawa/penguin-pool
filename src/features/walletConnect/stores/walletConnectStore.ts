import { useUserStore } from '@/entities/user/store/userStore'
import { sessionManager } from '@/shared/services/sessionManager'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getWalletInfo,
  testRpcConnection as testRpcConnectionQuery,
} from '../queries/walletQueries'
import { useWalletConnectService } from '../services/WalletConnectService'
import type {
  ConnectionResult,
  DisconnectResult,
  WalletConnectEvent,
  WalletConnectSession,
  WalletConnectState,
  WalletInfo,
} from '../types/walletConnect.types'

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

  // Actions
  const initialize = async (): Promise<void> => {
    try {
      // Set up event listeners immediately before any initialization
      setupEventListeners()

      if (!walletConnectService.isInitialized) {
        await walletConnectService.initialize()
      } else {
        console.log('WalletConnect service already initialized')
      }
    } catch (err) {
      console.error('Failed to initialize Wallet Connect:', err)
      error.value = err instanceof Error ? err.message : 'Initialization failed'
    }
  }

  const connect = async (pairing?: { topic: string }): Promise<ConnectionResult> => {
    try {
      isConnecting.value = true
      error.value = null

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
      if (!walletConnectService.isInitialized) {
        await walletConnectService.initialize()
      }

      return await walletConnectService.connect()
    } catch (err) {
      console.error('Failed to start connection:', err)
      return null
    }
  }

  const disconnect = async (): Promise<DisconnectResult> => {
    try {
      // First, properly disconnect from the wallet
      if (walletConnectService.isConnected()) {
        console.log('Disconnecting from Sage wallet...')
        const disconnectResult = await walletConnectService.disconnect()
        if (!disconnectResult.success) {
          console.warn('Failed to disconnect from wallet:', disconnectResult.error)
        }
      }

      // Clear wallet state
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
      walletConnectService.forceReset()

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
      const currentSession = walletConnectService.getSession()
      const isCurrentlyConnected = walletConnectService.isConnected()

      if (currentSession && isCurrentlyConnected) {
        session.value = currentSession
        accounts.value = extractAccountsFromSession(currentSession)
        chainId.value = walletConnectService.getNetworkInfo().chainId
        isConnected.value = true
        setupEventListeners()

        // Fetch wallet info when restoring session
        try {
          const fetchedWalletInfo = await getWalletInfo()
          console.log('🔍 restoreSession - Fetched wallet info:', fetchedWalletInfo)
          if (fetchedWalletInfo.success && fetchedWalletInfo.data) {
            walletInfo.value = fetchedWalletInfo.data
            console.log('🔍 restoreSession - Updated walletInfo.value:', walletInfo.value)
            console.log('🔍 restoreSession - Balance in walletInfo:', walletInfo.value.balance)

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

      return await walletConnectService.request(method, Object.values(params))
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
    return walletConnectService.getNetworkInfo()
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
    walletConnectService.on('session_delete', handleSessionDelete)
    walletConnectService.on('session_expire', handleSessionExpire)
    walletConnectService.on('session_update', handleSessionUpdate)
    walletConnectService.on('session_restored', handleSessionRestored)

    // Connection events
    walletConnectService.on('session_approve', handleSessionApprove)
    walletConnectService.on('session_reject', handleSessionReject)
  }

  const removeEventListeners = (): void => {
    walletConnectService.off('session_delete')
    walletConnectService.off('session_expire')
    walletConnectService.off('session_update')
    walletConnectService.off('session_restored')
    walletConnectService.off('session_approve')
    walletConnectService.off('session_reject')
    walletConnectService.off('session_request')
  }

  const handleSessionDelete = (): void => {
    isConnected.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    walletInfo.value = null
  }

  const handleSessionExpire = (): void => {
    isConnected.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    walletInfo.value = null
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

  const handleSessionApprove = (): void => {
    console.log('Session approved, updating store state')
    isConnected.value = true
    isConnecting.value = false
    error.value = null

    // Get the current session from the service
    const currentSession = walletConnectService.getSession()
    if (currentSession) {
      session.value = currentSession
      accounts.value = extractAccountsFromSession(currentSession)
      chainId.value = walletConnectService.getNetworkInfo().chainId
    }
  }

  const handleSessionReject = (event: WalletConnectEvent): void => {
    console.log('Session rejected:', event)
    error.value = 'Wallet connection was rejected'
    isConnecting.value = false
  }

  const handleSessionRestored = async (): Promise<void> => {
    try {
      const currentSession = walletConnectService.getSession()
      if (currentSession) {
        session.value = currentSession
        accounts.value = extractAccountsFromSession(currentSession)
        chainId.value = walletConnectService.getNetworkInfo().chainId
        isConnected.value = true

        const fetchedWalletInfo = await getWalletInfo()
        console.log('🔍 handleSessionUpdate - Fetched wallet info:', fetchedWalletInfo)
        if (fetchedWalletInfo.success && fetchedWalletInfo.data) {
          walletInfo.value = fetchedWalletInfo.data
          console.log('🔍 handleSessionUpdate - Updated walletInfo.value:', walletInfo.value)

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

  const getPairings = computed(() => {
    return walletConnectService.getPairings()
  })

  const balance = computed(() => {
    const bal = walletInfo.value?.balance || null
    console.log('🔍 balance computed - walletInfo.value:', walletInfo.value)
    console.log('🔍 balance computed - balance:', bal)
    return bal
  })

  const formattedBalance = computed(() => {
    if (!balance.value) return '0.000000000000'
    const balanceInXCH = parseFloat(balance.value.spendable) / 1000000000000
    const formatted = balanceInXCH.toFixed(12)
    console.log('🔍 formattedBalance computed - balance.value:', balance.value)
    console.log('🔍 formattedBalance computed - formatted:', formatted)
    return formatted
  })

  const executeCommand = async <TParams extends Record<string, unknown>, TResponse>(
    command: string,
    params: TParams
  ): Promise<{ success: boolean; data?: TResponse; error?: string }> => {
    try {
      const result = await walletConnectService.request<TResponse>(
        command as string,
        Object.values(params as Record<string, unknown>)
      )
      return {
        success: !!result,
        data: result,
        error: result ? undefined : 'Command execution failed',
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
    isConnected,
    isConnecting,
    session,
    accounts,
    chainId,
    error,
    walletInfo,
    balance,
    formattedBalance,
    state,
    hasChiaAccount,
    primaryAccount,
    initialize,
    connect,
    disconnect,
    restoreSession,
    sendRequest,
    clearError,
    getNetworkInfo,
    startConnection,
    getPairings,
    testRpcConnection,
    executeCommand,
  }
})
