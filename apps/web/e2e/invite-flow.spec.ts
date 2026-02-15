import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Smoke: trainee copies invite code, trainer accepts.
// NOTE: Relies on seeded stage data from recent manual flows (invite code is provided)
const TRAINEE_INVITE = {
  traineeId: 'cleo@gmail.com',
  code: 'NMBL946N',
  role: 'trainer',
}

test.describe('Invite acceptance flow', () => {
  const trainerEmail = process.env.E2E_TRAINER_EMAIL
  const trainerPassword = process.env.E2E_TRAINER_PASSWORD

  test.skip(!trainerEmail || !trainerPassword, 'Set E2E_TRAINER_EMAIL/PASSWORD to run this flow')

  test('trainer accepts trainee invite and passes axe', async ({ page, context }) => {
    // Visit invite acceptance page
    await page.goto('/invite', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: /accept team invite/i })).toBeVisible()

    // Fill form
    await page.getByLabel(/trainee id/i).fill(TRAINEE_INVITE.traineeId)
    await page.getByLabel(/invite code/i).fill(TRAINEE_INVITE.code)

    // Submit
    await page.getByRole('button', { name: /accept invite/i }).click()

    // Expect success toast / copy
    await expect(
      page.getByText(/joined trainee team/i).or(page.getByText(/invite accepted/i))
    ).toBeVisible({ timeout: 5000 })

    // Basic a11y check on the success view
    const results = await new AxeBuilder({ page }).analyze()
    const criticalOnly = results.violations.filter(v => v.impact === 'critical')
    expect(criticalOnly.length).toBe(0)

    // Clean up session for re-runs
    await context.clearCookies()
  })
})
