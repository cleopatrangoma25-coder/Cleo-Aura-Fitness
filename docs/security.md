# Security & Access Policy

- **2FA required** for all collaborators on GitHub and Firebase console.
- **Least privilege:** roles limited to project-level Editor is discouraged; use Firebase-specific roles (Firestore Viewer/Editor, Monitoring Editor).
- **Secrets:** Only in GitHub Actions secrets or Firebase environment config; never in repo.
- **Dependency hygiene:** Dependabot + GitHub dependency review (enabled), `pnpm audit:ci` in CI.
- **App surface:** Firestore rules enforce role/email-checked invites; session creation restricted to professionals.
- **DAST:** Weekly ZAP scan workflow targets stage URL (see `.github/workflows/zap-scan.yml`).
- **Incident response:** Alert channel `alerts@cleo-aura-fitness.com` (see `docs/ops/alerts.md`); rotate if ownership changes.
- **OWASP Top 10 review checklist (stage)**
  - [ ] A01 Broken Access Control: Verified Firestore rules with contract tests; all privileged writes go through Zod validation.
  - [ ] A02 Cryptographic Failures: Only Firebase-managed auth; no secrets in client bundle; HTTPS enforced.
  - [ ] A03 Injection: No dynamic eval; Firestore queries parameterized; user input validated with Zod.
  - [ ] A04 Insecure Design: Role/grant model documented in ADR; invites require role/email match and expiry.
  - [ ] A05 Security Misconfig: Email/password only; Sentry disabled on stage; env vars via secrets; Dependabot/CodeQL enabled.
  - [ ] A06 Vulnerable Components: Dependabot + `pnpm audit:ci`; CodeQL workflow.
  - [ ] A07 Identification & Auth: Firebase Auth only; no fallback tokens; session state stored in Firebase; password reset only via Firebase.
  - [ ] A08 Software/Data Integrity: CI requires tests/lint; coverage gate; storage-state E2E kept separate from prod.
  - [ ] A09 Security Logging/Monitoring: `errorReports` collection + Firebase Performance; alerts runbook for uptime/errors.
  - [ ] A10 SSRF: No server-side HTTP fetches; client-only app.
