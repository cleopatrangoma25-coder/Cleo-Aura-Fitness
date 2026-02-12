## Backlog (groomed)

Priority: P0 (critical), P1 (near-term), P2 (later)

| ID    | Item                                 | Priority | Acceptance Criteria                                                                                                                |
| ----- | ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| PM-01 | Invite expiry UX: countdown + resend | P0       | Pending invites show days/hours left; resend issues new code & revokes old; axe passes; expiry denial surfaced to user.            |
| PM-02 | A11y audit fixes                     | P0       | Axe+keyboard audit across auth/onboarding/dashboard has 0 critical/serious issues; tab order documented.                           |
| PM-03 | Analytics MVP                        | P1       | Events for page_view, invite_created, workout_logged emitted with anonymized user id; opt-out via env; dashboard counters visible. |
| PM-04 | SEO/SSR slice                        | P1       | Landing/auth pages SSR’d; lighthouse SEO ≥90; sitemap.xml + robots.txt generated in stage.                                         |
| PM-05 | Visual regression                    | P1       | Storybook stories for core cards/forms; CI snapshot job fails on diff; artifacts stored.                                           |
| PM-06 | Alerting & budgets                   | P1       | Firebase budget alert at $25; Sentry perf alert for TTFB>2s; docs updated.                                                         |
| PM-07 | Data indexes                         | P2       | Firestore composite indexes for invites by status+createdAt and progress by trainee+date; zero index errors in logs.               |
| PM-08 | Canary deploy                        | P2       | Tag-based deploy to preview hosting; automated rollback if smoke fails; checklist documented.                                      |
