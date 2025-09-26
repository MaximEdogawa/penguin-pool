import { isIOS } from '@/shared/config/environment'
import { computed } from 'vue'
import type { WalletConnectSession } from '../types/walletConnect.types'
import type { WalletInfo } from '../types/walletInfo.types'
import { useConnectionDataService } from './ConnectionDataService'
import { useInstanceDataService } from './InstanceDataService'
import { useLogoutService } from './LogoutService'
import { useUserDataService } from './UserDataService'
import { useWalletDataService } from './WalletDataService'

export interface WalletConnectState {
  isInitialized: boolean
  isConnected: boolean
  isConnecting: boolean
  session: WalletConnectSession | null
  accounts: string[]
  chainId: string | null
  fingerprint: string | null
  address: string | null
  error: string | null
}

export interface WalletConnectResult {
  success: boolean
  session?: WalletConnectSession | null
  error?: string | null
}

export function useWalletConnectService() {
  // Initialize all the real services
  const instanceService = useInstanceDataService()
  const connectionService = useConnectionDataService()
  const userService = useUserDataService()
  const walletService = useWalletDataService()
  const logoutService = useLogoutService()

  // Single source of truth for state
  const state = computed<WalletConnectState>(() => ({
    isInitialized: instanceService.isReady.value,
    isConnected: connectionService.state.value.isConnected,
    isConnecting: connectionService.state.value.isConnecting,
    session: connectionService.state.value.session,
    accounts: connectionService.state.value.accounts,
    chainId: connectionService.state.value.chainId,
    fingerprint: userService.state.value.fingerprint,
    address: userService.state.value.address,
    error:
      connectionService.state.value.error ||
      (instanceService.error.value instanceof Error
        ? instanceService.error.value.message
        : instanceService.error.value),
  }))

  // Core wallet operations
  const initialize = async (): Promise<void> => {
    console.log('🔧 Initializing WalletConnect...')
    try {
      await instanceService.initialize()
      console.log('✅ WalletConnect initialized successfully')
    } catch (error) {
      console.error('❌ WalletConnect initialization failed:', error)
      throw error
    }
  }

  const openModal = async (): Promise<WalletConnectResult> => {
    try {
      if (!instanceService.isReady.value) {
        await instanceService.initialize()
      }

      connectionService.resetConnectionState()

      const session = await connectionService.openModal()
      return {
        success: true,
        session,
        error: null,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Modal opening failed'
      console.error('WalletConnect modal opening failed:', errorMessage)
      connectionService.resetConnectionState()
      return {
        success: false,
        session: null,
        error: errorMessage,
      }
    }
  }

  const generateURI = async (): Promise<string> => {
    try {
      if (!instanceService.isReady.value) {
        await instanceService.initialize()
      }

      return await connectionService.generateURI()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'URI generation failed'
      console.error('WalletConnect URI generation failed:', errorMessage)
      throw error
    }
  }

  const connect = async (session: WalletConnectSession | null): Promise<WalletConnectResult> => {
    try {
      if (isIOS() && !session) {
        const signClient = instanceService.getSignClient.value
        if (!signClient) throw new Error('SignClient not available')

        const sessions = signClient.session.getAll()
        if (sessions.length > 0) {
          const latestSession = sessions[sessions.length - 1]
          await connectionService.connect(latestSession as unknown as WalletConnectSession)
          await userService.fetchUserData()
          return {
            success: true,
            session: latestSession as unknown as WalletConnectSession,
            error: null,
          }
        } else {
          throw new Error('No session available for iOS connection')
        }
      } else {
        if (!session) throw new Error('No session provided for connection')
        await connectionService.connect(session)
        await userService.fetchUserData()
        return {
          success: true,
          session: connectionService.state.value.session,
          error: null,
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      console.error('WalletConnect connection failed:', errorMessage)
      return {
        success: false,
        session: null,
        error: errorMessage,
      }
    }
  }

  const disconnect = async (): Promise<{ success: boolean; error: string | null }> => {
    console.log('🔌 Disconnecting WalletConnect...')
    try {
      await connectionService.disconnect()
      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect failed'
      return { success: false, error: errorMessage }
    }
  }

  const logout = async (): Promise<void> => {
    console.log('🚪 Logging out...')
    try {
      await logoutService.logout()
    } catch (error) {
      console.error('❌ Logout failed:', error)
    }
  }

  const restoreSessions = async (): Promise<void> => {
    console.log('🔄 Restoring sessions...')
    try {
      await connectionService.restoreSessions()
      // Refresh balance after session restoration
      await walletService.refreshBalance()
    } catch (error) {
      console.error('❌ Session restoration failed:', error)
    }
  }

  // Wallet info for external consumption
  const walletInfo = computed(
    (): WalletInfo => ({
      fingerprint: userService.state.value.fingerprint,
      chainId: connectionService.state.value.chainId,
      network: connectionService.state.value.chainId?.includes('mainnet') ? 'mainnet' : 'testnet',
      accounts: connectionService.state.value.accounts,
      session: connectionService.state.value.session,
      balance: walletService.balance.data.value,
      address: userService.state.value.address,
    })
  )

  // Balance operations
  const balance = computed(() => walletService.balance.data.value)

  const fetchBalance = async (): Promise<void> => {
    try {
      // For XCH balance, don't send type parameter as Sage doesn't support 'xch' type
      await walletService.getBalance({})
    } catch (error) {
      console.error('❌ Failed to fetch balance:', error)
    }
  }

  // Return only what's needed - clean, focused API
  return {
    // State
    state,
    walletInfo,
    balance,

    // Actions
    initialize,
    openModal,
    generateURI,
    connect,
    disconnect,
    logout,
    restoreSessions,
    fetchBalance,
  }
}
