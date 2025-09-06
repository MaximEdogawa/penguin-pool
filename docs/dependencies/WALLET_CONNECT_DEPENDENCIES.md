# WalletConnect Dependencies Analysis

## Overview

Penguin Pool uses WalletConnect v2 for Chia wallet connections. This document analyzes the WalletConnect dependency chain and its impact on our Chia-focused application.

## Direct Dependencies

### @walletconnect/sign-client (2.21.8)

**Purpose**: Core WalletConnect protocol implementation
**Usage**: Chia wallet connection and session management
**Why we need it**: Essential for connecting to Chia wallets via WalletConnect

### @walletconnect/modal (2.7.0)

**Purpose**: UI components for wallet connection
**Usage**: QR code display and wallet selection interface
**Why we need it**: User-friendly wallet connection experience

### @walletconnect/types (2.21.8)

**Purpose**: TypeScript type definitions
**Usage**: Type safety for WalletConnect operations
**Why we need it**: Type safety and IntelliSense support

## Transitive Dependencies

### @walletconnect/utils (2.21.8)

**Source**: Required by `@walletconnect/sign-client`
**Purpose**: Utility functions for WalletConnect
**Our usage**: Only `getSdkError` function (replaced with custom implementation)
**Impact**: Pulls in Ethereum dependencies

### viem (2.31.0)

**Source**: Required by `@walletconnect/utils`
**Purpose**: Ethereum TypeScript interface
**Our usage**: None (Chia-focused application)
**Impact**: Large dependency with Ethereum-specific functionality

### ox (0.7.1)

**Source**: Required by `viem`
**Purpose**: Ethereum Standard Library
**Our usage**: None (Chia-focused application)
**Impact**: Additional bundle size and build warnings

## Dependency Chain Visualization

```
Penguin Pool (Chia DeFi App)
├── @walletconnect/sign-client ✅ (Needed for Chia)
│   └── @walletconnect/utils ⚠️ (Required by sign-client)
│       └── viem ❌ (Ethereum library, unused)
│           └── ox ❌ (Ethereum library, unused)
├── @walletconnect/modal ✅ (Needed for UI)
└── @walletconnect/types ✅ (Needed for types)
```

## Impact Analysis

### Bundle Size Impact

- **@walletconnect/sign-client**: ~45KB
- **@walletconnect/modal**: ~25KB
- **@walletconnect/types**: ~5KB
- **@walletconnect/utils**: ~15KB (unused)
- **viem**: ~120KB (unused)
- **ox**: ~50KB (unused)

**Total unused dependencies**: ~185KB (~32% of main bundle)

### Build Warnings

- `/*#__PURE__*/` comments in `ox` package
- Suppressed in `vite.config.ts`
- No functional impact

### Runtime Impact

- **Memory usage**: Unused code still loaded
- **Parse time**: Additional JavaScript to parse
- **Tree shaking**: Some unused code removed in production

## Optimization Attempts

### What We Tried

1. **Removed @walletconnect/utils**: Not possible - required by sign-client
2. **Custom getSdkError**: Replaced single function usage
3. **Warning suppression**: Cleaned up build output
4. **Bundle analysis**: Identified unused dependencies

### What We Can't Do

1. **Remove viem/ox**: Required by WalletConnect architecture
2. **Use Chia-only WalletConnect**: No such library exists
3. **Custom WalletConnect**: Too complex for current needs

## Alternative Approaches

### Option 1: Accept Current State

**Pros**:

- Works reliably
- Well-maintained library
- Good documentation
- Type safety

**Cons**:

- Larger bundle size
- Unused dependencies
- Build warnings (suppressed)

### Option 2: Custom Wallet Connection

**Pros**:

- No unused dependencies
- Smaller bundle size
- Chia-specific implementation

**Cons**:

- Significant development effort
- Maintenance burden
- Potential compatibility issues
- Loss of WalletConnect ecosystem benefits

### Option 3: Wait for Better Alternatives

**Pros**:

- Future WalletConnect versions may be more modular
- Chia ecosystem may develop native solutions

**Cons**:

- Unclear timeline
- May never happen
- Current solution works

## Recommendation

**Accept the current state** with the following mitigations:

1. **Document the situation** (this file)
2. **Suppress build warnings** (already done)
3. **Monitor bundle size** (track changes)
4. **Consider alternatives** (if they become available)

## Monitoring

### Bundle Size Tracking

```bash
npm run build
# Check dist/assets/ for chunk sizes
```

### Dependency Updates

```bash
npm outdated
# Check for WalletConnect updates
```

### Security Audits

```bash
npm audit
# Check for vulnerabilities
```

## Future Considerations

### WalletConnect v3

- May have better modularity
- Could separate Ethereum and generic functionality
- Timeline: Unknown

### Chia Ecosystem

- Native Chia wallet connection libraries
- Chia-specific WalletConnect implementation
- Timeline: Unknown

### Custom Implementation

- If bundle size becomes critical
- If Chia-specific features are needed
- If WalletConnect limitations become problematic

## Related Files

- `src/features/walletConnect/` - Implementation
- `vite.config.ts` - Build configuration
- `package.json` - Dependencies
- `docs/dependencies/OX_PACKAGE_DEPENDENCY.md` - Ox package details
