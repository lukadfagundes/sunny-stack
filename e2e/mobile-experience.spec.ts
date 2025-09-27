import { test, expect, devices as _devices } from '@playwright/test'
import { mobileTestData } from './fixtures/test-data'

// Mobile tests with iPhone 12 configuration
test.describe('Mobile Experience', () => {

  test('should display correctly on mobile devices', async ({ page }) => {
    await page.goto('/quote')

    // Check main container is visible
    await expect(page.locator('[data-testid="quote-container"]')).toBeVisible()

    // Check that content fits within viewport
    const viewportSize = page.viewportSize()
    const containerBox = await page.locator('[data-testid="quote-container"]').boundingBox()

    if (containerBox && viewportSize) {
      expect(containerBox.width).toBeLessThanOrEqual(viewportSize.width)
    }

    // Check text is readable
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
    const fontSize = await heading.evaluate(el =>
      window.getComputedStyle(el).fontSize
    )
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16)
  })

  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/quote')

    // Test tap on quote option
    await page.tap('text=Guided Quote')
    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()

    // Test swipe/scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.evaluate(() => window.scrollTo(0, 0))

    // Test form input tap
    await page.tap('input[name="name"]')
    await page.fill('input[name="name"]', 'Mobile User')

    // Test button tap
    await page.tap('[aria-label="Go back"]')
    await expect(page.locator('text=Choose Your Path')).toBeVisible()
  })

  test('should show mobile-optimized navigation', async ({ page }) => {
    await page.goto('/quote')
    await page.tap('text=Guided Quote')

    // Check that back button is accessible
    const backButton = page.locator('[aria-label="Go back"]')
    await expect(backButton).toBeVisible()

    // Check touch target size
    const box = await backButton.boundingBox()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(mobileTestData.touchTargets.minSize)
      expect(box.height).toBeGreaterThanOrEqual(mobileTestData.touchTargets.minSize)
    }

    // Check progress indicator is mobile-friendly
    const progress = page.locator('[data-testid="quote-progress"]')
    await expect(progress).toBeVisible()
  })

  test('should maintain functionality on small screens', async ({ page }) => {
    await page.goto('/quote')
    await page.tap('text=Guided Quote')

    // Test form completion on mobile
    await page.fill('input[name="name"]', 'Mobile User')
    await page.fill('input[name="email"]', 'mobile@example.com')
    await page.tap('text=Continue')

    // Should navigate to next step
    await expect(page.locator('text=/What are we building/')).toBeVisible()

    // Test project type selection on mobile
    await page.tap('text=Mobile App')
    await page.tap('text=Continue')

    // Continue through form
    await page.fill('textarea[name="projectDescription"]', 'Mobile test')
    await page.tap('text=Continue')

    // Features selection
    await page.tap('text=Mobile responsive')
    await page.tap('text=Continue')

    // All functionality should work on mobile
    await expect(page.locator('text=/When do you need this/')).toBeVisible()
  })

  test('should handle virtual keyboard correctly', async ({ page }) => {
    await page.goto('/quote')
    await page.tap('text=Guided Quote')

    // Focus on input should bring up keyboard
    await page.tap('input[name="name"]')

    // Type with virtual keyboard simulation
    await page.type('input[name="name"]', 'Test User')

    // Keyboard should not cover submit button
    await page.tap('input[name="email"]')
    await page.type('input[name="email"]', 'test@example.com')

    // Continue button should be tappable
    await page.tap('text=Continue')
    await expect(page.locator('text=/What are we building/')).toBeVisible()
  })

  test('should adapt layout for landscape orientation', async ({ page }) => {
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 })
    await page.goto('/quote')

    // Content should still be accessible
    await expect(page.locator('text=Choose Your Path')).toBeVisible()
    await expect(page.locator('text=Guided Quote')).toBeVisible()
    await expect(page.locator('text=Technical Quote')).toBeVisible()

    // Elements should not overflow
    const container = await page.locator('[data-testid="quote-container"]').boundingBox()
    if (container) {
      expect(container.width).toBeLessThanOrEqual(667)
    }
  })

  test('should handle touch gestures on form elements', async ({ page }) => {
    await page.goto('/quote')
    await page.tap('text=Technical Quote')
    await page.tap('text=Fill Out Online Form')

    // Test dropdown selection on mobile
    await page.tap('select[name="projectType"]')
    await page.selectOption('select[name="projectType"]', 'mobile')

    // Test textarea on mobile
    await page.tap('textarea[name="projectDescription"]')
    await page.fill('textarea[name="projectDescription"]', 'Mobile form test')

    // Test checkbox/radio inputs if present
    await page.tap('select[name="timeline"]')
    await page.selectOption('select[name="timeline"]', 'flexible')

    // All touch interactions should work
    const selectedValue = await page.locator('select[name="projectType"]').inputValue()
    expect(selectedValue).toBe('mobile')
  })

  test('should provide adequate spacing for touch targets', async ({ page }) => {
    await page.goto('/quote')

    // Get all clickable elements
    const buttons = await page.locator('button, a, [role="button"]').all()

    for (const button of buttons.slice(0, 5)) { // Test first 5 to save time
      const box = await button.boundingBox()
      if (box) {
        // Check minimum size
        expect(box.width).toBeGreaterThanOrEqual(mobileTestData.touchTargets.minSize)
        expect(box.height).toBeGreaterThanOrEqual(mobileTestData.touchTargets.minSize)
      }
    }
  })
})

// Tablet tests with iPad configuration
test.describe('Tablet Experience', () => {

  test('should display correctly on tablet devices', async ({ page }) => {
    await page.goto('/quote')

    // Check layout adapts to tablet size
    await expect(page.locator('text=Choose Your Path')).toBeVisible()

    // Both options should be visible side by side if space permits
    await expect(page.locator('text=Guided Quote')).toBeVisible()
    await expect(page.locator('text=Technical Quote')).toBeVisible()

    // Check responsive grid layout
    const container = page.locator('[data-testid="quote-container"]')
    await expect(container).toBeVisible()
  })

  test('should handle tablet-specific interactions', async ({ page }) => {
    await page.goto('/quote')

    // Test hover states (tablets with mouse support)
    await page.hover('text=Guided Quote')

    // Test tap
    await page.tap('text=Guided Quote')
    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()

    // Test form on tablet
    await page.fill('input[name="name"]', 'Tablet User')
    await page.fill('input[name="email"]', 'tablet@example.com')
    await page.tap('text=Continue')

    await expect(page.locator('text=/What are we building/')).toBeVisible()
  })
})
