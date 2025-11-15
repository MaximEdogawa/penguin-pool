# Phase 2: Wallet Connect Implementation Plan

## ✅ Current Status (Completed)

1. **Package Installation**
   - ✅ `@maximedogawa/chia-wallet-connect-react@^0.0.2` installed from npm
   - ✅ Build works with Turbopack (no webpack needed)
   - ✅ All imports updated to use correct package name

2. **Core Setup**
   - ✅ Redux Provider and PersistGate configured in `layout.tsx`
   - ✅ WalletManager initialized in `layout.tsx`
   - ✅ `useWalletConnection` hook uses `useWalletConnectionState` from package
   - ✅ `WalletConnectionGuard` uses real connection state for route protection

3. **Build Status**
   - ✅ Build succeeds: `bun run build` works
   - ✅ All pages compile successfully
   - ✅ No TypeScript errors

## 📋 Phase 2 Tasks (Remaining)

### Step 1: Update Login Page ✅ Ready

**File:** `src/app/login/page.tsx`

- [ ] Replace demo "Enter Demo Mode" button with `ConnectButton` from package
- [ ] Import: `import { ConnectButton } from '@maximedogawa/chia-wallet-connect-react'`
- [ ] Remove `handleDemoLogin` function
- [ ] Remove demo mode text

### Step 2: Update DashboardLayout

**File:** `src/components/DashboardLayout.tsx`

- [ ] Import `ConnectButton` from package
- [ ] Import `useWalletConnectionState` to get connection status
- [ ] Replace "Wallet (Demo)" placeholder with:
  - Show `ConnectButton` when not connected
  - Show wallet address/fingerprint when connected
  - Display connection status indicator

### Step 3: Update Wallet Page

**File:** `src/app/wallet/page.tsx`

- [ ] Import `useWalletConnectionState` to get wallet data
- [ ] Get real wallet address from state: `address`
- [ ] Get wallet fingerprint if available
- [ ] Display actual wallet balance (if available from state)
- [ ] Remove "Demo Mode" messages
- [ ] Show connection status

### Step 4: Update useWalletFingerprint Hook

**File:** `src/hooks/useWalletFingerprint.ts`

- [ ] Import `useWalletConnectionState` from package
- [ ] Extract fingerprint from wallet state
- [ ] Return actual fingerprint or null

### Step 5: Update useWebSocket Hook (Optional)

**File:** `src/hooks/useWebSocket.ts`

- [ ] Check if WebSocket functionality is needed
- [ ] If needed, implement real WebSocket connection
- [ ] Integrate with TanStack Query for cache invalidation

### Step 6: Test Connection Flow

- [ ] Test connecting wallet from login page
- [ ] Verify redirect to dashboard after connection
- [ ] Test disconnecting wallet
- [ ] Verify redirect to login after disconnection

### Step 7: Test App Refresh

- [ ] Connect wallet
- [ ] Refresh page
- [ ] Verify connection persists (Redux Persist)
- [ ] Verify user stays on dashboard (not redirected to login)

### Step 8: Test Navigation Guards

- [ ] Verify protected routes redirect to login when not connected
- [ ] Verify login page redirects to dashboard when connected
- [ ] Test edge cases (modal closing, timing issues)

## 🔍 Key Package APIs to Use

### `useWalletConnectionState` Hook

```typescript
const {
  isConnected, // boolean
  connectedWallet, // string | null
  address, // string | null
  isWalletConnect, // boolean
  walletConnectSession, // SessionTypes.Struct | null
  walletImage, // string | null
  walletName, // string | null
  cnsName, // string | null
} = useWalletConnectionState()
```

### `ConnectButton` Component

```typescript
import { ConnectButton } from '@maximedogawa/chia-wallet-connect-react'

<ConnectButton />
```

### Redux Store Access

```typescript
import { useAppSelector } from '@maximedogawa/chia-wallet-connect-react'

const address = useAppSelector((state) => state.wallet.address)
const fingerprint = useAppSelector((state) => state.wallet.fingerprint)
```

## 📝 Implementation Order

1. **Login Page** (Easiest - just replace button)
2. **DashboardLayout** (Show connection status)
3. **Wallet Page** (Display real data)
4. **useWalletFingerprint** (Simple hook update)
5. **Testing** (Verify all flows work)

## 🎯 Success Criteria

- [ ] Users can connect wallet from login page
- [ ] Connection state persists after page refresh
- [ ] Wallet address displays correctly
- [ ] Navigation guards work correctly
- [ ] No console errors
- [ ] Build succeeds
- [ ] All pages render correctly

## 📚 Notes

- Redux Persist is already configured, so connection state should persist automatically
- WalletConnectionGuard already handles redirects based on connection state
- All infrastructure is in place, just need to wire up the UI components
