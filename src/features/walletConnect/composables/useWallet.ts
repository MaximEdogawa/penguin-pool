import { CHIA_MAINNET_CHAIN_ID, CHIA_TESTNET_CHAIN_ID } from '@/shared/config/environment'
import { computed } from 'vue'
import { useWalletConnectService } from '../services/WalletConnectService'
import type { ExtendedWalletInfo, WalletConnectSession } from '../types/walletConnect.types'

// Define WalletConnectNetwork interface for Chia networks
interface WalletConnectNetwork {
  chainId: string | null
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

// Network configurations
const chiaMainnet: WalletConnectNetwork = {
  id: CHIA_MAINNET_CHAIN_ID,
  chainId: CHIA_MAINNET_CHAIN_ID,
  name: 'Chia Mainnet',
  rpcUrls: {
    default: {
      http: ['https://api.chia.net'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Chia Explorer',
      url: 'https://www.chiaexplorer.com',
    },
  },
  nativeCurrency: {
    name: 'Chia',
    symbol: 'XCH',
    decimals: 12,
  },
}

const chiaTestnet: WalletConnectNetwork = {
  id: CHIA_TESTNET_CHAIN_ID,
  chainId: CHIA_TESTNET_CHAIN_ID,
  name: 'Chia Testnet',
  rpcUrls: {
    default: {
      http: ['https://api-testnet.chia.net'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Chia Testnet Explorer',
      url: 'https://testnet.chiaexplorer.com',
    },
  },
  nativeCurrency: {
    name: 'Chia Testnet',
    symbol: 'TXCH',
    decimals: 12,
  },
}

const networks: [WalletConnectNetwork, ...WalletConnectNetwork[]] = [chiaMainnet, chiaTestnet]

export function useWallet() {
  const walletService = useWalletConnectService()

  // Get reactive state from the service
  const state = walletService.state

  // Computed properties from service state
  const isConnected = walletService.isConnected
  const isConnecting = walletService.isConnecting
  const isInitialized = walletService.isInitialized
  const session = walletService.session
  const accounts = walletService.accounts
  const chainId = walletService.chainId
  const error = walletService.error

  // Network-specific computed properties
  const isChiaNetwork = computed(() => chainId.value?.startsWith('chia:'))
  const primaryAccount = computed(() => accounts.value[0] || null)

  // Connection methods
  const openModal = walletService.openModal
  const connect = walletService.connect
  const disconnect = walletService.disconnect

  // Network methods
  const getSupportedNetworks = (): WalletConnectNetwork[] => {
    return networks
  }

  const getNetworksByType = (type: 'mainnet' | 'testnet'): WalletConnectNetwork[] => {
    return networks.filter(network => network.name.toLowerCase().includes(type))
  }

  const getChiaNetworks = (): WalletConnectNetwork[] => {
    return networks
  }

  // Wallet request methods (using wallet data service)
  const signMessage = walletService.wallet.signMessage
  const sendTransaction = walletService.wallet.sendTransaction

  // Wallet info methods
  const getWalletInfo = (): ExtendedWalletInfo => {
    return {
      fingerprint: walletService.fingerprint.value,
      chainId: chainId.value,
      network: networks.find(network => network.chainId === chainId.value) ?? null,
      accounts: accounts.value,
      session: session.value as WalletConnectSession | null,
    }
  }

  const getBalance = walletService.wallet.getBalance
  const getAddress = () => walletService.wallet.address.data
  const getFingerprint = () => walletService.fingerprint.value
  const getPublicKey = () => walletService.wallet.address.data

  const getSyncStatus = () => walletService.wallet.syncStatus.data
  const getHeight = () => walletService.wallet.height.data

  // Logout method
  const logout = walletService.logout

  return {
    // Service state
    state,
    isConnected,
    isConnecting,
    isInitialized,
    session,
    accounts,
    chainId,
    error,
    // Network-specific state
    isChiaNetwork,
    primaryAccount,

    // Connection methods
    openModal,
    connect,
    disconnect,

    // Network methods
    getSupportedNetworks,
    getNetworksByType,
    getChiaNetworks,

    // Wallet request methods
    signMessage,
    sendTransaction,

    // Wallet info methods
    getWalletInfo,
    getBalance,
    getAddress,
    getFingerprint,
    getPublicKey,
    getSyncStatus,
    getHeight,

    // Logout method
    logout,

    // Data service queries
    walletBalance: walletService.wallet.balance,
    walletAddress: walletService.wallet.address,
    walletSyncStatus: walletService.wallet.syncStatus,
    walletHeight: walletService.wallet.height,

    // Expose data services
    instance: walletService.instance,
    connection: walletService.connection,
    user: walletService.user,
    wallet: walletService.wallet,
  }
}

/**
 * Composable for Chia-specific wallet operations
 */
export function useChiaWallet() {
  const walletService = useWalletConnectService()
  const wallet = walletService

  const chiaNetworks = computed(() => {
    return networks
  })

  const currentChiaNetwork = computed(() => {
    // Return the network based on chainId
    const chainId = wallet.chainId.value
    if (!chainId) return null
    return chainId.includes('mainnet') ? chiaMainnet : chiaTestnet
  })

  const isMainnet = computed(() => {
    return wallet.chainId.value?.includes('mainnet') || false
  })

  const isTestnet = computed(() => {
    return wallet.chainId.value?.includes('testnet') || false
  })

  const switchToMainnet = async () => {
    // Note: Network switching is not implemented in the current service
    console.warn('Network switching not implemented')
    return false
  }

  const switchToTestnet = async () => {
    // Note: Network switching is not implemented in the current service
    console.warn('Network switching not implemented')
    return false
  }

  return {
    ...wallet,
    isChiaNetwork: computed(() => wallet.chainId.value?.startsWith('chia:')),
    currentChiaNetwork,
    chainId: wallet.chainId,
    isMainnet,
    isTestnet,
    chiaNetworks,
    switchToMainnet,
    switchToTestnet,
  }
}
