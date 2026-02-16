// Save authenticated storage state for stage to reuse in tests.
import { chromium } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'https://cleo-aura-fitness-stage.web.app'
const EMAIL = process.env.E2E_EMAIL
const PASSWORD = process.env.E2E_PASSWORD
const OUTPUT = process.env.E2E_STORAGE || 'e2e/stage-auth.json'

if (!EMAIL || !PASSWORD) {
  console.error('E2E_EMAIL and E2E_PASSWORD are required')
  process.exit(1)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle' })
await page.getByLabel(/email/i).fill(EMAIL)
await page.getByLabel(/password/i).fill(PASSWORD)
await page.locator('form button[type=submit]').filter({ hasText: /login/i }).first().click()
await page.waitForURL('**/app', { timeout: 20000 })

  await context.storageState({ path: OUTPUT })
  await browser.close()
  console.log(`Saved storage state to ${OUTPUT}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
