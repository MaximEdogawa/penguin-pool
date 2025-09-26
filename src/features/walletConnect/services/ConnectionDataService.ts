import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, nextTick, ref } from 'vue'
import { SageMethods } from '../constants/sage-methods'
import type { AppSignClient, WalletConnectSession } from '../types/walletConnect.types'
import { useInstanceDataService } from './InstanceDataService'

export interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  isFullyReady: boolean
  session: WalletConnectSession | null
  accounts: string[]
  chainId: string | null
  error: string | null
}

const connectionState = ref<ConnectionState>({
  isConnected: false,
  isConnecting: false,
  isFullyReady: false,
  session: null,
  accounts: [],
  chainId: null,
  error: null,
})

export function useConnectionDataService() {
  const instanceService = useInstanceDataService()
  const connectionQuery = useQuery({
    queryKey: ['walletConnect', 'connection'],
    queryFn: () => connectionState.value,
    enabled: computed(() => instanceService.isReady.value),
    staleTime: Infinity,
  })

  const generateURIMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      if (!instanceService.isReady.value) {
        throw new Error('WalletConnect not initialized')
      }

      const signClient = instanceService.getSignClient.value
      if (!signClient) throw new Error('SignClient not available')

      const { uri } = await signClient.connect({
        optionalNamespaces: {
          chia: {
            methods: Object.values(SageMethods),
            chains: ['chia:mainnet', 'chia:testnet'],
            events: [],
          },
        },
      })

      if (!uri) {
        throw new Error('Failed to generate connection URI')
      }

      return uri
    },
  })

  const openModalMutation = useMutation({
    mutationFn: async (): Promise<WalletConnectSession> => {
      if (!instanceService.isReady.value) {
        throw new Error('WalletConnect not initialized')
      }

      const signClient = instanceService.getSignClient.value
      const modal = instanceService.getModal.value

      if (!signClient) throw new Error('SignClient not available')
      if (!modal) throw new Error('WalletConnect modal not available')

      const { uri, approval } = await signClient.connect({
        optionalNamespaces: {
          chia: {
            methods: Object.values(SageMethods),
            chains: ['chia:mainnet', 'chia:testnet'],
            events: [],
          },
        },
      })

      if (!uri) {
        throw new Error('Failed to generate connection URI')
      }

      await modal.openModal({ uri })

      let modalClosed = false
      const unsubscribe = modal.subscribeModal(state => {
        if (state.open === false && !modalClosed) {
          modalClosed = true
          resetConnectionState()
          unsubscribe()
        }
      })

      try {
        const session = await approval()

        modal.closeModal()
        unsubscribe()

        return session as unknown as WalletConnectSession
      } catch (error) {
        unsubscribe()
        if (modalClosed) {
          resetConnectionState()
          throw new Error('Modal closed without connection')
        }
        resetConnectionState()
        throw error
      }
    },
  })

  const connectMutation = useMutation({
    mutationFn: async (session: WalletConnectSession): Promise<ConnectionState> => {
      connectionState.value.isConnecting = true
      connectionState.value.error = null

      try {
        handleSessionApprove(session)
        return connectionState.value
      } catch (error) {
        connectionState.value.error = error instanceof Error ? error.message : 'Connection failed'
        connectionState.value.isConnecting = false
        throw error
      }
    },
    onSuccess: () => {
      console.log('✅ Wallet connected')
    },
    onError: error => {
      console.error('❌ Wallet connection failed:', error)
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!connectionState.value.session) return

      try {
        const signClient = instanceService.getSignClient.value
        if (!signClient) return

        await (signClient as AppSignClient).disconnect({
          topic: connectionState.value.session!.topic,
          reason: { code: 6000, message: 'User disconnected' },
        })

        clearConnection()
      } catch (error) {
        console.error('Disconnect error:', error)
        clearConnection()
      }
    },
    onSuccess: () => {
      console.log('✅ Wallet disconnected')
    },
  })

  const restoreSessionsMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!instanceService.isReady.value) return

      const signClient = instanceService.getSignClient.value
      if (!signClient) return

      const sessions = (signClient as AppSignClient).session.getAll()

      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1]
        handleSessionApprove(lastSession)
      }
    },
  })

  function handleSessionApprove(session: WalletConnectSession): void {
    connectionState.value.session = session
    connectionState.value.isConnected = true
    connectionState.value.isConnecting = false
    connectionState.value.error = null

    // Extract accounts and chainId
    const chiaNamespace = session.namespaces.chia
    const accounts = chiaNamespace?.accounts || []
    connectionState.value.accounts = accounts.map((account: string) => account.split(':')[2])
    connectionState.value.chainId = extractChainId(session)

    nextTick(() => {
      connectionState.value.isFullyReady = true
      console.log('🔄 Connection state updated, queries should refresh automatically')
    })
  }

  function extractChainId(session: WalletConnectSession): string {
    const chiaNamespace = session.namespaces.chia
    const accounts = chiaNamespace?.accounts || []
    if (accounts.length > 0) {
      const chainId = accounts[0].split(':')[1]
      return chainId === 'mainnet' ? 'mainnet' : 'testnet'
    }
    return 'testnet'
  }

  function clearConnection(): void {
    connectionState.value.isConnected = false
    connectionState.value.isConnecting = false
    connectionState.value.isFullyReady = false
    connectionState.value.session = null
    connectionState.value.accounts = []
    connectionState.value.chainId = null
    connectionState.value.error = null
  }

  function resetConnectionState(): void {
    connectionState.value.isConnecting = false
    connectionState.value.error = null
  }

  return {
    connection: connectionQuery,
    state: computed(() => connectionState.value),
    generateURI: generateURIMutation.mutateAsync,
    openModal: openModalMutation.mutateAsync,
    connect: connectMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    restoreSessions: restoreSessionsMutation.mutateAsync,
    resetConnectionState: resetConnectionState,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isOpeningModal: openModalMutation.isPending,
  }
}
