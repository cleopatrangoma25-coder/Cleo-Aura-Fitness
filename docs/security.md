## Threat Model (v0.1)

**Context**: Cleo Aura Fitness (stage) on Firebase (Auth + Firestore + Hosting). Roles: trainee (owner), trainer/nutritionist/counsellor (read-only via grants). Wearables data and wellbeing notes are PII-adjacent.

### Assets & Data
- User profiles, plan, roles (`users`)
- Trainee data: workouts, recovery, nutrition, wellbeing, progress, wearables
- Grants/invites for professional access

### Trust Boundaries
- Client ↔ Firebase Auth/Firestore (rules enforced)
- Invite links shared off-platform

### Key Risks
1) **Unauthorized data access** via mis-scoped Firestore rules.
2) **Invite leakage** (replay of unused invite codes).
3) **PII exposure** in logs/errors.
4) **Dependency vulnerabilities** in client bundle.

### Mitigations in place
- Firestore rules enforce auth and role-based module grants (least privilege).
- Client-side Zod validation for writes.
- Production/stage separation via Firebase projects.
- Global error capture (frontend hook) to avoid console spew.

### Gaps / Actions
- Add Dependabot and require 2FA on repo.
- Add automated security scan (GitHub Advanced Security or npm audit in CI).
- Expire invite codes after acceptance; store createdAt + TTL.
- Document secrets handling via env (no secrets in repo).

