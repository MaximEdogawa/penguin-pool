// Phase 1: Stub implementation - WebSocket will be added in Phase 2
'use client'

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
 * Phase 1: Stub implementation
 */
export function useWebSocket(_options: UseWebSocketOptions) {
  return {
    sendMessage: () => {},
    sendJsonMessage: () => {},
    lastMessage: null,
    lastJsonMessage: null,
    readyState: 3, // WebSocket.CLOSED
    getWebSocket: () => null,
    invalidateQuery: () => {},
    updateQueryData: () => {},
    isConnected: false,
    isConnecting: false,
    isDisconnected: true,
  }
}
