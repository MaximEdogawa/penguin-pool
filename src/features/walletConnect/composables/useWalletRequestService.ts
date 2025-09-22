import { computed } from 'vue'
import * as walletQueries from '../queries/walletQueries'
import { useWalletConnectService } from '../services/WalletConnectService'
import type { ExtendedWalletInfo } from '../types/walletConnect.types'

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
 * Composable for wallet request operations
 * Handles all wallet requests and integrates with wallet queries
 */
export function useWalletRequestService() {
  const walletConnectService = useWalletConnectService
  // Reactive state - use the reactive state from the service
  const state = computed(() => walletConnectService.getReactiveState())

  // Computed properties
  const isConnected = computed(() => state.value.isConnected)
  const isConnecting = computed(() => state.value.isConnecting)
  const session = computed(() => state.value.session)
  const accounts = computed(() => state.value.accounts)
  const chainId = computed(() => state.value.chainId)
  const currentNetwork = computed(() => state.value.currentNetwork)
  const error = computed(() => state.value.error)

  // Primary account (first account in the list)
  const primaryAccount = computed(() => accounts.value[0] || null)

  /**
   * Get wallet information
   */
  const getWalletInfo = (): ExtendedWalletInfo => {
    const currentState = walletConnectService.getState()
    return {
      fingerprint: currentState.accounts[0] || null,
      chainId: currentState.chainId,
      network: currentState.currentNetwork,
      accounts: currentState.accounts,
      session: currentState.session,
    }
  }

  /**
   * Make a request to the wallet
   */
  const request = async <T = unknown>(method: string, params: unknown[]): Promise<T> => {
    if (!isConnected.value) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log(`🔗 Making wallet request: ${method}`, params)
      const result = await walletConnectService.request<T>(method, params)
      console.log(`✅ Wallet request successful: ${method}`, result)
      return result
    } catch (error) {
      console.error(`❌ Wallet request failed: ${method}`, error)
      throw error
    }
  }

  /**
   * Sign a message
   */
  const signMessage = async (message: string): Promise<string> => {
    return await request<string>('chia_sign_message', [message])
  }

  /**
   * Send a transaction
   */
  const sendTransaction = async (transaction: unknown): Promise<string> => {
    return await request<string>('chia_send_transaction', [transaction])
  }

  /**
   * Get wallet balance
   */
  const getBalance = async (): Promise<unknown> => {
    return await request('chia_get_balance', [])
  }

  /**
   * Get wallet address
   */
  const getAddress = async (): Promise<string> => {
    return await request<string>('chia_get_address', [])
  }

  /**
   * Get wallet fingerprint
   */
  const getFingerprint = async (): Promise<number> => {
    return await request<number>('chia_get_fingerprint', [])
  }

  /**
   * Get wallet public key
   */
  const getPublicKey = async (): Promise<string> => {
    return await request<string>('chia_get_public_key', [])
  }

  /**
   * Get wallet sync status
   */
  const getSyncStatus = async (): Promise<unknown> => {
    return await request('chia_get_sync_status', [])
  }

  /**
   * Get wallet height
   */
  const getHeight = async (): Promise<number> => {
    return await request<number>('chia_get_height', [])
  }

  /**
   * Get wallet network info
   */
  const getNetworkInfo = () => {
    return walletConnectService.getNetworkInfo()
  }

  /**
   * Get supported networks
   */
  const getSupportedNetworks = (): WalletConnectNetwork[] => {
    return walletConnectService.getSupportedNetworks()
  }

  /**
   * Switch network
   */
  const switchNetwork = async (chainId: string): Promise<boolean> => {
    return await walletConnectService.switchNetwork(chainId)
  }

  /**
   * Connect to wallet
   */
  const connect = async () => {
    const result = await walletConnectService.connect()
    return result
  }

  /**
   * Disconnect from wallet
   */
  const disconnect = async () => {
    const result = await walletConnectService.disconnect()
    return result
  }

  /**
   * Event listeners
   */
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
    session,
    accounts,
    chainId,
    currentNetwork,
    error,
    primaryAccount,

    // Wallet info
    getWalletInfo,

    // Request methods
    request,
    signMessage,
    sendTransaction,
    getBalance,
    getAddress,
    getFingerprint,
    getPublicKey,
    getSyncStatus,
    getHeight,

    // Network methods
    getNetworkInfo,
    getSupportedNetworks,
    switchNetwork,

    // Connection methods
    connect,
    disconnect,

    // Event methods
    on,
    off,

    // Wallet queries integration
    walletQueries,
  }
}
