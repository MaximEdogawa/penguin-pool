import { useMutation, useQuery } from '@tanstack/vue-query'
import type { SessionTypes } from '@walletconnect/types'
import { computed, ref, type Ref } from 'vue'
import type { WalletConnectSession } from '../types/walletConnect.types'
import { useConnectDataService } from './ConnectionDataService'
import { walletConnectPersistenceService } from './WalletConnectPersistenceService'

export function useSessionDataService() {
  const { approval } = useConnectDataService()
  const sessionData: Ref<SessionTypes.Struct | undefined> = ref(undefined)

  const sessionMutation = useMutation({
    mutationFn: async () => {
      try {
        if (!approval.value) throw new Error('Approval function is not available')
        const result = await approval.value()
        if (!result) throw new Error('Approval result is not available')
        sessionData.value = result
        walletConnectPersistenceService.saveSession(result)
        return result
      } catch (error) {
        // Approval failed
        throw error
      }
    },
  })

  const sessionQuery = useQuery({
    queryKey: ['walletConnect', 'session'],
    queryFn: async () => {
      const currentSession = sessionData.value || walletConnectPersistenceService.currentSessionData
      return currentSession || null
    },
    enabled: computed(
      () => sessionMutation.isSuccess.value || walletConnectPersistenceService.hasValidSession
    ),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const initializeFromPersistence = () => {
    const persistedSession = walletConnectPersistenceService.currentSessionData
    if (persistedSession) {
      sessionData.value = persistedSession
    }
  }
  initializeFromPersistence()

  const chainId = computed(() => {
    const currentSession =
      sessionQuery?.data.value || walletConnectPersistenceService.currentSessionData
    if (!currentSession) return 'chia:testnet'
    const chains = currentSession.namespaces.chia?.chains
    if (chains && chains.length > 0) {
      return chains[0].split(':')[1]
    }
    return 'chia:testnet'
  })

  const fingerprint = computed(() => {
    const currentSession =
      sessionQuery?.data.value || walletConnectPersistenceService.currentSessionData
    if (!currentSession?.namespaces.chia?.accounts?.[0]) return 0
    return parseInt(currentSession.namespaces.chia.accounts[0].split(':')[2] || '0')
  })

  const topic = computed(() => {
    const currentSession =
      sessionQuery?.data.value || walletConnectPersistenceService.currentSessionData
    return currentSession?.topic || ''
  })

  const isConnected = computed(() => {
    return (
      sessionMutation.isSuccess.value ||
      walletConnectPersistenceService.reactiveCurrentSession.value !== null
    )
  })

  const disconnect = () => {
    walletConnectPersistenceService.clearSession()
    sessionData.value = undefined
    sessionMutation.reset()
  }

  return {
    data: sessionQuery.data,
    chainId,
    fingerprint,
    topic,
    isConnecting: sessionQuery.isLoading,
    isConnected,
    waitForApproval: () => sessionMutation.mutate(),
    disconnect,
    persistenceService: walletConnectPersistenceService,
  } as WalletConnectSession
}
