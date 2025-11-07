'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import SignClient from '@walletconnect/sign-client'
import { WalletConnectModal } from '@walletconnect/modal'
import type { SessionTypes } from '@walletconnect/types'
import { SIGN_CLIENT_CONFIG, MODAL_CONFIG, CHIA_CHAIN_ID } from '../constants'
import { CustomWalletConnectStorage } from '../storage'

const STORAGE_PREFIX = 'chia-wc-data'

interface WalletConnectInstance {
  signClient: SignClient
  modal: WalletConnectModal
}

const initializeSignClient = async (): Promise<WalletConnectInstance> => {
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

      const { uri: connectionUri, approval } = await signClient.connect({
        requiredNamespaces: {
          chia: {
            methods: [
              'chia_getCurrentAddress',
              'chia_createOfferForIds',
              'chia_getWallets',
              'chia_addCATToken',
            ],
            chains: [CHIA_CHAIN_ID],
            events: [],
          },
        },
      })

      if (connectionUri) {
        setUri(connectionUri)
        modal.openModal({ uri: connectionUri })
        const newSession = await approval()
        setSession(newSession)
        setUri(null)
        return newSession
      }

      throw new Error('Failed to get connection URI')
    },
  })

  const getAddressMutation = useMutation({
    mutationFn: async () => {
      if (!instanceQuery.data || !session) {
        throw new Error('SignClient or session is not available')
      }

      const { signClient } = instanceQuery.data
      const fingerprint = session.namespaces.chia.accounts[0].split(':').pop()

      const result = await signClient.request({
        topic: session.topic,
        chainId: CHIA_CHAIN_ID,
        request: {
          method: 'chia_getCurrentAddress',
          params: {
            fingerprint,
            wallet_id: 0,
            new_address: false,
          },
        },
      })

      return (result as { data?: string })?.data
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
    error: connectMutation.error || getAddressMutation.error || disconnectMutation.error,
    connect,
    disconnect,
    getAddress,
  }
}
