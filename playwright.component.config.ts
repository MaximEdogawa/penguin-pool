import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/playwright/components',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries for fast component tests
  workers: process.env.CI ? 1 : 4, // More workers for faster execution
  reporter: 'list', // Simple list reporter for speed
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off', // Disable tracing for speed
    screenshot: 'off', // Disable screenshots for speed
    video: 'off', // Disable video recording for speed
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // Always try to reuse existing server
    timeout: 60 * 1000, // Give more time for server startup
  },
  // Optimizations for fast component testing
  timeout: 5000, // 5 second timeout
  expect: {
    timeout: 2000, // 2 second timeout for assertions
  },
  // Disable unnecessary features for speed
  preserveOutput: 'never',
  maxFailures: 0, // Stop on first failure
})
