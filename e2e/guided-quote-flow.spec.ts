import { test, expect } from '@playwright/test'
import { validGuidedFormData, invalidFormData } from './fixtures/test-data'

test.describe('Guided Quote Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quote')
    await page.click('text=Guided Quote')
  })

  test('should complete full guided form submission', async ({ page }) => {
    // Step 1: Contact Information
    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()
    await page.fill('input[name="name"]', validGuidedFormData.name)
    await page.fill('input[name="email"]', validGuidedFormData.email)
    await page.fill('input[name="company"]', validGuidedFormData.company)
    await page.click('text=Continue')

    // Step 2: Project Type
    await expect(page.locator('text=/What are we building/')).toBeVisible()
    await page.click(`text=Website`)
    await page.click('text=Continue')

    // Step 3: Project Description
    await expect(page.locator('text=/Tell me about your vision/')).toBeVisible()
    await page.fill('textarea[name="projectDescription"]', validGuidedFormData.projectDescription)
    await page.click('text=Continue')

    // Step 4: Features
    await expect(page.locator('text=/What features do you need/')).toBeVisible()
    for (const feature of validGuidedFormData.features) {
      await page.click(`text=${feature}`)
    }
    await page.click('text=Continue')

    // Step 5: Timeline
    await expect(page.locator('text=/When do you need this/')).toBeVisible()
    await page.click('text=Within 1 month')
    await page.click('text=Continue')

    // Step 6: Budget
    await expect(page.locator('text=/Budget range/')).toBeVisible()
    await page.click('text=$5,000 - $10,000')
    await page.click('text=Continue')

    // Step 7: Review and Submit
    await expect(page.locator('text=/Perfect! Let\'s review/')).toBeVisible()

    // Mock API response
    await page.route('/api/send-quote', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.click('text=Send My Project Request')

    // Verify success message
    await expect(page.locator('text=/Thank you/')).toBeVisible()
  })

  test('should validate required fields at each step', async ({ page }) => {
    // Try to continue without filling required fields
    await page.click('text=Continue')

    // Should show validation errors
    await expect(page.locator('text=/Name is required/')).toBeVisible()
    await expect(page.locator('text=/Email is required/')).toBeVisible()

    // Fill name only
    await page.fill('input[name="name"]', 'Test')
    await page.click('text=Continue')

    // Should still show email error
    await expect(page.locator('text=/Email is required/')).toBeVisible()

    // Fill email with invalid format
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('text=Continue')

    // Should show format error
    await expect(page.locator('text=/Please enter a valid email/')).toBeVisible()
  })

  test('should navigate between steps correctly', async ({ page }) => {
    // Fill step 1
    await page.fill('input[name="name"]', validGuidedFormData.name)
    await page.fill('input[name="email"]', validGuidedFormData.email)
    await page.click('text=Continue')

    // Go to step 2
    await expect(page.locator('text=/What are we building/')).toBeVisible()

    // Go back to step 1
    await page.click('[aria-label="Go back"]')
    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()

    // Data should be preserved
    expect(await page.locator('input[name="name"]').inputValue()).toBe(validGuidedFormData.name)
    expect(await page.locator('input[name="email"]').inputValue()).toBe(validGuidedFormData.email)

    // Go forward again
    await page.click('text=Continue')
    await expect(page.locator('text=/What are we building/')).toBeVisible()
  })

  test('should preserve data when navigating back', async ({ page }) => {
    // Fill multiple steps
    await page.fill('input[name="name"]', validGuidedFormData.name)
    await page.fill('input[name="email"]', validGuidedFormData.email)
    await page.click('text=Continue')

    await page.click('text=Website')
    await page.click('text=Continue')

    await page.fill('textarea[name="projectDescription"]', validGuidedFormData.projectDescription)
    await page.click('text=Continue')

    // Navigate back through steps
    await page.click('[aria-label="Go back"]')
    expect(await page.locator('textarea[name="projectDescription"]').inputValue()).toBe(validGuidedFormData.projectDescription)

    await page.click('[aria-label="Go back"]')
    await expect(page.locator('.border-sunny-red').first()).toBeVisible() // Selected project type

    await page.click('[aria-label="Go back"]')
    expect(await page.locator('input[name="name"]').inputValue()).toBe(validGuidedFormData.name)
  })

  test('should show validation errors for invalid inputs', async ({ page }) => {
    // Test email validation
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', invalidFormData.email)
    await page.click('text=Continue')

    await expect(page.locator('text=/Please enter a valid email/')).toBeVisible()

    // Test max length validation
    await page.fill('input[name="email"]', validGuidedFormData.email)
    await page.click('text=Continue')
    await page.click('text=Website')
    await page.click('text=Continue')

    // Try to enter text exceeding max length
    await page.fill('textarea[name="projectDescription"]', invalidFormData.projectDescription)
    const actualValue = await page.locator('textarea[name="projectDescription"]').inputValue()
    expect(actualValue.length).toBeLessThanOrEqual(1000)
  })

  test('should display success message after submission', async ({ page }) => {
    // Quick path to submission
    await page.fill('input[name="name"]', validGuidedFormData.name)
    await page.fill('input[name="email"]', validGuidedFormData.email)

    // Navigate through all steps quickly
    const steps = [
      () => page.click('text=Continue'),
      async () => {
        await page.click('text=Website');
        await page.click('text=Continue');
      },
      async () => {
        await page.fill('textarea[name="projectDescription"]', 'Test');
        await page.click('text=Continue');
      },
      async () => {
        await page.click('text=User accounts/login');
        await page.click('text=Continue');
      },
      async () => {
        await page.click('text=Within 1 month');
        await page.click('text=Continue');
      },
      async () => {
        await page.click('text=$5,000 - $10,000');
        await page.click('text=Continue');
      }
    ]

    for (const step of steps) {
      await step()
    }

    // Mock successful API response
    await page.route('/api/send-quote', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.click('text=Send My Project Request')
    await expect(page.locator('text=/Thank you/')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Quick navigation to submission
    await page.fill('input[name="name"]', validGuidedFormData.name)
    await page.fill('input[name="email"]', validGuidedFormData.email)
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

    // Mock API error
    await page.route('/api/send-quote', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      })
    })

    await page.click('text=Send My Project Request')

    // Should show error message
    await expect(page.locator('text=/error sending your request/')).toBeVisible()
  })

  test('should prevent double submission', async ({ page }) => {
    // Quick navigation to submission
    await page.fill('input[name="name"]', validGuidedFormData.name)
    await page.fill('input[name="email"]', validGuidedFormData.email)
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

    let requestCount = 0
    await page.route('/api/send-quote', async route => {
      requestCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Try to click submit button multiple times
    await page.click('text=Send My Project Request')
    await page.click('text=Send My Project Request')
    await page.click('text=Send My Project Request')

    // Wait for any additional requests
    await page.waitForTimeout(1000)

    // Should only have made one request
    expect(requestCount).toBe(1)
  })

  test('should handle Other option in features correctly', async ({ page }) => {
    // Navigate to features step
    await page.fill('input[name="name"]', validGuidedFormData.name)
    await page.fill('input[name="email"]', validGuidedFormData.email)
    await page.click('text=Continue')
    await page.click('text=Website')
    await page.click('text=Continue')
    await page.fill('textarea[name="projectDescription"]', 'Test')
    await page.click('text=Continue')

    // Click Other option
    await page.click('text=Other')

    // Should show text input for other features
    await expect(page.locator('input[placeholder*="describe what else"]')).toBeVisible()

    // Fill other features
    await page.fill('input[placeholder*="describe what else"]', 'Custom feature requirement')

    // Continue to next step
    await page.click('text=Continue')

    // Navigate back to verify data is preserved
    await page.click('[aria-label="Go back"]')
    expect(await page.locator('input[placeholder*="describe what else"]').inputValue()).toBe('Custom feature requirement')
  })
})
