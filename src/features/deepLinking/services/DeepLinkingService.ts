import type { DeepLinkApp, DeepLinkConfig, DeepLinkResult } from '../types/deepLinking.types'

export class DeepLinkingService {
  private config: DeepLinkConfig
  private apps: Map<string, DeepLinkApp> = new Map()

  constructor(config?: Partial<DeepLinkConfig>) {
    this.config = {
      apps: [
        {
          id: 'spacescan',
          name: 'Spacescan.io',
          description: 'Chia blockchain explorer',
          icon: 'pi pi-globe',
          scheme: 'spacescan://',
          universalLink: 'https://spacescan.io',
          website: 'https://spacescan.io',
          supportedPlatforms: ['ios', 'android', 'web'],
        },
        {
          id: 'chia-explorer',
          name: 'Chia Explorer',
          description: 'Official Chia blockchain explorer',
          icon: 'pi pi-search',
          scheme: 'chia-explorer://',
          universalLink: 'https://www.chiaexplorer.com',
          website: 'https://www.chiaexplorer.com',
          supportedPlatforms: ['ios', 'android', 'web'],
        },
        {
          id: 'chia-network',
          name: 'Chia Network',
          description: 'Official Chia Network website',
          icon: 'pi pi-home',
          scheme: 'chia-network://',
          universalLink: 'https://www.chia.net',
          website: 'https://www.chia.net',
          supportedPlatforms: ['ios', 'android', 'web'],
        },
      ],
      defaultTimeout: 5000,
      retryAttempts: 2,
      ...config,
    }

    // Initialize apps map
    this.config.apps.forEach(app => {
      this.apps.set(app.id, app)
    })
  }

  /**
   * Get all available deep link apps
   */
  getApps(): DeepLinkApp[] {
    return [...this.config.apps]
  }

  /**
   * Get apps supported on current platform
   */
  getSupportedApps(): DeepLinkApp[] {
    const platform = this.detectPlatform()
    return this.config.apps.filter(app => app.supportedPlatforms.includes(platform))
  }

  /**
   * Get a specific app by ID
   */
  getApp(appId: string): DeepLinkApp | undefined {
    return this.apps.get(appId)
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): 'ios' | 'android' | 'web' {
    if (typeof window === 'undefined') return 'web'

    const userAgent = window.navigator.userAgent.toLowerCase()

    if (/iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window)) {
      return 'ios'
    }

    if (/android/.test(userAgent)) {
      return 'android'
    }

    return 'web'
  }

  /**
   * Generate deep link URL for an app
   */
  generateDeepLink(appId: string, path?: string, params?: Record<string, string>): string | null {
    const app = this.getApp(appId)
    if (!app) return null

    const platform = this.detectPlatform()
    let baseUrl: string

    if (platform === 'ios' && app.scheme) {
      baseUrl = app.scheme
    } else if (app.universalLink) {
      baseUrl = app.universalLink
    } else if (app.website) {
      baseUrl = app.website
    } else {
      return null
    }

    let url = baseUrl
    if (path) {
      url += path.startsWith('/') ? path : `/${path}`
    }

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    return url
  }

  /**
   * Try to open an app with deep link
   */
  async openApp(
    appId: string,
    path?: string,
    params?: Record<string, string>
  ): Promise<DeepLinkResult> {
    const app = this.getApp(appId)
    if (!app) {
      return {
        success: false,
        error: `App with ID '${appId}' not found`,
      }
    }

    const platform = this.detectPlatform()
    if (!app.supportedPlatforms.includes(platform)) {
      return {
        success: false,
        error: `App '${app.name}' is not supported on ${platform}`,
      }
    }

    const deepLinkUrl = this.generateDeepLink(appId, path, params)
    if (!deepLinkUrl) {
      return {
        success: false,
        error: `Could not generate deep link for app '${app.name}'`,
      }
    }

    try {
      const opened = await this.tryOpenUrl(deepLinkUrl)
      return {
        success: opened,
        openedApp: opened ? app.name : undefined,
        error: opened ? undefined : 'Failed to open app',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Try to open a URL (deep link or universal link)
   */
  private async tryOpenUrl(url: string): Promise<boolean> {
    return new Promise(resolve => {
      const startTime = Date.now()

      // Create a hidden iframe to test if the app opens
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)

      // Check if we return to the page quickly (app opened)
      const checkReturn = () => {
        const elapsed = Date.now() - startTime
        if (elapsed > 2000) {
          // If we're still here after 2 seconds, the app probably didn't open
          document.body.removeChild(iframe)
          resolve(false)
        } else {
          // Check again in 100ms
          setTimeout(checkReturn, 100)
        }
      }

      // Listen for page visibility changes
      const handleVisibilityChange = () => {
        if (document.hidden) {
          // Page went to background, app probably opened
          document.body.removeChild(iframe)
          document.removeEventListener('visibilitychange', handleVisibilityChange)
          resolve(true)
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Start checking
      setTimeout(checkReturn, 100)

      // Cleanup after timeout
      setTimeout(() => {
        document.body.removeChild(iframe)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        resolve(false)
      }, this.config.defaultTimeout)
    })
  }

  /**
   * Open app in new tab/window (for web platform)
   */
  openInNewTab(appId: string, path?: string, params?: Record<string, string>): boolean {
    const app = this.getApp(appId)
    if (!app) return false

    const url = this.generateDeepLink(appId, path, params)
    if (!url) return false

    try {
      window.open(url, '_blank', 'noopener,noreferrer')
      return true
    } catch (error) {
      console.error('Failed to open in new tab:', error)
      return false
    }
  }

  /**
   * Copy deep link to clipboard
   */
  async copyDeepLink(
    appId: string,
    path?: string,
    params?: Record<string, string>
  ): Promise<boolean> {
    const url = this.generateDeepLink(appId, path, params)
    if (!url) return false

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
        return true
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = url
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          document.execCommand('copy')
          return true
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (error) {
      console.error('Failed to copy deep link:', error)
      return false
    }
  }
}

// Export singleton instance
export const deepLinkingService = new DeepLinkingService()
