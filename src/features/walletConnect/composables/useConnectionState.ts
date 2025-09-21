import { computed, onUnmounted, readonly, ref, watch } from 'vue'
import { useWalletConnectService } from '../services/WalletConnectService'
import type { WalletConnectSession } from '../types/walletConnect.types'

export interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  isInitialized: boolean
  session: WalletConnectSession | null
  accounts: string[]
  chainId: string | null
  error: string | null
  lastConnected: Date | null
  connectionAttempts: number
  maxRetries: number
}

/**
 * Connection State Composable
 *
 * This composable provides reactive state management for WalletConnect
 * using the unified service.
 */
export function useConnectionState() {
  const service = useWalletConnectService

  // Core state
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const isInitialized = ref(false)
  const session = ref<WalletConnectSession | null>(null)
  const accounts = ref<string[]>([])
  const chainId = ref<string | null>(null)
  const error = ref<string | null>(null)
  const lastConnected = ref<Date | null>(null)
  const connectionAttempts = ref(0)
  const maxRetries = ref(service.getMaxRetries())

  // Computed state
  const state = computed<ConnectionState>(() => ({
    isConnected: isConnected.value,
    isConnecting: isConnecting.value,
    isInitialized: isInitialized.value,
    session: session.value,
    accounts: accounts.value,
    chainId: chainId.value,
    error: error.value,
    lastConnected: lastConnected.value,
    connectionAttempts: connectionAttempts.value,
    maxRetries: maxRetries.value,
  }))

  const hasChiaAccount = computed(() => {
    return accounts.value.some(account => account.startsWith('xch') || account.startsWith('txch'))
  })

  const primaryAccount = computed(() => {
    return accounts.value[0] || null
  })

  const canRetry = computed(() => {
    return connectionAttempts.value < maxRetries.value
  })

  const isRetrying = computed(() => {
    return isConnecting.value && connectionAttempts.value > 0
  })

  // Sync with service state
  const syncWithService = () => {
    const serviceState = service.getState()
    isConnected.value = serviceState.isConnected
    isConnecting.value = serviceState.isConnecting
    isInitialized.value = serviceState.isInitialized
    session.value = serviceState.session
    accounts.value = serviceState.accounts
    chainId.value = serviceState.chainId
    error.value = serviceState.error
    connectionAttempts.value = service.getConnectionAttempts()
    maxRetries.value = service.getMaxRetries()
  }

  // State management methods
  function setConnected(connected: boolean) {
    isConnected.value = connected
    if (connected) {
      lastConnected.value = new Date()
      connectionAttempts.value = 0
      error.value = null
    }
  }

  function setConnecting(connecting: boolean) {
    isConnecting.value = connecting
    if (connecting) {
      connectionAttempts.value += 1
    }
  }

  function setInitialized(initialized: boolean) {
    isInitialized.value = initialized
  }

  function setSession(newSession: WalletConnectSession | null) {
    session.value = newSession
    setConnected(!!newSession)
  }

  function setAccounts(newAccounts: string[]) {
    accounts.value = newAccounts
  }

  function setChainId(newChainId: string | null) {
    chainId.value = newChainId
  }

  function setError(newError: string | null) {
    error.value = newError
    if (newError) {
      setConnected(false)
    }
  }

  function setMaxRetries(retries: number) {
    maxRetries.value = retries
    service.setMaxRetries(retries)
  }

  function resetConnectionAttempts() {
    connectionAttempts.value = 0
    service.resetConnectionAttempts()
  }

  function incrementConnectionAttempts() {
    connectionAttempts.value += 1
  }

  // Reset all state
  function reset() {
    isConnected.value = false
    isConnecting.value = false
    isInitialized.value = false
    session.value = null
    accounts.value = []
    chainId.value = null
    error.value = null
    lastConnected.value = null
    connectionAttempts.value = 0
  }

  // Watch for service state changes
  watch(
    () => service.getState(),
    () => {
      syncWithService()
    },
    { immediate: true, deep: true }
  )

  // Watch for session changes and update derived state
  watch(session, newSession => {
    if (newSession) {
      // Extract accounts from session
      const sessionAccounts =
        (newSession.namespaces as Record<string, { accounts?: string[] }>)?.chia?.accounts?.map(
          (account: string) => account.split(':')[2] || account
        ) || []
      setAccounts(sessionAccounts)

      // Extract chain ID from session
      const sessionChainId =
        (newSession.namespaces as Record<string, { chains?: string[] }>)?.chia?.chains?.[0] || null
      setChainId(sessionChainId)
    } else {
      setAccounts([])
      setChainId(null)
    }
  })

  // Auto-cleanup on unmount
  onUnmounted(() => {
    reset()
  })

  return {
    // State
    state: readonly(state),
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    isInitialized: readonly(isInitialized),
    session: readonly(session),
    accounts: readonly(accounts),
    chainId: readonly(chainId),
    error: readonly(error),
    lastConnected: readonly(lastConnected),
    connectionAttempts: readonly(connectionAttempts),
    maxRetries: readonly(maxRetries),

    // Computed
    hasChiaAccount: readonly(hasChiaAccount),
    primaryAccount: readonly(primaryAccount),
    canRetry: readonly(canRetry),
    isRetrying: readonly(isRetrying),

    // Methods
    setConnected,
    setConnecting,
    setInitialized,
    setSession,
    setAccounts,
    setChainId,
    setError,
    setMaxRetries,
    resetConnectionAttempts,
    incrementConnectionAttempts,
    reset,
    syncWithService,
  }
}
