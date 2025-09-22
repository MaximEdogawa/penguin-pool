import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { useWalletConnectService } from '../services/WalletConnectService'

/**
 * TanStack Query hooks for wallet operations
 * Provides reactive data fetching, caching, and mutation capabilities
 */

// Query keys for consistent caching
export const walletQueryKeys = {
  all: ['wallet'] as const,
  connection: () => [...walletQueryKeys.all, 'connection'] as const,
  info: () => [...walletQueryKeys.all, 'info'] as const,
  balance: () => [...walletQueryKeys.all, 'balance'] as const,
  accounts: () => [...walletQueryKeys.all, 'accounts'] as const,
  session: () => [...walletQueryKeys.all, 'session'] as const,
}

/**
 * Hook for wallet connection status
 */
export function useWalletConnection() {
  const walletConnectService = useWalletConnectService

  return useQuery({
    queryKey: walletQueryKeys.connection(),
    queryFn: () => {
      const state = walletConnectService.getState()
      return {
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        isInitialized: state.isInitialized,
        error: state.error,
      }
    },
    refetchInterval: 1000, // Refetch every second to keep connection status up to date
    staleTime: 500, // Consider data stale after 500ms
  })
}

/**
 * Hook for wallet session information
 */
export function useWalletSession() {
  const walletConnectService = useWalletConnectService

  return useQuery({
    queryKey: walletQueryKeys.session(),
    queryFn: () => {
      const state = walletConnectService.getState()
      return {
        session: state.session,
        accounts: state.accounts,
        chainId: state.chainId,
        currentNetwork: state.currentNetwork,
      }
    },
    enabled: computed(() => walletConnectService.getState().isConnected),
    refetchInterval: 2000, // Refetch every 2 seconds when connected
    staleTime: 1000,
  })
}

/**
 * Hook for wallet information (address, fingerprint, etc.)
 */
export function useWalletInfo() {
  const walletConnectService = useWalletConnectService

  return useQuery({
    queryKey: walletQueryKeys.info(),
    queryFn: async () => {
      if (!walletConnectService.getState().isConnected) {
        throw new Error('Wallet not connected')
      }

      // Import only the address query to avoid duplicate balance requests
      const { getWalletAddress } = await import('../queries/walletQueries')
      const result = await getWalletAddress()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load wallet address')
      }

      // Return a minimal wallet info object with just the address
      return {
        address: result.data.address,
        fingerprint: walletConnectService.getState().accounts[0] || 0,
        isConnected: true,
        balance: null, // Balance will be handled by useWalletBalance
      }
    },
    enabled: computed(() => walletConnectService.getState().isConnected),
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 3,
    retryDelay: 1000,
  })
}

/**
 * Hook for wallet balance with refresh capability
 */
export function useWalletBalance() {
  const walletConnectService = useWalletConnectService
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: walletQueryKeys.balance(),
    queryFn: async () => {
      if (!walletConnectService.getState().isConnected) {
        throw new Error('Wallet not connected')
      }

      // Import only the balance query to avoid duplicate requests
      const { getAssetBalance } = await import('../queries/walletQueries')
      const result = await getAssetBalance()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load wallet balance')
      }

      return result.data
    },
    enabled: computed(() => walletConnectService.getState().isConnected),
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 3,
    retryDelay: 1000,
  })

  // Manual refresh function
  const refreshBalance = () => {
    queryClient.invalidateQueries({ queryKey: walletQueryKeys.balance() })
  }

  // Auto-refresh mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.balance() })
      return queryClient.fetchQuery({ queryKey: walletQueryKeys.balance() })
    },
    onSuccess: () => {
      console.log('✅ Wallet balance refreshed successfully')
    },
    onError: error => {
      console.error('❌ Failed to refresh wallet balance:', error)
    },
  })

  return {
    ...query,
    refreshBalance,
    refreshMutation,
  }
}

/**
 * Hook for wallet accounts
 */
export function useWalletAccounts() {
  const walletConnectService = useWalletConnectService

  return useQuery({
    queryKey: walletQueryKeys.accounts(),
    queryFn: () => {
      const state = walletConnectService.getState()
      return {
        accounts: state.accounts,
        primaryAccount: state.accounts[0] || null,
        hasChiaAccount: state.accounts.some(
          (account: string) => account.startsWith('xch') || account.startsWith('txch')
        ),
      }
    },
    enabled: computed(() => walletConnectService.getState().isConnected),
    refetchInterval: 5000, // Refetch every 5 seconds when connected
    staleTime: 2000,
  })
}

/**
 * Hook for wallet connection mutations
 */
export function useWalletConnectionMutations() {
  const walletConnectService = useWalletConnectService
  const queryClient = useQueryClient()

  const connectMutation = useMutation({
    mutationFn: async () => {
      const result = await walletConnectService.connect()
      if (!result.success) {
        throw new Error(result.error || 'Connection failed')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate all wallet queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.all })
      console.log('✅ Wallet connected successfully')
    },
    onError: error => {
      console.error('❌ Wallet connection failed:', error)
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const result = await walletConnectService.disconnect()
      if (!result.success) {
        throw new Error(result.error || 'Disconnect failed')
      }
      return result
    },
    onSuccess: () => {
      // Clear all wallet queries
      queryClient.removeQueries({ queryKey: walletQueryKeys.all })
      console.log('✅ Wallet disconnected successfully')
    },
    onError: error => {
      console.error('❌ Wallet disconnect failed:', error)
    },
  })

  return {
    connect: connectMutation,
    disconnect: disconnectMutation,
  }
}

/**
 * Hook for wallet initialization
 */
export function useWalletInitialization() {
  const walletConnectService = useWalletConnectService
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!walletConnectService.isInitialized()) {
        await walletConnectService.initialize()
      }
      return walletConnectService.getState()
    },
    onSuccess: () => {
      // Invalidate connection query to get fresh state
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.connection() })
      console.log('✅ Wallet initialized successfully')
    },
    onError: error => {
      console.error('❌ Wallet initialization failed:', error)
    },
  })
}

/**
 * Combined hook that provides all wallet functionality
 * This hook should only be called within a Vue component's setup() function
 */
export function useWallet() {
  const connection = useWalletConnection()
  const session = useWalletSession()
  const info = useWalletInfo()
  const balance = useWalletBalance()
  const accounts = useWalletAccounts()
  const mutations = useWalletConnectionMutations()
  const initialization = useWalletInitialization()

  // Computed properties for easy access
  const isConnected = computed(() => connection.data.value?.isConnected ?? false)
  const isConnecting = computed(() => connection.data.value?.isConnecting ?? false)
  const isInitialized = computed(() => connection.data.value?.isInitialized ?? false)
  const error = computed(() => connection.data.value?.error ?? null)

  const walletInfo = computed(() => info.data.value)
  const walletBalance = computed(() => balance.data.value)
  const walletAccounts = computed(() => accounts.data.value)
  const walletSession = computed(() => session.data.value)

  // Refresh all wallet data
  const refreshAll = () => {
    connection.refetch()
    session.refetch()
    info.refetch()
    balance.refreshBalance()
    accounts.refetch()
  }

  return {
    // Connection state
    isConnected,
    isConnecting,
    isInitialized,
    error,

    // Data
    walletInfo,
    walletBalance,
    walletAccounts,
    walletSession,

    // Individual queries
    connection,
    session,
    info,
    balance,
    accounts,

    // Mutations
    mutations,
    initialization,

    // Utilities
    refreshAll,
  }
}
