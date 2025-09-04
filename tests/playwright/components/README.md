# Playwright Component Tests

This directory contains fast component tests using Playwright for the Penguin Pool application.

## Features

- **Fast Execution**: Optimized for speed with minimal overhead
- **Isolated Testing**: Components are tested in isolation
- **Real Browser Testing**: Tests run in actual browser environments
- **Separate from Pre-commit**: Won't slow down your development workflow

## Running Tests

### Quick Component Tests

```bash
npm run test:component
```

### Interactive UI Mode

```bash
npm run test:component:ui
```

### Debug Mode

```bash
npm run test:component:debug
```

### Using the Script

```bash
./scripts/test-component.sh
```

## Test Structure

- `PageFooter.spec.ts` - Tests for the PageFooter component
- `PenguinLogo.spec.ts` - Tests for the PenguinLogo component
- `test-setup.ts` - Component test utilities and setup
- `test-page.html` - HTML page for component testing

## Configuration

The component tests use `playwright.component.config.ts` which is optimized for:

- **Speed**: 5-second timeout, no retries, no screenshots/videos
- **Parallelism**: 4 workers for faster execution
- **Minimal Overhead**: Disabled tracing and other slow features
- **Fast Failures**: Stops on first failure for quick feedback

## Adding New Component Tests

1. Create a new `.spec.ts` file in this directory
2. Import the test utilities: `import { test, expect } from '@playwright/test'`
3. Write your tests using Playwright's testing API
4. Focus on component behavior and user interactions

## Best Practices

- Keep tests focused and fast
- Test component behavior, not implementation details
- Use meaningful test descriptions
- Avoid complex setup that slows down tests
- Test one component per test file for isolation

## Performance

Component tests are designed to run in under 10 seconds for the entire suite, making them suitable for:

- Development feedback
- CI/CD pipelines
- Pre-deployment validation
- Component regression testing
