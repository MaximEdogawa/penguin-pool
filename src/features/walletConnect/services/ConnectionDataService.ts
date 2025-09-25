import { isIOS } from '@/shared/config/environment'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, nextTick, ref } from 'vue'
import { SageMethods } from '../constants/sage-methods'
import type { AppSignClient, WalletConnectSession } from '../types/walletConnect.types'
import { useIOSWalletConnectService } from './IOSWalletConnectService'
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

// Global connection state
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

  // Use iOS-specific service for iOS devices
  const iosService = useIOSWalletConnectService()
  const isIOSDevice = isIOS()

  const connectionQuery = useQuery({
    queryKey: ['walletConnect', 'connection'],
    queryFn: () => (isIOSDevice ? iosService.state.value : connectionState.value),
    enabled: computed(() => instanceService.isReady.value),
    staleTime: Infinity,
  })

  const openModalMutation = useMutation({
    mutationFn: async (): Promise<WalletConnectSession> => {
      // Use iOS-specific service for iOS devices
      if (isIOSDevice) {
        return await iosService.openModal()
      }

      // Original non-iOS implementation
      if (!instanceService.isReady.value) {
        throw new Error('WalletConnect not initialized')
      }

      const signClient = instanceService.getSignClient.value
      const modal = instanceService.getModal.value

      if (!signClient) throw new Error('SignClient not available')
      if (!modal) throw new Error('WalletConnect modal not available')

      // Create connection using SignClient
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

      // Use native WalletConnect modal for non-iOS devices
      console.log('🖥️ Non-iOS device detected, using native WalletConnect modal')

      // Open modal with the URI
      await modal.openModal({ uri })

      // Set up modal close handler
      let modalClosed = false
      const unsubscribe = modal.subscribeModal(state => {
        if (state.open === false && !modalClosed) {
          modalClosed = true
          // Reset connection state when modal is closed
          resetConnectionState()
          unsubscribe()
        }
      })

      try {
        // Wait for session approval
        const session = await approval()

        // Close modal after successful connection
        modal.closeModal()
        unsubscribe()

        return session as unknown as WalletConnectSession
      } catch (error) {
        // Handle approval rejection or modal close
        unsubscribe()
        if (modalClosed) {
          // Reset connection state when modal is closed without connection
          resetConnectionState()
          throw new Error('Modal closed without connection')
        }
        // Reset connection state on other errors
        resetConnectionState()
        throw error
      }
    },
  })

  const connectMutation = useMutation({
    mutationFn: async (session: WalletConnectSession): Promise<ConnectionState> => {
      // Use iOS-specific service for iOS devices
      if (isIOSDevice) {
        await iosService.connect(session)
        return iosService.state.value
      }

      // Original non-iOS implementation
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
      // Use iOS-specific service for iOS devices
      if (isIOSDevice) {
        return await iosService.disconnect()
      }

      // Original non-iOS implementation
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
      // Use iOS-specific service for iOS devices
      if (isIOSDevice) {
        return await iosService.restoreSessions()
      }

      // Original non-iOS implementation
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
    console.log('🔗 [CONNECTION] Starting session approval...')

    connectionState.value.session = session
    connectionState.value.isConnected = true
    connectionState.value.isConnecting = false
    connectionState.value.error = null

    // Extract accounts and chainId
    const chiaNamespace = session.namespaces.chia
    const accounts = chiaNamespace?.accounts || []
    connectionState.value.accounts = accounts.map((account: string) => account.split(':')[2])

    // Determine chainId from session
    connectionState.value.chainId = extractChainId(session)

    console.log('✅ Wallet connected successfully')
    console.log('🔗 [CONNECTION] Session details:', {
      topic: session.topic,
      accounts: connectionState.value.accounts,
      chainId: connectionState.value.chainId,
      isConnected: connectionState.value.isConnected,
    })

    // Use nextTick to ensure reactive updates propagate before queries start
    nextTick(() => {
      // Set isFullyReady AFTER all reactive updates have propagated
      connectionState.value.isFullyReady = true

      console.log('🔄 Connection state updated, queries should refresh automatically')
      console.log('🔗 [CONNECTION] Final state:', {
        isConnected: connectionState.value.isConnected,
        hasSession: !!connectionState.value.session,
        hasAccounts: connectionState.value.accounts.length > 0,
        chainId: connectionState.value.chainId,
        isFullyReady: connectionState.value.isFullyReady,
      })
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
    state: computed(() => (isIOSDevice ? iosService.state.value : connectionState.value)),
    openModal: openModalMutation.mutateAsync,
    connect: connectMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    restoreSessions: restoreSessionsMutation.mutateAsync,
    resetConnectionState: isIOSDevice ? iosService.resetConnectionState : resetConnectionState,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isOpeningModal: openModalMutation.isPending,
    // iOS-specific properties
    isIOSDevice,
    iosService: isIOSDevice ? iosService : null,
  }
}
