# Security & Access Policy

- **2FA required** for all collaborators on GitHub and Firebase console.
- **Least privilege:** roles limited to project-level Editor is discouraged; use Firebase-specific roles (Firestore Viewer/Editor, Monitoring Editor).
- **Secrets:** Only in GitHub Actions secrets or Firebase environment config; never in repo.
- **Dependency hygiene:** Dependabot + GitHub dependency review (enabled), `pnpm audit:ci` in CI.
- **App surface:** Firestore rules enforce role/email-checked invites; session creation restricted to professionals.
- **DAST:** Weekly ZAP scan workflow targets stage URL (see `.github/workflows/zap-scan.yml`).
- **Incident response:** Alert channel `alerts@cleo-aura-fitness.com` (see `docs/ops/alerts.md`); rotate if ownership changes.
