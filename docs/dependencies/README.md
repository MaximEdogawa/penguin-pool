# Dependencies Documentation

This folder contains detailed documentation about the dependencies used in the Penguin Pool project.

## Overview

Penguin Pool is a **Chia blockchain** DeFi application that requires wallet connectivity and blockchain interactions. Some dependencies are necessary for our Chia functionality, while others are included due to the current state of the Web3 ecosystem.

## Key Dependencies

### Core Framework

- **Vue 3** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Pinia** - State management

### UI & Styling

- **PrimeVue** - UI component library
- **Tailwind CSS** - Utility-first CSS framework
- **PrimeIcons** - Icon library

### Blockchain & Wallet

- **@walletconnect/sign-client** - Wallet connection protocol
- **@walletconnect/modal** - Wallet connection UI
- **@walletconnect/types** - TypeScript definitions

### Data & State

- **@tanstack/vue-query** - Data fetching and caching
- **@kurrent/kurrentdb-client** - Database client
- **Socket.io-client** - Real-time communication

### Development

- **Playwright** - E2E testing
- **Vitest** - Unit testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Transitive Dependencies

Some dependencies are included indirectly through other packages:

### Ethereum Dependencies (Unused)

- **ox** - Ethereum Standard Library (via WalletConnect)
- **viem** - Ethereum TypeScript interface (via WalletConnect)
- **@walletconnect/utils** - WalletConnect utilities (via sign-client)

These are included due to WalletConnect's architecture but are not used in our Chia-focused application.

## Documentation Files

- [OX_PACKAGE_DEPENDENCY.md](./OX_PACKAGE_DEPENDENCY.md) - Detailed explanation of the ox package
- [WALLET_CONNECT_DEPENDENCIES.md](./WALLET_CONNECT_DEPENDENCIES.md) - WalletConnect dependency analysis
- [BUNDLE_ANALYSIS.md](./BUNDLE_ANALYSIS.md) - Bundle size and optimization analysis

## Dependency Management

### Adding Dependencies

1. Check if the dependency is truly necessary
2. Consider if it's Chia-specific or generic
3. Document any transitive dependencies that affect bundle size
4. Update this documentation

### Removing Dependencies

1. Verify no functionality is broken
2. Check for transitive dependencies that might be affected
3. Update documentation
4. Test thoroughly

## Bundle Optimization

### Current Status

- **Total bundle size**: ~576KB (main chunk)
- **Vendor chunks**: Separated for better caching
- **Tree shaking**: Enabled for unused code removal

### Optimization Strategies

- Manual chunk splitting for vendor libraries
- Dynamic imports for route-based code splitting
- Tree shaking for unused dependencies
- Warning suppression for harmless build messages

## Security Considerations

### Environment Variables

- **VITE_WALLET_CONNECT_PROJECT_ID** - WalletConnect project ID (secret)
- **VITE_CHIA_CHAIN_ID** - Chia network configuration
- **KURRENTDB_API_KEY** - Database access (secret)

### Dependency Security

- Regular `npm audit` checks
- Automated security updates via Dependabot
- Minimal dependency footprint

## Future Improvements

### Potential Optimizations

1. **Chia-specific WalletConnect**: If available, replace current implementation
2. **Bundle splitting**: Further optimize chunk sizes
3. **Dependency audit**: Regular review of unused dependencies
4. **Alternative libraries**: Explore Chia-native alternatives

### Monitoring

- Bundle size tracking
- Dependency vulnerability scanning
- Performance impact assessment
