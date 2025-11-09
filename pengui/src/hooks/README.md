# WebSocket Hook with TanStack Query

This hook integrates WebSocket functionality with TanStack Query for real-time data updates.

## Installation

The `react-use-websocket` package is already installed and configured.

## Usage

### Basic Example

```tsx
'use client'

import { useWebSocket } from '@/hooks'
import { useQuery } from '@tanstack/react-query'

function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => fetch('/api/messages').then((res) => res.json()),
  })

  // Connect to WebSocket
  const { lastJsonMessage, isConnected, sendJsonMessage } = useWebSocket({
    url: 'wss://your-websocket-url',
    onMessage: (data) => {
      console.log('Received message:', data)
      // The hook automatically invalidates queries when messages are received
    },
    onOpen: () => {
      console.log('WebSocket connected')
    },
    onClose: () => {
      console.log('WebSocket disconnected')
    },
  })

  const handleSendMessage = () => {
    sendJsonMessage({ type: 'message', content: 'Hello!' })
  }

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={handleSendMessage}>Send Message</button>
      {/* Your component content */}
    </div>
  )
}
```

### Advanced Example with Query Updates

```tsx
'use client'

import { useWebSocket } from '@/hooks'
import { useQuery } from '@tanstack/react-query'

function RealTimeDataComponent() {
  const { data } = useQuery({
    queryKey: ['realtime-data'],
    queryKey: async () => {
      const res = await fetch('/api/data')
      return res.json()
    },
  })

  const { updateQueryData, invalidateQuery } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || null,
    onMessage: (message) => {
      // Update specific query data based on message type
      if (message.type === 'data-update') {
        updateQueryData(['realtime-data'], (old) => ({
          ...old,
          ...message.payload,
        }))
      } else if (message.type === 'refresh') {
        // Invalidate and refetch
        invalidateQuery(['realtime-data'])
      }
    },
  })

  return <div>{/* Render your data */}</div>
}
```

## API

### `useWebSocket(options)`

#### Options

- `url: string | null` - WebSocket URL to connect to
- `onMessage?: (data: any) => void` - Callback when message is received
- `onOpen?: () => void` - Callback when connection opens
- `onClose?: () => void` - Callback when connection closes
- `onError?: (error: Event) => void` - Callback when error occurs
- `shouldReconnect?: boolean` - Whether to automatically reconnect (default: `true`)
- `reconnectInterval?: number` - Reconnection interval in ms (default: `3000`)
- `reconnectAttempts?: number` - Maximum reconnection attempts (default: `5`)

#### Returns

- `sendMessage(message: string)` - Send a text message
- `sendJsonMessage(message: object)` - Send a JSON message
- `lastMessage: MessageEvent | null` - Last received message
- `lastJsonMessage: any` - Last received JSON message (parsed)
- `readyState: number` - WebSocket ready state
- `getWebSocket(): WebSocket | null` - Get the underlying WebSocket instance
- `invalidateQuery(queryKey: string[])` - Invalidate specific TanStack Query
- `updateQueryData<T>(queryKey: string[], updater: (old: T | undefined) => T)` - Update query data directly
- `isConnected: boolean` - Whether WebSocket is connected
- `isConnecting: boolean` - Whether WebSocket is connecting
- `isDisconnected: boolean` - Whether WebSocket is disconnected

## Features

- ✅ Automatic query invalidation on WebSocket messages
- ✅ Automatic reconnection with configurable attempts
- ✅ TypeScript support
- ✅ Direct query data updates
- ✅ Connection state helpers
- ✅ JSON message parsing
- ✅ Error handling
