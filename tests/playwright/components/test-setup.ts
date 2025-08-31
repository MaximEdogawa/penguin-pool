import { test as base } from '@playwright/test'

// Extend the base test with component-specific utilities
export const test = base.extend({
  // Add any component-specific setup here
})

export { expect } from '@playwright/test'
