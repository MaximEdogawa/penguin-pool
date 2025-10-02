import { useQuery } from '@tanstack/vue-query'
import { WalletConnectModal } from '@walletconnect/modal'
import SignClient from '@walletconnect/sign-client'
import { computed } from 'vue'
import { useWalletConnectEventListeners } from '../composables/useWalletConnectEventListeners'
import { MODAL_CONFIG, SIGN_CLIENT_CONFIG } from '../constants/wallet-connect'
import type { WalletConnectInstance } from '../types/walletConnect.types'
import { walletConnectPersistenceService } from './WalletConnectPersistenceService'

export function useInstanceDataService() {
  const eventListeners = useWalletConnectEventListeners()

  const initializeFn = async (): Promise<WalletConnectInstance | undefined> => {
    try {
      const signClient = await SignClient.init(SIGN_CLIENT_CONFIG)
      const modal = new WalletConnectModal(MODAL_CONFIG)
      eventListeners.addEventListeners(signClient)
      eventListeners.handlePendingSessionRequests()
      return { signClient, modal }
    } catch (error) {
      // Failed to initialize WalletConnect
      throw error
    }
  }

  const instanceQuery = useQuery({
    queryKey: ['walletConnect', 'instance'],
    queryFn: async () => {
      return await initializeFn()
    },
    enabled: true,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  return {
    data: instanceQuery.data,
    signClient: computed(() => instanceQuery.data.value?.signClient),
    modal: computed(() => instanceQuery.data.value?.modal),
    isInitializing: instanceQuery.isPending,
    isInitialized: instanceQuery.isSuccess,
    error: instanceQuery.error,
    persistenceService: walletConnectPersistenceService,
  }
}
