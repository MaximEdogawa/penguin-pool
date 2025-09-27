import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, watch } from 'vue'
import { SageMethods } from '../constants/sage-methods'
import { useIOSModal } from '../hooks/useIOSModal'
import { useInstanceDataService } from './InstanceDataService'

export function useConnectDataService() {
  const { signClient, modal } = useInstanceDataService()
  const queryClient = useQueryClient()
  const iOSModal = useIOSModal()

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!signClient.value || !modal.value) {
        throw new Error('SignClient or modal is not initialized')
      }

      const { uri, approval } = await signClient.value.connect({
        optionalNamespaces: {
          chia: {
            methods: Object.values(SageMethods),
            chains: ['chia:mainnet', 'chia:testnet'],
            events: [],
          },
        },
      })

      if (iOSModal.isIOS) {
        window.dispatchEvent(new CustomEvent('show_ios_modal', { detail: { uri } }))
      } else {
        await modal.value.openModal({ uri })
      }

      return { uri, approval, modal }
    },
    onSuccess: data => {
      queryClient.setQueryData(['walletConnect', 'uriAndApproval'], data)
    },
  })

  const query = useQuery({
    queryKey: ['walletConnect', 'uriAndApproval'],
    queryFn: () => connectMutation.data.value,
    enabled: computed(() => connectMutation.isSuccess.value),
    staleTime: Infinity,
  })

  return {
    uri: computed(() => query.data.value?.uri),
    approval: computed(() => query.data.value?.approval),
    modal: query.data.value?.modal,
    connect: () => connectMutation.mutate(),
    isConnecting: connectMutation.isPending,
    error: connectMutation.error,
  }
}

export function useSessionDataService() {
  const { uri, approval, modal } = useConnectDataService()
  const queryClient = useQueryClient()

  const sessionQuery = useQuery({
    queryKey: ['walletConnect', 'session'],
    queryFn: async () => {
      try {
        if (!approval.value) {
          throw new Error('Approval function is not available')
        }
        const result = await approval.value()
        if (!result) {
          throw new Error('Session approval was rejected or failed')
        }
        return result
      } catch (error) {
        console.error('Approval failed:', error)
      }
    },
    enabled: computed(() => uri.value != null && approval.value != null),
    staleTime: Infinity,
  })

  watch(
    () => sessionQuery.data.value,
    session => {
      if (session) {
        console.log('🔄 Session established, invalidating wallet state')
        queryClient.invalidateQueries({ queryKey: ['walletConnect', 'walletState'] })
        modal?.value?.closeModal()
      }
    }
  )

  return {
    session: sessionQuery.data,
    isConnecting: computed(() => sessionQuery.isFetching.value),
    isConnected: computed(() => sessionQuery.data.value != null),
  }
}
