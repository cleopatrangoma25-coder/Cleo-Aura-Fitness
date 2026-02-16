import { test, expect } from '@playwright/test'

const TRAINER_STORAGE = process.env.E2E_TRAINER_STORAGE || 'e2e/stage-trainer.json'
const TRAINEE_STORAGE = process.env.E2E_TRAINEE_STORAGE || 'e2e/stage-auth.json'

test.use({ trace: 'on' })

test.describe('Sessions + enrollment happy paths (stage storage state)', () => {
  test('trainer seeds session, trainee enrolls, enrollment visible', async ({ browser }) => {
    const trainerCtx = await browser.newContext({ storageState: TRAINER_STORAGE })
    const trainerPage = await trainerCtx.newPage()

    await trainerPage.goto('/app', { waitUntil: 'networkidle' })
    await trainerPage.goto('/app/sessions')
    const hasCreate = await trainerPage.getByRole('button', { name: /create/i }).count()
    if (hasCreate > 0) {
      await trainerPage.getByRole('button', { name: /create/i }).click()
      await trainerPage.getByLabel(/title/i).fill('Playwright Session')
      await trainerPage.getByLabel(/description/i).fill('Automation seeded session')
      await trainerPage.getByRole('button', { name: /save/i }).click()
    }
    await trainerCtx.close()

    const traineeCtx = await browser.newContext({ storageState: TRAINEE_STORAGE })
    const traineePage = await traineeCtx.newPage()
    await traineePage.goto('/app', { waitUntil: 'networkidle' })

    await traineePage.getByText(/upcoming coach sessions/i).scrollIntoViewIfNeeded()
    const enrollButton = traineePage.getByRole('button', { name: /enroll/i }).first()
    await enrollButton.click()
    await expect(enrollButton).toContainText(/enrolled/i, { timeout: 5000 })
    await traineeCtx.close()
  })

  test('login → create workout → verify in history (using trainee storage)', async ({ browser }) => {
    const traineeCtx = await browser.newContext({ storageState: TRAINEE_STORAGE })
    const page = await traineeCtx.newPage()

    await page.goto('/app', { waitUntil: 'networkidle' })
    await page.goto('/app/workouts/new')
    await page.getByLabel(/title/i).fill('Playwright Workout')
    await page.getByLabel(/primary muscle/i).selectOption({ index: 1 })
    await page.getByRole('button', { name: /save/i }).click()

    await page.goto('/app/history')
    await expect(page.getByText(/Playwright Workout/)).toBeVisible({ timeout: 5000 })
    await traineeCtx.close()
  })
})
