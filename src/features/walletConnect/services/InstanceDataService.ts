import { useMutation, useQuery } from '@tanstack/vue-query'
import { WalletConnectModal } from '@walletconnect/modal'
import SignClient from '@walletconnect/sign-client'
import { computed, ref, type Ref } from 'vue'
import { useWalletConnectEventListeners } from '../composables/useWalletConnectEventListeners'
import { MODAL_CONFIG, SIGN_CLIENT_CONFIG } from '../constants/wallet-connect'
import type { WalletConnectInstance } from '../types/walletConnect.types'
import { walletConnectPersistenceService } from './WalletConnectPersistenceService'

let globalSignClient: SignClient | null = null
let globalModal: WalletConnectModal | null = null
let isInitializing = false
let initializationPromise: Promise<WalletConnectInstance> | null = null

export function useInstanceDataService() {
  const instanceData: Ref<WalletConnectInstance | null> = ref(null)
  const isInitialized: Ref<boolean> = ref(false)
  const eventListeners = useWalletConnectEventListeners()

  const initializeMutation = useMutation({
    mutationFn: async (): Promise<WalletConnectInstance> => {
      if (isInitializing && initializationPromise) return initializationPromise

      if (globalSignClient && globalModal) {
        instanceData.value = { signClient: globalSignClient, modal: globalModal }
        isInitialized.value = true
        return instanceData.value
      }

      isInitializing = true
      initializationPromise = (async (): Promise<WalletConnectInstance> => {
        try {
          if (!globalSignClient) {
            console.log('no globalSignClient, initializing...')
            globalSignClient = await SignClient.init(SIGN_CLIENT_CONFIG)
          }
          if (!globalModal) globalModal = new WalletConnectModal(MODAL_CONFIG)

          const signClient = globalSignClient
          const modal = globalModal
          const instance = { signClient, modal }
          instanceData.value = instance
          isInitialized.value = true
          return instance
        } catch (error) {
          console.error('❌ Failed to initialize WalletConnect:', error)
          throw error
        } finally {
          isInitializing = false
          initializationPromise = null
        }
      })()

      return initializationPromise
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  const autoInitializeIfNeeded = async () => {
    if (walletConnectPersistenceService.hasValidSession && !isInitialized.value) {
      console.log('🔄 Auto-initializing WalletConnect instance for persisted session')
      try {
        await initializeMutation.mutate()
      } catch (error) {
        console.error('❌ Auto-initialization failed:', error)
      }
    }
  }

  autoInitializeIfNeeded()

  const instanceQuery = useQuery({
    queryKey: ['walletConnect', 'instance'],
    queryFn: async () => instanceData.value,
    enabled: computed(() => isInitialized.value),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const cleanup = () => {
    console.log('🧹 Cleaning up WalletConnect instances')

    if (globalSignClient) {
      eventListeners.removeEventListeners(globalSignClient)
    }

    globalSignClient = null
    globalModal = null
    isInitializing = false
    initializationPromise = null
    instanceData.value = null
    isInitialized.value = false
    eventListeners.resetListenersFlag()
  }

  return {
    data: instanceQuery.data,
    signClient: computed(() => instanceQuery.data.value?.signClient),
    modal: computed(() => instanceQuery.data.value?.modal),
    isInitializing: initializeMutation.isPending,
    isInitialized: computed(() => isInitialized.value),
    error: initializeMutation.error,
    initialize: () => initializeMutation.mutate(),
    cleanup,
    persistenceService: walletConnectPersistenceService,
  }
}
