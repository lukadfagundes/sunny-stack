import { test, expect } from '@playwright/test'
import { validTechnicalFormData } from './fixtures/test-data'

test.describe('Technical Quote Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quote')
    await page.click('text=Technical Quote')
  })

  test('should switch between form and download views', async ({ page }) => {
    // Initial view should show choice
    await expect(page.locator('text=/How would you like to proceed/')).toBeVisible()
    await expect(page.locator('text=Fill Out Online Form')).toBeVisible()
    await expect(page.locator('text=Download Template')).toBeVisible()

    // Click on online form
    await page.click('text=Fill Out Online Form')
    await expect(page.locator('text=Technical Requirements Form')).toBeVisible()

    // Go back to choice view
    await page.click('text=Back')
    await expect(page.locator('text=/How would you like to proceed/')).toBeVisible()

    // Click on download template
    await page.click('text=Download Template')

    // Should trigger download
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Download Requirements Template')
    const download = await downloadPromise

    expect(download.suggestedFilename()).toContain('technical-requirements')
  })

  test('should download template document', async ({ page }) => {
    await page.click('text=Download Template')

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Download Requirements Template')
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toMatch(/technical-requirements.*\.(docx|pdf|txt)/)

    // Verify email link is present
    await expect(page.locator('text=luka@sunny-stack.com')).toBeVisible()
  })

  test('should validate all technical fields', async ({ page }) => {
    await page.click('text=Fill Out Online Form')

    // Try to submit without filling required fields
    await page.click('text=Submit Technical Requirements')

    // Should show validation errors
    await expect(page.locator('text=/Full Name.*required/')).toBeVisible()
    await expect(page.locator('text=/Email.*required/')).toBeVisible()
    await expect(page.locator('text=/Project Name.*required/')).toBeVisible()
    await expect(page.locator('text=/Project Type.*required/')).toBeVisible()
    await expect(page.locator('text=/Project Description.*required/')).toBeVisible()
    await expect(page.locator('text=/Features.*required/')).toBeVisible()
    await expect(page.locator('text=/Timeline.*required/')).toBeVisible()
    await expect(page.locator('text=/Budget.*required/')).toBeVisible()
  })

  test('should submit technical requirements successfully', async ({ page }) => {
    await page.click('text=Fill Out Online Form')

    // Fill all required fields
    await page.fill('input[name="contactName"]', validTechnicalFormData.contactName)
    await page.fill('input[name="contactEmail"]', validTechnicalFormData.contactEmail)
    await page.fill('input[name="companyName"]', validTechnicalFormData.companyName)
    await page.fill('input[name="projectName"]', validTechnicalFormData.projectName)
    await page.selectOption('select[name="projectType"]', validTechnicalFormData.projectType)
    await page.fill('textarea[name="projectDescription"]', validTechnicalFormData.projectDescription)
    await page.fill('input[name="targetAudience"]', validTechnicalFormData.targetAudience)
    await page.fill('input[name="techStack"]', validTechnicalFormData.techStack)
    await page.fill('textarea[name="features"]', validTechnicalFormData.features)
    await page.fill('textarea[name="integrations"]', validTechnicalFormData.integrations)
    await page.selectOption('select[name="hostingPreference"]', validTechnicalFormData.hostingPreference)
    await page.selectOption('select[name="timeline"]', validTechnicalFormData.timeline)
    await page.selectOption('select[name="budget"]', validTechnicalFormData.budget)
    await page.selectOption('select[name="designStatus"]', validTechnicalFormData.designStatus)
    await page.fill('textarea[name="additionalNotes"]', validTechnicalFormData.additionalNotes)

    // Mock API response
    await page.route('/api/send-quote', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Submit form
    await page.click('text=Submit Technical Requirements')

    // Should show success message
    await expect(page.locator('text=/Thank you/')).toBeVisible()
  })

  test('should handle large text inputs', async ({ page }) => {
    await page.click('text=Fill Out Online Form')

    // Test max length on text areas
    const longText = 'A'.repeat(1500)

    await page.fill('textarea[name="projectDescription"]', longText)
    const descriptionValue = await page.locator('textarea[name="projectDescription"]').inputValue()
    expect(descriptionValue.length).toBeLessThanOrEqual(1000)

    await page.fill('textarea[name="features"]', longText)
    const featuresValue = await page.locator('textarea[name="features"]').inputValue()
    expect(featuresValue.length).toBeLessThanOrEqual(1000)

    await page.fill('textarea[name="additionalNotes"]', longText)
    const notesValue = await page.locator('textarea[name="additionalNotes"]').inputValue()
    expect(notesValue.length).toBeLessThanOrEqual(1000)
  })

  test('should show appropriate error messages', async ({ page }) => {
    await page.click('text=Fill Out Online Form')

    // Test email validation
    await page.fill('input[name="contactEmail"]', 'invalid-email')
    await page.click('text=Submit Technical Requirements')
    await expect(page.locator('text=/Please enter a valid email/')).toBeVisible()

    // Fix email and test other fields
    await page.fill('input[name="contactEmail"]', 'test@example.com')

    // Test required field messages
    await page.click('text=Submit Technical Requirements')
    const errorMessages = await page.locator('.text-red-500').allTextContents()
    expect(errorMessages.length).toBeGreaterThan(0)
  })

  test('should clear form after successful submission', async ({ page }) => {
    await page.click('text=Fill Out Online Form')

    // Fill minimal required fields
    await page.fill('input[name="contactName"]', 'Test Name')
    await page.fill('input[name="contactEmail"]', 'test@example.com')
    await page.fill('input[name="projectName"]', 'Test Project')
    await page.selectOption('select[name="projectType"]', 'website')
    await page.fill('textarea[name="projectDescription"]', 'Test description')
    await page.fill('textarea[name="features"]', 'Test features')
    await page.selectOption('select[name="timeline"]', 'flexible')
    await page.selectOption('select[name="budget"]', 'under5k')

    // Mock API response
    await page.route('/api/send-quote', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.click('text=Submit Technical Requirements')
    await expect(page.locator('text=/Thank you/')).toBeVisible()

    // Navigate back to form
    await page.click('text=Submit Another')

    // Check fields are cleared
    expect(await page.locator('input[name="contactName"]').inputValue()).toBe('')
    expect(await page.locator('input[name="contactEmail"]').inputValue()).toBe('')
    expect(await page.locator('textarea[name="projectDescription"]').inputValue()).toBe('')
  })

  test('should handle form reset correctly', async ({ page }) => {
    await page.click('text=Fill Out Online Form')

    // Fill some fields
    await page.fill('input[name="contactName"]', 'Test Name')
    await page.fill('input[name="contactEmail"]', 'test@example.com')
    await page.fill('textarea[name="projectDescription"]', 'Test description')

    // Go back and return
    await page.click('text=Back')
    await page.click('text=Fill Out Online Form')

    // Fields should be cleared when returning
    expect(await page.locator('input[name="contactName"]').inputValue()).toBe('')
    expect(await page.locator('input[name="contactEmail"]').inputValue()).toBe('')
  })

  test('should validate select dropdowns', async ({ page }) => {
    await page.click('text=Fill Out Online Form')

    // Fill text fields but leave dropdowns empty
    await page.fill('input[name="contactName"]', 'Test Name')
    await page.fill('input[name="contactEmail"]', 'test@example.com')
    await page.fill('input[name="projectName"]', 'Test Project')
    await page.fill('textarea[name="projectDescription"]', 'Test description')
    await page.fill('textarea[name="features"]', 'Test features')

    // Submit without selecting dropdowns
    await page.click('text=Submit Technical Requirements')

    // Should show errors for required dropdowns
    await expect(page.locator('text=/Project Type.*required/')).toBeVisible()
    await expect(page.locator('text=/Timeline.*required/')).toBeVisible()
    await expect(page.locator('text=/Budget.*required/')).toBeVisible()
  })

  test('should handle optional fields correctly', async ({ page }) => {
    await page.click('text=Fill Out Online Form')

    // Fill only required fields, leave optional empty
    await page.fill('input[name="contactName"]', 'Test Name')
    await page.fill('input[name="contactEmail"]', 'test@example.com')
    await page.fill('input[name="projectName"]', 'Test Project')
    await page.selectOption('select[name="projectType"]', 'website')
    await page.fill('textarea[name="projectDescription"]', 'Test description')
    await page.fill('textarea[name="features"]', 'Test features')
    await page.selectOption('select[name="timeline"]', 'flexible')
    await page.selectOption('select[name="budget"]', 'under5k')

    // Leave optional fields empty
    // companyName, targetAudience, techStack, integrations, hostingPreference, designStatus, additionalNotes

    // Mock API response
    await page.route('/api/send-quote', async route => {
      const request = route.request()
      const data = request.postDataJSON()

      // Verify optional fields can be empty
      expect(data.contactName).toBe('Test Name')
      expect(data.companyName).toBeUndefined()

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.click('text=Submit Technical Requirements')

    // Should submit successfully
    await expect(page.locator('text=/Thank you/')).toBeVisible()
  })
})
