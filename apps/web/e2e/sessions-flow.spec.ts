import { test, expect } from '@playwright/test'

const TRAINEE_EMAIL = process.env.E2E_TRAINEE_EMAIL
const TRAINEE_PASSWORD = process.env.E2E_TRAINEE_PASSWORD
const TRAINER_EMAIL = process.env.E2E_TRAINER_EMAIL
const TRAINER_PASSWORD = process.env.E2E_TRAINER_PASSWORD

test.describe('Sessions + enrollment happy paths', () => {
  test.skip(
    !TRAINEE_EMAIL || !TRAINEE_PASSWORD || !TRAINER_EMAIL || !TRAINER_PASSWORD,
    'Set E2E_TRAINEE_EMAIL/PASSWORD and E2E_TRAINER_EMAIL/PASSWORD to run'
  )

  test('trainer seeds session, trainee enrolls, enrollment visible', async ({ page }) => {
    // Trainer creates a session (assumes dashboard has a quick-create or default session)
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(TRAINER_EMAIL!)
    await page.getByLabel(/password/i).fill(TRAINER_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/app')

    // Navigate to sessions
    await page.goto('/app/sessions')
    const hasCreate = await page.getByRole('button', { name: /create/i }).count()
    if (hasCreate > 0) {
      await page.getByRole('button', { name: /create/i }).click()
      await page.getByLabel(/title/i).fill('Playwright Session')
      await page.getByLabel(/description/i).fill('Automation seeded session')
      await page.getByRole('button', { name: /save/i }).click()
    }

    // Sign out trainer
    await page.goto('/app/settings')
    const logoutBtn = page.getByRole('button', { name: /sign out/i })
    if (await logoutBtn.count()) await logoutBtn.click()

    // Trainee enrolls
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(TRAINEE_EMAIL!)
    await page.getByLabel(/password/i).fill(TRAINEE_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/app')

    await page.getByText(/upcoming coach sessions/i).scrollIntoViewIfNeeded()
    const enrollButton = page.getByRole('button', { name: /enroll/i }).first()
    await enrollButton.click()
    await expect(enrollButton).toContainText(/enrolled/i, { timeout: 5000 })
  })

  test('login → create workout → verify in history', async ({ page }) => {
    await page.goto('/auth')
    await page.getByLabel(/email/i).fill(TRAINEE_EMAIL!)
    await page.getByLabel(/password/i).fill(TRAINEE_PASSWORD!)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL('**/app')

    await page.goto('/app/workouts/new')
    await page.getByLabel(/title/i).fill('Playwright Workout')
    await page.getByLabel(/primary muscle/i).selectOption({ index: 1 })
    await page.getByRole('button', { name: /save/i }).click()

    await page.goto('/app/history')
    await expect(page.getByText(/Playwright Workout/)).toBeVisible({ timeout: 5000 })
  })
})
