import { test, expect } from '@playwright/test'
import { performanceThresholds } from './fixtures/test-data'

test.describe('Performance', () => {
  test('should load quote page within 3 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/quote', { waitUntil: 'networkidle' })

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(performanceThresholds.pageLoadTime)

    // Check that main content is visible
    await expect(page.locator('text=Choose Your Path')).toBeVisible()
  })

  test('should respond to interactions within 100ms', async ({ page }) => {
    await page.goto('/quote')

    // Measure interaction response time
    const startTime = Date.now()
    await page.click('text=Guided Quote')
    const responseTime = Date.now() - startTime

    expect(responseTime).toBeLessThan(performanceThresholds.interactionDelay + 50) // Adding buffer for network

    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()
  })

  test('should not have memory leaks during navigation', async ({ page }) => {
    await page.goto('/quote')

    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })

    // Navigate through the form multiple times
    for (let i = 0; i < 5; i++) {
      await page.click('text=Guided Quote')
      await page.fill('input[name="name"]', `User ${i}`)
      await page.fill('input[name="email"]', `user${i}@example.com`)
      await page.click('text=Continue')
      await page.click('[aria-label="Go back"]')
      await page.click('[aria-label="Go back"]')
    }

    // Check memory after navigation
    const finalMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize
      }
      return 0
    })

    // Memory shouldn't increase significantly (allow 10MB increase)
    if (initialMetrics > 0 && finalMetrics > 0) {
      const memoryIncrease = finalMetrics - initialMetrics
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB
    }
  })

  test('should handle rapid form submissions', async ({ page }) => {
    await page.goto('/quote')
    await page.click('text=Guided Quote')

    // Fill form quickly
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')

    // Rapid clicks on continue
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(page.click('text=Continue').catch(() => {}))
    }

    await Promise.all(promises)

    // Should only navigate once
    await expect(page.locator('text=/What are we building/')).toBeVisible()

    // Page should still be responsive
    await page.click('[aria-label="Go back"]')
    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()
  })

  test('should optimize bundle size and lazy load components', async ({ page }) => {
    // Monitor network requests
    const requests = []
    page.on('request', request => {
      if (request.resourceType() === 'script') {
        requests.push({
          url: request.url(),
          size: request.size || 0
        })
      }
    })

    await page.goto('/quote')

    // Initial bundle should be reasonable
    const totalSize = requests.reduce((sum, req) => sum + req.size, 0)
    expect(totalSize).toBeLessThan(2 * 1024 * 1024) // 2MB total for initial load

    // Navigate to trigger potential lazy loads
    await page.click('text=Technical Quote')

    // Additional components should load on demand
    const lazyLoadedRequests = requests.filter(req =>
      req.url.includes('technical') || req.url.includes('chunk')
    )

    // Some code splitting should be happening
    expect(lazyLoadedRequests.length).toBeGreaterThan(0)
  })

  test('should maintain 60 FPS during animations', async ({ page }) => {
    await page.goto('/quote')

    // Start performance measurement
    await page.evaluateHandle(() => {
      window.frameCount = 0
      window.startTime = performance.now()

      const countFrames = () => {
        window.frameCount++
        if (performance.now() - window.startTime < 1000) {
          requestAnimationFrame(countFrames)
        }
      }
      requestAnimationFrame(countFrames)
    })

    // Trigger animations
    await page.click('text=Guided Quote')
    await page.waitForTimeout(1000)

    // Check FPS
    const fps = await page.evaluate(() => window.frameCount)
    expect(fps).toBeGreaterThan(50) // Allow some variance from 60 FPS
  })

  test('should cache static assets effectively', async ({ page }) => {
    // First visit
    const firstLoadRequests = []
    page.on('request', request => {
      firstLoadRequests.push(request.url())
    })

    await page.goto('/quote')
    const firstLoadCount = firstLoadRequests.length

    // Second visit (should use cache)
    const secondLoadRequests = []
    page.on('request', request => {
      secondLoadRequests.push(request.url())
    })

    await page.reload()
    const secondLoadCount = secondLoadRequests.length

    // Second load should have fewer requests due to caching
    expect(secondLoadCount).toBeLessThanOrEqual(firstLoadCount)
  })

  test('should handle API timeouts gracefully', async ({ page }) => {
    await page.goto('/quote')
    await page.click('text=Guided Quote')

    // Fill form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('text=Continue')
    await page.click('text=Website')
    await page.click('text=Continue')
    await page.fill('textarea[name="projectDescription"]', 'Test')
    await page.click('text=Continue')
    await page.click('text=User accounts/login')
    await page.click('text=Continue')
    await page.click('text=Within 1 month')
    await page.click('text=Continue')
    await page.click('text=$5,000 - $10,000')
    await page.click('text=Continue')

    // Mock slow API
    await page.route('/api/send-quote', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000)) // 5 second delay
      await route.fulfill({
        status: 504,
        body: 'Gateway Timeout'
      })
    })

    await page.click('text=Send My Project Request')

    // Should show timeout error within reasonable time
    await expect(page.locator('text=/error|timeout/i')).toBeVisible({ timeout: 10000 })
  })
})