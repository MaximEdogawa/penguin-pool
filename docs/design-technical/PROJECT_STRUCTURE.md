# Penguin-pool Project Structure

## Feature Sliced Design Architecture

The project follows the Feature Sliced Design methodology, organizing code by business features rather than technical layers. This approach ensures better maintainability, scalability, and team collaboration.

## Root Directory Structure

```
penguin-pool/
├── docs/                          # Documentation
├── public/                        # Static assets
├── src/                           # Source code
├── tests/                         # Test files
├── .github/                       # GitHub workflows
├── .husky/                        # Git hooks
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── playwright.config.ts           # Playwright configuration
└── README.md                      # Project overview
```

## Source Code Structure (`src/`)

### App Layer

```
src/
├── app/                           # Application configuration
│   ├── providers/                 # Global providers
│   │   ├── AppProvider.tsx       # Main app provider
│   │   ├── WalletProvider.tsx    # Wallet connection provider
│   │   ├── DatabaseProvider.tsx  # Kurrent DB provider
│   │   └── ThemeProvider.tsx     # Theme management
│   ├── styles/                    # Global styles
│   │   ├── index.css             # Main CSS file
│   │   ├── tailwind.css          # Tailwind imports
│   │   └── variables.css         # CSS custom properties
│   ├── types/                     # Global type definitions
│   │   ├── api.ts                # API types
│   │   ├── database.ts           # Database types
│   │   ├── wallet.ts             # Wallet types
│   │   └── common.ts             # Common types
│   ├── utils/                     # Utility functions
│   │   ├── constants.ts          # App constants
│   │   ├── helpers.ts            # Helper functions
│   │   ├── validation.ts         # Validation schemas
│   │   └── formatters.ts         # Data formatters
│   ├── hooks/                     # Global hooks
│   │   ├── useLocalStorage.ts    # Local storage hook
│   │   ├── useDebounce.ts        # Debounce hook
│   │   └── useOnlineStatus.ts    # Online status hook
│   └── App.vue                    # Root component
```

### Pages Layer

```
src/
├── pages/                         # Page components
│   ├── Dashboard/                 # Dashboard page
│   │   ├── index.vue             # Main dashboard
│   │   ├── components/            # Dashboard-specific components
│   │   ├── hooks/                 # Dashboard-specific hooks
│   │   ├── types/                 # Dashboard types
│   │   └── utils/                 # Dashboard utilities
│   ├── OptionContracts/           # Option contracts page
│   │   ├── index.vue             # Main contracts page
│   │   ├── components/            # Contract components
│   │   ├── hooks/                 # Contract hooks
│   │   ├── types/                 # Contract types
│   │   └── utils/                 # Contract utilities
│   ├── Loans/                     # Loans management
│   │   ├── index.vue             # Main loans page
│   │   ├── OfferedLoans/          # Offered loans subpage
│   │   ├── TakenLoans/            # Taken loans subpage
│   │   ├── components/            # Loan components
│   │   ├── hooks/                 # Loan hooks
│   │   ├── types/                 # Loan types
│   │   └── utils/                 # Loan utilities
│   ├── Offers/                    # Loan offers
│   │   ├── index.vue             # Main offers page
│   │   ├── components/            # Offer components
│   │   ├── hooks/                 # Offer hooks
│   │   ├── types/                 # Offer types
│   │   └── utils/                 # Offer utilities
│   ├── PiggyBank/                 # Piggy bank system
│   │   ├── index.vue             # Main piggy bank page
│   │   ├── components/            # Piggy bank components
│   │   ├── hooks/                 # Piggy bank hooks
│   │   ├── types/                 # Piggy bank types
│   │   └── utils/                 # Piggy bank utilities
│   ├── Profile/                   # User profile
│   │   ├── index.vue             # Main profile page
│   │   ├── components/            # Profile components
│   │   ├── hooks/                 # Profile hooks
│   │   ├── types/                 # Profile types
│   │   └── utils/                 # Profile utilities
│   └── Auth/                      # Authentication
│       ├── Login.vue              # Login page
│       ├── Register.vue           # Registration page
│       ├── components/            # Auth components
│       ├── hooks/                 # Auth hooks
│       ├── types/                 # Auth types
│       └── utils/                 # Auth utilities
```

### Widgets Layer

```
src/
├── widgets/                       # Complex UI combinations
│   ├── Header/                    # Application header
│   │   ├── index.vue             # Header component
│   │   ├── components/            # Header sub-components
│   │   ├── hooks/                 # Header hooks
│   │   └── types/                 # Header types
│   ├── Sidebar/                   # Navigation sidebar
│   │   ├── index.vue             # Sidebar component
│   │   ├── components/            # Sidebar sub-components
│   │   ├── hooks/                 # Sidebar hooks
│   │   └── types/                 # Sidebar types
│   ├── LoanCard/                  # Loan display card
│   │   ├── index.vue             # Loan card component
│   │   ├── components/            # Card sub-components
│   │   ├── hooks/                 # Card hooks
│   │   └── types/                 # Card types
│   ├── ContractForm/              # Contract creation form
│   │   ├── index.vue             # Form component
│   │   ├── components/            # Form sub-components
│   │   ├── hooks/                 # Form hooks
│   │   └── types/                 # Form types
│   └── NotificationPanel/         # Notification system
│       ├── index.vue             # Notification panel
│       ├── components/            # Notification components
│       ├── hooks/                 # Notification hooks
│       └── types/                 # Notification types
```

### Features Layer

```
src/
├── features/                      # Business logic features
│   ├── wallet-connection/         # Wallet integration
│   │   ├── api/                  # Wallet API calls
│   │   ├── components/            # Wallet components
│   │   ├── hooks/                 # Wallet hooks
│   │   ├── store/                 # Wallet state management
│   │   ├── types/                 # Wallet types
│   │   └── utils/                 # Wallet utilities
│   ├── database-management/       # Kurrent DB operations
│   │   ├── api/                  # Database API
│   │   ├── components/            # Database components
│   │   ├── hooks/                 # Database hooks
│   │   ├── store/                 # Database state
│   │   ├── types/                 # Database types
│   │   └── utils/                 # Database utilities
│   ├── contract-management/       # Option contracts
│   │   ├── api/                  # Contract API
│   │   ├── components/            # Contract components
│   │   ├── hooks/                 # Contract hooks
│   │   ├── store/                 # Contract state
│   │   ├── types/                 # Contract types
│   │   └── utils/                 # Contract utilities
│   ├── loan-management/           # Loan operations
│   │   ├── api/                  # Loan API
│   │   ├── components/            # Loan components
│   │   ├── hooks/                 # Loan hooks
│   │   ├── store/                 # Loan state
│   │   ├── types/                 # Loan types
│   │   └── utils/                 # Loan utilities
│   ├── offer-management/          # Loan offers
│   │   ├── api/                  # Offer API
│   │   ├── components/            # Offer components
│   │   ├── hooks/                 # Offer hooks
│   │   ├── store/                 # Offer state
│   │   ├── types/                 # Offer types
│   │   └── utils/                 # Offer utilities
│   └── piggy-bank/               # Piggy bank system
│       ├── api/                  # Piggy bank API
│       ├── components/            # Piggy bank components
│       ├── hooks/                 # Piggy bank hooks
│       ├── store/                 # Piggy bank state
│       ├── types/                 # Piggy bank types
│       └── utils/                 # Piggy bank utilities
```

### Entities Layer

```
src/
├── entities/                      # Business entities
│   ├── user/                      # User entity
│   │   ├── api/                  # User API
│   │   ├── components/            # User components
│   │   ├── hooks/                 # User hooks
│   │   ├── store/                 # User state
│   │   ├── types/                 # User types
│   │   └── utils/                 # User utilities
│   ├── contract/                  # Contract entity
│   │   ├── api/                  # Contract API
│   │   ├── components/            # Contract components
│   │   ├── hooks/                 # Contract hooks
│   │   ├── store/                 # Contract state
│   │   ├── types/                 # Contract types
│   │   └── utils/                 # Contract utilities
│   ├── loan/                      # Loan entity
│   │   ├── api/                  # Loan API
│   │   ├── components/            # Loan components
│   │   ├── hooks/                 # Loan hooks
│   │   ├── store/                 # Loan state
│   │   ├── types/                 # Loan types
│   │   └── utils/                 # Loan utilities
│   ├── offer/                     # Offer entity
│   │   ├── api/                  # Offer API
│   │   ├── components/            # Offer components
│   │   ├── hooks/                 # Offer hooks
│   │   ├── store/                 # Offer state
│   │   ├── types/                 # Offer types
│   │   └── utils/                 # Offer utilities
│   └── coin/                      # Piggy bank coin entity
│       ├── api/                  # Coin API
│       ├── components/            # Coin components
│       ├── hooks/                 # Coin hooks
│       ├── store/                 # Coin state
│       ├── types/                 # Coin types
│       └── utils/                 # Coin utilities
```

### Shared Layer

```
src/
├── shared/                        # Shared resources
│   ├── ui/                        # UI components
│   │   ├── Button/                # Button component
│   │   ├── Input/                 # Input component
│   │   ├── Modal/                 # Modal component
│   │   ├── Table/                 # Table component
│   │   ├── Card/                  # Card component
│   │   ├── Form/                  # Form components
│   │   ├── Loading/               # Loading states
│   │   └── Error/                 # Error components
│   ├── lib/                       # External libraries
│   │   ├── api/                   # API client setup
│   │   ├── database/              # Database client
│   │   ├── wallet/                # Wallet clients
│   │   └── blockchain/            # Blockchain clients
│   ├── config/                    # Configuration files
│   │   ├── api.ts                # API configuration
│   │   ├── database.ts            # Database configuration
│   │   ├── wallet.ts              # Wallet configuration
│   │   └── environment.ts         # Environment variables
│   └── assets/                    # Static assets
│       ├── images/                # Image files
│       ├── icons/                 # Icon files
│       └── fonts/                 # Font files
```

## Testing Structure

```
tests/
├── unit/                          # Unit tests
│   ├── components/                # Component tests
│   ├── hooks/                     # Hook tests
│   ├── utils/                     # Utility tests
│   └── store/                     # State management tests
├── integration/                    # Integration tests
│   ├── api/                       # API integration tests
│   ├── database/                  # Database integration tests
│   └── wallet/                    # Wallet integration tests
├── e2e/                           # End-to-end tests
│   ├── flows/                     # User flow tests
│   ├── pages/                     # Page tests
│   └── components/                # Component interaction tests
└── fixtures/                      # Test data and mocks
    ├── data/                      # Test data
    ├── mocks/                     # Mock objects
    └── setup/                     # Test setup files
```

## Configuration Files

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore",
    "format": "prettier --write src/",
    "prepare": "husky install"
  }
}
```

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@features': path.resolve(__dirname, './src/features'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@app': path.resolve(__dirname, './src/app'),
    },
  },
})
```

## Import Rules

### Absolute Imports

- Use absolute imports for better readability
- Follow the Feature Sliced Design import order:
  1. External libraries
  2. Shared layer
  3. Entities layer
  4. Features layer
  5. Widgets layer
  6. Pages layer
  7. App layer

### Import Examples

```typescript
// ✅ Correct import order
import { ref } from 'vue'
import { Button } from '@shared/ui/Button'
import { useUser } from '@entities/user'
import { useWalletConnection } from '@features/wallet-connection'
import { Header } from '@widgets/Header'
import { Dashboard } from '@pages/Dashboard'
import { AppProvider } from '@app/providers'

// ❌ Avoid relative imports
import { Button } from '../../../shared/ui/Button'
```

## File Naming Conventions

### Components

- Use PascalCase for component files: `UserProfile.vue`
- Use kebab-case for component folders: `user-profile/`

### Hooks

- Use camelCase with `use` prefix: `useWalletConnection.ts`

### Types

- Use PascalCase: `UserProfile.ts`

### Utilities

- Use camelCase: `formatCurrency.ts`

### Constants

- Use UPPER_SNAKE_CASE: `API_ENDPOINTS.ts`

## Benefits of This Structure

1. **Scalability**: Easy to add new features without affecting existing code
2. **Maintainability**: Clear separation of concerns and responsibilities
3. **Team Collaboration**: Multiple developers can work on different features simultaneously
4. **Code Reusability**: Shared components and utilities are easily accessible
5. **Testing**: Clear structure makes it easier to write and organize tests
6. **Performance**: Lazy loading and code splitting are easier to implement
7. **Type Safety**: Better TypeScript support with clear import paths
