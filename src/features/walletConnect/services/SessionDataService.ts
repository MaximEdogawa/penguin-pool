import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import type { WalletConnectSession } from '../types/walletConnect.types'
import { useConnectDataService } from './ConnectionDataService'

export function useSessionDataService() {
  const { approval } = useConnectDataService()
  const sessionMutation = useMutation({
    mutationFn: async () => {
      try {
        if (!approval.value) throw new Error('Approval function is not available')
        return await approval.value()
      } catch (error) {
        console.error('Approval failed:', error)
      }
    },
  })

  const sessionQuery = useQuery({
    queryKey: ['walletConnect', 'session'],
    queryFn: async () => sessionMutation.data.value,
    enabled: computed(() => sessionMutation.isSuccess.value),
    staleTime: Infinity,
  })

  const chainId = computed(() => {
    if (!sessionQuery?.data.value) return 'chia:testnet'
    const chains = sessionQuery.data.value.namespaces.chia?.chains
    if (chains && chains.length > 0) {
      return chains[0].split(':')[1]
    }
    return 'chia:testnet'
  })

  const fingerprint = computed(() => {
    return parseInt(sessionQuery?.data.value?.namespaces.chia?.accounts?.[0].split(':')[2] || '0')
  })

  const topic = computed(() => sessionQuery?.data.value?.topic || '')

  return {
    data: sessionQuery.data,
    chainId,
    fingerprint,
    topic,
    isConnecting: sessionQuery.isLoading,
    isConnected: sessionQuery.isSuccess,
    waitForApproval: () => sessionMutation.mutate(),
  } as WalletConnectSession
}
