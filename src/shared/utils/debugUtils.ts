import type { QueryClient } from '@tanstack/vue-query'
import { environment } from '../config/environment'

/**
 * Debug utilities for production debugging
 * Only active when debug flags are enabled
 */

export class DebugUtils {
  private static instance: DebugUtils
  private isEnabled: boolean

  constructor() {
    this.isEnabled =
      environment.debug.enabled || environment.debug.tanstackDebug || environment.isDevelopment
  }

  static getInstance(): DebugUtils {
    if (!DebugUtils.instance) {
      DebugUtils.instance = new DebugUtils()
    }
    return DebugUtils.instance
  }

  /**
   * Log debug information only when debugging is enabled
   */
  log(message: string, ...args: unknown[]): void {
    if (this.isEnabled) {
      console.log(`🔍 [DEBUG] ${message}`, ...args)
    }
  }

  /**
   * Log query information
   */
  logQuery(queryKey: string[], status: string, data?: unknown, error?: unknown): void {
    if (this.isEnabled) {
      console.log(`🔄 [QUERY] [${queryKey.join(',')}] ${status}`, {
        data,
        error,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Log mutation information
   */
  logMutation(mutationKey: string[], status: string, data?: unknown, error?: unknown): void {
    if (this.isEnabled) {
      console.log(`🔄 [MUTATION] [${mutationKey.join(',')}] ${status}`, {
        data,
        error,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Log wallet connection events
   */
  logWalletEvent(event: string, data?: unknown): void {
    if (this.isEnabled) {
      console.log(`🔗 [WALLET] ${event}`, data)
    }
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, details?: unknown): void {
    if (this.isEnabled) {
      console.log(`⏱️ [PERF] ${operation} took ${duration}ms`, details)
    }
  }

  /**
   * Get debug information about the current state
   */
  getDebugInfo(): Record<string, unknown> {
    if (!this.isEnabled) return {}

    return {
      environment: {
        isDevelopment: environment.isDevelopment,
        isProduction: environment.isProduction,
        debugEnabled: environment.debug.enabled,
        tanstackDebug: environment.debug.tanstackDebug,
        vueDevtools: environment.debug.vueDevtools,
      },
      queryClient:
        typeof window !== 'undefined'
          ? (window as unknown as Record<string, unknown>).__QUERY_CLIENT__
          : null,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Export debug information to console
   */
  exportDebugInfo(): void {
    if (this.isEnabled) {
      console.log('🔍 Debug Information:', this.getDebugInfo())
    }
  }
}

// Export singleton instance
export const debugUtils = DebugUtils.getInstance()

// Global debug functions for easy access
export const debugLog = (message: string, ...args: unknown[]) => debugUtils.log(message, ...args)
export const debugQuery = (queryKey: string[], status: string, data?: unknown, error?: unknown) =>
  debugUtils.logQuery(queryKey, status, data, error)
export const debugMutation = (
  mutationKey: string[],
  status: string,
  data?: unknown,
  error?: unknown
) => debugUtils.logMutation(mutationKey, status, data, error)
export const debugWallet = (event: string, data?: unknown) => debugUtils.logWalletEvent(event, data)
export const debugPerformance = (operation: string, duration: number, details?: unknown) =>
  debugUtils.logPerformance(operation, duration, details)

// Expose debug utilities to window for console access
if (typeof window !== 'undefined') {
  const win = window as unknown as Record<string, unknown>
  win.__DEBUG_UTILS__ = debugUtils
  win.__DEBUG_LOG__ = debugLog
  win.__DEBUG_QUERY__ = debugQuery
  win.__DEBUG_MUTATION__ = debugMutation
  win.__DEBUG_WALLET__ = debugWallet
  win.__DEBUG_PERF__ = debugPerformance

  // Add helper function to manually refresh balance
  win.__MANUAL_BALANCE_REFRESH__ = async () => {
    const queryClient = win.__QUERY_CLIENT__ as QueryClient
    if (queryClient) {
      console.log('🔄 Manually refreshing balance...')
      await queryClient.invalidateQueries({ queryKey: ['walletConnect', 'balance'] })
    } else {
      console.error('❌ QueryClient not available')
    }
  }

  // Add helper function to test balance request directly
  win.__TEST_BALANCE_REQUEST__ = async () => {
    const isProduction = import.meta.env.PROD
    console.log(
      `🧪 Testing balance request directly in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}...`
    )
    try {
      // Import the function dynamically to avoid circular dependencies
      const { getAssetBalance } = await import(
        '@/features/walletConnect/repositories/walletQueries.repository'
      )
      const { useWalletStateService } = await import(
        '@/features/walletConnect/services/WalletStateDataService'
      )
      const { useInstanceDataService } = await import(
        '@/features/walletConnect/services/InstanceDataService'
      )

      const walletStateService = useWalletStateService()
      const instanceService = useInstanceDataService()

      console.log('🧪 Environment info:', {
        isProduction,
        isDevelopment: import.meta.env.DEV,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      })
      console.log('🧪 Wallet state:', walletStateService.walletState.value)
      console.log('🧪 Instance ready:', instanceService.isReady.value)

      const result = await getAssetBalance(
        walletStateService.walletState,
        instanceService,
        null,
        null
      )
      console.log(
        `🧪 Balance request result in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}:`,
        result
      )
      return result
    } catch (error) {
      console.error(
        `🧪 Balance request test failed in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}:`,
        error
      )
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Add helper function to test alternative methods
  win.__TEST_ALTERNATIVE_METHODS__ = async () => {
    console.log('🧪 Testing alternative wallet methods...')
    try {
      const { makeWalletRequest } = await import(
        '@/features/walletConnect/repositories/walletQueries.repository'
      )
      const { SageMethods } = await import('@/features/walletConnect/constants/sage-methods')
      const { useConnectionDataService } = await import(
        '@/features/walletConnect/services/ConnectionDataService'
      )
      const { useInstanceDataService } = await import(
        '@/features/walletConnect/services/InstanceDataService'
      )

      const connectionService = useConnectionDataService()
      const instanceService = useInstanceDataService()

      console.log('🧪 Testing chip0002_getAssetCoins...')
      const coinsResult = await makeWalletRequest(
        SageMethods.CHIP0002_GET_ASSET_COINS,
        { type: null, assetId: null },
        connectionService,
        instanceService
      )
      console.log('🧪 getAssetCoins result:', coinsResult)

      return { coinsResult }
    } catch (error) {
      console.error('🧪 Alternative methods test failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
