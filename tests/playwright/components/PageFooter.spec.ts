import { test, expect } from '@playwright/test'

test.describe('PageFooter Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a simple test page that renders the component
    await page.goto('/')
  })

  test('renders footer content correctly', async ({ page }) => {
    // Check if footer content is visible
    const footer = page.locator('.content-footer')
    await expect(footer).toBeVisible()

    // Check footer structure
    await expect(page.locator('.footer-content')).toBeVisible()
    await expect(page.locator('.footer-left')).toBeVisible()
    await expect(page.locator('.footer-right')).toBeVisible()
  })

  test('displays current year and copyright', async ({ page }) => {
    const currentYear = new Date().getFullYear()

    // Check copyright text
    await expect(page.locator('.footer-text')).toContainText('Penguin Pool')
    await expect(page.locator('.footer-text')).toContainText(currentYear.toString())
  })

  test('displays app version', async ({ page }) => {
    await expect(page.locator('.footer-version')).toContainText('v1.0.0')
  })
})
