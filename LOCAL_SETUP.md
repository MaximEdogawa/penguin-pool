# Local Development Setup

This guide explains how to set up the Penguin Pool application for local development.

## Prerequisites

- Node.js (^20.19.0 || >=22.12.0)
- npm or yarn
- Git

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd penguin-pool
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration

#### Required: WalletConnect Project ID

The application requires a WalletConnect Project ID for wallet connection functionality. This is a sensitive secret that should never be committed to version control.

1. **Get a WalletConnect Project ID:**
   - Go to [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)
   - Sign up or log in
   - Create a new project
   - Copy your Project ID

2. **Create local environment file:**

   ```bash
   cp env.local.example .env.local
   ```

3. **Add your WalletConnect Project ID:**
   ```bash
   # Edit .env.local
   VITE_WALLET_CONNECT_PROJECT_ID=your_actual_project_id_here
   ```

#### Required: KurrentDB API Keys

If you're using KurrentDB functionality, you need to add your API keys to `.env.local`:

```bash
# Add to .env.local - Get these from your KurrentDB dashboard
VITE_KURRENT_DB_DEV_API_KEY=your_dev_api_key_here
VITE_KURRENT_DB_DEV_SECRET_KEY=your_dev_secret_key_here

# For other environments (if needed)
VITE_KURRENT_DB_TEST_API_KEY=your_test_api_key_here
VITE_KURRENT_DB_TEST_SECRET_KEY=your_test_secret_key_here
VITE_KURRENT_DB_STAGING_API_KEY=your_staging_api_key_here
VITE_KURRENT_DB_STAGING_SECRET_KEY=your_staging_secret_key_here
VITE_KURRENT_DB_MAINNET_API_KEY=your_mainnet_api_key_here
VITE_KURRENT_DB_MAINNET_SECRET_KEY=your_mainnet_secret_key_here
```

### 4. Start Development Servers

#### Frontend Only

```bash
npm run dev
```

#### Backend Only

```bash
npm run dev:backend
```

#### Both Frontend and Backend

```bash
npm run dev:all
```

## Environment Files

The application uses different environment files for different modes:

- **`.env.local`** - Local overrides (never committed, highest priority)
- **`.env.dev`** - Development environment
- **`.env.test`** - Test environment
- **`.env.staging`** - Staging environment
- **`.env.production`** - Production environment

## Feature Flags

The application includes a comprehensive feature flag system. You can enable/disable features by modifying the environment files or using the `.env.local` file for local overrides.

See [docs/FEATURE_FLAGS.md](docs/FEATURE_FLAGS.md) for detailed information about the feature flag system.

## Security Notes

- **Never commit `.env.local`** - This file contains sensitive secrets
- **Never commit API keys or secrets** to version control
- **Use CI/CD secrets** for production deployments
- **The `env.local.example` file** shows what needs to be configured locally

## Troubleshooting

### WalletConnect Not Working

If wallet connection isn't working:

1. Check that you have a valid `VITE_WALLET_CONNECT_PROJECT_ID` in `.env.local`
2. Verify the Project ID is correct in your WalletConnect dashboard
3. Check the browser console for error messages

### KurrentDB Not Working

If KurrentDB functionality isn't working:

1. Check that you have valid API keys in `.env.local` for the current environment
2. Verify the API keys are correct in your KurrentDB dashboard
3. Check the browser console for error messages
4. Ensure the correct environment is set (`VITE_KURRENT_DB_ENVIRONMENT`)

### Feature Flags Not Working

If feature flags aren't working as expected:

1. Check the environment file for the current mode
2. Verify the feature flag syntax in the environment file
3. Check the browser console for validation warnings
4. See the feature flags documentation for more details

### Build Issues

If you encounter build issues:

1. Make sure all dependencies are installed
2. Check that your Node.js version meets the requirements
3. Clear the build cache: `npm run clean`
4. Check for TypeScript errors: `npm run type-check`

## Development Scripts

```bash
# Development
npm run dev                    # Frontend only
npm run dev:backend           # Backend only
npm run dev:all               # Both frontend and backend

# Building
npm run build                 # Build frontend
npm run build:backend         # Build backend

# Testing
npm run test                  # Run tests
npm run test:e2e             # Run end-to-end tests

# Linting and Formatting
npm run lint                  # Lint code
npm run format               # Format code
```

## Getting Help

- Check the [documentation](docs/) folder for detailed guides
- Review the [feature flags documentation](docs/FEATURE_FLAGS.md)
- Check the [API documentation](docs/API_DOCUMENTATION.md)
- Look at the [technical stack documentation](docs/design-technical/TECHNICAL_STACK.md)
