import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import { useConnectionDataService } from './ConnectionDataService'

export interface UserData {
  fingerprint: string | null
  address: string | null
  publicKey: string | null
  // syncStatus: Record<string, unknown> | null // Disabled - unsupported by Sage
  // height: number | null // Disabled - unsupported by Sage
}

// Global user data state
const userDataState = ref<UserData>({
  fingerprint: null,
  address: null,
  publicKey: null,
  // syncStatus: null, // Disabled - unsupported by Sage
  // height: null, // Disabled - unsupported by Sage
})

export function useUserDataService() {
  const connectionService = useConnectionDataService()

  const userDataQuery = useQuery({
    queryKey: ['walletConnect', 'userData'],
    queryFn: async (): Promise<UserData> => {
      if (!connectionService.state.value.isConnected) {
        throw new Error('Wallet not connected')
      }

      const fingerprint = connectionService.state.value.accounts[0] || null

      // Fetch additional user data if needed
      userDataState.value.fingerprint = fingerprint
      userDataState.value.address = fingerprint // For now, fingerprint is the address

      return userDataState.value
    },
    enabled: computed(() => connectionService.state.value.isConnected),
    staleTime: 30000,
  })

  const fetchUserDataMutation = useMutation({
    mutationFn: async (): Promise<UserData> => {
      if (!connectionService.state.value.isConnected) {
        throw new Error('Wallet not connected')
      }

      const fingerprint = connectionService.state.value.accounts[0] || null

      userDataState.value.fingerprint = fingerprint
      userDataState.value.address = fingerprint

      return userDataState.value
    },
    onSuccess: data => {
      console.log('✅ User data fetched:', data)
    },
    onError: error => {
      console.error('❌ Failed to fetch user data:', error)
    },
  })

  const clearUserDataMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      userDataState.value = {
        fingerprint: null,
        address: null,
        publicKey: null,
        // syncStatus: null, // Disabled - unsupported by Sage
        // height: null, // Disabled - unsupported by Sage
      }
    },
  })

  const setFingerprintMutation = useMutation({
    mutationFn: async (fingerprint: string): Promise<void> => {
      userDataState.value.fingerprint = fingerprint
      userDataState.value.address = fingerprint
    },
  })

  return {
    userData: userDataQuery,
    state: computed(() => userDataState.value),
    fetchUserData: fetchUserDataMutation.mutateAsync,
    clearUserData: clearUserDataMutation.mutateAsync,
    setFingerprint: setFingerprintMutation.mutateAsync,
    isLoading: fetchUserDataMutation.isPending,
  }
}
