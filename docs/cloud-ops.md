## Cloud & Ops Quick Setup (Stage/Prod)

### 1) Budget Alerts (Firebase/GCP)
- In Google Cloud Console → Billing → Budgets & alerts: create a budget for the Firebase project with email alerts at 50%/75%/90%.
- Add yourself + on-call emails to recipients.

### 2) Hosting / 5xx Alert
- In Cloud Monitoring → Log-based metrics: create a counter for `resource.type="firebase_hosting_site" severity>=ERROR`.
- Add an alert policy on that metric (5 errors in 5 minutes) with email/Slack webhook.

### 3) Frontend Error Capture
- Set `VITE_SENTRY_DSN` in stage/prod env to enable Sentry via `apps/web/src/lib/monitoring.ts`.
- Optional: set `VITE_ERROR_MONITOR_ENDPOINT` to your webhook if not using Sentry.

### 4) Performance / Crashlytics (optional)
- Web Performance Monitoring (Firebase): enable in Firebase console; data will flow to GCP Metrics Explorer.
- For mobile companion builds, enable Crashlytics in the app config.

### 5) Env Hygiene
- Keep `.env.example` in sync; stage/prod env vars injected via CI or Hosting config.
- Consider `@t3-oss/env-core` for build-time validation (future work).

### 6) Disaster Recovery
- Export Firestore rules/indexes (`firestore.rules`, `firestore.indexes.json`) already tracked.
- For data backups, schedule Firestore export (GCS) via Cloud Scheduler (to be configured in console/IaC).
