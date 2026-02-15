## Cloud & Ops Quick Setup (Stage/Prod)

### 1) Budget Alerts (Firebase/GCP)

- Console: Google Cloud Console -> Billing -> Budgets & alerts. Create a budget for the Firebase project with thresholds at 50% / 75% / 90%.
- CLI (example, adjust PROJECT/BILLING_ACCOUNT):
  ```bash
  gcloud billing budgets create \
    --billing-account=XXXXXX-XXXXXX-XXXXXX \
    --display-name="Cleo Aura Stage Budget" \
    --budget-amount=50 \
    --threshold-rules=0.5,0.75,0.9 \
    --all-updates-rule-pubsub-topic=projects/$PROJECT/topics/billing-alerts
  ```
- Add on-call email/webhook (Pub/Sub -> Cloud Function/Slack) to receive alerts.

### 2) Hosting / 5xx Alert

- In Cloud Monitoring -> Log-based metrics: create a counter for `resource.type="firebase_hosting_site" severity>=ERROR`.
- Add an alert policy on that metric (5 errors in 5 minutes) with email/Slack webhook.

### 3) Frontend Error Capture & Alerts

- Set `VITE_SENTRY_DSN` in stage/prod env to enable Sentry via `apps/web/src/lib/monitoring.ts`.
- In Sentry: alert rule “Web Error Spike” — condition: 5 errors in 5 min; actions: Slack + email.
- Optional: set `VITE_ERROR_MONITOR_ENDPOINT` to your webhook if not using Sentry.

### 4) Performance / Crashlytics (optional)

- Web Performance Monitoring (Firebase): enable in Firebase console; data will flow to GCP Metrics Explorer.
- For mobile companion builds, enable Crashlytics in the app config.

### 5) Env Hygiene

- Keep `.env.example` in sync; stage/prod env vars injected via CI or Hosting config.
- Consider `@t3-oss/env-core` for build-time validation (future work).

### 6) Disaster Recovery / Backups

- Export Firestore rules/indexes (`firestore.rules`, `firestore.indexes.json`) already tracked.
- Schedule Firestore export to GCS via Cloud Scheduler:
  ```bash
  gcloud scheduler jobs create pubsub firestore-backup \
    --schedule="0 3 * * *" \
    --topic=projects/$PROJECT/topics/cloud-firestore-backup \
    --message-body="{\"outputUriPrefix\":\"gs://$PROJECT-firestore-backups\"}"
  ```
- Future IaC: Terraform module for service account + bucket + scheduler + alerting.
