import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Happy path smoke', () => {
  test('auth screen loads and is a11y-clean', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' })
    const html = await page.content()
    expect(html.length).toBeGreaterThan(100)
    const results = await new AxeBuilder({ page }).analyze()
    const severe = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    expect(severe.length).toBe(0)
  })
})
