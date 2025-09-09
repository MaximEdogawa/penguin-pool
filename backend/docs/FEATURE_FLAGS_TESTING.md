# Backend Feature Flags Testing

This directory contains test scripts to verify that the backend feature flags are working correctly in different environments.

## Test Scripts

### 1. NPM Scripts (Recommended)

The easiest way to run feature flag tests using npm scripts (run from the backend directory):

```bash
# Navigate to backend directory
cd backend

# Test staging environment (default)
npm run test:feature-flags

# Test specific environments
npm run test:feature-flags:dev
npm run test:feature-flags:test
npm run test:feature-flags:staging
npm run test:feature-flags:production
```

### 2. Direct Script Execution

#### Node.js Script (`test-feature-flags.js`)

A Node.js script with environment support and better error handling.

**Usage:**

```bash
# Navigate to backend directory
cd backend

# Test staging environment (default)
node test-feature-flags.cjs

# Test specific environment
node test-feature-flags.cjs --env=dev
node test-feature-flags.cjs --env=test
node test-feature-flags.cjs --env=staging
node test-feature-flags.cjs --env=production

# Show help
node test-feature-flags.cjs --help
```

**Requirements:**

- Node.js (already available in the project)

#### Node.js Script (`test-feature-flags.cjs`)

A comprehensive Node.js script that tests all feature flag endpoints.

**Usage:**

```bash
# Navigate to backend directory
cd backend

# Make sure the backend is running first
npm run dev:staging

# Run the test script
node test-feature-flags.cjs
```

**Requirements:**

- Node.js (already available in the project)

## What the Tests Check

The test scripts verify the following:

### 1. **Basic Endpoints**

- `GET /feature-flags` - Get all feature flags
- `GET /feature-flags/enabled` - Get only enabled features
- `GET /feature-flags/health` - Health check for feature flags

### 2. **Category-based Tests**

- `GET /feature-flags/category/{category}` for each category:
  - `backend`
  - `database`
  - `api`
  - `security`
  - `experimental`

### 3. **Individual Feature Tests**

Tests each specific feature flag:

- **Backend**: websocketEnabled, healthChecks, rateLimiting, cors, compression, helmet, swagger, logging
- **Database**: kurrentdbEnabled, migrations, backup, monitoring
- **API**: versioning, documentation, validation, errorHandling
- **Security**: authentication, authorization, encryption, sessionManagement
- **Experimental**: advancedLogging, performanceMonitoring, metrics, tracing

### 4. **Validation Tests**

- `POST /feature-flags/validate` - Validate feature flag configuration
- Error handling for invalid endpoints

## Expected Results

Based on your staging environment configuration (`backend/env.staging`), you should see:

### ✅ **Enabled Features** (should return `true`):

- All backend features (websocketEnabled, healthChecks, rateLimiting, cors, compression, helmet, swagger, logging)
- All database features (kurrentdbEnabled, migrations, backup, monitoring)
- All API features (versioning, documentation, validation, errorHandling)
- All security features (authentication, authorization, encryption, sessionManagement)

### ❌ **Disabled Features** (should return `false`):

- All experimental features (advancedLogging, performanceMonitoring, metrics, tracing)

## Running Tests in Different Environments

### Staging Environment (Default)

```bash
# Navigate to backend directory
cd backend

# Start backend in staging mode
npm run dev:staging

# Run tests
npm run test:feature-flags
# or
npm run test:feature-flags:staging
```

### Development Environment

```bash
# Navigate to backend directory
cd backend

# Start backend in dev mode
npm run dev

# Run tests
npm run test:feature-flags:dev
```

### Test Environment

```bash
# Navigate to backend directory
cd backend

# Start backend in test mode
npm run dev:test

# Run tests
npm run test:feature-flags:test
```

### Production Environment

```bash
# Navigate to backend directory
cd backend

# Start backend in production mode
npm run dev:production

# Run tests
npm run test:feature-flags:production
```

## Troubleshooting

### Backend Not Running

If you see "Backend is not running or not accessible":

1. Make sure the backend is started: `npm run dev:staging`
2. Check the port (default: 3001 for staging)
3. Verify the backend URL in the test scripts

### Connection Timeout

If requests are timing out:

1. Check if the backend is responding: `curl http://localhost:3001/health`
2. Increase the timeout value in the test scripts
3. Check for firewall or network issues

### JSON Parsing Errors

If you see JSON parsing errors:

1. Install `jq`: `brew install jq` (macOS) or `apt-get install jq` (Ubuntu)
2. Or use the Node.js version which has built-in JSON parsing

## Customizing Tests

You can modify the test scripts to:

- Change the backend URL
- Add new feature flags to test
- Modify timeout values
- Add custom validation logic
- Test different environments

## Integration with CI/CD

These test scripts can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Test Feature Flags
  run: |
    npm run dev:staging &
    sleep 10  # Wait for backend to start
    ./test-feature-flags.sh
    pkill -f "nest start"
```
