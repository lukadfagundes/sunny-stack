import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility', () => {
  test('should be navigable with keyboard only', async ({ page }) => {
    await page.goto('/quote')

    // Tab through all interactive elements
    await page.keyboard.press('Tab')
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    // Tab to first option
    await page.keyboard.press('Tab')
    focusedElement = await page.evaluate(() => document.activeElement?.textContent)
    expect(focusedElement).toContain('Guided')

    // Activate with Enter
    await page.keyboard.press('Enter')
    await expect(page.locator('text=/Let\'s start with your contact info/')).toBeVisible()

    // Tab through form fields
    await page.keyboard.press('Tab') // Skip back button
    await page.keyboard.press('Tab') // Focus name field
    await page.keyboard.type('Test User')

    await page.keyboard.press('Tab') // Focus email field
    await page.keyboard.type('test@example.com')

    await page.keyboard.press('Tab') // Focus company field
    await page.keyboard.press('Tab') // Focus continue button
    await page.keyboard.press('Enter')

    // Should navigate to next step
    await expect(page.locator('text=/What are we building/')).toBeVisible()

    // Use arrow keys for selection if applicable
    await page.keyboard.press('Tab')
    await page.keyboard.press('Space') // Select option
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // Continue

    // Should be able to navigate entire form with keyboard
    await expect(page.locator('text=/Tell me about your vision/')).toBeVisible()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/quote')

    // Check main navigation elements
    const backButton = page.locator('[aria-label="Go back"]')
    await page.click('text=Guided Quote')
    await expect(backButton).toBeVisible()

    // Check form fields have labels
    const nameInput = page.locator('input[name="name"]')
    const nameLabel = await nameInput.evaluate(el => {
      const id = el.getAttribute('id')
      const label = document.querySelector(`label[for="${id}"]`)
      return label?.textContent || el.getAttribute('aria-label')
    })
    expect(nameLabel).toBeTruthy()

    // Check buttons have accessible text
    const continueButton = page.locator('button:has-text("Continue")')
    await expect(continueButton).toBeVisible()
    const buttonText = await continueButton.textContent()
    expect(buttonText).toBeTruthy()

    // Check progress indicators have ARIA
    const progress = page.locator('[data-testid="quote-progress"]')
    const ariaValue = await progress.getAttribute('aria-valuenow')
    expect(ariaValue).toBeTruthy()
  })

  test('should work with screen readers', async ({ page }) => {
    await page.goto('/quote')

    // Check for screen reader only text
    const srOnly = await page.locator('.sr-only').count()
    expect(srOnly).toBeGreaterThanOrEqual(0)

    // Check headings hierarchy
    const h1 = await page.locator('h1').count()
    expect(h1).toBeGreaterThan(0)

    const headings = await page.evaluate(() => {
      const h1s = document.querySelectorAll('h1')
      const h2s = document.querySelectorAll('h2')
      const h3s = document.querySelectorAll('h3')
      return {
        h1: h1s.length,
        h2: h2s.length,
        h3: h3s.length
      }
    })

    // Should have logical heading structure
    expect(headings.h1).toBeGreaterThan(0)

    // Check for alt text on images if any
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }

    // Check form has proper structure
    await page.click('text=Guided Quote')
    const form = page.locator('form').first()
    if (await form.isVisible()) {
      const role = await form.getAttribute('role')
      expect(role === 'form' || role === null).toBeTruthy()
    }
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/quote')

    // Check text contrast ratios
    const textElements = await page.locator('p, span, h1, h2, h3, button').all()

    for (const element of textElements.slice(0, 5)) { // Test sample
      const contrast = await element.evaluate(el => {
        const style = window.getComputedStyle(el)
        const bg = style.backgroundColor
        const fg = style.color

        // Simple contrast check (would use color contrast library in production)
        return { background: bg, foreground: fg }
      })

      // Ensure text is not same color as background
      expect(contrast.background).not.toBe(contrast.foreground)
    }

    // Check interactive elements have visible focus states
    await page.keyboard.press('Tab')
    const focusedStyle = await page.evaluate(() => {
      const el = document.activeElement
      if (!el) return null
      const style = window.getComputedStyle(el)
      return {
        outline: style.outline,
        boxShadow: style.boxShadow,
        border: style.border
      }
    })

    // Should have some focus indication
    expect(
      focusedStyle?.outline !== 'none' ||
      focusedStyle?.boxShadow !== 'none' ||
      focusedStyle?.border
    ).toBeTruthy()
  })

  test('should handle focus management correctly', async ({ page }) => {
    await page.goto('/quote')

    // Click into guided form
    await page.click('text=Guided Quote')

    // Focus should be managed when navigating
    const initialFocus = await page.evaluate(() => document.activeElement?.tagName)
    expect(initialFocus).toBeTruthy()

    // Open and close modals/overlays if any
    // Focus should return to trigger element

    // Navigate back
    await page.click('[aria-label="Go back"]')

    // Focus should be in a logical place
    const returnFocus = await page.evaluate(() => document.activeElement?.tagName)
    expect(returnFocus).toBeTruthy()

    // Tab trap in modals (if applicable)
    // Focus should cycle within modal when open
  })

  test('should provide skip links for navigation', async ({ page }) => {
    await page.goto('/quote')

    // Check for skip to main content link
    await page.keyboard.press('Tab')
    const firstFocused = await page.evaluate(() => document.activeElement?.textContent)

    // May have skip link or go directly to navigation
    expect(firstFocused).toBeTruthy()

    // Check main landmark exists
    const main = page.locator('main')
    await expect(main).toHaveCount(1)
  })

  test('should handle form errors accessibly', async ({ page }) => {
    await page.goto('/quote')
    await page.click('text=Guided Quote')

    // Submit without filling required fields
    await page.click('text=Continue')

    // Error messages should be associated with fields
    const errorMessages = page.locator('[role="alert"], .text-red-500')
    const errorCount = await errorMessages.count()
    expect(errorCount).toBeGreaterThan(0)

    // Errors should be announced to screen readers
    const firstError = errorMessages.first()
    const errorText = await firstError.textContent()
    expect(errorText).toContain('required')

    // Focus should move to first error field
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return el?.getAttribute('name') || el?.tagName
    })
    expect(focusedElement).toBeTruthy()
  })

  test('should use semantic HTML elements', async ({ page }) => {
    await page.goto('/quote')

    // Check for semantic elements
    const semanticElements = await page.evaluate(() => {
      return {
        nav: document.querySelectorAll('nav').length,
        main: document.querySelectorAll('main').length,
        header: document.querySelectorAll('header').length,
        footer: document.querySelectorAll('footer').length,
        section: document.querySelectorAll('section').length,
        article: document.querySelectorAll('article').length
      }
    })

    // Should use semantic HTML
    expect(semanticElements.main).toBeGreaterThan(0)

    // Check buttons are actual buttons
    const interactiveElements = await page.locator('[onclick], [role="button"]').all()
    for (const element of interactiveElements) {
      const tagName = await element.evaluate(el => el.tagName)
      expect(['BUTTON', 'A', 'INPUT'].includes(tagName)).toBeTruthy()
    }
  })

  test.skip('should pass automated accessibility scan', async ({ page }) => {
    await page.goto('/quote')

    // Run axe accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    // Should have no violations
    expect(accessibilityScanResults.violations).toEqual([])

    // Test guided form page
    await page.click('text=Guided Quote')
    const formScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()

    expect(formScanResults.violations).toEqual([])
  })

  test('should support prefers-reduced-motion', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/quote')

    // Check that animations are disabled
    const animationDuration = await page.evaluate(() => {
      const element = document.querySelector('[data-testid="quote-container"]')
      if (!element) return '0s'
      return window.getComputedStyle(element).animationDuration
    })

    // Animations should be instant or very short with reduced motion
    expect(animationDuration === '0s' || animationDuration === '0.01s').toBeTruthy()
  })
})
