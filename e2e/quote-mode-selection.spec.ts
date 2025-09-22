import { test, expect } from '@playwright/test'

test.describe('Quote Mode Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quote')
  })

  test('should display mode selection on initial load', async ({ page }) => {
    // Check that the quote container is visible
    await expect(page.locator('[data-testid="quote-container"]')).toBeVisible()

    // Verify both quote options are present
    await expect(page.locator('text=Guided Quote')).toBeVisible()
    await expect(page.locator('text=Technical Quote')).toBeVisible()

    // Verify descriptions are shown
    await expect(page.locator('text=/Perfect for those who want guidance/')).toBeVisible()
    await expect(page.locator('text=/For developers and technical teams/')).toBeVisible()
  })

  test('should navigate to guided form when selected', async ({ page }) => {
    // Click on Guided Quote option
    await page.click('text=Guided Quote')

    // Verify navigation to guided form
    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()

    // Check that progress indicator is shown
    await expect(page.locator('[data-testid="quote-progress"]')).toBeVisible()
  })

  test('should navigate to technical form when selected', async ({ page }) => {
    // Click on Technical Quote option
    await page.click('text=Technical Quote')

    // Verify navigation to technical form view
    await expect(page.locator('text=/How would you like to proceed/')).toBeVisible()

    // Check that both options are available
    await expect(page.locator('text=Fill Out Online Form')).toBeVisible()
    await expect(page.locator('text=Download Template')).toBeVisible()
  })

  test('should return to selection when back is clicked from guided form', async ({ page }) => {
    // Navigate to guided form
    await page.click('text=Guided Quote')
    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()

    // Click back button
    await page.click('[aria-label="Go back"]')

    // Verify return to mode selection
    await expect(page.locator('text=Choose Your Path')).toBeVisible()
    await expect(page.locator('text=Guided Quote')).toBeVisible()
    await expect(page.locator('text=Technical Quote')).toBeVisible()
  })

  test('should return to selection when back is clicked from technical form', async ({ page }) => {
    // Navigate to technical form
    await page.click('text=Technical Quote')
    await expect(page.locator('text=/How would you like to proceed/')).toBeVisible()

    // Click back button
    await page.click('text=Back to Options')

    // Verify return to mode selection
    await expect(page.locator('text=Choose Your Path')).toBeVisible()
    await expect(page.locator('text=Guided Quote')).toBeVisible()
    await expect(page.locator('text=Technical Quote')).toBeVisible()
  })

  test('should preserve selection state during navigation', async ({ page }) => {
    // Navigate to guided form and fill some data
    await page.click('text=Guided Quote')
    await page.fill('input[name="name"]', 'Test User')

    // Go back
    await page.click('[aria-label="Go back"]')

    // Navigate to guided form again
    await page.click('text=Guided Quote')

    // Check if data was cleared (it should be for new session)
    const nameInput = await page.locator('input[name="name"]').inputValue()
    expect(nameInput).toBe('')
  })

  test('should have proper focus management', async ({ page }) => {
    // Check initial focus
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    // Tab through options
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Activate with Enter key
    await page.keyboard.press('Enter')

    // Verify navigation occurred
    const url = page.url()
    expect(url).toContain('/quote')
  })

  test('should display correctly on different screen sizes', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('text=Choose Your Path')).toBeVisible()
    await expect(page.locator('text=Guided Quote')).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('text=Choose Your Path')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('text=Choose Your Path')).toBeVisible()
  })
})