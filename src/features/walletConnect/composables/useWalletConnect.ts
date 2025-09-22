import { computed, ref } from 'vue'
import { useWalletConnectService } from '../services/WalletConnectService'

// Define WalletConnectNetwork interface for Chia networks
interface WalletConnectNetwork {
  id: string
  name: string
  rpcUrls: {
    default: { http: string[] }
  }
  blockExplorers: {
    default: { name: string; url: string }
  }
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

/**
 * Main composable for AppKit wallet operations
 */
export function useWalletConnect() {
  const walletConnectService = useWalletConnectService

  // Reactive state
  const state = ref(walletConnectService.getState())

  // Computed properties
  const isConnected = computed(() => state.value.isConnected)
  const isConnecting = computed(() => state.value.isConnecting)
  const isInitialized = computed(() => state.value.isInitialized)
  const session = computed(() => state.value.session)
  const accounts = computed(() => state.value.accounts)
  const chainId = computed(() => state.value.chainId)
  const error = computed(() => state.value.error)
  const currentNetwork = computed(() => state.value.currentNetwork)

  // Network-specific computed properties
  const isChiaNetwork = computed(() => chainId.value?.startsWith('chia:'))

  // Primary account (first account in the list)
  const primaryAccount = computed(() => accounts.value[0] || null)

  // Network info
  const networkInfo = computed(() => {
    return walletConnectService.getNetworkInfo()
  })

  // Methods
  const connect = async () => {
    const result = await walletConnectService.connect()
    updateState()
    return result
  }

  const disconnect = async () => {
    const result = await walletConnectService.disconnect()
    updateState()
    return result
  }

  const switchNetwork = async (chainId: string) => {
    const result = await walletConnectService.switchNetwork(chainId)
    updateState()
    return result
  }

  const getSupportedNetworks = (): WalletConnectNetwork[] => {
    return walletConnectService.getSupportedNetworks()
  }

  const getNetworksByType = (type: 'chia'): WalletConnectNetwork[] => {
    return walletConnectService.getNetworksByType(type)
  }

  const getChiaNetworks = (): WalletConnectNetwork[] => {
    return getNetworksByType('chia')
  }

  // Helper function to update state from service
  const updateState = () => {
    state.value = walletConnectService.getState()
  }

  // Event listeners
  const on = (event: string, callback: (data: unknown) => void) => {
    walletConnectService.on(event, callback)
  }

  const off = (event: string) => {
    walletConnectService.off(event)
  }

  return {
    // State
    state,
    isConnected,
    isConnecting,
    isInitialized,
    session,
    accounts,
    chainId,
    error,
    currentNetwork,

    // Network-specific state
    isChiaNetwork,
    primaryAccount,
    networkInfo,

    // Methods
    connect,
    disconnect,
    switchNetwork,
    getSupportedNetworks,
    getNetworksByType,
    getChiaNetworks,
    on,
    off,
  }
}

/**
 * Composable for Chia-specific wallet operations
 */
export function useChiaWallet() {
  const {
    isConnected,
    isChiaNetwork,
    chainId,
    currentNetwork,
    connect,
    disconnect,
    switchNetwork,
    getChiaNetworks,
  } = useWalletConnect()

  const chiaNetworks = computed(() => {
    return getChiaNetworks()
  })

  const currentChiaNetwork = computed(() => {
    if (!isChiaNetwork.value || !currentNetwork.value) return null
    return currentNetwork.value
  })

  const isMainnet = computed(() => {
    return chainId.value?.includes('mainnet') || false
  })

  const isTestnet = computed(() => {
    return chainId.value?.includes('testnet') || false
  })

  const switchToMainnet = async () => {
    const mainnetNetwork = chiaNetworks.value.find((n: WalletConnectNetwork) =>
      n.name.includes('Mainnet')
    )
    if (mainnetNetwork) {
      return await switchNetwork(String(mainnetNetwork.id))
    }
    return false
  }

  const switchToTestnet = async () => {
    const testnetNetwork = chiaNetworks.value.find((n: WalletConnectNetwork) =>
      n.name.includes('Testnet')
    )
    if (testnetNetwork) {
      return await switchNetwork(String(testnetNetwork.id))
    }
    return false
  }

  return {
    isConnected,
    isChiaNetwork,
    currentNetwork,
    currentChiaNetwork,
    chainId,
    isMainnet,
    isTestnet,
    chiaNetworks,
    connect,
    disconnect,
    switchNetwork,
    switchToMainnet,
    switchToTestnet,
  }
}
