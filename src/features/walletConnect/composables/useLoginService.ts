import { useUserStore } from '@/entities/user/store/userStore'
import { useConnectionDataService } from '@/features/walletConnect/services/ConnectionDataService'
import { useIOSWalletConnectService } from '@/features/walletConnect/services/IOSWalletConnectService'
import { useWalletConnectService } from '@/features/walletConnect/services/WalletConnectService'
import { isIOS } from '@/shared/config/environment'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

export interface LoginStatus {
  message: string
  type: 'info' | 'success' | 'error'
  icon: string
}

export function useLoginService() {
  const router = useRouter()
  const userStore = useUserStore()
  const connectionService = useConnectionDataService()

  // Decision point: Choose service based on platform
  const isIOSDevice = computed(() => isIOS())
  const standardWalletService = useWalletConnectService()
  const iosWalletService = useIOSWalletConnectService()

  // State
  const connectionStatus = ref<LoginStatus>({
    message: '',
    type: 'info',
    icon: 'pi pi-info-circle',
  })

  // Computed
  const isConnecting = computed(() => {
    try {
      if (isIOSDevice.value) {
        return iosWalletService?.state?.value?.isConnecting || false
      } else {
        return connectionService?.state?.value?.isConnecting || false
      }
    } catch (error) {
      console.error('Error getting connection status:', error)
      return false
    }
  })

  // Global error handler to prevent page refreshes
  const setupGlobalErrorHandlers = () => {
    try {
      // Prevent unhandled errors from causing page refreshes
      window.addEventListener('error', event => {
        console.error('Global error caught:', event.error)
        event.preventDefault()
        return false
      })

      // Prevent unhandled promise rejections from causing page refreshes
      window.addEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection caught:', event.reason)
        event.preventDefault()
      })
    } catch (error) {
      console.error('Failed to setup global error handlers:', error)
    }
  }

  // Update connection status
  const updateConnectionStatus = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    connectionStatus.value = {
      message,
      type,
      icon:
        type === 'error'
          ? 'pi pi-exclamation-triangle'
          : type === 'success'
            ? 'pi pi-check-circle'
            : 'pi pi-info-circle',
    }
  }

  // Handle successful wallet connection and login
  const handleSuccessfulConnection = async (walletInfo: { fingerprint: string | null }) => {
    try {
      if (walletInfo.fingerprint) {
        await userStore.login(walletInfo.fingerprint, 'wallet-user')
        await new Promise(resolve => setTimeout(resolve, 1000))
        await router.push('/dashboard')
      } else {
        throw new Error('No wallet fingerprint found')
      }
    } catch (error) {
      console.error('Login failed:', error)
      updateConnectionStatus(
        'Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      )
    }
  }

  // iOS connection handler
  const handleIOSConnection = async () => {
    try {
      console.log('🍎 Using iOS-specific wallet connection flow')
      updateConnectionStatus('Opening iOS wallet connection...', 'info')

      // Safety check for iOS service methods
      if (!iosWalletService.openModal) {
        throw new Error('iOS wallet service openModal method not available')
      }

      // iOS flow: Open modal and handle connection internally
      await iosWalletService.openModal()

      // iOS service handles connection internally and dispatches events
      // Listen for iOS connection events
      const handleIOSConnected: EventListener = (event: Event) => {
        try {
          const customEvent = event as CustomEvent
          console.log('🍎 iOS wallet connected event received:', customEvent.detail)

          // Safety check for event detail
          if (!event || !customEvent.detail) {
            console.error('🍎 Invalid iOS connection event:', event)
            return
          }

          const session = customEvent.detail.session
          if (session) {
            // Get wallet information from iOS service
            const walletInfo = iosWalletService.walletInfo?.value

            // Safety check for wallet info
            if (!walletInfo) {
              console.error('🍎 No wallet info available from iOS service')
              return
            }

            if (walletInfo.fingerprint) {
              handleSuccessfulConnection(walletInfo)
            } else {
              console.error('🍎 No wallet fingerprint found in wallet info:', walletInfo)
              updateConnectionStatus('No wallet fingerprint found', 'error')
            }
          } else {
            console.error('🍎 No session in iOS connection event:', customEvent.detail)
          }
        } catch (error) {
          console.error('🍎 Error in iOS connection handler:', error)
          updateConnectionStatus(
            'Connection handler error: ' +
              (error instanceof Error ? error.message : 'Unknown error'),
            'error'
          )
        }
      }

      window.addEventListener('ios_wallet_connected', handleIOSConnected)

      // Clean up listener after 30 seconds
      setTimeout(() => {
        window.removeEventListener('ios_wallet_connected', handleIOSConnected)
      }, 30000)
    } catch (error) {
      console.error('iOS wallet connection error:', error)
      updateConnectionStatus(
        'Failed to connect iOS wallet: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      )
    }
  }

  // Standard connection handler
  const handleStandardConnection = async () => {
    try {
      console.log('🖥️ Using standard wallet connection flow')
      updateConnectionStatus('Opening wallet connection...', 'info')

      // Safety check for standard service methods
      if (!standardWalletService.openModal) {
        throw new Error('Standard wallet service openModal method not available')
      }

      // Standard flow: Open modal and handle connection
      const result = await standardWalletService.openModal()

      // Safety check for result
      if (!result) {
        throw new Error('No result from wallet service')
      }

      if (result.success && result.session) {
        // Safety check for connect method
        if (!standardWalletService.connect) {
          throw new Error('Standard wallet service connect method not available')
        }

        // Connect using the session from the modal
        const connectResult = await standardWalletService.connect(result.session)

        // Safety check for connect result
        if (!connectResult) {
          throw new Error('No connection result from wallet service')
        }

        if (connectResult.success) {
          // Get wallet information
          const walletInfo = standardWalletService.walletInfo

          // Safety check for wallet info
          if (!walletInfo || !walletInfo.value) {
            throw new Error('No wallet info available')
          }

          await handleSuccessfulConnection(walletInfo.value)
        } else {
          throw new Error(connectResult.error || 'Connection failed')
        }
      } else {
        // Handle modal close without connection
        if (result.error === 'Modal closed without connection') {
          updateConnectionStatus('Connection cancelled', 'info')
        } else {
          throw new Error(result.error || 'Modal opening failed')
        }
      }
    } catch (error) {
      console.error('Standard wallet connection error:', error)
      updateConnectionStatus(
        'Failed to connect wallet: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      )
    }
  }

  // Main wallet connection handler
  const connectWallet = async () => {
    try {
      // Safety check for services
      if (!iosWalletService || !standardWalletService) {
        throw new Error('Wallet services not properly initialized')
      }

      if (isIOSDevice.value) {
        await handleIOSConnection()
      } else {
        await handleStandardConnection()
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      updateConnectionStatus(
        'Failed to connect wallet: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      )
    }
  }

  // Initialize login service
  const initializeLogin = async () => {
    try {
      // Setup global error handlers
      setupGlobalErrorHandlers()

      // Safety check for services
      if (!iosWalletService || !standardWalletService || !connectionService) {
        console.error('Wallet services not properly initialized')
        return
      }

      // Check connection status using appropriate service
      const isConnected = isIOSDevice.value
        ? iosWalletService.state?.value?.isConnected
        : connectionService.state?.value?.isConnected

      // Safety check for connection status
      if (isConnected === undefined) {
        console.error('Unable to determine connection status')
        return
      }

      if (isConnected) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const walletInfo = isIOSDevice.value
          ? iosWalletService.walletInfo
          : standardWalletService.walletInfo

        // Safety check for wallet info
        if (!walletInfo || !walletInfo.value) {
          console.error('No wallet info available during initialization')
          return
        }

        if (walletInfo.value.fingerprint) {
          await handleSuccessfulConnection(walletInfo.value)
        } else {
          console.error('No wallet fingerprint found during initialization')
        }
      }
    } catch (error) {
      console.error('Failed to initialize Wallet Connect:', error)
      // Don't throw the error to prevent page refresh
    }
  }

  return {
    // State
    connectionStatus,
    isConnecting,
    isIOSDevice,

    // Methods
    connectWallet,
    initializeLogin,
    updateConnectionStatus,

    // Services (for advanced usage)
    standardWalletService,
    iosWalletService,
    connectionService,
  }
}
