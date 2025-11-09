'use client'

import useWebSocketHook from 'react-use-websocket'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'

interface UseWebSocketOptions {
  url: string | null
  onMessage?: (data: unknown) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  shouldReconnect?: boolean
  reconnectInterval?: number
  reconnectAttempts?: number
}

/**
 * Custom hook that integrates WebSocket with TanStack Query
 * Automatically invalidates queries when WebSocket messages are received
 */
export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  shouldReconnect = true,
  reconnectInterval = 3000,
  reconnectAttempts = 5,
}: UseWebSocketOptions) {
  const queryClient = useQueryClient()

  const { sendMessage, sendJsonMessage, lastMessage, lastJsonMessage, readyState, getWebSocket } =
    useWebSocketHook(url, {
      shouldReconnect: shouldReconnect ? () => true : () => false,
      reconnectInterval,
      reconnectAttempts,
      onOpen,
      onClose,
      onError,
    })

  // Handle incoming messages and update TanStack Query cache
  useEffect(() => {
    if (lastJsonMessage) {
      // Call custom message handler if provided
      if (onMessage) {
        onMessage(lastJsonMessage)
      }

      // Invalidate all queries to trigger refetch
      // You can customize this to invalidate specific queries based on message content
      queryClient.invalidateQueries()
    }
  }, [lastJsonMessage, onMessage, queryClient])

  // Helper function to invalidate specific queries
  const invalidateQuery = useCallback(
    (queryKey: string[]) => {
      queryClient.invalidateQueries({ queryKey })
    },
    [queryClient]
  )

  // Helper function to update query data directly
  const updateQueryData = useCallback(
    <T>(queryKey: string[], updater: (old: T | undefined) => T) => {
      queryClient.setQueryData<T>(queryKey, updater)
    },
    [queryClient]
  )

  return {
    sendMessage,
    sendJsonMessage,
    lastMessage,
    lastJsonMessage,
    readyState,
    getWebSocket,
    invalidateQuery,
    updateQueryData,
    isConnected: readyState === 1, // WebSocket.OPEN
    isConnecting: readyState === 0, // WebSocket.CONNECTING
    isDisconnected: readyState === 3, // WebSocket.CLOSED
  }
}
