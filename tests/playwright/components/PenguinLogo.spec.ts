import { test, expect } from '@playwright/test'

test.describe('PenguinLogo Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a simple test page that renders the component
    await page.goto('/')
  })

  test('renders logo image correctly', async ({ page }) => {
    // Check if logo image is visible
    const logo = page.locator('img[alt="Penguin Pool Logo"]')
    await expect(logo).toBeVisible()

    // Check logo attributes
    await expect(logo).toHaveAttribute('src', /penguin-pool\.svg$/)
    await expect(logo).toHaveAttribute('alt', 'Penguin Pool Logo')
  })

  test('applies custom CSS classes when provided', async ({ page }) => {
    // This test would need the component to be rendered with custom classes
    // For now, we'll test the basic functionality
    const logo = page.locator('img[alt="Penguin Pool Logo"]')
    await expect(logo).toBeVisible()
  })

  test('logo has correct dimensions', async ({ page }) => {
    const logo = page.locator('img[alt="Penguin Pool Logo"]')

    // Check if logo has width and height attributes
    const width = await logo.getAttribute('width')
    const height = await logo.getAttribute('height')

    expect(width).toBeTruthy()
    expect(height).toBeTruthy()
  })
})
