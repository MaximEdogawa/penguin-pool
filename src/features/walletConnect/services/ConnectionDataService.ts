import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { SageMethods } from '../constants/sage-methods'
import { useInstanceDataService } from './InstanceDataService'

export function useConnectDataService() {
  const { signClient, modal } = useInstanceDataService()
  const connectMutation = useMutation({
    mutationFn: async () => {
      try {
        if (!signClient.value || !modal.value)
          throw new Error('SignClient or modal is not initialized')

        const result = await signClient.value.connect({
          optionalNamespaces: {
            chia: {
              methods: Object.values(SageMethods),
              chains: ['chia:mainnet', 'chia:testnet'],
              events: [],
            },
          },
        })

        return result
      } catch (error) {
        // Connection failed
        throw error
      }
    },
  })

  const connectQuery = useQuery({
    queryKey: ['walletConnect', 'connection'],
    queryFn: async () => connectMutation.data.value,
    enabled: computed(() => connectMutation.isSuccess.value),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return {
    data: connectQuery.data,
    uri: computed(() => connectQuery.data.value?.uri),
    approval: computed(() => connectQuery.data.value?.approval),
    isConnecting: connectQuery.isLoading,
    isConnected: connectQuery.isSuccess,
    error: connectQuery.error,
    connect: () => connectMutation.mutate(),
  }
}
