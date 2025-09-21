import type { PairingTypes } from '@walletconnect/types'
import { computed, readonly, ref, watch } from 'vue'
import { useWalletConnectService } from '../services/WalletConnectService'
import type {
  ConnectionResult,
  DisconnectResult,
  WalletConnectEvent,
} from '../types/walletConnect.types'

/**
 * WalletConnect Composable
 *
 * This composable provides a reactive interface to the unified WalletConnectService
 * with enhanced iOS support and automatic state management.
 */
export function useWalletConnect() {
  // Use the unified service
  const service = useWalletConnectService

  // Reactive state
  const isConnecting = ref(false)
  const error = ref<string | null>(null)
  const eventListeners = new Map<string, (event: WalletConnectEvent) => void>()

  // Computed state from service
  const isConnected = computed(() => service.isConnected())
  const isInitialized = computed(() => service.isInitialized)
  const session = computed(() => service.getSession())
  const accounts = computed(() => service.getAccounts())
  const chainId = computed(() => service.getChainId())

  // State object for external consumption
  const state = computed(() => ({
    isConnected: isConnected.value,
    isConnecting: isConnecting.value,
    isInitialized: isInitialized.value,
    session: session.value,
    accounts: accounts.value,
    chainId: chainId.value,
    error: error.value,
  }))

  /**
   * Initialize WalletConnect with iOS optimizations
   */
  async function initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing WalletConnect...')

      await service.initialize()

      console.log('✅ WalletConnect initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WalletConnect'
      error.value = errorMessage
      console.error('❌ WalletConnect initialization failed:', errorMessage)
      throw err
    }
  }

  /**
   * Connect to wallet with improved iOS support
   */
  async function connect(pairing?: { topic: string }): Promise<ConnectionResult> {
    try {
      isConnecting.value = true
      error.value = null

      console.log('🔗 Connecting to wallet...')

      const result = await service.connect(pairing)

      if (result) {
        // Wait for approval
        const sessionResult = await result.approval()

        if (sessionResult) {
          console.log('✅ Wallet connected successfully')
          return {
            success: true,
            session: service.getSession() || undefined,
            accounts: service.getAccounts(),
          }
        } else {
          throw new Error('Connection failed - no session received')
        }
      } else {
        throw new Error('Connection failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed'
      error.value = errorMessage
      console.error('❌ Connection failed:', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      isConnecting.value = false
    }
  }

  /**
   * Disconnect from wallet
   */
  async function disconnect(): Promise<DisconnectResult> {
    try {
      console.log('🔌 Disconnecting from wallet...')

      const result = await service.disconnect()

      if (result.success) {
        console.log('✅ Wallet disconnected successfully')
      } else {
        console.error('❌ Wallet disconnect failed:', result.error)
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed'
      console.error('❌ Wallet disconnect error:', errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Make a request to the wallet
   */
  async function request<T = unknown>(method: string, params: unknown[]): Promise<T> {
    try {
      return await service.request<T>(method, params)
    } catch (err) {
      console.error('❌ Request failed:', err)
      throw err
    }
  }

  /**
   * Get connection info
   */
  function getConnectionInfo() {
    return service.getConnectionInfo()
  }

  /**
   * Get pairings
   */
  function getPairings(): PairingTypes.Struct[] {
    return service.getPairings()
  }

  /**
   * Add event listener
   */
  function on(event: string, callback: (event: WalletConnectEvent) => void): void {
    eventListeners.set(event, callback)
    service.on(event, callback)
  }

  /**
   * Remove event listener
   */
  function off(event: string): void {
    eventListeners.delete(event)
    service.off(event)
  }

  // Event emission is handled by the service

  /**
   * Cleanup resources
   */
  function cleanup(): void {
    eventListeners.clear()
    service.cleanup()
  }

  // Watch for service state changes and update local state
  watch(
    () => service.getState(),
    newState => {
      error.value = newState.error
    },
    { deep: true }
  )

  return {
    // State
    state: readonly(state),
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    isInitialized: readonly(isInitialized),
    session: readonly(session),
    accounts: readonly(accounts),
    chainId: readonly(chainId),
    error: readonly(error),

    // Methods
    initialize,
    connect,
    disconnect,
    request,
    getConnectionInfo,
    getPairings,
    on,
    off,
    cleanup,

    // Service access
    service,
  }
}
