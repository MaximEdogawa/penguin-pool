import { useMutation, useQuery } from '@tanstack/vue-query'
import { WalletConnectModal } from '@walletconnect/modal'
import { SignClient } from '@walletconnect/sign-client'
import { computed, ref } from 'vue'

type SignClientType = Awaited<ReturnType<typeof SignClient.init>>
type WalletConnectModalType = InstanceType<typeof WalletConnectModal>

export interface WalletConnectInstance {
  signClient: SignClientType | null
  modal: WalletConnectModalType | null
  isInitialized: boolean
  isInitializing: boolean
  error: string | null
}

// Global instance state
const instanceState = ref<WalletConnectInstance>({
  signClient: null,
  modal: null,
  isInitialized: false,
  isInitializing: false,
  error: null,
})

export function useInstanceDataService() {
  const instanceQuery = useQuery({
    queryKey: ['walletConnect', 'instance'],
    queryFn: () => instanceState.value,
    enabled: computed(() => true),
    staleTime: Infinity,
  })

  const initializeMutation = useMutation({
    mutationFn: async (): Promise<WalletConnectInstance> => {
      if (instanceState.value.isInitialized || instanceState.value.isInitializing) {
        return instanceState.value as WalletConnectInstance
      }

      instanceState.value.isInitializing = true
      instanceState.value.error = null

      try {
        const signClient = await SignClient.init({
          projectId: (import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID as string) || '',
          relayUrl: 'wss://relay.walletconnect.com',
          metadata: {
            name: 'Penguin Pool',
            description: 'Chia Pool Management Platform',
            url: window.location.origin,
            icons: [`${window.location.origin}/favicon.ico`],
          },
        })

        // Create WalletConnect Modal
        const modal = new WalletConnectModal({
          projectId: (import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID as string) || '',
          enableExplorer: true,
          themeMode: 'light',
          themeVariables: {
            '--wcm-z-index': '1000',
            '--wcm-background-color': '#ffffff',
            '--wcm-accent-color': '#3b82f6',
            '--wcm-accent-fill-color': '#ffffff',
            '--wcm-overlay-background-color': 'rgba(0, 0, 0, 0.5)',
          },
        })

        instanceState.value.signClient = signClient as SignClientType
        instanceState.value.modal = modal as WalletConnectModalType
        instanceState.value.isInitialized = true
        instanceState.value.isInitializing = false

        return instanceState.value as WalletConnectInstance
      } catch (error) {
        instanceState.value.error = error instanceof Error ? error.message : 'Initialization failed'
        instanceState.value.isInitializing = false
        throw error
      }
    },
    onSuccess: () => {
      console.log('✅ WalletConnect instance initialized')
    },
    onError: error => {
      console.error('❌ WalletConnect initialization failed:', error)
    },
  })

  const getSignClient = computed(() => instanceState.value.signClient)
  const getModal = computed(() => instanceState.value.modal)
  const isReady = computed(
    () => instanceState.value.isInitialized && instanceState.value.signClient !== null
  )

  return {
    instance: instanceQuery,
    state: computed(() => instanceState.value),
    initialize: initializeMutation.mutateAsync,
    isInitializing: initializeMutation.isPending,
    error: initializeMutation.error,
    getSignClient,
    getModal,
    isReady,
  }
}
