'use client'

import { logger } from '@/lib/logger'
import { CustomWalletConnectStorage } from '@/lib/walletConnect/storage'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { WalletConnectModal } from '@walletconnect/modal'
import SignClient from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  CHIA_CHAIN_ID,
  MODAL_CONFIG,
  OPTIONAL_NAMESPACES,
  SIGN_CLIENT_CONFIG,
} from './constants/wallet-connect'

const STORAGE_PREFIX = 'chia-wc-data'

interface WalletConnectInstance {
  signClient: SignClient
  modal: WalletConnectModal
}

const initializeSignClient = async (): Promise<WalletConnectInstance> => {
  const projectId = SIGN_CLIENT_CONFIG.projectId?.trim() || ''

  if (!projectId) {
    throw new Error(
      'WalletConnect Project ID is missing. Please set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID in your .env.local file.'
    )
  }

  if (projectId === '' || projectId.length < 10) {
    throw new Error(
      `Invalid WalletConnect Project ID. Current value: "${projectId}". Please check your .env.local file.`
    )
  }

  const signClient = await SignClient.init({
    ...SIGN_CLIENT_CONFIG,
    storage: new CustomWalletConnectStorage(STORAGE_PREFIX),
  })

  // Suppress relay message processing errors - these are internal WalletConnect errors
  // that occur when processing stale/invalid messages from the relay server
  signClient.core.relayer.events.on('relayer:error', (error) => {
    // Silently ignore relay errors - they're not actionable by the user
    // These occur when processing stale/invalid messages from the relay server
    // Only log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug('WalletConnect relay error (suppressed)', error)
    }
  })

  // Don't aggressively clean up sessions on init - this causes relay errors
  // Instead, let WalletConnect handle session management and only clean up
  // when we actually try to use a session (lazy cleanup)

  const modal = new WalletConnectModal(MODAL_CONFIG)

  return { signClient, modal }
}

interface WalletContextType {
  address: string | null
  connectWallet: (method: string, autoConnect: boolean) => Promise<void>
  disconnect: () => Promise<void>
  walletConnectUri: string | null
  isConnecting: boolean
  isConnected: boolean
  error: unknown
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [uri, setUri] = useState<string | null>(null)
  const [session, setSession] = useState<SessionTypes.Struct | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isManuallyCancelled, setIsManuallyCancelled] = useState(false)
  const hasAttemptedAddressFetch = useRef(false)
  const approvalCancelledRef = useRef(false)

  const instanceQuery = useQuery({
    queryKey: ['walletConnect', 'chia', 'instance'],
    queryFn: initializeSignClient,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const connectMutation = useMutation({
    mutationFn: async () => {
      // Reset cancellation flags at the start of each connection attempt
      approvalCancelledRef.current = false
      setIsManuallyCancelled(false)

      if (instanceQuery.error) {
        throw instanceQuery.error
      }

      if (!instanceQuery.data) {
        throw new Error('SignClient is not initialized')
      }

      const { signClient, modal } = instanceQuery.data

      const lastSessions = signClient.session.getAll()
      if (lastSessions.length > 0) {
        const lastSession = lastSessions[lastSessions.length - 1]
        try {
          // Use a timeout to prevent hanging on invalid sessions
          const pingPromise = signClient.ping({ topic: lastSession.topic })
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Ping timeout')), 3000)
          })
          await Promise.race([pingPromise, timeoutPromise])
          setSession(lastSession)
          return lastSession
        } catch {
          // Session expired or invalid, remove it and continue with new connection
          try {
            await signClient.disconnect({
              topic: lastSession.topic,
              reason: {
                code: 6000,
                message: 'SESSION_EXPIRED',
              },
            })
          } catch {
            // Ignore disconnect errors for invalid sessions
          }
        }
      }

      try {
        const { uri: connectionUri, approval } = await signClient.connect({
          optionalNamespaces: OPTIONAL_NAMESPACES,
        })

        if (connectionUri) {
          setUri(connectionUri)
          approvalCancelledRef.current = false
          modal.openModal({ uri: connectionUri })

          try {
            // Race approval promise with cancellation check
            const cancellationCheck = new Promise<null>((resolve) => {
              const checkInterval = setInterval(() => {
                if (approvalCancelledRef.current) {
                  clearInterval(checkInterval)
                  resolve(null)
                }
              }, 100) // Check every 100ms

              // Clear interval after 5 minutes (safety timeout)
              setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000)
            })

            const newSession = await Promise.race([approval(), cancellationCheck])

            // Check if approval was cancelled while waiting
            if (approvalCancelledRef.current || newSession === null) {
              modal.closeModal()
              setUri(null)
              return null
            }
            setSession(newSession)
            setUri(null)
            modal.closeModal()
            return newSession
          } catch (approvalError) {
            modal.closeModal()
            setUri(null)

            // If approval was cancelled (modal closed), don't throw error
            if (approvalCancelledRef.current) {
              return null
            }

            if (approvalError instanceof Error) {
              // Check if user closed the modal (not a rejection)
              // WalletConnect throws different errors for modal close vs rejection
              const errorMsg = approvalError.message.toLowerCase()
              if (
                errorMsg.includes('user closed') ||
                errorMsg.includes('modal closed') ||
                errorMsg.includes('closed modal') ||
                errorMsg.includes('connection closed') ||
                errorMsg.includes('cancelled')
              ) {
                // User closed modal - don't throw error, just reset state
                // This allows them to try connecting again
                return null
              }
              if (errorMsg.includes('user rejected') || errorMsg.includes('rejected')) {
                throw new Error(
                  'Connection rejected. Please try again and approve the connection in your wallet.'
                )
              }
              if (errorMsg.includes('timeout') || errorMsg.includes('expired')) {
                throw new Error('Connection timeout. Please try again.')
              }
            }
            // For other errors, check if it's a modal close by error code or type
            // WalletConnect may use specific error codes for modal close
            throw approvalError
          }
        }

        throw new Error('Failed to get connection URI')
      } catch (error) {
        if (instanceQuery.data) {
          instanceQuery.data.modal.closeModal()
        }
        setUri(null)

        if (error instanceof Error) {
          if (error.message.includes('Unauthorized') || error.message.includes('invalid key')) {
            throw new Error(
              'WalletConnect authentication failed. Please check your Project ID configuration.'
            )
          }
          if (error.message.includes('socket') || error.message.includes('WebSocket')) {
            throw new Error(
              'Connection error. Please check your internet connection and try again.'
            )
          }
          if (error.message.includes('User rejected') || error.message.includes('rejected')) {
            throw new Error(
              'Connection rejected. Please try again and approve the connection in your wallet.'
            )
          }
        }
        throw error
      }
    },
  })

  const getAddressMutation = useMutation({
    mutationFn: async () => {
      if (!instanceQuery.data || !session) {
        throw new Error('SignClient or session is not available')
      }

      // Verify session has the required method
      const chiaNamespace = session.namespaces?.chia
      if (!chiaNamespace?.methods?.includes('chia_getAddress')) {
        throw new Error('Session does not support chia_getAddress method')
      }

      const { signClient } = instanceQuery.data

      const result = await signClient.request({
        topic: session.topic,
        chainId: CHIA_CHAIN_ID,
        request: {
          method: 'chia_getAddress',
          params: {
            walletId: 1,
            newAddress: false,
          },
        },
      })

      const addr = (result as { address?: string })?.address
      if (addr) {
        setAddress(addr)
      }
      return addr
    },
    retry: false, // Don't retry on error to prevent infinite loops
  })

  const connectWallet = useCallback(
    async (method: string, autoConnect: boolean) => {
      try {
        const newSession = await connectMutation.mutateAsync()
        // Auto-fetch address after connection if we have a new session
        if (newSession && !address) {
          try {
            await getAddressMutation.mutateAsync()
          } catch {
            // Silently fail - address will be fetched later if needed
          }
        }
      } catch (error) {
        // If user closed modal, reset state silently to allow reconnection
        if (error instanceof Error && error.message.includes('closed')) {
          setUri(null)
          return
        }
        // Re-throw other errors
        throw error
      }
    },
    [connectMutation, address, getAddressMutation]
  )

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!instanceQuery.data || !session) {
        return
      }

      const { signClient } = instanceQuery.data

      await signClient.disconnect({
        topic: session.topic,
        reason: {
          code: 6000,
          message: 'USER_DISCONNECTED',
        },
      })

      setSession(null)
      setAddress(null)
      setUri(null)
      hasAttemptedAddressFetch.current = false
      queryClient.invalidateQueries({ queryKey: ['walletConnect', 'chia'] })
    },
  })

  const disconnect = useCallback(async () => {
    await disconnectMutation.mutateAsync()
  }, [disconnectMutation])

  // Restore session on mount (only once, with timeout to prevent hanging)
  useEffect(() => {
    if (instanceQuery.data && !session) {
      const { signClient } = instanceQuery.data
      const lastSessions = signClient.session.getAll()
      if (lastSessions.length > 0) {
        const lastSession = lastSessions[lastSessions.length - 1]
        // Use timeout to prevent hanging on invalid sessions
        const pingPromise = signClient.ping({ topic: lastSession.topic })
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Ping timeout')), 3000)
        })
        Promise.race([pingPromise, timeoutPromise])
          .then(() => {
            setSession(lastSession)
          })
          .catch(() => {
            // Session expired or invalid, silently ignore
            // Don't try to disconnect here to avoid relay errors
          })
      }
    }
  }, [instanceQuery.data, session])

  // Auto-fetch address when session is available (only once)
  useEffect(() => {
    if (session && !address && !hasAttemptedAddressFetch.current && instanceQuery.data) {
      // Check if session has the required method in its namespaces
      const chiaNamespace = session.namespaces?.chia
      if (chiaNamespace?.methods?.includes('chia_getAddress')) {
        hasAttemptedAddressFetch.current = true
        getAddressMutation.mutate()
      }
    }
  }, [session, address, instanceQuery.data, getAddressMutation])

  // Reset the flag when session changes or address is set
  useEffect(() => {
    if (!session || address) {
      hasAttemptedAddressFetch.current = false
    }
  }, [session, address])

  useEffect(() => {
    if (instanceQuery.data && uri && !connectMutation.isPending) {
      instanceQuery.data.modal.openModal({ uri })
    }
  }, [uri, instanceQuery.data, connectMutation.isPending])

  // Ensure button resets when URI is cleared (modal closed) and no connection exists
  useEffect(() => {
    if (!uri && !session && !address && connectMutation.isPending) {
      // URI was cleared (modal closed) but mutation is still pending - force reset
      setIsManuallyCancelled(true)
      connectMutation.reset()
    }
  }, [uri, session, address, connectMutation])

  // Listen for modal close events to reset connection state when modal is closed
  useEffect(() => {
    if (!instanceQuery.data) return

    const { modal } = instanceQuery.data
    let isSubscribed = true
    let previousModalOpen = false

    const unsubscribe = modal.subscribeModal((state) => {
      // Detect when modal transitions from open to closed
      if (previousModalOpen && !state.open && !state.loading && isSubscribed) {
        // Modal was closed - always reset state if no connection was established
        // Check if we have a session AND address to determine if connection was successful
        const hasSuccessfulConnection = session && address

        if (!hasSuccessfulConnection) {
          // No connection established - always reset everything
          approvalCancelledRef.current = true
          setIsManuallyCancelled(true) // Immediately set flag to override isPending
          setUri(null)
          // Reset mutation state immediately so button becomes clickable again
          // This will make isPending false even if the approval promise is still pending
          connectMutation.reset()
        }
      }
      previousModalOpen = state.open
    })

    return () => {
      isSubscribed = false
      unsubscribe()
    }
  }, [instanceQuery.data, session, address, connectMutation])

  return (
    <WalletContext.Provider
      value={{
        address,
        connectWallet,
        disconnect,
        walletConnectUri: uri,
        isConnecting:
          (connectMutation.isPending && !isManuallyCancelled) || instanceQuery.isLoading,
        isConnected: !!session,
        error:
          instanceQuery.error ||
          connectMutation.error ||
          getAddressMutation.error ||
          disconnectMutation.error,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
