import { useMutation, useQuery } from '@tanstack/vue-query'
import { WalletConnectModal } from '@walletconnect/modal'
import SignClient from '@walletconnect/sign-client'
import { computed, ref } from 'vue'

type WalletConnectModalType = InstanceType<typeof WalletConnectModal>

export interface WalletConnectInstance {
  signClient: SignClient | null
  modal: WalletConnectModalType | null
  isInitialized: boolean
  isInitializing: boolean
  error: string | null
}

const instanceState = ref<WalletConnectInstance>({
  signClient: null,
  modal: null,
  isInitialized: false,
  isInitializing: false,
  error: null,
})

let eventListenersAttached = false

export function useInstanceDataService() {
  const instanceQuery = useQuery({
    queryKey: ['walletConnect', 'instance'],
    queryFn: () => instanceState.value,
    enabled: computed(() => true),
    staleTime: Infinity,
  })

  function setupSignClientEventListeners(signClient: SignClient) {
    if (eventListenersAttached) {
      console.log('⚠️ Event listeners already attached, skipping...')
      return
    }

    signClient.on('session_request', async event => {
      console.log('📨 Received session request:', event)
    })

    signClient.on('session_event', event => {
      console.log('📨 Received session event:', event)
    })

    signClient.on('session_delete', event => {
      console.log('🗑️ Session deleted:', event)
      clearConnection()
    })

    signClient.on('session_update', event => {
      console.log('🔄 Session updated:', event)
    })

    signClient.on('session_expire', event => {
      console.log('⏰ Session expired:', event)
      clearConnection()
    })
    eventListenersAttached = true
  }

  function clearConnection(): void {
    console.log('🧹 Clearing connection state')
    instanceState.value.error = null
  }

  function resetEventListenersFlag(): void {
    eventListenersAttached = false
  }

  const initializeMutation = useMutation({
    mutationFn: async (): Promise<WalletConnectInstance> => {
      if (instanceState.value.isInitialized || instanceState.value.isInitializing) {
        return instanceState.value as WalletConnectInstance
      }

      instanceState.value.isInitializing = true
      instanceState.value.error = null
      resetEventListenersFlag()

      try {
        const signClientConfig = {
          projectId: (import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID as string) || '',
          relayUrl: 'wss://relay.walletconnect.com',
          metadata: {
            name: 'Penguin Pool',
            description: 'Chia Pool Management Platform',
            url: window.location.origin,
            icons: [`${window.location.origin}/penguin-pool.svg`],
          },
        }

        const signClient = await SignClient.init(signClientConfig)
        setupSignClientEventListeners(signClient)

        const modal = new WalletConnectModal({
          projectId: (import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID as string) || '',
          enableExplorer: false,
          themeMode: 'dark',
          themeVariables: {
            '--wcm-z-index': '1000',
            '--wcm-background-color': '#1f2937',
            '--wcm-accent-color': '#3b82f6',
            '--wcm-accent-fill-color': '#ffffff',
            '--wcm-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
          },
        })

        instanceState.value.signClient = signClient
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
    resetEventListenersFlag,
  }
}
