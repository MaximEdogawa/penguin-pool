/**
 * iOS-specific WalletConnect functionality
 *
 * This composable provides iOS-specific features for WalletConnect:
 * - Device detection
 * - Connection monitoring
 * - Configuration adjustments
 * - Clipboard operations
 */

import { ref } from 'vue'

export interface IOSConnectionState {
  isIOS: boolean
  connectionMonitor: NodeJS.Timeout | null
  lastHeartbeat: number
  isMonitoring: boolean
  visibilityChangeHandler?: () => void
  pageShowHandler?: () => void
  pageHideHandler?: () => void
}

interface SignClientInterface {
  session: {
    getAll: () => Array<{
      topic: string
      expiry?: number
      namespaces?: {
        chia?: {
          accounts?: string[]
          chains?: string[]
        }
      }
    }>
  }
  request: (params: {
    topic: string
    chainId: string
    request: {
      method: string
      params: unknown[]
    }
  }) => Promise<unknown>
}

export function useIOSWalletConnection() {
  const state = ref<IOSConnectionState>({
    isIOS: false,
    connectionMonitor: null,
    lastHeartbeat: 0,
    isMonitoring: false,
  })

  /**
   * Detect if running on iOS
   */
  const detectIOS = (): boolean => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    console.log('🍎 iOS detection:', {
      userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      isIOS,
    })

    return isIOS
  }

  // Initialize iOS detection immediately
  state.value.isIOS = detectIOS()

  /**
   * Copy text to clipboard with iOS fallbacks
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      console.log('📋 Attempting to copy to clipboard:', text)

      // Method 1: Modern clipboard API (preferred)
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text)
          console.log('✅ Text copied to clipboard (modern API)')
          return true
        } catch (modernError) {
          console.warn('⚠️ Modern clipboard API failed:', modernError)
        }
      }

      // Method 2: Fallback for older browsers/iOS Safari
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-999999px'
      textarea.style.top = '-999999px'
      textarea.style.opacity = '0'
      textarea.style.pointerEvents = 'none'
      textarea.setAttribute('readonly', '')
      textarea.setAttribute('contenteditable', 'true')

      document.body.appendChild(textarea)

      // For iOS Safari, we need to make the textarea visible briefly
      if (state.value.isIOS) {
        textarea.style.position = 'absolute'
        textarea.style.left = '50%'
        textarea.style.top = '50%'
        textarea.style.transform = 'translate(-50%, -50%)'
        textarea.style.width = '1px'
        textarea.style.height = '1px'
        textarea.style.opacity = '0.01'
        textarea.style.zIndex = '-1'
      }

      textarea.focus()
      textarea.select()
      textarea.setSelectionRange(0, 99999) // For mobile devices

      let successful = false
      try {
        successful = document.execCommand('copy')
        console.log('✅ Text copied to clipboard (fallback method)')
      } catch (execError) {
        console.warn('⚠️ execCommand failed:', execError)
      }

      // Clean up
      document.body.removeChild(textarea)

      if (successful) {
        console.log('✅ Text copied to clipboard (fallback method)')
        return true
      }

      // Method 3: Try clipboard API again after user interaction
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(text)
          console.log('✅ Text copied to clipboard (retry with modern API)')
          return true
        } catch (retryError) {
          console.warn('⚠️ Retry with modern API also failed:', retryError)
        }
      }

      console.error('❌ All copy methods failed')
      return false
    } catch (error) {
      console.error('❌ Copy failed with error:', error)
      return false
    }
  }

  /**
   * Set up iOS-specific connection monitoring
   */
  const setupConnectionMonitoring = (
    signClient: SignClientInterface,
    onConnectionLost: () => void
  ): void => {
    if (!state.value.isIOS) return

    console.log('🍎 Setting up iOS connection monitoring')
    state.value.isMonitoring = true

    // Monitor connection every 10 seconds
    state.value.connectionMonitor = setInterval(() => {
      monitorConnection(signClient, onConnectionLost)
    }, 10000)

    // Set up page visibility listeners for iOS
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🍎 Page hidden, pausing monitoring')
        pauseConnectionMonitoring()
      } else {
        console.log('🍎 Page visible, resuming monitoring')
        resumeConnectionMonitoring(signClient, onConnectionLost)
      }
    }

    const handlePageShow = () => {
      console.log('🍎 Page shown, resuming monitoring')
      resumeConnectionMonitoring(signClient, onConnectionLost)
    }

    const handlePageHide = () => {
      console.log('🍎 Page hidden, pausing monitoring')
      pauseConnectionMonitoring()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('pagehide', handlePageHide)

    // Store listeners for cleanup
    state.value.visibilityChangeHandler = handleVisibilityChange
    state.value.pageShowHandler = handlePageShow
    state.value.pageHideHandler = handlePageHide
  }

  /**
   * Monitor iOS connection health
   */
  const monitorConnection = (
    signClient: SignClientInterface,
    onConnectionLost: () => void
  ): void => {
    if (!state.value.isIOS || !signClient) return

    try {
      // Check if we have an active session
      const sessions = signClient.session.getAll()
      if (sessions.length === 0) {
        console.log('🍎 No active sessions found')
        return
      }

      // Check session expiry
      const now = Date.now()
      const activeSession = sessions.find(session => {
        if (!session.expiry) return true
        return session.expiry * 1000 > now
      })

      if (!activeSession) {
        console.log('🍎 No valid sessions found, connection lost')
        onConnectionLost()
        return
      }

      // Ping the session to check if it's still responsive
      pingSession(signClient, activeSession, onConnectionLost)
    } catch (error) {
      console.error('🍎 Error monitoring connection:', error)
    }
  }

  /**
   * Ping session to check connectivity
   */
  const pingSession = async (
    signClient: SignClientInterface,
    session: { topic: string },
    onConnectionLost: () => void
  ): Promise<void> => {
    try {
      // Send a simple ping request to check if the connection is alive
      await signClient.request({
        topic: session.topic,
        chainId: 'chia:testnet',
        request: {
          method: 'chia_getAddress',
          params: [],
        },
      })

      state.value.lastHeartbeat = Date.now()
      console.log('🍎 Connection ping successful')
    } catch (error) {
      console.warn('🍎 Connection ping failed:', error)
      // If ping fails, consider connection lost
      onConnectionLost()
    }
  }

  /**
   * Recover iOS connection
   */
  const recoverIOSConnection = (): void => {
    console.log('🍎 Attempting to recover iOS connection...')
    // This could include reinitializing the connection or showing recovery options
  }

  /**
   * Pause connection monitoring
   */
  const pauseConnectionMonitoring = (): void => {
    if (state.value.connectionMonitor) {
      clearInterval(state.value.connectionMonitor)
      state.value.connectionMonitor = null
      state.value.isMonitoring = false
    }
  }

  /**
   * Resume connection monitoring
   */
  const resumeConnectionMonitoring = (
    signClient: SignClientInterface,
    onConnectionLost: () => void
  ): void => {
    if (state.value.isIOS && !state.value.connectionMonitor) {
      state.value.connectionMonitor = setInterval(() => {
        monitorConnection(signClient, onConnectionLost)
      }, 10000)
      state.value.isMonitoring = true
    }
  }

  /**
   * Clean up connection monitoring
   */
  const cleanupConnectionMonitoring = (): void => {
    pauseConnectionMonitoring()

    // Remove event listeners
    if (state.value.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', state.value.visibilityChangeHandler)
    }
    if (state.value.pageShowHandler) {
      window.removeEventListener('pageshow', state.value.pageShowHandler)
    }
    if (state.value.pageHideHandler) {
      window.removeEventListener('pagehide', state.value.pageHideHandler)
    }

    // Clear handlers
    state.value.visibilityChangeHandler = undefined
    state.value.pageShowHandler = undefined
    state.value.pageHideHandler = undefined
  }

  /**
   * Handle iOS WebSocket issues
   */
  const handleIOSWebSocketIssues = (): void => {
    console.log('🍎 Handling iOS WebSocket issues...')
    // This could include reconnection logic or user notifications
  }

  /**
   * Get iOS-specific SignClient options
   */
  const getSignClientOptions = (baseOptions: Record<string, unknown>): Record<string, unknown> => {
    if (!state.value.isIOS) return baseOptions

    const metadata = (baseOptions.metadata as Record<string, unknown>) || {}
    return {
      ...baseOptions,
      relayUrl: 'wss://relay.walletconnect.com',
      metadata: {
        ...metadata,
        name: 'Penguin Pool (iOS)',
        description: 'Penguin Pool - Chia Lending Platform (iOS Optimized)',
      },
    }
  }

  /**
   * Get iOS-specific modal options
   */
  const getModalOptions = (baseOptions: Record<string, unknown>): Record<string, unknown> => {
    if (!state.value.isIOS) return baseOptions

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
  }

  /**
   * Get iOS-specific connection timeout
   */
  const getConnectionTimeout = (defaultTimeout: number): number => {
    return state.value.isIOS ? defaultTimeout * 2 : defaultTimeout
  }

  /**
   * Get iOS-specific error message
   */
  const getIOSErrorMessage = (originalError: string): string => {
    if (!state.value.isIOS) return originalError

    // Provide iOS-specific error messages
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
  }

  /**
   * Get iOS connection instructions
   */
  const getIOSInstructions = (): string[] => {
    return [
      'Copy the connection string above',
      'Open Sage Wallet app on your device',
      'Tap "Connect" or "Scan QR" in the app',
      'Paste the connection string and approve the connection',
    ]
  }

  return {
    state,
    detectIOS,
    copyToClipboard,
    setupConnectionMonitoring,
    monitorConnection,
    recoverIOSConnection,
    pauseConnectionMonitoring,
    resumeConnectionMonitoring,
    cleanupConnectionMonitoring,
    handleIOSWebSocketIssues,
    getSignClientOptions,
    getModalOptions,
    getConnectionTimeout,
    getIOSErrorMessage,
    getIOSInstructions,
  }
}
