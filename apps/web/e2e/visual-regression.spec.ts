import { test, expect } from '@playwright/test'

test.describe('Visual regression', () => {
  test('auth screen looks correct', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' })
    await expect(page).toHaveScreenshot('auth.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 500,
    })
  })

  test('dashboard card layout remains stable', async ({ page }) => {
    await page.goto('/app', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300) // settle layout
    await expect(page.locator('main')).toHaveScreenshot('dashboard-main.png', {
      animations: 'disabled',
      maxDiffPixels: 700,
    })
  })
})
