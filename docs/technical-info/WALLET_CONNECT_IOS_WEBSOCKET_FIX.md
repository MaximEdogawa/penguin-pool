# WalletConnect iOS WebSocket Connection Issue

## Problem Description

When using WalletConnect on iOS devices, WebSocket connections to the WalletConnect relay server (`wss://relay.walletconnect.com`) are lost when the user switches between apps. This results in the following error:

```
WebSocket connection to 'wss://relay.walletconnect.com/...' failed: The network connection was lost.
```

This issue occurs consistently when:

1. User opens the dApp in Safari on iOS
2. User switches to another app (e.g., wallet app) to approve a connection
3. User returns to the dApp
4. The dApp attempts to reconnect or establish a new connection

## Root Cause

### iOS Background Execution Limitations

iOS suspends network activities, including WebSocket connections, when an app transitions to the background. This is a system-level behavior designed to conserve battery and system resources.

### Technical Details

1. **WebSocket Connection Termination**: When the Safari browser (or any iOS app) goes to background, iOS terminates active WebSocket connections to the relay server.

2. **Stale Connection State**: The WalletConnect `SignClient` instance persists in memory, but the underlying WebSocket connection is dead. The `signClient.core.relayer.connected` property may still report `true` even though the connection is non-functional.

3. **Expired Authentication Tokens**: The JWT authentication token in the WebSocket URL has an expiration time. After app switching, the token may be expired or invalid, causing connection failures.

4. **No Automatic Reconnection**: The WalletConnect SDK doesn't automatically detect and reconnect when the app returns to foreground. The SDK expects the connection to remain active, but iOS has terminated it.

## Solution

### Implementation

The solution implements app lifecycle event handling that detects when the iOS app returns to foreground and automatically reinitializes the WalletConnect connection.

**Location**: `pengui/src/features/walletConnect/WalletContext.tsx`

### How It Works

1. **Visibility Change Detection**:
   - Listens for `visibilitychange` events (when Safari tab becomes visible/hidden)
   - Also listens for `focus` events as a backup mechanism
   - Only active on iOS devices

2. **Connection Validation**:
   When the app becomes visible:
   - Checks if the relayer WebSocket is actually connected
   - If disconnected → reinitializes SignClient (creates fresh connection with new auth token)
   - If connected → verifies with a ping test; if ping fails, reinitializes

3. **Reconnection Prevention**:
   - Uses a flag to prevent multiple simultaneous reconnection attempts
   - Waits 2 seconds after reconnection before allowing another attempt

### Code Implementation

```typescript
// Handle app visibility changes on iOS - reinitialize SignClient when app returns to foreground
// This fixes the WebSocket connection issue when switching apps on iOS
useEffect(() => {
  if (!isIOS()) return

  // Track if we're currently handling a reconnection to avoid multiple simultaneous attempts
  let isReconnecting = false

  const handleVisibilityChange = async () => {
    // When app becomes visible again after being hidden
    if (document.visibilityState === 'visible' && instanceQuery.data && !isReconnecting) {
      isReconnecting = true

      try {
        const { signClient } = instanceQuery.data

        // Check if relayer is actually connected
        // On iOS, the connection state may be stale after app switching
        const isRelayerConnected = signClient.core.relayer.connected

        if (!isRelayerConnected) {
          // Force reinitialize SignClient by invalidating the query
          // This creates a fresh connection with a new auth token
          await queryClient.invalidateQueries({ queryKey: ['walletConnect', 'chia', 'instance'] })
        } else {
          // Relayer appears connected, but verify it's actually working
          // by checking if we can ping an existing session
          if (session) {
            try {
              const pingPromise = signClient.ping({ topic: session.topic })
              const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Ping timeout')), 3000)
              })
              await Promise.race([pingPromise, timeoutPromise])
            } catch {
              // Ping failed, connection is dead - reinitialize
              await queryClient.invalidateQueries({
                queryKey: ['walletConnect', 'chia', 'instance'],
              })
            }
          }
        }
      } finally {
        // Reset reconnecting flag after a delay to allow reinitialization to complete
        setTimeout(() => {
          isReconnecting = false
        }, 2000)
      }
    }
  }

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Also listen for focus events as a backup
  const handleFocus = () => {
    if (instanceQuery.data) {
      handleVisibilityChange()
    }
  }
  window.addEventListener('focus', handleFocus)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleFocus)
  }
}, [instanceQuery.data, session, queryClient])
```

## Why This Solution Works

1. **Automatic Detection**: The solution automatically detects when the app returns to foreground, eliminating the need for manual reconnection.

2. **Fresh Connection**: Reinitializing the SignClient creates a completely fresh WebSocket connection with a new authentication token, bypassing any stale state.

3. **Connection Verification**: The ping test ensures that even if the connection state reports as connected, we verify it's actually functional.

4. **Prevents Race Conditions**: The `isReconnecting` flag prevents multiple simultaneous reconnection attempts that could cause conflicts.

## Testing

To verify the fix works:

1. Open the dApp in Safari on an iOS device
2. Initiate a WalletConnect connection
3. Switch to another app (e.g., wallet app)
4. Return to the dApp
5. The connection should automatically reinitialize
6. Try connecting to the wallet again - it should work without WebSocket errors

## Related Issues

### Safari Experimental Features

Some users have reported that disabling the "NSURLSession WebSocket" experimental feature in Safari can help with WebSocket stability:

- Navigate to: **Settings** > **Safari** > **Advanced** > **Experimental Features**
- Disable: **NSURLSession WebSocket**

However, this is a user-side workaround and not a solution for the dApp itself.

### Alternative Solutions Considered

1. **Manual Reconnection**: Attempting to manually reconnect the WebSocket transport. This was not reliable because the SDK doesn't expose a direct reconnect method.

2. **Connection State Monitoring**: Continuously monitoring connection state. This was too resource-intensive and didn't solve the root cause.

3. **Link Mode**: Using WalletConnect's Link Mode with Universal Links. This requires wallet app support and doesn't solve the WebSocket issue for existing implementations.

## References

- [WalletConnect iOS Best Practices](https://docs.walletconnect.network/wallet-sdk/ios/best-practices)
- [iOS WebSocket Background Behavior](https://stackoverflow.com/questions/63226301/websocket-connections-on-iphone-get-lost-when-safari-is-un-focused-hidden)
- [WalletConnect Link Mode](https://docs.walletconnect.network/wallet-sdk/features/link-mode)

## Maintenance Notes

- This solution is iOS-specific and only activates when `isIOS()` returns `true`
- The reconnection logic uses React Query's `invalidateQueries` to trigger SignClient reinitialization
- The 2-second delay for the reconnection flag is a balance between allowing reinitialization to complete and being responsive to user actions
- The 3-second ping timeout prevents hanging on dead connections

## Future Improvements

Potential enhancements:

1. Add user-facing feedback when reconnection is in progress
2. Implement exponential backoff for reconnection attempts
3. Add metrics/logging for reconnection success rates
4. Consider implementing Link Mode as an alternative transport mechanism
