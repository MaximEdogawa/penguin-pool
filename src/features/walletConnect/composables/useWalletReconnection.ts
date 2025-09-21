import { isIOS } from '@/shared/config/environment'
import { computed, onUnmounted, readonly, ref } from 'vue'
import type { WalletConnectEvent } from '../types/walletConnect.types'

export interface ReconnectionConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  healthCheckInterval: number
  maxConsecutiveFailures: number
}

/**
 * Wallet Reconnection Composable
 *
 * This composable provides automatic reconnection functionality
 * using the unified WalletConnectService.
 */
export function useWalletReconnection() {
  // Service is available but not directly used in this composable

  // State
  const isReconnecting = ref(false)
  const retryCount = ref(0)
  const consecutiveFailures = ref(0)
  const lastReconnectionAttempt = ref<Date | null>(null)
  const healthCheckInterval = ref<NodeJS.Timeout | null>(null)
  const isHealthCheckActive = ref(false)

  // Configuration
  const config = ref<ReconnectionConfig>({
    maxRetries: isIOS() ? 8 : 5, // More retries for iOS
    baseDelay: isIOS() ? 2000 : 1500, // Longer base delay for iOS
    maxDelay: 30000, // Max 30 seconds
    backoffMultiplier: 1.5,
    healthCheckInterval: isIOS() ? 20000 : 15000, // More frequent checks for iOS
    maxConsecutiveFailures: 3,
  })

  // Computed
  const canRetry = computed(() => {
    return retryCount.value < config.value.maxRetries
  })

  const nextRetryDelay = computed(() => {
    const delay = Math.min(
      config.value.baseDelay * Math.pow(config.value.backoffMultiplier, retryCount.value),
      config.value.maxDelay
    )
    return delay
  })

  const shouldStartHealthCheck = computed(() => {
    return !isHealthCheckActive.value && retryCount.value > 0
  })

  // Reconnection methods
  async function attemptReconnection(
    reconnectFn: () => Promise<boolean>,
    onSuccess?: () => void,
    onFailure?: (error: Error) => void
  ): Promise<boolean> {
    if (isReconnecting.value) {
      console.log('🔄 Reconnection already in progress')
      return false
    }

    if (!canRetry.value) {
      console.log('❌ Max retries exceeded, stopping reconnection attempts')
      return false
    }

    try {
      isReconnecting.value = true
      lastReconnectionAttempt.value = new Date()

      console.log(
        `🔄 Attempting reconnection (${retryCount.value + 1}/${config.value.maxRetries})...`
      )

      const success = await reconnectFn()

      if (success) {
        console.log('✅ Reconnection successful')
        retryCount.value = 0
        consecutiveFailures.value = 0
        onSuccess?.()
        return true
      } else {
        throw new Error('Reconnection function returned false')
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown reconnection error')
      console.error('❌ Reconnection attempt failed:', err.message)

      consecutiveFailures.value += 1
      retryCount.value += 1

      onFailure?.(err)

      // If we haven't exceeded max retries, schedule next attempt
      if (canRetry.value) {
        const delay = nextRetryDelay.value
        console.log(`⏰ Scheduling next reconnection attempt in ${delay}ms...`)

        setTimeout(() => {
          attemptReconnection(reconnectFn, onSuccess, onFailure)
        }, delay)
      }

      return false
    } finally {
      isReconnecting.value = false
    }
  }

  // Health check methods
  function startHealthCheck(healthCheckFn: () => Promise<boolean>, onUnhealthy?: () => void): void {
    if (isHealthCheckActive.value) {
      console.log('⚠️ Health check already active')
      return
    }

    console.log('🏥 Starting connection health check...')
    isHealthCheckActive.value = true

    const performHealthCheck = async () => {
      if (!isHealthCheckActive.value) return

      try {
        const isHealthy = await healthCheckFn()

        if (isHealthy) {
          consecutiveFailures.value = 0
          console.log('✅ Connection health check passed')
        } else {
          consecutiveFailures.value += 1
          console.warn(
            `⚠️ Connection health check failed (${consecutiveFailures.value}/${config.value.maxConsecutiveFailures})`
          )

          if (consecutiveFailures.value >= config.value.maxConsecutiveFailures) {
            console.error('❌ Too many consecutive health check failures, triggering reconnection')
            onUnhealthy?.()
            stopHealthCheck()
          }
        }
      } catch (error) {
        console.error('❌ Health check error:', error)
        consecutiveFailures.value += 1

        if (consecutiveFailures.value >= config.value.maxConsecutiveFailures) {
          console.error('❌ Too many consecutive health check errors, triggering reconnection')
          onUnhealthy?.()
          stopHealthCheck()
        }
      }

      // Schedule next health check
      if (isHealthCheckActive.value) {
        healthCheckInterval.value = setTimeout(performHealthCheck, config.value.healthCheckInterval)
      }
    }

    // Start first health check
    healthCheckInterval.value = setTimeout(performHealthCheck, config.value.healthCheckInterval)
  }

  function stopHealthCheck(): void {
    if (healthCheckInterval.value) {
      clearTimeout(healthCheckInterval.value)
      healthCheckInterval.value = null
    }
    isHealthCheckActive.value = false
    console.log('🛑 Health check stopped')
  }

  // Event-based reconnection
  function setupEventBasedReconnection(
    walletConnect: {
      on: (event: string, callback: (event: WalletConnectEvent) => void) => void
      off: (event: string) => void
    },
    reconnectFn: () => Promise<boolean>
  ): () => void {
    const handleDisconnection = () => {
      console.log('🔌 Wallet disconnected, starting reconnection...')
      attemptReconnection(reconnectFn)
    }

    const handleReconnection = () => {
      console.log('🔌 Wallet reconnected, stopping reconnection attempts')
      stopReconnection()
    }

    // Listen for disconnection events
    walletConnect.on('session_disconnected', handleDisconnection)
    walletConnect.on('session_delete', handleDisconnection)
    walletConnect.on('session_expire', handleDisconnection)

    // Listen for reconnection events
    walletConnect.on('session_connected', handleReconnection)

    // Return cleanup function
    return () => {
      walletConnect.off('session_disconnected')
      walletConnect.off('session_delete')
      walletConnect.off('session_expire')
      walletConnect.off('session_connected')
    }
  }

  // Reset methods
  function resetRetryCount(): void {
    retryCount.value = 0
    consecutiveFailures.value = 0
  }

  function stopReconnection(): void {
    isReconnecting.value = false
    stopHealthCheck()
    console.log('🛑 Reconnection stopped')
  }

  function reset(): void {
    stopReconnection()
    retryCount.value = 0
    consecutiveFailures.value = 0
    lastReconnectionAttempt.value = null
  }

  // Update configuration
  function updateConfig(newConfig: Partial<ReconnectionConfig>): void {
    config.value = { ...config.value, ...newConfig }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    reset()
  })

  return {
    // State
    isReconnecting: readonly(isReconnecting),
    retryCount: readonly(retryCount),
    consecutiveFailures: readonly(consecutiveFailures),
    lastReconnectionAttempt: readonly(lastReconnectionAttempt),
    isHealthCheckActive: readonly(isHealthCheckActive),
    config: readonly(config),

    // Computed
    canRetry: readonly(canRetry),
    nextRetryDelay: readonly(nextRetryDelay),
    shouldStartHealthCheck: readonly(shouldStartHealthCheck),

    // Methods
    attemptReconnection,
    startHealthCheck,
    stopHealthCheck,
    setupEventBasedReconnection,
    resetRetryCount,
    stopReconnection,
    reset,
    updateConfig,
  }
}
