import { test, expect } from '@playwright/test'

test.describe('Portfolio Mobile Scroll Fix', () => {

  test('should not jump to top when scrolling to bottom on mobile', async ({ page }) => {
    // Navigate to portfolio page
    await page.goto('/portfolio')

    // Wait for page to load
    await expect(page.locator('h1').nth(1)).toContainText('Portfolio')

    // Get initial scroll position (should be at top)
    const initialScroll = await page.evaluate(() => window.scrollY)
    expect(initialScroll).toBe(0)

    // Scroll to bottom of page
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight)
    })

    // Wait a moment for any potential jump to occur
    await page.waitForTimeout(500)

    // Check that we're still at the bottom (not jumped back to top)
    const finalScroll = await page.evaluate(() => window.scrollY)
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)

    // We should be near the bottom (within 50px tolerance)
    expect(finalScroll).toBeGreaterThan(pageHeight - 50)

    console.log(`Initial scroll: ${initialScroll}, Final scroll: ${finalScroll}, Page height: ${pageHeight}`)
  })

  test('should handle smooth scrolling without jumping', async ({ page }) => {
    await page.goto('/portfolio')

    // Wait for content to load
    await expect(page.locator('h1').nth(1)).toContainText('Portfolio')

    // Perform gradual scroll
    const scrollSteps = 5
    const scrollPositions = []

    for (let i = 1; i <= scrollSteps; i++) {
      await page.evaluate((step) => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        const targetScroll = (maxScroll / 5) * step
        window.scrollTo({ top: targetScroll, behavior: 'smooth' })
      }, i)

      await page.waitForTimeout(300) // Wait for smooth scroll

      const currentScroll = await page.evaluate(() => window.scrollY)
      scrollPositions.push(currentScroll)
    }

    // Verify that scroll positions are increasing (no jumps back)
    for (let i = 1; i < scrollPositions.length; i++) {
      expect(scrollPositions[i]).toBeGreaterThanOrEqual(scrollPositions[i - 1])
    }

    console.log('Scroll positions:', scrollPositions)
  })

  test('should maintain scroll position after interaction', async ({ page }) => {
    await page.goto('/portfolio')

    // Scroll to middle of page
    await page.evaluate(() => {
      const middleScroll = (document.documentElement.scrollHeight - window.innerHeight) / 2
      window.scrollTo(0, middleScroll)
    })

    const midScroll = await page.evaluate(() => window.scrollY)

    // Click on a project card (if available) or interact with page
    const projectCard = page.locator('.project-card').first()
    if (await projectCard.isVisible()) {
      await projectCard.click()
    }

    // Wait and check scroll position hasn't jumped
    await page.waitForTimeout(500)
    const afterInteractionScroll = await page.evaluate(() => window.scrollY)

    // Scroll position should remain relatively stable (within 100px)
    expect(Math.abs(afterInteractionScroll - midScroll)).toBeLessThan(100)
  })
})
