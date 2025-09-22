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
  // Relay healing state
  relayHealing: boolean
  relayReconnectAttempts: number
  maxRelayReconnectAttempts: number
  relayReconnectDelay: number
  lastRelayError: number
  relayHealthCheckInterval: NodeJS.Timeout | null
}

export interface SignClientInterface {
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
  core: {
    relayer: {
      connected: boolean
      on: (event: string, callback: (data: unknown) => void) => void
      disconnect?: () => Promise<void>
      connect?: () => Promise<void>
    }
  }
}

export function useIOSWalletConnection() {
  const state = ref<IOSConnectionState>({
    isIOS: false,
    connectionMonitor: null,
    lastHeartbeat: 0,
    isMonitoring: false,
    // Relay healing state
    relayHealing: false,
    relayReconnectAttempts: 0,
    maxRelayReconnectAttempts: 5,
    relayReconnectDelay: 1000,
    lastRelayError: 0,
    relayHealthCheckInterval: null,
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

  /**
   * Initialize iOS-specific relay healing
   */
  const initializeRelayHealing = (signClient: SignClientInterface): void => {
    try {
      if (!state.value.isIOS || !signClient) return

      console.log('🍎 Initializing iOS relay healing...')

      // Set up relay event listeners
      const core = signClient.core
      if (core && core.relayer) {
        // Listen for relay connection errors
        core.relayer.on('relayer_connect_error', (error: unknown) => {
          try {
            console.error('🍎 Relay connection error:', error)
            handleRelayError(signClient)
          } catch (eventError) {
            console.error('🍎 Error in relay_connect_error handler:', eventError)
          }
        })

        // Listen for relay disconnections
        core.relayer.on('relayer_disconnect', (error: unknown) => {
          try {
            console.warn('🍎 Relay disconnected:', error)
            handleRelayDisconnect(signClient)
          } catch (eventError) {
            console.error('🍎 Error in relay_disconnect handler:', eventError)
          }
        })

        // Listen for relay errors
        core.relayer.on('relayer_error', (error: unknown) => {
          try {
            console.error('🍎 Relay error:', error)
            handleRelayError(signClient)
          } catch (eventError) {
            console.error('🍎 Error in relay_error handler:', eventError)
          }
        })

        // Listen for relay reconnection
        core.relayer.on('relayer_connect', () => {
          try {
            console.log('🍎 Relay reconnected successfully!')
            handleRelayReconnect(signClient)
          } catch (eventError) {
            console.error('🍎 Error in relay_connect handler:', eventError)
          }
        })

        // Listen for page visibility changes to trigger healing
        const handleVisibilityChange = () => {
          try {
            if (document.hidden) {
              console.log('🍎 Page hidden, pausing relay healing')
              stopRelayHealthCheck()
            } else {
              console.log('🍎 Page visible, resuming relay healing')
              startRelayHealthCheck(signClient)
              // Trigger immediate healing check when page becomes visible
              setTimeout(() => {
                try {
                  checkRelayHealth(signClient)
                } catch (timeoutError) {
                  console.error('🍎 Error in visibility change timeout:', timeoutError)
                }
              }, 1000)
            }
          } catch (visibilityError) {
            console.error('🍎 Error in visibility change handler:', visibilityError)
          }
        }

        // Listen for page show/hide events
        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('pageshow', () => {
          try {
            console.log('🍎 Page show event - triggering relay healing')
            // Only trigger healing if we have a valid session
            const sessions = signClient.session.getAll()
            if (sessions.length > 0) {
              setTimeout(() => {
                try {
                  checkRelayHealth(signClient)
                } catch (timeoutError) {
                  console.error('🍎 Error in pageshow timeout:', timeoutError)
                }
              }, 500)
            } else {
              console.log('🍎 Page show event - no active sessions, skipping healing')
            }
          } catch (pageshowError) {
            console.error('🍎 Error in pageshow handler:', pageshowError)
          }
        })

        // Health checks will only start after relay disconnect errors
        console.log(
          '🍎 Relay healing initialized - health checks will start after disconnect errors'
        )
      }
    } catch (error) {
      console.error('🍎 Error initializing relay healing:', error)
    }
  }

  /**
   * Handle relay connection errors
   */
  const handleRelayError = (signClient: SignClientInterface): void => {
    try {
      if (!state.value.isIOS || !signClient) return

      const now = Date.now()
      const timeSinceLastError = now - state.value.lastRelayError

      // Throttle error handling to prevent spam
      if (timeSinceLastError < 5000) {
        console.log('🍎 Relay error throttled, ignoring...')
        return
      }

      state.value.lastRelayError = now
      console.log('🍎 Handling relay error, attempting reconnection...')

      // Reset reconnection attempts if it's been a while
      if (timeSinceLastError > 30000) {
        state.value.relayReconnectAttempts = 0
      }

      // Use setTimeout to prevent blocking the main thread
      setTimeout(() => {
        try {
          attemptRelayReconnection(signClient)
        } catch (timeoutError) {
          console.error('🍎 Error in relay error timeout:', timeoutError)
        }
      }, 100)
    } catch (error) {
      console.error('🍎 Error in handleRelayError:', error)
    }
  }

  /**
   * Handle relay disconnections
   */
  const handleRelayDisconnect = (signClient: SignClientInterface): void => {
    try {
      if (!state.value.isIOS || !signClient) return

      console.log('🍎 Relay disconnected, attempting reconnection...')

      // Start health checks only after a disconnect occurs
      startRelayHealthCheck(signClient)

      attemptRelayReconnection(signClient)
    } catch (error) {
      console.error('🍎 Error in handleRelayDisconnect:', error)
    }
  }

  /**
   * Handle relay reconnections
   */
  const handleRelayReconnect = (signClient: SignClientInterface): void => {
    try {
      if (!state.value.isIOS || !signClient) return

      console.log('🍎 Relay reconnected, updating state...')

      // Reset reconnection state since we're now connected
      state.value.relayHealing = false
      state.value.relayReconnectAttempts = 0
      state.value.relayReconnectDelay = 1000 // Reset to initial delay

      // Stop health checks since we're reconnected
      stopRelayHealthCheck()

      // Test the reconnected relay with a health check
      setTimeout(async () => {
        try {
          await checkRelayHealth(signClient)

          // After successful health check, restore session if needed
          await restoreSessionAfterReconnect(signClient)
        } catch (error) {
          console.warn('🍎 Health check after relay reconnect failed:', error)
        }
      }, 2000) // Wait 2 seconds for the connection to stabilize

      console.log('🍎 Relay reconnection handling completed')
    } catch (error) {
      console.error('🍎 Error in handleRelayReconnect:', error)
    }
  }

  /**
   * Restore session after relay reconnection
   */
  const restoreSessionAfterReconnect = async (signClient: SignClientInterface): Promise<void> => {
    try {
      if (!state.value.isIOS || !signClient) return

      console.log('🍎 Checking for session restoration after relay reconnect...')

      // Get all active sessions
      const sessions = signClient.session.getAll()

      if (sessions.length === 0) {
        console.log('🍎 No sessions found after relay reconnect')
        return
      }

      // Find the most recent session
      const activeSession = sessions[sessions.length - 1]

      // Check if the session is still valid
      if (activeSession && activeSession.expiry && activeSession.expiry > Date.now() / 1000) {
        console.log('🍎 Valid session found after relay reconnect, restoring...')

        // Import the user store here to avoid circular dependencies
        const { useUserStore } = await import('@/entities/user/store/userStore')
        const userStore = useUserStore()

        // Extract wallet information from session
        const accounts =
          activeSession.namespaces?.chia?.accounts?.map(
            (account: string) => account.split(':')[2]
          ) || []

        if (accounts.length > 0) {
          // Use the first account as the wallet identifier
          const walletIdentifier = accounts[0]
          await userStore.login(walletIdentifier)
          console.log('🍎 User authentication state updated after relay reconnect')
        }
      } else {
        console.log('🍎 Session expired or invalid after relay reconnect')
      }
    } catch (error) {
      console.error('🍎 Error in restoreSessionAfterReconnect:', error)
    }
  }

  /**
   * Attempt to reconnect the relay
   */
  const attemptRelayReconnection = async (signClient: SignClientInterface): Promise<void> => {
    try {
      if (!state.value.isIOS || state.value.relayHealing || !signClient) return

      if (state.value.relayReconnectAttempts >= state.value.maxRelayReconnectAttempts) {
        console.error('🍎 Max relay reconnection attempts reached, giving up')
        return
      }

      state.value.relayHealing = true
      state.value.relayReconnectAttempts++

      console.log(
        `🍎 Attempting relay reconnection ${state.value.relayReconnectAttempts}/${state.value.maxRelayReconnectAttempts}...`
      )

      try {
        // Force disconnect the current relay
        const core = signClient?.core
        if (core?.relayer) {
          // Use the actual relayer methods - they may be different
          if (typeof core.relayer.disconnect === 'function') {
            await core.relayer.disconnect()
          }
          console.log('🍎 Relay disconnected, waiting before reconnection...')

          // Wait before reconnecting
          await new Promise(resolve => setTimeout(resolve, state.value.relayReconnectDelay))

          // Reconnect the relay
          if (typeof core.relayer.connect === 'function') {
            await core.relayer.connect()
          }
          console.log('🍎 Relay reconnected successfully')

          // Test the reconnection with a health check (but don't await to prevent blocking)
          setTimeout(async () => {
            try {
              await checkRelayHealth(signClient)
            } catch (error) {
              console.warn('🍎 Health check after reconnection failed:', error)
            }
          }, 1000)

          // Reset reconnection state
          state.value.relayReconnectAttempts = 0
          state.value.relayHealing = false

          // Health checks will only restart if there's another disconnect
        } else {
          console.warn('🍎 No relayer available for reconnection')
          state.value.relayHealing = false
        }
      } catch (reconnectionError) {
        console.error('🍎 Relay reconnection failed:', reconnectionError)
        state.value.relayHealing = false

        // Exponential backoff for next attempt
        state.value.relayReconnectDelay = Math.min(state.value.relayReconnectDelay * 2, 10000)

        // Retry after delay
        setTimeout(() => {
          try {
            attemptRelayReconnection(signClient)
          } catch (retryError) {
            console.error('🍎 Error in relay reconnection retry:', retryError)
          }
        }, state.value.relayReconnectDelay)
      }
    } catch (error) {
      console.error('🍎 Error in attemptRelayReconnection:', error)
      state.value.relayHealing = false
    }
  }

  /**
   * Start periodic relay health checks
   */
  const startRelayHealthCheck = (signClient: SignClientInterface): void => {
    try {
      if (!state.value.isIOS || !signClient) return

      // Clear existing health check
      if (state.value.relayHealthCheckInterval) {
        clearInterval(state.value.relayHealthCheckInterval)
      }

      console.log('🍎 Starting relay health checks...')
      state.value.relayHealthCheckInterval = setInterval(() => {
        try {
          // Only run health checks if we have a valid signClient
          if (signClient && signClient.core && signClient.core.relayer) {
            checkRelayHealth(signClient)
          } else {
            console.log('🍎 Skipping health check - no valid signClient or relayer')
          }
        } catch (intervalError) {
          console.error('🍎 Error in relay health check interval:', intervalError)
        }
      }, 10000) // Check every 10 seconds
    } catch (error) {
      console.error('🍎 Error in startRelayHealthCheck:', error)
    }
  }

  /**
   * Check relay health
   */
  const checkRelayHealth = async (signClient: SignClientInterface): Promise<void> => {
    try {
      if (!state.value.isIOS || !signClient) return

      try {
        const core = signClient.core
        if (core && core.relayer) {
          // Check if relay is connected
          const isConnected = core.relayer.connected
          if (!isConnected) {
            console.warn('🍎 Relay health check failed - not connected')
            handleRelayDisconnect(signClient)
            return
          }

          // If relay is connected and we have active sessions, skip health checks
          // Only run health checks when disconnected or during healing
          if (isConnected && !state.value.relayHealing) {
            console.log('🍎 Relay is connected and healthy, skipping health check')
            return
          }

          // Only test with wallet requests if we have active sessions
          const sessions = signClient.session.getAll()
          if (sessions.length > 0) {
            // Check if session is still valid (not expired)
            const session = sessions[0]
            const now = Date.now()
            const sessionExpiry = session.expiry ? session.expiry * 1000 : 0

            if (sessionExpiry > 0 && now > sessionExpiry) {
              console.warn('🍎 Session expired, skipping health check')
              return
            }

            try {
              // Test with a simple request to verify relay is working
              await Promise.race([
                signClient.request({
                  topic: session.topic,
                  chainId: 'chia:testnet',
                  request: {
                    method: 'chia_getAddress',
                    params: [],
                  },
                }),
                // Timeout after 5 seconds (increased from 3)
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Request timeout')), 5000)
                ),
              ])
              console.log('🍎 Relay health check passed')
            } catch (requestError) {
              // If the request fails, it might be a relay issue
              console.warn('🍎 Relay health check failed - request error:', requestError)
              // Only trigger healing if it's a network/timeout error, not a wallet rejection
              if (
                requestError instanceof Error &&
                (requestError.message.includes('timeout') ||
                  requestError.message.includes('network') ||
                  requestError.message.includes('connection'))
              ) {
                handleRelayError(signClient)
              } else {
                console.log('🍎 Request failed but not a relay issue, skipping healing')
              }
            }
          } else {
            // No active sessions, but relay should still be healthy
            console.log('🍎 Relay health check passed (no active sessions)')
          }
        }
      } catch (coreError) {
        console.warn('🍎 Relay health check failed:', coreError)
        // Only trigger healing for actual relay errors
        if (
          coreError instanceof Error &&
          (coreError.message.includes('relay') ||
            coreError.message.includes('connection') ||
            coreError.message.includes('network'))
        ) {
          handleRelayError(signClient)
        }
      }
    } catch (error) {
      console.error('🍎 Error in checkRelayHealth:', error)
    }
  }

  /**
   * Stop relay health checks
   */
  const stopRelayHealthCheck = (): void => {
    try {
      if (state.value.relayHealthCheckInterval) {
        clearInterval(state.value.relayHealthCheckInterval)
        state.value.relayHealthCheckInterval = null
        console.log('🍎 Stopped relay health checks')
      }
    } catch (error) {
      console.error('🍎 Error in stopRelayHealthCheck:', error)
    }
  }

  /**
   * Clean up relay healing
   */
  const cleanupRelayHealing = (): void => {
    try {
      stopRelayHealthCheck()
      state.value.relayHealing = false
      state.value.relayReconnectAttempts = 0
      state.value.relayReconnectDelay = 1000
      console.log('🍎 Cleaned up relay healing')
    } catch (error) {
      console.error('🍎 Error in cleanupRelayHealing:', error)
    }
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
    // Relay healing methods
    initializeRelayHealing,
    handleRelayError,
    handleRelayDisconnect,
    handleRelayReconnect,
    attemptRelayReconnection,
    startRelayHealthCheck,
    checkRelayHealth,
    stopRelayHealthCheck,
    cleanupRelayHealing,
  }
}
