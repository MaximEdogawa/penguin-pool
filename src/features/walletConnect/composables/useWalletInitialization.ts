import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useWalletConnectService } from '../services/WalletConnectService'

// Query keys for wallet initialization
export const WALLET_INIT_QUERY_KEYS = {
  initialization: ['wallet', 'initialization'] as const,
  status: ['wallet', 'initialization', 'status'] as const,
  error: ['wallet', 'initialization', 'error'] as const,
} as const

// Initialization status types
export type InitializationStatus = 'idle' | 'initializing' | 'initialized' | 'error'

// Global initialization state
const initializationStatus = ref<InitializationStatus>('idle')
const initializationError = ref<Error | null>(null)
const walletConnectService = useWalletConnectService

/**
 * Composable for managing wallet initialization with TanStack Query
 */
export function useWalletInitialization() {
  const queryClient = useQueryClient()

  // Query for initialization status
  const initializationQuery = useQuery({
    queryKey: WALLET_INIT_QUERY_KEYS.status,
    queryFn: async (): Promise<InitializationStatus> => {
      if (walletConnectService.isInitialized()) {
        return 'initialized'
      }

      if (walletConnectService.isInitializationInProgress()) {
        return 'initializing'
      }

      return 'idle'
    },
    staleTime: 5000, // Consider fresh for 5 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 10000, // Check every 10 seconds
    refetchOnReconnect: true,
    retry: false, // Don't retry status checks
  })

  // Mutation for initializing the wallet service
  const initializeMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      initializationStatus.value = 'initializing'
      initializationError.value = null

      try {
        await walletConnectService.initialize()
        initializationStatus.value = 'initialized'

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['wallet'] })

        return Promise.resolve()
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Initialization failed')
        initializationStatus.value = 'error'
        initializationError.value = err
        throw err
      }
    },
    onSuccess: () => {
      console.log('Wallet initialization completed successfully')
    },
    onError: error => {
      console.error('Wallet initialization failed:', error)
    },
  })

  // Mutation for reinitializing (useful for recovery)
  const reinitializeMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      // Clear session storage and reset the service first
      walletConnectService.clearSessionStorage()
      await walletConnectService.forceReset()

      // Clear all wallet-related queries
      queryClient.clear()

      // Initialize again
      return initializeMutation.mutateAsync()
    },
    onSuccess: () => {
      console.log('Wallet reinitialization completed successfully')
    },
    onError: error => {
      console.error('Wallet reinitialization failed:', error)
    },
  })

  // Computed properties
  const isInitialized = computed(
    () =>
      initializationQuery.data.value === 'initialized' ||
      initializationStatus.value === 'initialized'
  )

  const isInitializing = computed(
    () =>
      initializationQuery.data.value === 'initializing' ||
      initializationStatus.value === 'initializing' ||
      initializeMutation.isPending.value
  )

  const hasError = computed(
    () =>
      initializationQuery.data.value === 'error' ||
      initializationStatus.value === 'error' ||
      !!initializeMutation.error.value ||
      !!initializationError.value
  )

  const error = computed(
    () =>
      initializeMutation.error.value ||
      initializationError.value ||
      walletConnectService.getLastInitializationError()
  )

  // Methods
  const initialize = async (): Promise<void> => {
    if (isInitialized.value) {
      console.log('Wallet already initialized')
      return
    }

    if (isInitializing.value) {
      console.log('Wallet initialization already in progress')
      return
    }

    return initializeMutation.mutateAsync()
  }

  const reinitialize = async (): Promise<void> => {
    return reinitializeMutation.mutateAsync()
  }

  const reset = (): void => {
    initializationStatus.value = 'idle'
    initializationError.value = null
    queryClient.clear()
  }

  // Auto-initialize on mount if not already initialized
  const autoInitialize = async (): Promise<void> => {
    if (!isInitialized.value && !isInitializing.value) {
      try {
        await initialize()
      } catch (error) {
        console.warn('Auto-initialization failed:', error)
      }
    }
  }

  return {
    // State
    isInitialized,
    isInitializing,
    hasError,
    error,
    status: computed(() => initializationQuery.data.value || initializationStatus.value),

    // Methods
    initialize,
    reinitialize,
    reset,
    autoInitialize,

    // Query objects for advanced usage
    initializationQuery,
    initializeMutation,
    reinitializeMutation,
  }
}

/**
 * Simplified hook for just checking initialization status
 */
export function useWalletInitializationStatus() {
  const { isInitialized, isInitializing, hasError, error } = useWalletInitialization()

  return {
    isInitialized,
    isInitializing,
    hasError,
    error,
  }
}
