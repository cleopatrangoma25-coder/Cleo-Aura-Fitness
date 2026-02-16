# Cloud Monitoring & Budgets (Stage)

Use these commands to provision guardrails for the stage project (`cleo-aura-fitness-stage`).

## Setup (one-time)
```bash
gcloud config set project cleo-aura-fitness-stage
```

## 1) Uptime check + alert (stage web)
```bash
gcloud monitoring uptime-checks create http stage-web \
  --path=/ \
  --period=300s \
  --timeout=10s \
  --host=cleo-aura-fitness-stage.web.app

gcloud monitoring channels create email \
  --display-name="Stage On-call" \
  --channel-labels=email_address=alerts@cleo-aura-fitness.com

gcloud monitoring policies create \
  --display-name="Stage uptime down" \
  --conditions="condition-threshold(resource.type=\"uptime_url\" AND metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\"),duration=0" \
  --notification-channels="$(gcloud monitoring channels list --format='value(name)' --filter='displayName=Stage On-call')"
```

## 2) Error budget/usage alert (Firestore)
```bash
gcloud beta monitoring policies create \
  --display-name="Firestore write errors stage" \
  --conditions="metric.type=\"firestore.googleapis.com/document/write_count\" AND metric.labels.status!=\"OK\""
```

## 3) Cost budget (Cloud Billing)
```bash
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="Stage monthly budget" \
  --budget-amount=50USD \
  --threshold-rule=0.5 \
  --threshold-rule=0.8 \
  --threshold-rule=0.9 \
  --all-updates-rule-pubsub-topic=projects/cleo-aura-fitness-stage/topics/budget-alerts

> After creating the policies/budget, grab a screenshot of the Cloud Monitoring dashboard + budget chart and drop it into `docs/ops/screenshots/` for quick visibility.
```

> Apply via CI/IaC if desired; these commands are safe to run once and idempotent for the named resources.
