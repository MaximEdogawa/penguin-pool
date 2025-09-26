import { useMutation, useQuery } from '@tanstack/vue-query'
import { WalletConnectModal } from '@walletconnect/modal'
import SignClient from '@walletconnect/sign-client'
import { computed, ref, type Ref } from 'vue'

export interface WalletConnectInstance {
  signClient: SignClient | null
  modal: WalletConnectModal | null
  isInitialized: boolean
  isInitializing: boolean
  error: string | null
}

const instanceState: Ref<WalletConnectInstance> = ref({
  signClient: null,
  modal: null,
  isInitialized: false,
  isInitializing: false,
  error: null,
})

const eventListenersAttached = ref(false)

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        reject(new Error(`${operation} timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    ),
  ])
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Initialization failed'
}

const cleanupResources = (
  signClient: SignClient | null,
  modal: WalletConnectModal | null
): void => {
  if (!signClient || !modal) return console.error('SignClient or modal is not initialized')
  try {
    if (signClient) {
      signClient.removeAllListeners('session_request')
      signClient.removeAllListeners('session_event')
      signClient.removeAllListeners('session_delete')
      signClient.removeAllListeners('session_update')
      signClient.removeAllListeners('session_expire')
    }
  } catch (error) {
    console.error('Error cleaning up signClient:', error)
  }

  try {
    if (modal) {
      modal.closeModal()
    }
  } catch (error) {
    console.error('Error cleaning up modal:', error)
  }
}

const createSignClientConfig = (projectId: string) => {
  return {
    projectId,
    relayUrl: import.meta.env?.VITE_WALLET_CONNECT_RELAY_URL || 'wss://relay.walletconnect.com',
    metadata: {
      name: import.meta.env?.VITE_APP_NAME || 'Penguin Pool',
      description: 'Chia Pool Management Platform',
      url: window.location.origin,
      icons: [
        `${window.location.origin}/penguin-pool.svg`,
        `${window.location.origin}/icons/icon-192x192.png`,
        `${window.location.origin}/icons/icon-512x512.png`,
      ],
    },
  }
}

const createModalConfig = (projectId: string) => {
  return {
    projectId,
    enableExplorer: false,
    themeMode: 'dark' as const,
    themeVariables: {
      '--wcm-z-index': '1000',
      '--wcm-background-color': '#1f2937',
      '--wcm-accent-color': '#3b82f6',
      '--wcm-accent-fill-color': '#ffffff',
      '--wcm-overlay-background-color': 'rgba(0, 0, 0, 0.8)',
    },
  }
}

export function useInstanceDataService() {
  const instanceQuery = useQuery({
    queryKey: ['walletConnect', 'instance'],
    queryFn: () => instanceState.value,
    enabled: true,
    staleTime: Infinity,
  })

  function setupSignClientEventListeners(signClient: SignClient) {
    if (eventListenersAttached.value) {
      return
    }

    signClient.on('session_request', async event => {
      console.log('📨 Received session request:', event)
    })

    signClient.on('session_event', event => {
      console.log('📨 Received session event:', event)
    })

    signClient.on('session_delete', event => {
      console.log('🗑️ Received session delete:', event)
    })

    signClient.on('session_update', event => {
      console.log('🔄 Received session update:', event)
    })

    signClient.on('session_expire', event => {
      console.log('⏰ Received session expire:', event)
      clearConnection()
    })

    eventListenersAttached.value = true
  }

  function clearConnection(): void {
    instanceState.value.error = null
  }

  function resetEventListenersFlag(): void {
    eventListenersAttached.value = false
  }

  function resetInstance(): void {
    cleanupResources(instanceState.value.signClient, instanceState.value.modal)

    instanceState.value = {
      signClient: null,
      modal: null,
      isInitialized: false,
      isInitializing: false,
      error: null,
    }

    eventListenersAttached.value = false
  }

  const initializeMutation = useMutation({
    mutationFn: async (): Promise<WalletConnectInstance> => {
      if (instanceState.value.isInitialized) {
        return instanceState.value
      }

      if (instanceState.value.isInitializing) {
        return new Promise((resolve, reject) => {
          const checkInitialization = () => {
            if (instanceState.value.isInitialized) {
              resolve(instanceState.value)
            } else if (!instanceState.value.isInitializing) {
              reject(new Error('Initialization failed'))
            } else {
              setTimeout(checkInitialization, 100)
            }
          }
          checkInitialization()
        })
      }

      const projectId = import.meta.env?.VITE_WALLET_CONNECT_PROJECT_ID
      if (!projectId) {
        const error = new Error('VITE_WALLET_CONNECT_PROJECT_ID is required but not provided')
        instanceState.value.error = error.message
        throw error
      }

      instanceState.value.isInitializing = true
      instanceState.value.error = null
      resetEventListenersFlag()

      try {
        const signClientConfig = createSignClientConfig(projectId)
        const modalConfig = createModalConfig(projectId)

        const signClient = await withTimeout(
          SignClient.init(signClientConfig),
          30000,
          'SignClient initialization'
        )

        setupSignClientEventListeners(signClient)

        const modal = await withTimeout(
          Promise.resolve(new WalletConnectModal(modalConfig)),
          10000,
          'Modal creation'
        )

        instanceState.value = {
          ...instanceState.value,
          signClient,
          modal,
          isInitialized: true,
          isInitializing: false,
          error: null,
        }

        return instanceState.value
      } catch (error) {
        const errorMessage = getErrorMessage(error)

        cleanupResources(instanceState.value.signClient!, instanceState.value.modal!)

        instanceState.value = {
          ...instanceState.value,
          signClient: null,
          modal: null,
          isInitialized: false,
          isInitializing: false,
          error: errorMessage,
        }

        throw error
      }
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  const getSignClient = computed(() => instanceState.value.signClient)
  const getModal = computed(() => instanceState.value.modal)
  const isReady = computed(
    () => instanceState.value.isInitialized && instanceState.value.signClient !== null
  )

  const isHealthy = computed(() => {
    return !!(
      instanceState.value.isInitialized &&
      instanceState.value.signClient &&
      instanceState.value.modal &&
      !instanceState.value.error
    )
  })

  return {
    instance: instanceQuery,
    state: computed(() => instanceState.value),
    initialize: initializeMutation.mutateAsync,
    isInitializing: initializeMutation.isPending,
    error: initializeMutation.error,
    getSignClient,
    getModal,
    isReady,
    isHealthy,
    resetEventListenersFlag,
    resetInstance,
  }
}
