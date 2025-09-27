import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import type { WalletConnectSession, WalletConnectState } from '../types/walletConnect.types'
import { useSessionDataService } from './ConnectionDataService'
import { useInstanceDataService } from './InstanceDataService'

export function useWalletStateService() {
  const sessionService = useSessionDataService()
  const { instance } = useInstanceDataService()

  const walletStateQuery = useQuery({
    queryKey: ['walletConnect', 'walletState'],
    queryFn: (): WalletConnectState => ({
      signClient: instance.data.value?.signClient ?? null,
      isInitialized: instance.data.value?.isInitialized ?? false,
      isConnected: sessionService.isConnected.value,
      isConnecting: sessionService.isConnecting.value,
      session: sessionService.session.value ?? null,
      accounts: sessionService.session.value?.namespaces?.chia?.accounts ?? [],
      chainId: sessionService.session.value ? extractChainId(sessionService.session.value) : null,
      fingerprint: sessionService.session.value?.namespaces?.chia?.accounts![0] || null,
      address: sessionService.session.value?.namespaces?.chia?.accounts![0] || null,
      error:
        instance.error.value instanceof Error ? instance.error.value.message : instance.error.value,
    }),
    enabled: true,
    staleTime: Infinity,
  })

  const defaultState: WalletConnectState = {
    signClient: null,
    isInitialized: false,
    isConnected: false,
    isConnecting: false,
    session: null,
    accounts: [],
    chainId: null,
    fingerprint: null,
    address: null,
    error: null,
  }

  const walletState = computed(() => walletStateQuery.data.value ?? defaultState)
  const signClient = computed(() => walletState.value.signClient)
  const isInitialized = computed(() => walletState.value.isInitialized)
  const isConnected = computed(() => walletState.value.isConnected)
  const isConnecting = computed(() => walletState.value.isConnecting)
  const session = computed(() => walletState.value.session)
  const accounts = computed(() => walletState.value.accounts)
  const chainId = computed(() => walletState.value.chainId)
  const fingerprint = computed(() => walletState.value.fingerprint)
  const address = computed(() => walletState.value.address)
  const error = computed(() => walletState.value.error)

  const hasWallet = computed(() => isConnected.value && accounts.value.length > 0)
  const walletAddress = computed(() => address.value || fingerprint.value)
  const isReady = computed(() => isInitialized.value && !isConnecting.value && !error.value)

  return {
    walletState,
    signClient,
    isInitialized,
    isConnected,
    isConnecting,
    session,
    accounts,
    chainId,
    fingerprint,
    address,
    error,
    hasWallet,
    walletAddress,
    isReady,
    isLoading: walletStateQuery.isLoading,
    isError: walletStateQuery.isError,
    queryError: walletStateQuery.error,
  }
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
