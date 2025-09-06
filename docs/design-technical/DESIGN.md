# Penguin-pool: Decentralized Lending Platform Design Document

## Project Overview

Penguin-pool is a Progressive Web App (PWA) that enables decentralized lending and borrowing activities on the Chia Network. The platform leverages Kurrent DB for local data storage, ensuring offline accessibility while maintaining blockchain integration for secure transactions.

### Core Features

- **Option Contracts**: Create and manage financial derivatives
- **Lending Platform**: Offer and take loans with customizable terms
- **Piggy Bank System**: Coin management for loan settlements
- **Wallet Integration**: Secure transactions via Wallet Connect and Sage Wallet
- **Offline-First**: Local data storage with blockchain synchronization

## Technical Architecture

### Frontend Stack

- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: PrimeVue component library
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state
- **PWA**: Service workers and offline capabilities

### Backend & Data

- **Database**: Kurrent DB for local stream storage
- **Blockchain**: Chia Network integration
- **APIs**: dexie.space, spacescan.io for blockchain data
- **Authentication**: Chia DID and Wallet Connect

### Development Tools

- **Testing**: Playwright for E2E testing
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky for pre-commit validation
- **Type Safety**: TypeScript integration

## Database Schema

### Collections Structure

#### Users Collection

```typescript
interface User {
  id: string // Unique identifier
  username: string // Display name
  walletAddress: string // Sage Wallet address
  balance: number // Current balance
  createdAt: Date // Account creation date
  updatedAt: Date // Last update timestamp
  preferences: UserPreferences // User settings
}
```

#### Option Contracts Collection

```typescript
interface OptionContract {
  id: string // Unique contract identifier
  creatorId: string // User who created the contract
  asset: string // Asset identifier
  strikePrice: number // Strike price for the option
  expirationDate: Date // Contract expiration
  type: 'call' | 'put' // Option type
  status: 'active' | 'expired' | 'exercised'
  createdAt: Date
  updatedAt: Date
}
```

#### Offers Collection

```typescript
interface Offer {
  id: string // Unique offer identifier
  creatorId: string // User who created the offer
  asset: string // Asset being offered
  amount: number // Offer amount
  interestRate: number // Annual interest rate
  loanTerm: number // Loan duration in days
  status: 'active' | 'accepted' | 'expired'
  createdAt: Date
  updatedAt: Date
}
```

#### Loans Collection

```typescript
interface Loan {
  id: string // Unique loan identifier
  offerId: string // Reference to the offer
  borrowerId: string // User taking the loan
  lenderId: string // User providing the loan
  amount: number // Loan amount
  interestRate: number // Applied interest rate
  startDate: Date // Loan start date
  dueDate: Date // Loan due date
  status: 'active' | 'repaid' | 'defaulted'
  createdAt: Date
  updatedAt: Date
}
```

#### Piggy Bank Coins Collection

```typescript
interface PiggyBankCoin {
  id: string // Unique coin identifier
  userId: string // Owner of the coin
  amount: number // Coin value
  type: 'standard' | 'premium' // Coin type
  createdAt: Date
  lastUsed: Date
}
```

## UI Component Architecture

### Page Structure

1. **Dashboard** - Overview and quick actions
2. **Option Contracts** - Contract management and creation
3. **Offered Loans** - View and manage loan offers
4. **My Taken Loans** - Active and completed loans
5. **My Offered Loans** - Loans provided to others
6. **Income Overview** - Financial analytics and reporting
7. **Piggy Bank** - Coin management system

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Main Content
├── Pages
│   ├── Dashboard
│   ├── OptionContracts
│   ├── Loans
│   ├── Offers
│   ├── PiggyBank
│   └── Profile
└── Shared Components
    ├── Forms
    ├── Tables
    ├── Cards
    └── Modals
```

## Data Flow Architecture

### User Authentication Flow

1. User connects wallet via Wallet Connect
2. Chia DID verification
3. User data stored in local Kurrent DB
4. User added to global users stream
5. Session management and token handling

### Contract Creation Flow

1. User fills contract creation form
2. Data validation and local storage
3. Blockchain transaction creation
4. Contract stored in local DB
5. Synchronization with dexie.space

### Loan Management Flow

1. User creates or accepts loan offer
2. Smart contract execution on Chia
3. Loan data stored locally
4. Payment tracking and notifications
5. Settlement via Piggy Bank coins

## Security Considerations

### Wallet Security

- Private key never leaves user device
- Secure communication protocols
- Multi-factor authentication support
- Session timeout and automatic logout

### Data Privacy

- Local-first data storage
- Encrypted sensitive information
- User consent for data sharing
- GDPR compliance considerations

### Smart Contract Security

- Audited contract templates
- Multi-signature requirements
- Emergency pause functionality
- Insurance fund integration

## Performance Optimization

### Frontend Performance

- Lazy loading of components
- Virtual scrolling for large lists
- Image optimization and caching
- Bundle splitting and code splitting

### Database Performance

- Indexed queries for fast retrieval
- Stream-based data synchronization
- Efficient data compression
- Background sync optimization

### PWA Performance

- Service worker caching strategies
- Offline-first data access
- Background sync capabilities
- Push notification optimization

## Testing Strategy

### Unit Testing

- Component testing with Vue Test Utils
- Utility function testing
- State management testing
- API integration testing

### Integration Testing

- End-to-end workflows
- Database operations testing
- Wallet integration testing
- Cross-browser compatibility

### Performance Testing

- Load time optimization
- Memory usage monitoring
- Database query performance
- PWA offline capabilities

## Deployment & DevOps

### Build Process

- Automated testing pipeline
- Code quality checks
- Bundle optimization
- PWA asset generation

### Deployment Strategy

- Staging environment testing
- Blue-green deployment
- Rollback procedures
- Monitoring and alerting

### Environment Configuration

- Development setup
- Staging configuration
- Production deployment
- Environment-specific variables

## Future Enhancements

### Phase 2 Features

- Advanced analytics dashboard
- Social features and reputation system
- Insurance and risk management
- Mobile app development

### Phase 3 Features

- Cross-chain integration
- DeFi protocol integration
- Advanced trading features
- Institutional tools

## Conclusion

This design document provides a comprehensive foundation for building the Penguin-pool decentralized lending platform. The architecture prioritizes security, performance, and user experience while maintaining the decentralized nature of the platform. The implementation will follow an iterative approach, starting with core functionality and gradually adding advanced features based on user feedback and market demands.
