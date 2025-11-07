'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import SignClient from '@walletconnect/sign-client'
import { WalletConnectModal } from '@walletconnect/modal'
import type { SessionTypes } from '@walletconnect/types'
import { SIGN_CLIENT_CONFIG, MODAL_CONFIG, CHIA_CHAIN_ID, REQUIRED_NAMESPACES } from '../constants'
import { CustomWalletConnectStorage } from '../storage'

const STORAGE_PREFIX = 'chia-wc-data'

interface WalletConnectInstance {
  signClient: SignClient
  modal: WalletConnectModal
}

const initializeSignClient = async (): Promise<WalletConnectInstance> => {
  const projectId = SIGN_CLIENT_CONFIG.projectId?.trim() || ''

  if (!projectId) {
    throw new Error(
      'WalletConnect Project ID is missing. Please set WALLET_CONNECT_PROJECT_ID in your .env.local file.'
    )
  }

  // Verify project ID is not the default empty string
  if (projectId === '' || projectId.length < 10) {
    throw new Error(
      `Invalid WalletConnect Project ID. Current value: "${projectId}". Please check your .env.local file.`
    )
  }

  const signClient = await SignClient.init({
    ...SIGN_CLIENT_CONFIG,
    storage: new CustomWalletConnectStorage(STORAGE_PREFIX),
  })

  const modal = new WalletConnectModal(MODAL_CONFIG)

  return { signClient, modal }
}

export function useWalletConnect() {
  const queryClient = useQueryClient()
  const [uri, setUri] = useState<string | null>(null)
  const [session, setSession] = useState<SessionTypes.Struct | null>(null)

  const instanceQuery = useQuery({
    queryKey: ['walletConnect', 'instance'],
    queryFn: initializeSignClient,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const connectMutation = useMutation({
    mutationFn: async () => {
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
          await signClient.ping({ topic: lastSession.topic })
          setSession(lastSession)
          return lastSession
        } catch {
          // Session expired, continue with new connection
        }
      }

      try {
        const { uri: connectionUri, approval } = await signClient.connect({
          requiredNamespaces: REQUIRED_NAMESPACES,
        })

        if (connectionUri) {
          setUri(connectionUri)
          modal.openModal({ uri: connectionUri })

          try {
            const newSession = await approval()
            setSession(newSession)
            setUri(null)
            modal.closeModal()
            return newSession
          } catch (approvalError) {
            // Close modal on approval error
            modal.closeModal()
            setUri(null)

            // Handle approval-specific errors
            if (approvalError instanceof Error) {
              if (
                approvalError.message.includes('User rejected') ||
                approvalError.message.includes('rejected')
              ) {
                throw new Error(
                  'Connection rejected. Please try again and approve the connection in your wallet.'
                )
              }
              if (
                approvalError.message.includes('timeout') ||
                approvalError.message.includes('expired')
              ) {
                throw new Error('Connection timeout. Please try again.')
              }
            }
            throw approvalError
          }
        }

        throw new Error('Failed to get connection URI')
      } catch (error) {
        // Close modal on any error
        if (instanceQuery.data) {
          instanceQuery.data.modal.closeModal()
        }
        setUri(null)

        // Handle WalletConnect specific errors
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

      return (result as { address?: string })?.address
    },
  })

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
      queryClient.invalidateQueries({ queryKey: ['walletConnect'] })
    },
  })

  const connect = useCallback(() => {
    connectMutation.mutate()
  }, [connectMutation])

  const disconnect = useCallback(() => {
    disconnectMutation.mutate()
  }, [disconnectMutation])

  const getAddress = useCallback(() => {
    getAddressMutation.mutate()
  }, [getAddressMutation])

  // Restore session on mount
  useEffect(() => {
    if (instanceQuery.data && !session) {
      const { signClient } = instanceQuery.data
      const lastSessions = signClient.session.getAll()
      if (lastSessions.length > 0) {
        const lastSession = lastSessions[lastSessions.length - 1]
        signClient
          .ping({ topic: lastSession.topic })
          .then(() => {
            setSession(lastSession)
          })
          .catch(() => {
            // Session expired, ignore
          })
      }
    }
  }, [instanceQuery.data, session])

  useEffect(() => {
    if (instanceQuery.data && uri && !connectMutation.isPending) {
      instanceQuery.data.modal.openModal({ uri })
    }
  }, [uri, instanceQuery.data, connectMutation.isPending])

  return {
    isInitializing: instanceQuery.isLoading,
    isConnecting: connectMutation.isPending,
    isConnected: !!session,
    uri,
    session,
    address: getAddressMutation.data,
    error:
      instanceQuery.error ||
      connectMutation.error ||
      getAddressMutation.error ||
      disconnectMutation.error,
    connect,
    disconnect,
    getAddress,
  }
}
