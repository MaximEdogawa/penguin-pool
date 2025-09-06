# Feature Flags System

This document explains how to use the comprehensive feature flag system implemented in the Penguin Pool application.

## Overview

The feature flag system allows you to enable/disable features at runtime based on environment configuration. This is useful for:

- Gradual feature rollouts
- A/B testing
- Environment-specific configurations
- Emergency feature disabling
- Development and testing

## Architecture

### Frontend (Vue.js)

- **Feature Flag Store**: Pinia store managing all feature flags
- **Composables**: Easy-to-use composables for different feature categories
- **Router Integration**: Dynamic route loading based on feature flags
- **Component Wrapper**: `<FeatureFlag>` component for conditional rendering

### Backend (NestJS)

- **Feature Flag Service**: Service managing backend feature flags
- **Middleware**: Request-level feature flag access
- **API Endpoints**: REST API for feature flag management
- **Environment Integration**: Environment variable-based configuration

## Environment Files

The system supports four environments with their own configuration files:

### Frontend Environment Files

- `.env.dev` - Development environment
- `.env.test` - Test environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Backend Environment Files

- `backend/env.dev` - Development environment
- `backend/env.test` - Test environment
- `backend/env.staging` - Staging environment
- `backend/env.production` - Production environment

## Feature Categories

### App Features

- `offers` - Offers functionality
- `loans` - Loans functionality
- `optionContracts` - Option contracts functionality
- `piggyBank` - Piggy bank functionality
- `customThemes` - Custom theme functionality
- `loginOptions` - Login options
- `dashboard` - Dashboard functionality
- `profile` - Profile functionality
- `serviceHealth` - Service health monitoring

### Technical Features

- `backendStack` - Backend stack switching
- `databaseType` - Database type switching
- `loginStorage` - Login storage method (database vs browser)
- `offersStorage` - Offers storage method (database vs IndexedDB)
- `offlineMode` - Offline mode functionality
- `websocketConnection` - WebSocket connections
- `apiVersioning` - API versioning

### UI Features

- `darkMode` - Dark mode
- `responsiveDesign` - Responsive design
- `animations` - UI animations
- `accessibility` - Accessibility features
- `internationalization` - Internationalization support

### Experimental Features

- `advancedAnalytics` - Advanced analytics
- `betaFeatures` - Beta features
- `performanceMonitoring` - Performance monitoring
- `aBTesting` - A/B testing framework

## Usage

### Frontend Usage

#### Using Composables

```typescript
// App features
import { useAppFeature } from '@/stores/featureFlags'

const { isEnabled: isOffersEnabled } = useAppFeature('offers')

// Technical features
import { useTechnicalFeature } from '@/stores/featureFlags'

const { isEnabled: isOfflineModeEnabled } = useTechnicalFeature('offlineMode')

// UI features
import { useUIFeature } from '@/stores/featureFlags'

const { isEnabled: isDarkModeEnabled } = useUIFeature('darkMode')

// Experimental features
import { useExperimentalFeature } from '@/stores/featureFlags'

const { isEnabled: isBetaFeaturesEnabled } = useExperimentalFeature('betaFeatures')
```

#### Using the Feature Flag Component

```vue
<template>
  <!-- Show content only if feature is enabled -->
  <FeatureFlag category="app" feature="offers">
    <OffersPage />
  </FeatureFlag>

  <!-- Show content with fallback if feature is disabled -->
  <FeatureFlag
    category="app"
    feature="loans"
    :show-fallback="true"
    fallback-message="Loans feature is coming soon!"
  >
    <LoansPage />
    <template #fallback>
      <div class="coming-soon">
        <h3>Loans Coming Soon!</h3>
        <p>We're working on this feature.</p>
      </div>
    </template>
  </FeatureFlag>
</template>

<script setup lang="ts">
  import FeatureFlag from '@/components/FeatureFlag.vue'
</script>
```

#### Using the Store Directly

```typescript
import { useFeatureFlagsStore } from '@/stores/featureFlags'

const featureFlags = useFeatureFlagsStore()

// Check if feature is enabled
const isEnabled = featureFlags.isAppFeatureEnabled.value('offers')

// Get all enabled features
const enabledFeatures = featureFlags.enabledFeatures.value

// Update a feature flag (for admin purposes)
featureFlags.updateFeatureFlag('app', 'offers', false)

// Get features by category
const appFeatures = featureFlags.getEnabledFeaturesByCategory('app')
```

### Backend Usage

#### Using the Service

```typescript
import { FeatureFlagsService } from './feature-flags/feature-flags.service'

@Injectable()
export class SomeService {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  someMethod() {
    // Check if feature is enabled
    if (this.featureFlags.isWebSocketEnabled()) {
      // WebSocket logic
    }

    if (this.featureFlags.isKurrentDbEnabled()) {
      // Database logic
    }

    // Check specific features
    const isOfflineModeEnabled = this.featureFlags.isFeatureEnabled('technical', 'offlineMode')
  }
}
```

#### Using Middleware

```typescript
// The middleware automatically adds feature flags to the request object
app.use((req, res, next) => {
  if (req.featureFlags.isWebSocketEnabled) {
    // WebSocket logic
  }
  next()
})
```

#### API Endpoints

```bash
# Get all feature flags
GET /feature-flags

# Get enabled features
GET /feature-flags/enabled

# Get features by category
GET /feature-flags/category/backend

# Check specific feature
GET /feature-flags/check/backend/websocketEnabled

# Validate feature flags
POST /feature-flags/validate

# Get health status
GET /feature-flags/health
```

## Environment Configuration

### Setting Feature Flags

Feature flags can be set in environment files using the following format:

```bash
# Frontend (VITE_ prefix required)
VITE_FEATURE_OFFERS=true
VITE_FEATURE_LOANS=false
VITE_FEATURE_DARK_MODE=true

# Backend (FEATURE_ prefix)
FEATURE_WEBSOCKET_ENABLED=true
FEATURE_RATE_LIMITING=false
FEATURE_SWAGGER=true
```

### Environment Variable Loading Priority

Vite loads environment variables in the following priority order (highest to lowest):

1. **`.env.local`** - Local overrides (never committed to git)
2. **`.env.[mode].local`** - Mode-specific local overrides
3. **`.env.[mode]`** - Mode-specific environment files (e.g., `.env.production`)
4. **`.env`** - Default environment file

**Important**: Sensitive secrets like `VITE_WALLET_CONNECT_PROJECT_ID` and KurrentDB API keys should only be stored in `.env.local` for local development or in CI/CD secrets for production deployments.

### Environment-Specific Overrides

Each environment file can override the default feature flag values:

```bash
# .env.dev
VITE_FEATURE_OFFERS=true
VITE_FEATURE_ANIMATIONS=true

# .env.production
VITE_FEATURE_OFFERS=true
VITE_FEATURE_ANIMATIONS=false
```

## Build Scripts

### Frontend Build Scripts

```bash
# Development
npm run dev                    # Uses .env.dev
npm run build:dev             # Builds with .env.dev

# Test
npm run dev:test              # Uses .env.test
npm run build:test            # Builds with .env.test

# Staging
npm run dev:staging           # Uses .env.staging
npm run build:staging         # Builds with .env.staging

# Production
npm run dev:production        # Uses .env.production
npm run build:production      # Builds with .env.production
```

### Backend Build Scripts

```bash
# Development
npm run dev:backend:dev       # Uses backend/env.dev
npm run build:backend:dev     # Builds with backend/env.dev

# Test
npm run dev:backend:test      # Uses backend/env.test
npm run build:backend:test    # Builds with backend/env.test

# Staging
npm run dev:backend:staging   # Uses backend/env.staging
npm run build:backend:staging # Builds with backend/env.staging

# Production
npm run dev:backend:production # Uses backend/env.production
npm run build:backend:production # Builds with backend/env.production
```

## Best Practices

### 1. Feature Flag Naming

- Use descriptive names that clearly indicate what the feature does
- Use snake_case for environment variables
- Use camelCase for code references

### 2. Environment Configuration

- Always provide sensible defaults
- Document feature flag purposes
- Use environment-specific overrides sparingly

### 3. Code Organization

- Group related feature flags together
- Use TypeScript types for better IDE support
- Validate feature flag configurations

### 4. Testing

- Test with different feature flag combinations
- Mock feature flags in unit tests
- Test fallback behavior

### 5. Monitoring

- Log feature flag usage
- Monitor feature flag performance impact
- Track feature adoption rates

## Troubleshooting

### Common Issues

1. **Feature not showing**: Check if the feature flag is enabled in the current environment
2. **Build errors**: Ensure environment files exist and are properly formatted
3. **Type errors**: Make sure feature names match the defined types
4. **Router issues**: Verify that routes are properly configured with feature flags

### Debugging

1. **Frontend**: Check browser console for feature flag validation warnings
2. **Backend**: Check logs for feature flag initialization messages
3. **API**: Use the `/feature-flags/health` endpoint to check system status

### Validation

The system automatically validates feature flag configurations and will show warnings for:

- Conflicting feature combinations
- Missing required features
- Invalid environment configurations

## Migration Guide

### Adding New Feature Flags

1. Add the feature flag to `src/shared/config/featureFlags.ts`
2. Update environment files with appropriate values
3. Add the feature flag to the backend service if needed
4. Update documentation

### Removing Feature Flags

1. Remove the feature flag from all configuration files
2. Update code to remove feature flag checks
3. Remove from documentation
4. Test thoroughly

## Security Considerations

- Feature flags are not secret - don't put sensitive configuration in them
- Use environment-specific overrides for security-related features
- Validate feature flag inputs
- Monitor feature flag changes in production
- **IMPORTANT**: Sensitive secrets like `VITE_WALLET_CONNECT_PROJECT_ID` and KurrentDB API keys should only be stored in `.env.local` (for local development) or CI/CD secrets (for production)
- Never commit `.env.local` files to version control
- Use the `env.local.example` file as a template for required secrets

## Performance Considerations

- Feature flag checks are lightweight and cached
- Avoid complex logic in feature flag checks
- Use feature flags to optimize bundle sizes
- Monitor performance impact of feature flags
