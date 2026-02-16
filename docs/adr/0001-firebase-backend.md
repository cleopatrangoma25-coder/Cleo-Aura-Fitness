# ADR 0001 — Firebase-only backend with rules-based access

- **Context**: Early-stage product, multi-role (trainee, trainer, nutritionist, counsellor) with real-time data sharing. Need low ops, fast iteration, and built-in auth.
- **Decision**:
  - Use Firebase Auth + Firestore as the single backend.
  - Enforce domain access via Firestore Security Rules (role/email-matched invites, module grants).
  - Keep write validation client-side with Zod schemas; add minimal Cloud Functions only when stricter auditing is required.
- **Consequences**:
  - Pros: zero servers, fast iteration, offline-friendly SDK, rules as the main enforcement layer.
  - Cons: Complex rules to maintain; limited server-side composition; heavier client bundles unless code-split.
  - Mitigations: shared schema package, contract tests in Vitest + emulator, monitoring hooks (`errorReports`, Firebase Performance), and option to introduce Functions/tRPC later for sensitive writes.
