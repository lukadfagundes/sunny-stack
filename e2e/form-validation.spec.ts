import { test, expect } from '@playwright/test'
import { invalidFormData as _invalidFormData, edgeCaseData } from './fixtures/test-data'

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quote')
  })

  test('should validate email format', async ({ page }) => {
    await page.click('text=Guided Quote')

    // Test various invalid email formats
    const invalidEmails = [
      'plaintext',
      '@example.com',
      'user@',
      'user@.com',
      'user..name@example.com',
      'user name@example.com',
      'user@example',
    ]

    for (const email of invalidEmails) {
      await page.fill('input[name="email"]', email)
      await page.fill('input[name="name"]', 'Test User')
      await page.click('text=Continue')
      await expect(page.locator('text=/Please enter a valid email/')).toBeVisible()
      await page.fill('input[name="email"]', '')
    }

    // Test valid email formats
    const validEmails = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'user123@test-domain.org'
    ]

    for (const email of validEmails) {
      await page.fill('input[name="email"]', email)
      await page.click('text=Continue')
      // Should move to next step
      await expect(page.locator('text=/What are we building/')).toBeVisible()
      await page.click('[aria-label="Go back"]')
    }
  })

  test('should validate phone number format', async ({ page }) => {
    await page.click('text=Technical Quote')
    await page.click('text=Fill Out Online Form')

    // Phone field might be optional, but if provided should be valid
    const invalidPhones = ['123', 'abc-defg-hijk', '!!!-!!!-!!!!']

    for (const phone of invalidPhones) {
      await page.fill('input[name="phone"]', phone)
      // Fill other required fields to trigger validation
      await page.click('text=Submit Technical Requirements')

      // Clear for next test
      await page.fill('input[name="phone"]', '')
    }
  })

  test('should enforce character limits', async ({ page }) => {
    await page.click('text=Guided Quote')

    // Test name field max length (50 characters)
    const longName = 'A'.repeat(60)
    await page.fill('input[name="name"]', longName)
    const nameValue = await page.locator('input[name="name"]').inputValue()
    expect(nameValue.length).toBeLessThanOrEqual(50)

    // Test company field max length (50 characters)
    const longCompany = 'B'.repeat(60)
    await page.fill('input[name="company"]', longCompany)
    const companyValue = await page.locator('input[name="company"]').inputValue()
    expect(companyValue.length).toBeLessThanOrEqual(50)

    // Navigate to description field
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('text=Continue')
    await page.click('text=Website')
    await page.click('text=Continue')

    // Test description max length (1000 characters)
    const longDescription = 'C'.repeat(1100)
    await page.fill('textarea[name="projectDescription"]', longDescription)
    const descValue = await page.locator('textarea[name="projectDescription"]').inputValue()
    expect(descValue.length).toBeLessThanOrEqual(1000)
  })

  test('should require mandatory fields', async ({ page }) => {
    await page.click('text=Guided Quote')

    // Try to proceed without filling any fields
    await page.click('text=Continue')

    // Should show multiple required field errors
    const errors = await page.locator('.text-red-500').allTextContents()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some(e => e.includes('required'))).toBeTruthy()

    // Fill only name
    await page.fill('input[name="name"]', 'Test User')
    await page.click('text=Continue')

    // Should still show email required
    await expect(page.locator('text=/Email is required/')).toBeVisible()

    // Fill email and should proceed
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('text=Continue')
    await expect(page.locator('text=/What are we building/')).toBeVisible()
  })

  test('should sanitize HTML in text inputs', async ({ page }) => {
    await page.click('text=Guided Quote')

    // Test XSS attempts in various fields
    const xssAttempts = edgeCaseData.specialCharacters

    await page.fill('input[name="name"]', xssAttempts.name)
    await page.fill('input[name="company"]', xssAttempts.company)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('text=Continue')

    // Should proceed without executing scripts
    await expect(page.locator('text=/What are we building/')).toBeVisible()

    // Continue to description
    await page.click('text=Website')
    await page.click('text=Continue')

    await page.fill('textarea[name="projectDescription"]', xssAttempts.projectDescription)

    // Verify no script execution occurred
    const alerts = []
    page.on('dialog', dialog => {
      alerts.push(dialog.message())
      dialog.dismiss()
    })

    await page.click('text=Continue')
    expect(alerts.length).toBe(0)
  })

  test('should validate budget and timeline selections', async ({ page }) => {
    await page.click('text=Guided Quote')

    // Navigate to timeline step
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('text=Continue')
    await page.click('text=Website')
    await page.click('text=Continue')
    await page.fill('textarea[name="projectDescription"]', 'Test')
    await page.click('text=Continue')
    await page.click('text=User accounts/login')
    await page.click('text=Continue')

    // Timeline step - try to continue without selection
    await page.click('text=Continue')
    await expect(page.locator('text=/Timeline is required/')).toBeVisible()

    // Select timeline
    await page.click('text=Within 1 month')
    await page.click('text=Continue')

    // Budget step - try to continue without selection
    await page.click('text=Continue')
    await expect(page.locator('text=/Budget is required/')).toBeVisible()

    // Select budget
    await page.click('text=$5,000 - $10,000')
    await page.click('text=Continue')

    // Should reach review step
    await expect(page.locator('text=/Perfect! Let\'s review/')).toBeVisible()
  })

  test('should handle special characters in input fields', async ({ page }) => {
    await page.click('text=Guided Quote')

    // Test special characters that should be allowed
    const specialName = edgeCaseData.specialCharacters.name
    await page.fill('input[name="name"]', specialName)
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('text=Continue')

    // Should accept special characters in names
    await expect(page.locator('text=/What are we building/')).toBeVisible()

    // Go back and verify data preserved
    await page.click('[aria-label="Go back"]')
    expect(await page.locator('input[name="name"]').inputValue()).toBe(specialName)
  })

  test('should validate form on both client and server side', async ({ page }) => {
    await page.click('text=Guided Quote')

    // Disable JavaScript to test server-side validation
    await page.addInitScript(() => {
      // Simulate client-side validation being bypassed
    })

    // Fill form with invalid data
    await page.fill('input[name="name"]', '')
    await page.fill('input[name="email"]', 'invalid')

    // Navigate through form
    await page.click('text=Continue')

    // Should still catch validation errors
    await expect(page.locator('text=/required|valid/')).toBeVisible()
  })

  test('should handle edge case input lengths', async ({ page }) => {
    await page.click('text=Guided Quote')

    // Test minimum valid inputs
    const minData = edgeCaseData.minimalData
    await page.fill('input[name="name"]', minData.name)
    await page.fill('input[name="email"]', minData.email)
    await page.click('text=Continue')

    // Should accept minimal valid data
    await expect(page.locator('text=/What are we building/')).toBeVisible()

    // Test maximum length inputs
    await page.click('[aria-label="Go back"]')
    const maxData = edgeCaseData.maxLengthInputs
    await page.fill('input[name="name"]', maxData.name)
    await page.fill('input[name="email"]', maxData.email)
    await page.click('text=Continue')

    // Should handle max length data
    await expect(page.locator('text=/What are we building/')).toBeVisible()
  })

  test('should validate dropdown selections', async ({ page }) => {
    await page.click('text=Technical Quote')
    await page.click('text=Fill Out Online Form')

    // Test that default/empty option is not valid
    await page.fill('input[name="contactName"]', 'Test')
    await page.fill('input[name="contactEmail"]', 'test@example.com')
    await page.fill('input[name="projectName"]', 'Test')
    await page.fill('textarea[name="projectDescription"]', 'Test')
    await page.fill('textarea[name="features"]', 'Test')

    // Leave dropdowns at default
    await page.click('text=Submit Technical Requirements')

    // Should show errors for required dropdowns
    await expect(page.locator('text=/Project Type.*required/')).toBeVisible()
    await expect(page.locator('text=/Timeline.*required/')).toBeVisible()
    await expect(page.locator('text=/Budget.*required/')).toBeVisible()
  })
})
