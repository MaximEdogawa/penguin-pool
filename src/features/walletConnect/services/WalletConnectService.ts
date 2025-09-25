import { computed, watch } from 'vue'
import type { WalletConnectSession } from '../types/walletConnect.types'
import { useConnectionDataService } from './ConnectionDataService'
import { useInstanceDataService } from './InstanceDataService'
import { useLogoutService } from './LogoutService'
import { useUserDataService } from './UserDataService'
import { useWalletDataService } from './WalletDataService'
import { useWalletStateService } from './WalletStateService'

export function useWalletConnectService() {
  // Initialize the lightweight state service
  const stateService = useWalletStateService()

  // Initialize all the real services
  const instanceService = useInstanceDataService()
  const connectionService = useConnectionDataService()
  const userService = useUserDataService()
  const walletService = useWalletDataService()
  const logoutService = useLogoutService()

  // Sync state from services to the lightweight state service
  watch(
    () => instanceService.isReady.value,
    isReady => stateService.setInitialized(isReady),
    { immediate: true }
  )

  watch(
    () => connectionService.state.value.isConnected,
    isConnected => stateService.setConnected(isConnected),
    { immediate: true }
  )

  watch(
    () => connectionService.state.value.isConnecting,
    isConnecting => stateService.setConnecting(isConnecting),
    { immediate: true }
  )

  watch(
    () => connectionService.state.value.session,
    session => stateService.setSession(session),
    { immediate: true }
  )

  watch(
    () => connectionService.state.value.accounts,
    accounts => stateService.setAccounts(accounts),
    { immediate: true }
  )

  watch(
    () => connectionService.state.value.chainId,
    chainId => stateService.setChainId(chainId),
    { immediate: true }
  )

  watch(
    () => userService.state.value.fingerprint,
    fingerprint => stateService.setFingerprint(fingerprint),
    { immediate: true }
  )

  watch(
    () => userService.state.value.address,
    address => stateService.setAddress(address),
    { immediate: true }
  )

  watch(
    () => connectionService.state.value.error || instanceService.error.value,
    (error: string | Error | null) =>
      stateService.setError(error instanceof Error ? error.message : error),
    { immediate: true }
  )

  return {
    // State from services
    state: computed(() => ({
      isInitialized: instanceService.isReady.value,
      isConnected: connectionService.state.value.isConnected,
      isConnecting: connectionService.state.value.isConnecting,
      session: connectionService.state.value.session,
      accounts: connectionService.state.value.accounts,
      chainId: connectionService.state.value.chainId,
      fingerprint: userService.state.value.fingerprint,
      address: userService.state.value.address,
      error: connectionService.state.value.error || instanceService.error.value,
    })),

    isInitialized: computed(() => instanceService.isReady.value),
    isConnected: computed(() => connectionService.state.value.isConnected),
    isConnecting: computed(() => connectionService.state.value.isConnecting),
    session: computed(() => connectionService.state.value.session),
    accounts: computed(() => connectionService.state.value.accounts),
    chainId: computed(() => connectionService.state.value.chainId),
    address: computed(() => userService.state.value.address),
    error: computed(() => connectionService.state.value.error || instanceService.error.value),

    // Actions using real services
    initialize: async () => {
      console.log('🔧 Initializing WalletConnect...')
      try {
        await instanceService.initialize()
        console.log('✅ WalletConnect initialized successfully')
      } catch (error) {
        console.error('❌ WalletConnect initialization failed:', error)
        throw error
      }
    },

    openModal: async () => {
      console.log('🔗 Opening WalletConnect modal...')
      try {
        // Ensure instance is initialized first
        if (!instanceService.isReady.value) {
          await instanceService.initialize()
        }

        // Reset connection state before opening modal
        connectionService.resetConnectionState()

        // Open the native WalletConnect modal
        const session = await connectionService.openModal()

        return {
          success: true,
          session,
          error: null,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Modal opening failed'
        console.error('❌ WalletConnect modal opening failed:', errorMessage)

        // Reset connection state on error
        connectionService.resetConnectionState()

        return {
          success: false,
          session: null,
          error: errorMessage,
        }
      }
    },

    connect: async (session: WalletConnectSession) => {
      console.log('🔗 Completing WalletConnect connection...')
      try {
        // Complete the connection using the session from the modal
        await connectionService.connect(session)

        // Fetch user data after connection
        await userService.fetchUserData()

        return {
          success: true,
          session: connectionService.state.value.session,
          error: null,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Connection failed'
        console.error('❌ WalletConnect connection failed:', errorMessage)
        return {
          success: false,
          session: null,
          error: errorMessage,
        }
      }
    },

    disconnect: async () => {
      console.log('🔌 Disconnecting WalletConnect...')
      try {
        await connectionService.disconnect()
        return { success: true, error: null }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Disconnect failed'
        return { success: false, error: errorMessage }
      }
    },

    logout: async () => {
      console.log('🚪 Logging out...')
      try {
        await logoutService.logout()
      } catch (error) {
        console.error('❌ Logout failed:', error)
      }
    },

    restoreSessions: async () => {
      console.log('🔄 Restoring sessions...')
      try {
        await connectionService.restoreSessions()
        // Refresh balance after session restoration
        await walletService.refreshBalance()
      } catch (error) {
        console.error('❌ Session restoration failed:', error)
      }
    },

    // Data Services
    instance: instanceService,
    connection: connectionService,
    user: userService,
    wallet: walletService,

    // Additional properties expected by useWallet
    fingerprint: computed(() => userService.state.value.fingerprint),
    balance: computed(() => walletService.balance.data.value),
    walletInfo: computed(() => ({
      fingerprint: userService.state.value.fingerprint,
      chainId: connectionService.state.value.chainId,
      network: connectionService.state.value.chainId?.includes('mainnet') ? 'mainnet' : 'testnet',
      accounts: connectionService.state.value.accounts,
      session: connectionService.state.value.session,
    })),
    fetchBalance: async () => {
      try {
        // For XCH balance, don't send type parameter as Sage doesn't support 'xch' type
        await walletService.getBalance({})
      } catch (error) {
        console.error('❌ Failed to fetch balance:', error)
      }
    },
    initialization: {
      mutateAsync: instanceService.initialize,
      isPending: instanceService.isInitializing,
    },
  }
}
