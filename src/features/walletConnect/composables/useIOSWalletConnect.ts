import { isIOS } from '@/shared/config/environment'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useIOSWalletConnectService } from '../services/IOSWalletConnectService'
import { useUserDataService } from '../services/UserDataService'

/**
 * iOS-specific WalletConnect composable
 *
 * This composable provides enhanced WalletConnect functionality specifically
 * optimized for iOS devices, including:
 * - Enhanced WebSocket handling
 * - Connection healing and retry logic
 * - iOS-specific timeouts and error handling
 * - Automatic reconnection
 */
export function useIOSWalletConnect() {
  const iosService = useIOSWalletConnectService()
  const userService = useUserDataService()

  // Local state for UI
  const isInitializing = ref(false)
  const lastError = ref<string | null>(null)

  // Computed properties
  const isIOSDevice = computed(() => isIOS())
  const isConnected = computed(() => iosService.state.value.isConnected)
  const isConnecting = computed(() => iosService.state.value.isConnecting)
  const isFullyReady = computed(() => iosService.state.value.isFullyReady)
  const session = computed(() => iosService.state.value.session)
  const accounts = computed(() => iosService.state.value.accounts)
  const chainId = computed(() => iosService.state.value.chainId)
  const error = computed(() => iosService.state.value.error || lastError.value)
  const isHealing = computed(() => iosService.state.value.isHealing)
  const websocketStatus = computed(() => iosService.state.value.websocketStatus)
  const connectionAttempts = computed(() => iosService.state.value.connectionAttempts)

  // Connection status helpers
  const canConnect = computed(() => {
    return (
      isIOSDevice.value &&
      !isConnected.value &&
      !isConnecting.value &&
      !isInitializing.value &&
      !isHealing.value
    )
  })

  const canDisconnect = computed(() => {
    return isConnected.value && !isConnecting.value
  })

  const connectionStatus = computed(() => {
    if (isHealing.value) return 'healing'
    if (isConnecting.value) return 'connecting'
    if (isConnected.value && isFullyReady.value) return 'connected'
    if (isConnected.value && !isFullyReady.value) return 'initializing'
    if (error.value) return 'error'
    return 'disconnected'
  })

  // Auto-initialize on mount for iOS devices
  onMounted(async () => {
    if (isIOSDevice.value) {
      await initialize()
    }
  })

  // Initialize the iOS WalletConnect service
  const initialize = async () => {
    if (!isIOSDevice.value || isInitializing.value) return

    console.log('🍎 Initializing iOS WalletConnect service...')
    isInitializing.value = true
    lastError.value = null

    try {
      // Try to restore existing sessions first
      await iosService.restoreSessions()

      if (!isConnected.value) {
        console.log('🍎 No existing sessions found, ready for new connection')
      } else {
        console.log('🍎 Existing session restored successfully')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initialization failed'
      console.error('🍎 iOS WalletConnect initialization failed:', errorMessage)
      lastError.value = errorMessage
    } finally {
      isInitializing.value = false
    }
  }

  // Connect to wallet with iOS-specific handling
  const connect = async (): Promise<{ success: boolean; error?: string }> => {
    if (!canConnect.value) {
      return {
        success: false,
        error: 'Cannot connect in current state',
      }
    }

    console.log('🍎 Starting iOS wallet connection...')
    lastError.value = null

    try {
      // Open modal and get session
      const session = await iosService.openModal()

      // Complete the connection
      await iosService.connect(session)

      // Fetch user data after successful connection
      await userService.fetchUserData()

      console.log('🍎 iOS wallet connection completed successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      console.error('🍎 iOS wallet connection failed:', errorMessage)
      lastError.value = errorMessage

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  // Disconnect from wallet
  const disconnect = async (): Promise<{ success: boolean; error?: string }> => {
    if (!canDisconnect.value) {
      return {
        success: false,
        error: 'Cannot disconnect in current state',
      }
    }

    console.log('🍎 Disconnecting iOS wallet...')
    lastError.value = null

    try {
      await iosService.disconnect()
      console.log('🍎 iOS wallet disconnected successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnection failed'
      console.error('🍎 iOS wallet disconnection failed:', errorMessage)
      lastError.value = errorMessage

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  // Manual connection healing
  const healConnection = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isIOSDevice.value) {
      return {
        success: false,
        error: 'Healing only available on iOS devices',
      }
    }

    console.log('🍎 Manually triggering connection healing...')
    lastError.value = null

    try {
      await iosService.healConnection()
      console.log('🍎 Connection healing completed successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Healing failed'
      console.error('🍎 Connection healing failed:', errorMessage)
      lastError.value = errorMessage

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  // Clear error state
  const clearError = () => {
    lastError.value = null
    iosService.resetConnectionState()
  }

  // Watch for connection state changes
  watch(
    () => connectionStatus.value,
    (newStatus, oldStatus) => {
      console.log(`🍎 Connection status changed: ${oldStatus} -> ${newStatus}`)

      // Handle specific state transitions
      if (newStatus === 'error' && oldStatus === 'connected') {
        console.log('🍎 Connection lost, attempting automatic healing...')
        // Auto-healing is handled by the service
      }
    }
  )

  // Watch for WebSocket status changes
  watch(
    () => websocketStatus.value,
    (newStatus, oldStatus) => {
      console.log(`🍎 WebSocket status changed: ${oldStatus} -> ${newStatus}`)

      if (newStatus === 'error' && isConnected.value) {
        console.log('🍎 WebSocket error detected, connection may be unstable')
      }
    }
  )

  // Cleanup on unmount
  onUnmounted(() => {
    // Service cleanup is handled automatically
    console.log('🍎 iOS WalletConnect composable unmounted')
  })

  return {
    // State
    isIOSDevice,
    isConnected,
    isConnecting,
    isFullyReady,
    isInitializing,
    isHealing,
    session,
    accounts,
    chainId,
    error,
    websocketStatus,
    connectionAttempts,
    connectionStatus,

    // Computed helpers
    canConnect,
    canDisconnect,

    // Actions
    initialize,
    connect,
    disconnect,
    healConnection,
    clearError,

    // Service access (for advanced usage)
    service: iosService,
  }
}
