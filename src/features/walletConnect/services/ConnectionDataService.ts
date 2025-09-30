import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { SageMethods } from '../constants/sage-methods'
import { isIOS } from '../hooks/useIOSModal'
import { useInstanceDataService } from './InstanceDataService'

export function useConnectDataService() {
  const { signClient, modal } = useInstanceDataService()

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!signClient.value || !modal.value)
        throw new Error('SignClient or modal is not initialized')

      const { uri, approval } = await signClient.value.connect({
        optionalNamespaces: {
          chia: {
            methods: Object.values(SageMethods),
            chains: ['chia:mainnet', 'chia:testnet'],
            events: [],
          },
        },
      })

      if (isIOS.value) {
        window.dispatchEvent(new CustomEvent('show_ios_modal', { detail: { uri } }))
      } else {
        await modal.value.openModal({ uri })
      }

      return { uri, approval }
    },
  })

  const connectQuery = useQuery({
    queryKey: ['walletConnect', 'uriAndApproval'],
    queryFn: () => connectMutation.data.value,
    enabled: computed(() => connectMutation.isSuccess.value),
    staleTime: Infinity,
  })

  return {
    data: connectQuery.data,
    uri: computed(() => connectQuery.data.value?.uri),
    approval: computed(() => connectQuery.data.value?.approval),
    isConnecting: connectMutation.isPending,
    isConnected: connectMutation.isSuccess,
    error: connectMutation.error,
    connect: () => connectMutation.mutate(),
  }
}
