# WalletConnect Persistence Implementation with TanStack Query

## Overview

This implementation provides proper persistence for WalletConnect sessions using TanStack Query, avoiding the common issues with trying to persist non-serializable objects like SignClient instances and WebSocket connections.

## Key Components

### 1. WalletConnectPersistenceService.ts

- **Purpose**: Manages serializable session data persistence
- **Storage**: Uses localStorage for session data
- **Features**:
  - Saves only serializable session data (SessionTypes.Struct)
  - Validates session expiry
  - Provides session restoration
  - Clears expired sessions automatically

### 2. Updated InstanceDataService.ts

- **Changes**:
  - Removed `meta: { persist: true }` from queries
  - Added persistence service integration
  - Added event listeners for session management
  - Proper initialization flow

### 3. Updated SessionDataService.ts

- **Changes**:
  - Integrated with persistence service
  - Automatic session restoration on service creation
  - Manual persistence handling instead of TanStack Query persistence
  - Added disconnect functionality

### 4. Updated ConnectionDataService.ts

- **Changes**:
  - Removed `meta: { persist: true }` (connection data is temporary)
  - Cleaner separation of concerns

### 5. Updated main.ts

- **Changes**:
  - Added WalletConnect persistence initialization on app startup
  - Proper service initialization order

## How It Works

### Session Persistence Flow

1. **On Session Creation**:

   ```typescript
   // SessionDataService saves session when approval completes
   persistenceService.saveSession(result)
   ```

2. **On App Startup**:

   ```typescript
   // main.ts initializes persistence service
   const walletConnectPersistence = useWalletConnectPersistenceService()
   walletConnectPersistence.initialize()
   ```

3. **On Service Creation**:

   ```typescript
   // SessionDataService restores session from persistence
   initializeFromPersistence()
   ```

4. **On Session Events**:
   ```typescript
   // InstanceDataService listens for session events
   signClient.on('session_delete', () => persistenceService.clearSession())
   signClient.on('session_expire', () => persistenceService.clearSession())
   ```

### Data Structure

The persistence service stores only serializable data:

```typescript
interface PersistedWalletConnectData {
  session: SessionTypes.Struct | null
  lastConnectedAt: number
  projectId: string
}
```

## Benefits

1. **Proper Serialization**: Only stores serializable session data, not complex objects
2. **Automatic Cleanup**: Clears expired sessions automatically
3. **Event-Driven**: Responds to WalletConnect events for session management
4. **TanStack Query Integration**: Works seamlessly with existing query structure
5. **Type Safety**: Full TypeScript support with proper types

## Testing

Use the `WalletConnectPersistenceTest.vue` component to test:

- Session saving and loading
- Session expiry handling
- Persistence across browser refreshes
- Debug information display

## Usage

The persistence is automatically handled by the services. No additional setup is required beyond the existing WalletConnect integration.

### Manual Session Management

```typescript
// Get persistence service
const persistenceService = useWalletConnectPersistenceService()

// Check if session is valid
if (persistenceService.hasValidSession.value) {
  // Session is valid and restored
}

// Clear session manually
persistenceService.clearSession()

// Get session info
const session = persistenceService.currentSession.value
const expiry = persistenceService.sessionExpiry.value
```

## Migration Notes

- Removed `meta: { persist: true }` from WalletConnect queries
- Added manual persistence handling in services
- Session restoration happens automatically on service initialization
- No breaking changes to existing component APIs
