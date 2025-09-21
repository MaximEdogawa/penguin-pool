# WalletConnect Unified Migration Guide

This guide explains how to use the unified WalletConnect implementation that combines the best features from both the original and V2 implementations with improved iOS support and better architecture.

## What's New in the Unified Implementation

### 🍎 Enhanced iOS Support

- **Automatic iOS Detection**: The service automatically detects iOS devices and applies optimizations
- **WebSocket Relay Priority**: iOS uses WebSocket relays first for better URI generation
- **Extended Timeouts**: Longer connection timeouts for iOS devices
- **Improved Error Handling**: Better error messages and recovery for iOS-specific issues

### 🏗️ Better Architecture

- **Composable-Based**: Uses Vue 3 composables for better state management
- **Automatic Reconnection**: Built-in reconnection logic with exponential backoff
- **Health Monitoring**: Continuous health checks to detect connection issues
- **Event-Driven**: Clean event system for better integration

### 🚀 Simplified API

- **Less Code**: Significantly reduced boilerplate code
- **Better TypeScript Support**: Improved type safety and IntelliSense
- **Cleaner State Management**: Reactive state that automatically syncs
- **Easier Testing**: Composable architecture makes testing easier

## Migration Steps

### 1. Update Imports

**Before (Legacy):**

```typescript
import { useWalletConnectService } from '../services/WalletConnectService'
import { useWalletConnectStore } from '../stores/walletConnectStore'
```

**After (Unified):**

```typescript
import { useWalletConnectService } from '../services/WalletConnectService'
import { useWalletConnectStore } from '../stores/walletConnectStore'
// The same imports, but now with V2 enhancements built-in
```

### 2. Update Store Usage

**Before (Legacy):**

```typescript
const store = useWalletConnectStore()

// Manual state management
const isConnected = ref(false)
const isConnecting = ref(false)
const session = ref(null)

// Manual event listeners
const setupEventListeners = () => {
  // Complex event listener setup
}
```

**After (V2):**

```typescript
const store = useWalletConnectStoreV2()

// Automatic state management
const { isConnected, isConnecting, session, accounts, chainId } = store

// Automatic event listeners (no setup needed)
```

### 3. Update Connection Logic

**Before (Legacy):**

```typescript
const connect = async () => {
  try {
    isConnecting.value = true
    const result = await walletConnectService.connect()

    if (result) {
      const sessionResult = await result.approval()
      if (sessionResult) {
        // Manual state updates
        session.value = sessionResult
        isConnected.value = true
      }
    }
  } catch (error) {
    // Manual error handling
  } finally {
    isConnecting.value = false
  }
}
```

**After (V2):**

```typescript
const connect = async () => {
  try {
    const result = await store.connect()
    if (result.success) {
      // State is automatically updated
      console.log('Connected!', store.session)
    }
  } catch (error) {
    // Error is automatically handled and stored
    console.error('Connection failed:', store.error)
  }
}
```

### 4. Update Service Usage

**Before (Legacy):**

```typescript
const walletService = useWalletConnectService

// Manual initialization
await walletService.initialize()

// Manual connection
const result = await walletService.connect()
if (result) {
  const session = await result.approval()
  // Manual state management
}
```

**After (V2):**

```typescript
const walletService = useWalletConnectServiceV2

// Automatic initialization with reconnection
await walletService.initialize()

// Simplified connection
const result = await walletService.connect()
if (result.success) {
  // State is automatically managed
  console.log('Connected!', walletService.getSession())
}
```

## New Features

### Automatic Reconnection

```typescript
// V2 automatically handles reconnection
const store = useWalletConnectStoreV2()

// No need to manually handle reconnection
// The service will automatically retry failed connections
```

### Health Monitoring

```typescript
// V2 includes built-in health monitoring
const store = useWalletConnectStoreV2()

// Health checks run automatically
// Connection issues are detected and handled automatically
```

### iOS Optimizations

```typescript
// V2 automatically detects iOS and applies optimizations
const store = useWalletConnectStoreV2()

// iOS-specific features:
// - Extended timeouts
// - WebSocket relay priority
// - Enhanced error handling
// - Better reconnection logic
```

## Breaking Changes

### 1. Service API Changes

- `connect()` now returns a `ConnectionResult` object instead of a connection object
- `initialize()` is now required before using other methods
- Event listeners are set up automatically

### 2. Store API Changes

- State is now reactive and automatically managed
- No need to manually sync state between service and store
- Event listeners are set up automatically

### 3. Type Changes

- Some types have been updated for better type safety
- New types added for better state management

## Migration Checklist

- [ ] Update imports to use V2 services and stores
- [ ] Remove manual state management code
- [ ] Remove manual event listener setup
- [ ] Update connection logic to use new API
- [ ] Test on iOS devices
- [ ] Update error handling to use new error state
- [ ] Remove legacy reconnection code (now automatic)
- [ ] Update tests to use new API

## Examples

See `src/features/walletConnect/examples/usage-example.ts` for complete usage examples.

## Support

If you encounter issues during migration, please check:

1. All imports are updated to V2
2. State management is using the new reactive system
3. Event listeners are not manually set up
4. iOS-specific code is removed (now automatic)

The V2 implementation is backward compatible with the legacy API, so you can migrate gradually.
