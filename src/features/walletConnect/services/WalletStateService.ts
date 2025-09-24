import { ref, computed } from 'vue'

// Simple wallet state that can be used outside of component context
const walletState = ref({
  isInitialized: false,
  isConnected: false,
  isConnecting: false,
  session: null as Record<string, unknown> | null,
  accounts: [] as string[],
  chainId: null as string | null,
  fingerprint: null as string | null,
  address: null as string | null,
  error: null as string | null,
})

export function useWalletStateService() {
  return {
    state: computed(() => walletState.value),
    isInitialized: computed(() => walletState.value.isInitialized),
    isConnected: computed(() => walletState.value.isConnected),
    isConnecting: computed(() => walletState.value.isConnecting),
    session: computed(() => walletState.value.session),
    accounts: computed(() => walletState.value.accounts),
    chainId: computed(() => walletState.value.chainId),
    fingerprint: computed(() => walletState.value.fingerprint),
    address: computed(() => walletState.value.address),
    error: computed(() => walletState.value.error),

    // Methods to update state (called by the main service)
    setInitialized: (value: boolean) => {
      walletState.value.isInitialized = value
    },
    setConnected: (value: boolean) => {
      walletState.value.isConnected = value
    },
    setConnecting: (value: boolean) => {
      walletState.value.isConnecting = value
    },
    setSession: (session: Record<string, unknown> | null) => {
      walletState.value.session = session
    },
    setAccounts: (accounts: string[]) => {
      walletState.value.accounts = accounts
    },
    setChainId: (chainId: string | null) => {
      walletState.value.chainId = chainId
    },
    setFingerprint: (fingerprint: string | null) => {
      walletState.value.fingerprint = fingerprint
    },
    setAddress: (address: string | null) => {
      walletState.value.address = address
    },
    setError: (error: string | null) => {
      walletState.value.error = error
    },
  }
}
