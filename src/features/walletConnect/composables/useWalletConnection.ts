import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref, watch } from 'vue'
import { getWalletInfo } from '../queries/walletQueries'
import { sageWalletConnectService } from '../services/SageWalletConnectService'
import { useWalletInitialization } from './useWalletInitialization'

// Query keys for wallet connection
export const WALLET_QUERY_KEYS = {
  connection: ['wallet', 'connection'] as const,
  walletInfo: ['wallet', 'info'] as const,
  session: ['wallet', 'session'] as const,
} as const

// Wallet connection state
const isConnecting = ref(false)
const connectionError = ref<string | null>(null)

export function useWalletConnection() {
  const queryClient = useQueryClient()
  const { isInitialized, initialize, autoInitialize } = useWalletInitialization()

  // Auto-initialize on first use
  autoInitialize()

  // Query for wallet connection status
  const connectionQuery = useQuery({
    queryKey: WALLET_QUERY_KEYS.connection,
    queryFn: async () => {
      // Ensure initialization before checking connection
      if (!isInitialized.value) {
        await initialize()
      }
      return sageWalletConnectService.isConnected()
    },
    enabled: computed(() => isInitialized.value),
    staleTime: 10000, // Consider fresh for 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  // Query for wallet info
  const walletInfoQuery = useQuery({
    queryKey: WALLET_QUERY_KEYS.walletInfo,
    queryFn: async () => {
      const result = await getWalletInfo()
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.data
    },
    enabled: computed(() => connectionQuery.data.value === true),
    staleTime: 30000, // Consider fresh for 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  // Mutation for starting wallet connection
  const startConnectionMutation = useMutation({
    mutationFn: async () => {
      isConnecting.value = true
      connectionError.value = null

      try {
        const connection = await sageWalletConnectService.startConnection()
        if (!connection) {
          throw new Error('Failed to start wallet connection')
        }
        return connection
      } catch (error) {
        connectionError.value = error instanceof Error ? error.message : 'Connection failed'
        throw error
      } finally {
        isConnecting.value = false
      }
    },
    onSuccess: () => {
      // Invalidate connection query to refetch status
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.connection })
    },
    onError: error => {
      console.error('Wallet connection mutation failed:', error)
      connectionError.value = error instanceof Error ? error.message : 'Connection failed'
    },
  })

  // Mutation for wallet approval
  const approveConnectionMutation = useMutation({
    mutationFn: async ({ approval }: { approval: () => Promise<unknown> }) => {
      try {
        const session = await approval()
        if (!session) {
          throw new Error('Wallet connection was not approved')
        }
        return session
      } catch (error) {
        connectionError.value = error instanceof Error ? error.message : 'Approval failed'
        throw error
      }
    },
    onSuccess: () => {
      // Invalidate all wallet-related queries
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
    onError: error => {
      console.error('Wallet approval mutation failed:', error)
      connectionError.value = error instanceof Error ? error.message : 'Approval failed'
    },
  })

  // Mutation for disconnecting wallet
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return await sageWalletConnectService.disconnect()
    },
    onSuccess: () => {
      // Clear all wallet-related queries
      queryClient.setQueryData(WALLET_QUERY_KEYS.connection, false)
      queryClient.setQueryData(WALLET_QUERY_KEYS.walletInfo, null)
      queryClient.setQueryData(WALLET_QUERY_KEYS.session, null)
    },
    onError: error => {
      console.error('Wallet disconnect mutation failed:', error)
    },
  })

  // Computed properties
  const isConnected = computed(() => connectionQuery.data.value === true)
  const walletInfo = computed(() => walletInfoQuery.data.value)
  const isLoading = computed(
    () => connectionQuery.isLoading.value || walletInfoQuery.isLoading.value
  )
  const error = computed(
    () => connectionQuery.error.value || walletInfoQuery.error.value || connectionError.value
  )

  // Watch for connection changes
  watch(isConnected, connected => {
    if (connected) {
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.walletInfo })
    }
  })

  // Methods
  const startConnection = async () => {
    try {
      const connection = await startConnectionMutation.mutateAsync()
      return connection
    } catch (error) {
      throw error
    }
  }

  const approveConnection = async (approval: () => Promise<unknown>) => {
    try {
      const session = await approveConnectionMutation.mutateAsync({ approval })
      return session
    } catch (error) {
      throw error
    }
  }

  const disconnect = async () => {
    try {
      await disconnectMutation.mutateAsync()
    } catch (error) {
      throw error
    }
  }

  const retryConnection = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet'] })
  }

  const refetchWalletInfo = async () => {
    try {
      await queryClient.refetchQueries({
        queryKey: WALLET_QUERY_KEYS.walletInfo,
        type: 'active',
      })
    } catch {
      // Handle error silently
    }
  }

  return {
    // State
    isConnected,
    isConnecting: computed(() => isConnecting.value || startConnectionMutation.isPending.value),
    walletInfo,
    isLoading,
    error,

    // Queries
    connectionQuery,
    walletInfoQuery,

    // Mutations
    startConnectionMutation,
    approveConnectionMutation,
    disconnectMutation,

    // Methods
    startConnection,
    approveConnection,
    disconnect,
    retryConnection,
    refetchWalletInfo,
  }
}

// Composable for wallet connection with background sync
export function useWalletConnectionWithBackgroundSync() {
  const walletConnection = useWalletConnection()
  const queryClient = useQueryClient()

  // Set up enhanced background execution for iOS PWA using TanStack Query
  if (typeof window !== 'undefined') {
    // TanStack Query handles background execution automatically

    // Set up page visibility change handler for iOS PWA
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('PWA went to background, maintaining wallet connection...')
        // Notify service worker about background state
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'WALLET_CONNECTION_STATUS',
            status: 'background',
            timestamp: Date.now(),
          })
        }
      } else {
        console.log('PWA returned to foreground, syncing wallet state')
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
      }
    }

    const handlePageFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    }

    const handleBeforeUnload = () => {
      queryClient.setQueryData(['wallet', 'connection'], true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handlePageFocus)
    window.addEventListener('beforeunload', handleBeforeUnload)
  }

  return walletConnection
}
