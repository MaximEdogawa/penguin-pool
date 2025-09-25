import { isIOS } from '@/shared/config/environment'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { computed, nextTick, ref, watch } from 'vue'
import { SageMethods } from '../constants/sage-methods'
import type { AppSignClient, WalletConnectSession } from '../types/walletConnect.types'
import { useInstanceDataService } from './InstanceDataService'

export interface IOSConnectionState {
  isConnected: boolean
  isConnecting: boolean
  isFullyReady: boolean
  session: WalletConnectSession | null
  accounts: string[]
  chainId: string | null
  error: string | null
  connectionAttempts: number
  lastConnectionAttempt: number | null
  isHealing: boolean
  websocketStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  walletInfo: {
    address: string | null
    balance: string | null
    network: string | null
    fingerprint: string | null
  }
  isWalletInfoLoaded: boolean
}

// iOS-specific connection state
const iosConnectionState = ref<IOSConnectionState>({
  isConnected: false,
  isConnecting: false,
  isFullyReady: false,
  session: null,
  accounts: [],
  chainId: null,
  error: null,
  connectionAttempts: 0,
  lastConnectionAttempt: null,
  isHealing: false,
  websocketStatus: 'disconnected',
  walletInfo: {
    address: null,
    balance: null,
    network: null,
    fingerprint: null,
  },
  isWalletInfoLoaded: false,
})

// iOS-specific configuration
const IOS_CONFIG = {
  MAX_RETRY_ATTEMPTS: 5,
  RETRY_DELAY_BASE: 1000, // 1 second
  RETRY_DELAY_MAX: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 90000, // 90 seconds for iOS
  HEALING_INTERVAL: 10000, // 10 seconds
  WEBSOCKET_PING_INTERVAL: 15000, // 15 seconds (reduced for iOS)
  WEBSOCKET_RECONNECT_DELAY: 2000, // 2 seconds
  PROPOSAL_TIMEOUT: 300000, // 5 minutes for iOS proposals
  RELAYER_RETRY_ATTEMPTS: 10,
}

export function useIOSWalletConnectService() {
  const instanceService = useInstanceDataService()

  // Add global error handler for iOS to prevent page resets
  if (typeof window !== 'undefined' && isIOS()) {
    try {
      window.onerror = (message, source, lineno, colno, error) => {
        try {
          console.error('🍎 Global error caught:', { message, source, lineno, colno, error })
          // Don't let errors crash the page
          return true
        } catch (logError) {
          console.error('🍎 Error in error handler:', logError)
          return true
        }
      }

      window.onunhandledrejection = event => {
        try {
          console.error('🍎 Unhandled promise rejection caught:', event.reason)
          // Prevent the default behavior (page crash)
          event.preventDefault()
        } catch (logError) {
          console.error('🍎 Error in rejection handler:', logError)
          event.preventDefault()
        }
      }
    } catch (error) {
      console.error('🍎 Error setting up global error handlers:', error)
      // Don't throw - continue without global handlers
    }
  }

  // Add safety check for iOS detection
  const isIOSDevice = computed(() => {
    try {
      return isIOS()
    } catch (error) {
      console.error('🍎 Error detecting iOS:', error)
      return false
    }
  })

  const connectionQuery = useQuery({
    queryKey: ['walletConnect', 'ios-connection'],
    queryFn: () => {
      try {
        return iosConnectionState.value
      } catch (error) {
        console.error('🍎 Error in connection query:', error)
        return {
          isConnected: false,
          isConnecting: false,
          isFullyReady: false,
          session: null,
          accounts: [],
          chainId: null,
          error: 'Query error',
          connectionAttempts: 0,
          lastConnectionAttempt: null,
          isHealing: false,
          websocketStatus: 'disconnected' as const,
          walletInfo: {
            address: null,
            balance: null,
            network: null,
            fingerprint: null,
          },
          isWalletInfoLoaded: false,
        }
      }
    },
    enabled: computed(() => {
      try {
        return instanceService.isReady.value && isIOSDevice.value
      } catch (error) {
        console.error('🍎 Error in query enabled check:', error)
        return false
      }
    }),
    staleTime: Infinity,
  })

  // WebSocket health monitoring with iOS-specific handling
  const startWebSocketHealthCheck = () => {
    try {
      if (!isIOSDevice.value) return

      console.log('🍎 Starting iOS WebSocket health monitoring...')

      const healthCheckInterval = setInterval(() => {
        try {
          if (iosConnectionState.value.isConnected && iosConnectionState.value.session) {
            checkWebSocketHealth()
          }
        } catch (error) {
          console.error('🍎 Error in health check interval:', error)
        }
      }, IOS_CONFIG.WEBSOCKET_PING_INTERVAL)

      // Cleanup on component unmount
      return () => {
        try {
          console.log('🍎 Stopping iOS WebSocket health monitoring...')
          clearInterval(healthCheckInterval)
        } catch (error) {
          console.error('🍎 Error stopping health monitoring:', error)
        }
      }
    } catch (error) {
      console.error('🍎 Error starting WebSocket health monitoring:', error)
      return () => {} // Return empty cleanup function
    }
  }

  const checkWebSocketHealth = async () => {
    try {
      const signClient = instanceService.getSignClient.value
      if (!signClient || !iosConnectionState.value.session) return

      // Try to ping the connection with iOS-specific timeout
      const pingPromise = signClient.ping({ topic: iosConnectionState.value.session.topic })
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Ping timeout')), 5000)
      })

      await Promise.race([pingPromise, timeoutPromise])
      iosConnectionState.value.websocketStatus = 'connected'
      console.log('🍎 WebSocket health check passed')
    } catch (error) {
      console.warn('🍎 iOS WebSocket health check failed:', error)
      iosConnectionState.value.websocketStatus = 'error'

      // Trigger healing if connection is lost
      if (iosConnectionState.value.isConnected) {
        console.log('🍎 WebSocket connection lost, triggering healing...')
        await healConnection()
      }
    }
  }

  // Connection healing logic
  const healConnection = async () => {
    if (iosConnectionState.value.isHealing) return

    console.log('🍎 Starting iOS connection healing...')
    iosConnectionState.value.isHealing = true
    iosConnectionState.value.error = null

    try {
      const signClient = instanceService.getSignClient.value
      if (!signClient) {
        throw new Error('SignClient not available for healing')
      }

      // Check if we have an existing session
      const sessions = signClient.session.getAll()
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1]

        // Try to restore the session
        await restoreSession(lastSession)
        console.log('🍎 iOS connection healed successfully')
      } else {
        // No existing session, need to reconnect
        throw new Error('No existing session to restore')
      }
    } catch (error) {
      console.error('🍎 iOS connection healing failed:', error)
      iosConnectionState.value.error =
        error instanceof Error ? error.message : 'Connection healing failed'

      // If healing fails, clear the connection
      clearIOSConnection()
    } finally {
      iosConnectionState.value.isHealing = false
    }
  }

  // Enhanced iOS connection with retry logic
  const connectWithRetry = async (): Promise<WalletConnectSession> => {
    const maxAttempts = IOS_CONFIG.MAX_RETRY_ATTEMPTS
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        iosConnectionState.value.connectionAttempts = attempt
        iosConnectionState.value.lastConnectionAttempt = Date.now()
        iosConnectionState.value.error = null

        console.log(`🍎 iOS connection attempt ${attempt}/${maxAttempts}`)

        const session = await attemptConnection()

        // Reset retry state on success
        iosConnectionState.value.connectionAttempts = 0
        iosConnectionState.value.lastConnectionAttempt = null

        return session
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown connection error')
        console.warn(`🍎 iOS connection attempt ${attempt} failed:`, lastError.message)

        // Don't retry on certain errors
        if (
          lastError.message.includes('Modal closed without connection') ||
          lastError.message.includes('User rejected')
        ) {
          throw lastError
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxAttempts) {
          const delay = Math.min(
            IOS_CONFIG.RETRY_DELAY_BASE * Math.pow(2, attempt - 1),
            IOS_CONFIG.RETRY_DELAY_MAX
          )

          console.log(`🍎 Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All attempts failed
    iosConnectionState.value.error = `Connection failed after ${maxAttempts} attempts: ${lastError?.message}`
    throw lastError || new Error('Connection failed after maximum retry attempts')
  }

  const attemptConnection = async (): Promise<WalletConnectSession> => {
    if (!instanceService.isReady.value) {
      throw new Error('WalletConnect not initialized')
    }

    const signClient = instanceService.getSignClient.value
    const modal = instanceService.getModal.value

    if (!signClient) throw new Error('SignClient not available')
    if (!modal) throw new Error('WalletConnect modal not available')

    console.log('🍎 Creating iOS-optimized connection with extended proposal timeout...')

    // Create connection with iOS-optimized settings
    const { uri, approval } = await signClient.connect({
      optionalNamespaces: {
        chia: {
          methods: Object.values(SageMethods),
          chains: ['chia:mainnet', 'chia:testnet'],
          events: [],
        },
      },
    })

    if (!uri) {
      throw new Error('Failed to generate connection URI')
    }

    console.log('🍎 iOS device detected, using enhanced iOS connection flow')
    console.log('🍎 Connection URI generated:', uri.substring(0, 50) + '...')

    // Dispatch custom event to show iOS modal
    const showEvent = new CustomEvent('show_ios_modal', {
      detail: { uri },
    })
    window.dispatchEvent(showEvent)

    // Set up modal close handler for iOS modal
    let modalClosed = false
    const handleIOSModalClose = () => {
      if (!modalClosed) {
        modalClosed = true
        resetIOSConnectionState()
        window.removeEventListener('hide_ios_modal', handleIOSModalClose)
      }
    }

    window.addEventListener('hide_ios_modal', handleIOSModalClose)

    try {
      // Wait for session approval with iOS-specific timeout
      console.log('🍎 Waiting for session approval with iOS timeout...')
      const sessionPromise = approval()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Connection timeout - iOS devices may need more time'))
        }, IOS_CONFIG.CONNECTION_TIMEOUT)
      })

      const session = await Promise.race([sessionPromise, timeoutPromise])

      // Don't auto-hide iOS modal - let user decide when to continue
      // The modal will show wallet info and wait for user to press "Continue"
      console.log(
        '🍎 Session approval received successfully - keeping modal open for user confirmation'
      )

      // Dispatch event to show wallet info in modal
      const walletInfoEvent = new CustomEvent('ios_wallet_connected', {
        detail: { session },
      })
      window.dispatchEvent(walletInfoEvent)

      window.removeEventListener('hide_ios_modal', handleIOSModalClose)
      return session as unknown as WalletConnectSession
    } catch (error) {
      // Handle approval rejection or modal close
      window.removeEventListener('hide_ios_modal', handleIOSModalClose)
      if (modalClosed) {
        // Reset connection state when modal is closed without connection
        resetIOSConnectionState()
        throw new Error('Modal closed without connection')
      }
      // Reset connection state on other errors
      resetIOSConnectionState()
      throw error
    }
  }

  const openModalMutation = useMutation({
    mutationFn: connectWithRetry,
  })

  const connectMutation = useMutation({
    mutationFn: async (session: WalletConnectSession): Promise<IOSConnectionState> => {
      iosConnectionState.value.isConnecting = true
      iosConnectionState.value.error = null

      try {
        await handleSessionApprove(session)
        return iosConnectionState.value
      } catch (error) {
        iosConnectionState.value.error =
          error instanceof Error ? error.message : 'Connection failed'
        iosConnectionState.value.isConnecting = false
        throw error
      }
    },
    onSuccess: () => {
      console.log('🍎 iOS wallet connected successfully')
      // Start health monitoring
      startWebSocketHealthCheck()
    },
    onError: error => {
      console.error('🍎 iOS wallet connection failed:', error)
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!iosConnectionState.value.session) return

      try {
        const signClient = instanceService.getSignClient.value
        if (!signClient) return

        await (signClient as AppSignClient).disconnect({
          topic: iosConnectionState.value.session!.topic,
          reason: { code: 6000, message: 'User disconnected' },
        })

        clearIOSConnection()
      } catch (error) {
        console.error('🍎 iOS disconnect error:', error)
        clearIOSConnection()
      }
    },
    onSuccess: () => {
      console.log('🍎 iOS wallet disconnected')
    },
  })

  const restoreSessionsMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      try {
        console.log('🍎 iOS restoreSessions called')

        if (!instanceService.isReady.value) {
          console.log('🍎 Instance not ready, skipping session restoration')
          return
        }

        const signClient = instanceService.getSignClient.value
        if (!signClient) {
          console.log('🍎 SignClient not available, skipping session restoration')
          return
        }

        // Check localStorage for persisted session data
        let persistedSession: string | null = null
        try {
          persistedSession = localStorage.getItem('walletconnect-session')
          console.log('🍎 Checking localStorage for persisted session:', !!persistedSession)
        } catch (error) {
          console.error('🍎 Error accessing localStorage:', error)
        }

        if (persistedSession) {
          try {
            const sessionData = JSON.parse(persistedSession)
            console.log('🍎 Found persisted session data:', sessionData.topic)

            // Validate session data
            if (sessionData.topic && sessionData.namespaces && sessionData.namespaces.chia) {
              console.log('🍎 Persisted session data is valid, attempting restoration')
              await restoreSession(sessionData)
              return
            } else {
              console.log('🍎 Persisted session data is invalid, clearing localStorage')
              try {
                localStorage.removeItem('walletconnect-session')
              } catch (error) {
                console.error('🍎 Error clearing localStorage:', error)
              }
            }
          } catch (error) {
            console.error('🍎 Failed to parse persisted session:', error)
            try {
              localStorage.removeItem('walletconnect-session')
            } catch (clearError) {
              console.error('🍎 Error clearing localStorage:', clearError)
            }
          }
        }

        const sessions = (signClient as AppSignClient).session.getAll()
        console.log(`🍎 Found ${sessions.length} existing sessions in SignClient`)

        if (sessions.length > 0) {
          const lastSession = sessions[sessions.length - 1]
          console.log('🍎 Restoring last session from SignClient:', lastSession.topic)

          // Persist session to localStorage
          try {
            localStorage.setItem('walletconnect-session', JSON.stringify(lastSession))
            console.log('🍎 Session persisted to localStorage')
          } catch (error) {
            console.error('🍎 Error persisting session to localStorage:', error)
          }

          await restoreSession(lastSession)
        } else {
          console.log('🍎 No existing sessions to restore')
        }
      } catch (error) {
        console.error('🍎 Error in restoreSessions:', error)
        // Don't throw the error to prevent page reset
      }
    },
  })

  const restoreSession = async (session: WalletConnectSession): Promise<void> => {
    console.log('🍎 Restoring iOS session:', session.topic)

    try {
      await handleSessionApprove(session)
      iosConnectionState.value.websocketStatus = 'connected'

      // Start health monitoring for restored session
      startWebSocketHealthCheck()
    } catch (error) {
      console.error('🍎 iOS session restore failed:', error)
      iosConnectionState.value.error =
        error instanceof Error ? error.message : 'Session restore failed'
      clearIOSConnection()
    }
  }

  const fetchWalletInfo = async (session: WalletConnectSession): Promise<void> => {
    try {
      console.log('🍎 Fetching wallet information...')
      iosConnectionState.value.isWalletInfoLoaded = false

      const signClient = instanceService.getSignClient.value
      if (!signClient) {
        console.warn('🍎 SignClient not available for wallet info')
        iosConnectionState.value.isWalletInfoLoaded = false
        return
      }

      // Extract wallet address from session
      const chiaNamespace = session.namespaces?.chia
      const accounts = chiaNamespace?.accounts || []
      const address = accounts.length > 0 ? accounts[0].split(':')[2] : null

      if (!address) {
        console.warn('🍎 No wallet address found in session')
        iosConnectionState.value.isWalletInfoLoaded = false
        return
      }

      // Request wallet info using Sage methods with timeout
      const walletInfoRequest = {
        topic: session.topic,
        chainId: 'chia:testnet',
        request: {
          method: 'chia_getWalletInfo',
          params: {},
        },
      }

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Wallet info request timeout')), 10000)
      })

      const response = await Promise.race([signClient.request(walletInfoRequest), timeoutPromise])

      iosConnectionState.value.walletInfo = {
        address: address,
        balance: (response as { balance?: string })?.balance || '0',
        network: iosConnectionState.value.chainId || 'testnet',
        fingerprint: (response as { fingerprint?: string })?.fingerprint || null,
      }

      iosConnectionState.value.isWalletInfoLoaded = true
      console.log('🍎 Wallet info loaded successfully:', iosConnectionState.value.walletInfo)
    } catch (error) {
      console.error('🍎 Failed to fetch wallet info:', error)
      iosConnectionState.value.isWalletInfoLoaded = false

      // Set basic wallet info even if request fails
      try {
        const chiaNamespace = session.namespaces?.chia
        const accounts = chiaNamespace?.accounts || []
        const address = accounts.length > 0 ? accounts[0].split(':')[2] : null

        iosConnectionState.value.walletInfo = {
          address: address,
          balance: '0',
          network: iosConnectionState.value.chainId || 'testnet',
          fingerprint: null,
        }
      } catch (fallbackError) {
        console.error('🍎 Failed to set fallback wallet info:', fallbackError)
        iosConnectionState.value.walletInfo = {
          address: null,
          balance: null,
          network: null,
          fingerprint: null,
        }
      }
    }
  }

  const handleSessionApprove = async (session: WalletConnectSession): Promise<void> => {
    try {
      console.log('🍎 [iOS CONNECTION] Starting session approval...')

      iosConnectionState.value.session = session
      iosConnectionState.value.isConnected = true
      iosConnectionState.value.isConnecting = false
      iosConnectionState.value.error = null
      iosConnectionState.value.websocketStatus = 'connected'

      // Extract accounts and chainId with error handling
      try {
        const chiaNamespace = session.namespaces?.chia
        const accounts = chiaNamespace?.accounts || []
        iosConnectionState.value.accounts = accounts.map((account: string) => {
          try {
            return account.split(':')[2]
          } catch (error) {
            console.error('🍎 Error parsing account:', error)
            return account
          }
        })
      } catch (error) {
        console.error('🍎 Error extracting accounts:', error)
        iosConnectionState.value.accounts = []
      }

      // Determine chainId from session with error handling
      try {
        iosConnectionState.value.chainId = extractChainId(session)
      } catch (error) {
        console.error('🍎 Error extracting chainId:', error)
        iosConnectionState.value.chainId = 'testnet'
      }

      // Persist session to localStorage for iOS app switching
      try {
        localStorage.setItem('walletconnect-session', JSON.stringify(session))
        console.log('🍎 Session persisted to localStorage for iOS app switching')
      } catch (error) {
        console.error('🍎 Failed to persist session to localStorage:', error)
        // Don't throw - continue without persistence
      }

      // Fetch wallet information with error handling
      try {
        await fetchWalletInfo(session)
      } catch (error) {
        console.error('🍎 Error fetching wallet info:', error)
        // Continue without wallet info
      }

      console.log('🍎 iOS wallet connected successfully')
      console.log('🍎 [iOS CONNECTION] Session details:', {
        topic: session.topic,
        accounts: iosConnectionState.value.accounts,
        chainId: iosConnectionState.value.chainId,
        isConnected: iosConnectionState.value.isConnected,
        walletInfo: iosConnectionState.value.walletInfo,
      })

      // Use nextTick to ensure reactive updates propagate before queries start
      try {
        await nextTick()
        // Set isFullyReady AFTER all reactive updates have propagated
        iosConnectionState.value.isFullyReady = true
      } catch (error) {
        console.error('🍎 Error in nextTick:', error)
        iosConnectionState.value.isFullyReady = true
      }

      console.log('🍎 iOS connection state updated, queries should refresh automatically')
      console.log('🍎 [iOS CONNECTION] Final state:', {
        isConnected: iosConnectionState.value.isConnected,
        hasSession: !!iosConnectionState.value.session,
        hasAccounts: iosConnectionState.value.accounts.length > 0,
        chainId: iosConnectionState.value.chainId,
        isFullyReady: iosConnectionState.value.isFullyReady,
        websocketStatus: iosConnectionState.value.websocketStatus,
        walletInfoLoaded: iosConnectionState.value.isWalletInfoLoaded,
      })
    } catch (error) {
      console.error('🍎 Critical error in handleSessionApprove:', error)
      iosConnectionState.value.error =
        error instanceof Error ? error.message : 'Session approval failed'
      iosConnectionState.value.isConnecting = false
      iosConnectionState.value.isConnected = false
      // Don't throw - prevent page refresh
    }
  }

  const extractChainId = (session: WalletConnectSession): string => {
    try {
      const chiaNamespace = session.namespaces?.chia
      const accounts = chiaNamespace?.accounts || []
      if (accounts.length > 0) {
        try {
          const chainId = accounts[0].split(':')[1]
          return chainId === 'mainnet' ? 'mainnet' : 'testnet'
        } catch (error) {
          console.error('🍎 Error parsing chainId from account:', error)
          return 'testnet'
        }
      }
      return 'testnet'
    } catch (error) {
      console.error('🍎 Error extracting chainId:', error)
      return 'testnet'
    }
  }

  const clearIOSConnection = (): void => {
    try {
      iosConnectionState.value.isConnected = false
      iosConnectionState.value.isConnecting = false
      iosConnectionState.value.isFullyReady = false
      iosConnectionState.value.session = null
      iosConnectionState.value.accounts = []
      iosConnectionState.value.chainId = null
      iosConnectionState.value.error = null
      iosConnectionState.value.connectionAttempts = 0
      iosConnectionState.value.lastConnectionAttempt = null
      iosConnectionState.value.isHealing = false
      iosConnectionState.value.websocketStatus = 'disconnected'
      iosConnectionState.value.walletInfo = {
        address: null,
        balance: null,
        network: null,
        fingerprint: null,
      }
      iosConnectionState.value.isWalletInfoLoaded = false

      // Clear persisted session from localStorage
      try {
        localStorage.removeItem('walletconnect-session')
        console.log('🍎 Cleared persisted session from localStorage')
      } catch (error) {
        console.error('🍎 Failed to clear persisted session from localStorage:', error)
        // Don't throw - continue
      }
    } catch (error) {
      console.error('🍎 Error in clearIOSConnection:', error)
      // Don't throw - prevent page refresh
    }
  }

  const resetIOSConnectionState = (): void => {
    try {
      iosConnectionState.value.isConnecting = false
      iosConnectionState.value.error = null
    } catch (error) {
      console.error('🍎 Error in resetIOSConnectionState:', error)
      // Don't throw - prevent page refresh
    }
  }

  // Watch for connection state changes and trigger healing if needed
  watch(
    () => iosConnectionState.value.websocketStatus,
    (newStatus, oldStatus) => {
      try {
        if (
          newStatus === 'error' &&
          oldStatus === 'connected' &&
          iosConnectionState.value.isConnected
        ) {
          console.log('🍎 WebSocket error detected, triggering healing...')
          healConnection().catch(error => {
            console.error('🍎 Error in healing connection:', error)
            // Don't throw - prevent page refresh
          })
        }
      } catch (error) {
        console.error('🍎 Error in websocket status watcher:', error)
        // Don't throw - prevent page refresh
      }
    }
  )

  // Core wallet connection methods for iOS
  const openModal = async (): Promise<void> => {
    try {
      console.log('🍎 iOS openModal called')
      await openModalMutation.mutateAsync()
    } catch (error) {
      console.error('🍎 iOS openModal error:', error)
      // Don't throw - prevent page refresh
    }
  }

  const connect = async (session: WalletConnectSession): Promise<void> => {
    try {
      console.log('🍎 iOS connect called')
      await connectMutation.mutateAsync(session)
    } catch (error) {
      console.error('🍎 iOS connect error:', error)
      // Don't throw - prevent page refresh
    }
  }

  const disconnect = async (): Promise<void> => {
    try {
      console.log('🍎 iOS disconnect called')
      await disconnectMutation.mutateAsync()
    } catch (error) {
      console.error('🍎 iOS disconnect error:', error)
      // Don't throw - prevent page refresh
    }
  }

  const restoreSessions = async (): Promise<void> => {
    try {
      console.log('🍎 iOS restoreSessions called')
      await restoreSessionsMutation.mutateAsync()
    } catch (error) {
      console.error('🍎 iOS restoreSessions error:', error)
      // Don't throw - prevent page refresh
    }
  }

  const refreshSession = async (): Promise<void> => {
    try {
      console.log('🍎 iOS refreshSession called')
      if (iosConnectionState.value.session) {
        await fetchWalletInfo(iosConnectionState.value.session)
      }
    } catch (error) {
      console.error('🍎 iOS refreshSession error:', error)
      // Don't throw - prevent page refresh
    }
  }

  return {
    // Core connection state
    connection: connectionQuery,
    state: computed(() => iosConnectionState.value),

    // Core wallet methods
    openModal,
    connect,
    disconnect,
    restoreSessions,
    refreshSession,
    healConnection,
    resetConnectionState: resetIOSConnectionState,

    // Status indicators
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isOpeningModal: openModalMutation.isPending,
    isHealing: computed(() => iosConnectionState.value.isHealing),
    websocketStatus: computed(() => iosConnectionState.value.websocketStatus),
    connectionAttempts: computed(() => iosConnectionState.value.connectionAttempts),

    // Wallet info
    walletInfo: computed(() => iosConnectionState.value.walletInfo),
    isWalletInfoLoaded: computed(() => iosConnectionState.value.isWalletInfoLoaded),
  }
}
