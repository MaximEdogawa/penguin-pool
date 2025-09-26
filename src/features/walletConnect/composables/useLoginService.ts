import { useUserStore } from '@/entities/user/store/userStore'
import { useConnectionDataService } from '@/features/walletConnect/services/ConnectionDataService'
import { useWalletConnectService } from '@/features/walletConnect/services/WalletConnectService'
import type { WalletInfo } from '@/features/walletConnect/types/walletInfo.types'
import { isIOS } from '@/shared/config/environment'
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
  const isIOSDevice = computed(() => isIOS())
  const walletService = useWalletConnectService()
  const connectionStatus = ref<LoginStatus>({
    message: '',
    type: 'info',
    icon: 'pi pi-info-circle',
  })

  const isConnecting = computed(() => {
    try {
      return walletService?.state?.value?.isConnecting || false
    } catch (error) {
      console.error('Error getting connection status:', error)
      return false
    }
  })

  const setupGlobalErrorHandlers = () => {
    try {
      window.addEventListener('error', event => {
        console.error('Global error caught:', event.error)
        event.preventDefault()
        return false
      })

      window.addEventListener('unhandledrejection', event => {
        console.error('Unhandled promise rejection caught:', event.reason)
        event.preventDefault()
      })
    } catch (error) {
      console.error('Failed to setup global error handlers:', error)
    }
  }

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

  const loginWithWalletInfo = async (walletInfo: WalletInfo) => {
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

  const connectWalletWithiOSFlow = async () => {
    try {
      updateConnectionStatus('Opening iOS wallet connection...', 'info')

      if (!walletService.generateURI) {
        throw new Error('Wallet service generateURI method not available')
      }

      const uri = await walletService.generateURI()

      if (!uri) {
        throw new Error('Failed to generate URI for iOS modal')
      }

      window.dispatchEvent(new CustomEvent('show_ios_modal', { detail: { uri } }))
      updateConnectionStatus('iOS modal opened - scan QR code and approve in wallet', 'info')

      const checkConnection = setInterval(async () => {
        const isConnected = walletService.state?.value?.isConnected
        if (isConnected) {
          clearInterval(checkConnection)
          updateConnectionStatus('Wallet connected! Click Continue to proceed', 'success')

          window.dispatchEvent(
            new CustomEvent('ios_wallet_connected', {
              detail: {
                walletInfo: walletService.walletInfo.value,
                connectionState: walletService.state.value,
              },
            })
          )
        }
      }, 1000)

      setTimeout(() => {
        clearInterval(checkConnection)
      }, 300000)
    } catch (error) {
      console.error('iOS wallet connection error:', error)
      updateConnectionStatus(
        'Failed to connect iOS wallet: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      )
    }
  }

  const connectWalletWithStandardFlow = async () => {
    try {
      updateConnectionStatus('Opening wallet connection...', 'info')

      if (!walletService.openModal) {
        throw new Error('Wallet service openModal method not available')
      }

      const result = await walletService.openModal()

      if (!result) {
        throw new Error('No result from wallet service')
      }

      if (result.success && result.session) {
        if (!walletService.connect) {
          throw new Error('Wallet service connect method not available')
        }

        const connectResult = await walletService.connect(result.session)

        if (!connectResult) {
          throw new Error('No connection result from wallet service')
        }

        if (connectResult.success) {
          await new Promise(resolve => setTimeout(resolve, 500))
          const walletInfo = walletService.walletInfo
          const connectionState = walletService.state.value

          const finalWalletInfo: WalletInfo = {
            ...walletInfo.value,
            fingerprint: walletInfo.value.fingerprint || connectionState.accounts[0] || null,
          }

          if (!finalWalletInfo) {
            throw new Error('No wallet info available')
          }

          await loginWithWalletInfo(finalWalletInfo)
        } else {
          throw new Error(connectResult.error || 'Connection failed')
        }
      } else {
        if (result.error === 'Modal closed without connection') {
          updateConnectionStatus('Connection cancelled', 'info')
        } else {
          throw new Error(result.error || 'Modal opening failed')
        }
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      updateConnectionStatus(
        'Failed to connect wallet: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      )
    }
  }

  const handleIOSContinue = async () => {
    try {
      const walletInfo = walletService.walletInfo
      const connectionState = walletService.state.value

      const finalWalletInfo: WalletInfo = {
        ...walletInfo.value,
        fingerprint: walletInfo.value.fingerprint || connectionState.accounts[0] || null,
      }

      if (!finalWalletInfo.fingerprint) {
        throw new Error('No wallet fingerprint found')
      }

      await loginWithWalletInfo(finalWalletInfo)
    } catch (error) {
      console.error('iOS continue error:', error)
      updateConnectionStatus(
        'Failed to proceed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      )
    }
  }

  const handleIOSModalContinue = () => {
    handleIOSContinue()
  }

  onMounted(() => {
    window.addEventListener('ios_modal_continue', handleIOSModalContinue as EventListener)
  })

  onUnmounted(() => {
    window.removeEventListener('ios_modal_continue', handleIOSModalContinue as EventListener)
  })

  const connectWallet = async () => {
    try {
      if (!walletService) {
        throw new Error('Wallet service not properly initialized')
      }

      if (isIOSDevice.value) {
        await connectWalletWithiOSFlow()
      } else {
        await connectWalletWithStandardFlow()
      }
    } catch (error) {
      console.error('Wallet connection error:', error)
      updateConnectionStatus(
        'Failed to connect wallet: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'error'
      )
    }
  }

  const initializeWalletConnection = async () => {
    try {
      setupGlobalErrorHandlers()

      if (!walletService || !connectionService) {
        console.error('Wallet services not properly initialized')
        return
      }

      const isConnected = walletService.state?.value?.isConnected
      if (isConnected === undefined) {
        console.error('Unable to determine connection status')
        return
      }

      if (isConnected) {
        await new Promise(resolve => setTimeout(resolve, 500))

        const walletInfo = walletService.walletInfo
        const connectionState = walletService.state.value

        if (!walletInfo) {
          console.error('No wallet info available during initialization')
          return
        }

        const finalWalletInfo: WalletInfo = {
          ...walletInfo.value,
          fingerprint: walletInfo.value.fingerprint || connectionState.accounts[0] || null,
        }
        if (finalWalletInfo.fingerprint) {
          await loginWithWalletInfo(finalWalletInfo)
        } else {
          console.error('No wallet fingerprint found during initialization')
        }
      }
    } catch (error) {
      console.error('Failed to initialize Wallet Connect:', error)
    }
  }

  return {
    connectionStatus,
    isConnecting,
    isIOSDevice,
    connectWallet,
    handleIOSContinue,
    initializeWalletConnection,
    updateConnectionStatus,
    walletService,
    connectionService,
  }
}
