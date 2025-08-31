# Testing Setup

This project has a comprehensive testing setup with both unit tests and component tests.

## Test Types

### 1. Unit Tests (Vitest)
- **Location**: `tests/unit/`
- **Framework**: Vitest + Vue Test Utils
- **Speed**: Very fast (< 1 second for all tests)
- **Pre-commit**: ✅ Included in pre-commit hooks
- **Command**: `npm run test:run`

### 2. Component Tests (Playwright)
- **Location**: `tests/playwright/components/`
- **Framework**: Playwright
- **Speed**: Fast (~3-5 seconds for all tests)
- **Pre-commit**: ❌ Not included (separate workflow)
- **Command**: `npm run test:component`

### 3. E2E Tests (Playwright)
- **Location**: `tests/playwright/`
- **Framework**: Playwright
- **Speed**: Slower (full application testing)
- **Pre-commit**: ❌ Not included
- **Command**: `npm run test:e2e`

## Running Tests

### Quick Commands
```bash
# Unit tests (fast, included in pre-commit)
npm run test:run

# Component tests (fast, separate)
npm run test:component

# E2E tests (slower, separate)
npm run test:e2e
```

### Interactive Mode
```bash
# Unit tests with UI
npm run test:ui

# Component tests with UI
npm run test:component:ui

# E2E tests with UI
npm run test:e2e:ui
```

### Debug Mode
```bash
# Component tests in debug mode
npm run test:component:debug
```

## Test Configuration

### Unit Tests (Vitest)
- **Config**: `vitest.config.ts`
- **Environment**: jsdom
- **Setup**: `tests/setup.ts`
- **Coverage**: Available via `npm run test:coverage`

### Component Tests (Playwright)
- **Config**: `playwright.component.config.ts`
- **Optimized for speed**: 5s timeout, no retries, no screenshots
- **Parallel execution**: 4 workers
- **Browser**: Chromium only (for speed)

### E2E Tests (Playwright)
- **Config**: `playwright.config.ts`
- **Full browser support**: Chromium, Firefox, WebKit
- **Tracing and screenshots**: Enabled
- **Retries**: 2 retries on failure

## Pre-commit Hooks

The pre-commit hooks are configured to run only unit tests for speed:

```bash
# .husky/pre-commit
npm run lint-staged    # Format and lint
npm run test:run       # Fast unit tests only
```

This ensures:
- ✅ Fast feedback during development
- ✅ No blocking on slower tests
- ✅ Consistent code quality

## Performance

| Test Type | Execution Time | Pre-commit | Use Case |
|-----------|----------------|------------|----------|
| Unit Tests | < 1s | ✅ Yes | Development, CI |
| Component Tests | 3-5s | ❌ No | Component validation |
| E2E Tests | 30s+ | ❌ No | Full application testing |

## Adding New Tests

### Unit Tests
1. Create file in `tests/unit/`
2. Import from `@/components/ComponentName.vue`
3. Use Vue Test Utils for mounting
4. Test component logic and props

### Component Tests
1. Create file in `tests/playwright/components/`
2. Use Playwright's testing API
3. Test component rendering and behavior
4. Focus on user interactions

### E2E Tests
1. Create file in `tests/playwright/`
2. Test full user workflows
3. Test application integration
4. Use multiple browser support

## Best Practices

1. **Keep unit tests fast** - They run on every commit
2. **Component tests for UI** - Test rendering and interactions
3. **E2E tests for workflows** - Test complete user journeys
4. **Separate concerns** - Different test types for different purposes
5. **Optimize for speed** - Component tests should be fast for development feedback
