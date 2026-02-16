# Apply Stage Alerts & Budgets (no billing changes)

Prereqs: gcloud installed and authenticated with access to `cleo-aura-fitness-stage`.

1) Set project
```
gcloud config set project cleo-aura-fitness-stage
```

2) Uptime check + simple alert (stage host)
```
gcloud monitoring uptime-checks create http stage-web \
  --path=/ --period=300s --timeout=10s \
  --host=cleo-aura-fitness-stage.web.app
gcloud monitoring channels create email \
  --display-name="Stage On-call" \
  --channel-labels=email_address=alerts@cleo-aura-fitness.com
gcloud monitoring policies create \
  --display-name="Stage uptime down" \
  --conditions="condition-threshold(resource.type=\"uptime_url\" AND metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\"),duration=0" \
  --notification-channels="$(gcloud monitoring channels list --format='value(name)' --filter='displayName=Stage On-call')"
```

3) Firestore error watch
```
gcloud beta monitoring policies create \
  --display-name="Firestore write errors stage" \
  --conditions="metric.type=\"firestore.googleapis.com/document/write_count\" AND metric.labels.status!=\"OK\""
```

4) Budget placeholder (run only if billing linked)
```
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="Stage monthly budget" \
  --budget-amount=50USD \
  --threshold-rule=0.5 --threshold-rule=0.8 --threshold-rule=0.9
```

5) Capture evidence
- Grab a screenshot of the Monitoring dashboard and budget chart.
- Save under `docs/ops/screenshots/` (not versioned if sensitive).

Note: Commands are idempotent for the named resources; adjust names if rerunning. No code changes or billing enablement are performed by this doc.***
