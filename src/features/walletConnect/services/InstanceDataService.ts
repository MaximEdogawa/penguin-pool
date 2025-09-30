import { useMutation, useQuery } from '@tanstack/vue-query'
import { WalletConnectModal } from '@walletconnect/modal'
import SignClient from '@walletconnect/sign-client'
import { computed } from 'vue'
import { MODAL_CONFIG, SIGN_CLIENT_CONFIG } from '../constants/wallet-connect'
import type { WalletConnectInstance } from '../types/walletConnect.types'

export function useInstanceDataService() {
  const initializeMutation = useMutation({
    mutationFn: async (): Promise<WalletConnectInstance> => {
      try {
        const signClient = await SignClient.init(SIGN_CLIENT_CONFIG)
        const modal = new WalletConnectModal(MODAL_CONFIG)
        return { signClient, modal }
      } catch (error) {
        throw error
      }
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  const instanceQuery = useQuery({
    queryKey: ['walletConnect', 'instance'],
    queryFn: () => initializeMutation.data.value,
    enabled: computed(() => initializeMutation.isSuccess.value),
    staleTime: Infinity,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  return {
    data: instanceQuery.data,
    signClient: computed(() => instanceQuery.data.value?.signClient),
    modal: computed(() => instanceQuery.data.value?.modal),
    isInitializing: instanceQuery.isLoading,
    isInitialized: instanceQuery.isSuccess,
    error: initializeMutation.error,
    initialize: () => initializeMutation.mutate(),
  }
}
