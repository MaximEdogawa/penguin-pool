import { computed, ref } from 'vue'
import { deepLinkingService } from '../services/DeepLinkingService'
import type { DeepLinkApp, DeepLinkResult } from '../types/deepLinking.types'

export function useDeepLinking() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<DeepLinkResult | null>(null)

  // Get all available apps
  const apps = computed(() => deepLinkingService.getApps())

  // Get apps supported on current platform
  const supportedApps = computed(() => deepLinkingService.getSupportedApps())

  // Get current platform
  const platform = computed(() => {
    if (typeof window === 'undefined') return 'web'

    const userAgent = window.navigator.userAgent.toLowerCase()

    if (/iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window)) {
      return 'ios'
    }

    if (/android/.test(userAgent)) {
      return 'android'
    }

    return 'web'
  })

  /**
   * Open an app with deep link
   */
  const openApp = async (
    appId: string,
    path?: string,
    params?: Record<string, string>
  ): Promise<DeepLinkResult> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await deepLinkingService.openApp(appId, path, params)
      lastResult.value = result

      if (!result.success) {
        error.value = result.error || 'Failed to open app'
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage

      const result: DeepLinkResult = {
        success: false,
        error: errorMessage,
      }
      lastResult.value = result
      return result
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Open app in new tab (for web platform)
   */
  const openInNewTab = (appId: string, path?: string, params?: Record<string, string>): boolean => {
    return deepLinkingService.openInNewTab(appId, path, params)
  }

  /**
   * Copy deep link to clipboard
   */
  const copyDeepLink = async (
    appId: string,
    path?: string,
    params?: Record<string, string>
  ): Promise<boolean> => {
    try {
      return await deepLinkingService.copyDeepLink(appId, path, params)
    } catch (err) {
      console.error('Failed to copy deep link:', err)
      return false
    }
  }

  /**
   * Generate deep link URL
   */
  const generateDeepLink = (
    appId: string,
    path?: string,
    params?: Record<string, string>
  ): string | null => {
    return deepLinkingService.generateDeepLink(appId, path, params)
  }

  /**
   * Get app by ID
   */
  const getApp = (appId: string): DeepLinkApp | undefined => {
    return deepLinkingService.getApp(appId)
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * Clear last result
   */
  const clearResult = () => {
    lastResult.value = null
  }

  return {
    // State
    isLoading,
    error,
    lastResult,
    apps,
    supportedApps,
    platform,

    // Actions
    openApp,
    openInNewTab,
    copyDeepLink,
    generateDeepLink,
    getApp,
    clearError,
    clearResult,
  }
}
