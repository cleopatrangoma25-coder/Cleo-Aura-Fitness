# Roadmap (Stage)

## Milestone 1 — Stability & A11y

- Run axe checks on auth, dashboard, sessions.
- Fix label/aria/contrast issues surfaced by axe.
- Add one Playwright smoke: trainee invite → trainer accept.

## Milestone 2 — Coverage & CI

- Raise Vitest coverage to 60% threshold and enforce in CI.
- Include `pnpm audit:ci` (already added) and Dependabot alerts.
- Publish test/coverage summaries to GitHub job summary.

## Milestone 3 — UX Polish

- Replace remaining “boxy” tables with KPI cards + sparklines.
- Add hero illustration on auth + dashboard.
- Post-submit redirect for all forms (recovery, check-in, wearables).

## Milestone 4 — Monitoring

- Enable Sentry DSN + trace sample rate for stage.
- Add simple uptime/ping check workflow hitting stage URL nightly.

## Milestone 5 — Security/Rules

- Add Zod validation on invite acceptance inputs.
- Add contract test for invites + module grants on emulator.
