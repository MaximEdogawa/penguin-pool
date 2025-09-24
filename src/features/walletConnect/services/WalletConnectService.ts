import { computed, watch } from 'vue'
import type { WalletConnectSession } from '../types/walletConnect.types'
import { useConnectionDataService } from './ConnectionDataService'
import { useInstanceDataService } from './InstanceDataService'
import { useLogoutService } from './LogoutService'
import { useUserDataService } from './UserDataService'
import { useWalletDataService } from './WalletDataService'
import { useWalletStateService } from './WalletStateService'

// Simple iOS detection
const detectIOS = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase()
  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function useWalletConnectService() {
  // Initialize the lightweight state service
  const stateService = useWalletStateService()

  // Initialize all the real services
  const instanceService = useInstanceDataService()
  const connectionService = useConnectionDataService()
  const userService = useUserDataService()
  const walletService = useWalletDataService()
  const logoutService = useLogoutService()

  // Computed state from services
  const isIOS = computed(() => detectIOS())

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
      isIOS: isIOS.value,
    })),

    isInitialized: computed(() => instanceService.isReady.value),
    isConnected: computed(() => connectionService.state.value.isConnected),
    isConnecting: computed(() => connectionService.state.value.isConnecting),
    session: computed(() => connectionService.state.value.session),
    accounts: computed(() => connectionService.state.value.accounts),
    chainId: computed(() => connectionService.state.value.chainId),
    address: computed(() => userService.state.value.address),
    error: computed(() => connectionService.state.value.error || instanceService.error.value),
    isIOS,

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
    refreshSession: async () => {
      try {
        await connectionService.restoreSessions()
      } catch (error) {
        console.error('❌ Failed to refresh session:', error)
      }
    },
    initialization: {
      mutateAsync: instanceService.initialize,
      isPending: instanceService.isInitializing,
    },

    // iOS-specific methods
    getModalOptions: (baseOptions: Record<string, unknown>) => {
      if (!isIOS.value) return baseOptions

      const themeVariables = (baseOptions.themeVariables as Record<string, unknown>) || {}
      return {
        ...baseOptions,
        enableExplorer: false,
        themeVariables: {
          ...themeVariables,
          '--wcm-z-index': '1000',
          '--wcm-background-color': '#ffffff',
          '--wcm-accent-color': '#3b82f6',
          '--wcm-accent-fill-color': '#ffffff',
          '--wcm-overlay-background-color': 'rgba(0, 0, 0, 0.5)',
        },
      }
    },

    getConnectionTimeout: (defaultTimeout: number) => {
      return isIOS.value ? defaultTimeout * 2 : defaultTimeout
    },

    getIOSErrorMessage: (originalError: string) => {
      if (!isIOS.value) return originalError

      if (originalError.includes('timeout')) {
        return 'Connection timed out. Please try again and make sure Sage Wallet is open.'
      }
      if (originalError.includes('rejected')) {
        return 'Connection was rejected. Please try again in Sage Wallet.'
      }
      if (originalError.includes('network')) {
        return 'Network error. Please check your internet connection and try again.'
      }

      return originalError
    },

    getIOSInstructions: () => {
      return [
        'Copy the connection string above',
        'Open Sage Wallet app on your device',
        'Tap "Connect" or "Scan QR" in the app',
        'Paste the connection string and approve the connection',
      ]
    },
  }
}
