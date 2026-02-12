# Cleo Aura Fitness: Feminine Focused Wellness App

A production-ready monorepo for a feminine-focused fitness and wellbeing platform. Cleo Aura Fitness helps trainees track workouts, recovery, nutrition, wellbeing, progress, and wearable summaries while controlling professional access with role-based permissions.

## Stack Overview

Think of building Cleo Aura Fitness like running a premium wellness studio:

| Tool               | Role            | Studio Analogy                                  |
| ------------------ | --------------- | ----------------------------------------------- |
| **pnpm**           | Package Manager | Front desk organizing all studio resources      |
| **Turborepo**      | Build System    | Operations manager coordinating every team      |
| **React + Vite**   | Frontend        | Member-facing studio experience                 |
| **TypeScript**     | Type Safety     | Operational standards that prevent mistakes     |
| **Tailwind CSS**   | Styling         | Interior design system for consistent branding  |
| **tRPC**           | API Layer       | Internal communication between teams            |
| **TanStack Query** | Data Fetching   | Smart member records cache                      |
| **Firebase**       | Backend + Auth  | Secure membership, access, and data management  |
| **Vitest**         | Testing         | Quality checks before opening the studio floor  |
| **Zod**            | Validation      | Intake screening for structured, safe data      |

## Monorepo Structure

```text
.
|-- apps/
|   |-- web/                   # React frontend (member + professional app)
|   |   `-- src/
|   |       |-- App.tsx
|   |       |-- features/
|   |       |   |-- dashboard/
|   |       |   |-- workouts/
|   |       |   |-- recovery/
|   |       |   |-- nutrition/
|   |       |   |-- wellbeing/
|   |       |   |-- progress/
|   |       |   |-- wearables/
|   |       |   |-- team/
|   |       |   `-- billing/
|   |       `-- lib/
|   `-- functions/             # Backend functions / tRPC services
|
|-- packages/
|   |-- shared/                # Shared schemas, enums, and types
|   |-- ui/                    # Shared UI primitives/components
|   |-- eslint-config/         # Shared lint config
|   `-- typescript-config/     # Shared TS config
|
|-- docs/
|   |-- project-definition/
|   `-- ci-cd/
|
|-- firestore.rules            # Firestore security rules
|-- firestore.indexes.json     # Firestore indexes/field overrides
|-- firestore.test.ts          # Firestore rules tests
|-- firebase.json              # Firebase project config
|-- turbo.json                 # Turborepo pipeline config
`-- package.json               # Root scripts
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Firebase CLI (for emulator/deploy workflows)

### Installation

```bash
git clone <your-repo-url>
cd Cleo-Aura-Fitness-1
pnpm install
```

### Development

```bash
# Run all apps/packages in dev mode
pnpm dev

# Run checks
pnpm precheck

# Run tests
pnpm test

# Build all workspaces
pnpm build

# Lint and format
pnpm lint
pnpm format
```

## Key Features

### Product Focus

- Feminine-focused wellness journey that combines physical training, recovery, nutrition, and emotional wellbeing.
- Role-based experiences for:
- `trainee`
- `trainer`
- `nutritionist`
- `counsellor`
- Privacy-first access model where trainees explicitly grant and revoke module access.

### Trainee Experience

- Workout and recovery logging with muscle-group tagging.
- Daily nutrition + wellbeing check-ins.
- Progress measurement and analytics.
- Wearables summary logging.
- Team access control for professionals.

### Professional Experience

- Multi-client overview and role-specific insights.
- Read-only module access controlled by trainee permissions.
- Invite acceptance and per-client workspace views.

### Freemium + Pro

- `free` and `pro` plan model on `users/{uid}`.
- Pro-gated features include analytics, wearables, and team access management.
- Dedicated Pro upgrade payment page (`/app/upgrade`) for upgrade flow.

## Scripts Reference

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `pnpm dev`           | Start development servers                     |
| `pnpm build`         | Build all packages                            |
| `pnpm test`          | Run all tests                                 |
| `pnpm test:coverage` | Run tests with coverage report                |
| `pnpm test:rules`    | Run Firestore rules tests via emulator        |
| `pnpm lint`          | Lint all packages                             |
| `pnpm lint:fix`      | Auto-fix lint issues                          |
| `pnpm format`        | Format code with Prettier                     |
| `pnpm format:check`  | Check code formatting                         |
| `pnpm typecheck`     | Run TypeScript checks                         |
| `pnpm precheck`      | Lint + typecheck + build + test               |
| `pnpm deploy:stage`  | Build web app in stage mode and deploy stage  |

---

## Security Model

Firestore rules enforce:

- Trainees can read/write their own records.
- Professionals have no access by default.
- Professionals only read modules explicitly granted by trainees.
- Revocation is immediate via team/grant updates.

Run security rule tests with:

```bash
pnpm test:rules
```

---

## CI/CD Pipeline

The repository includes branch-based CI/CD with GitHub Actions.

### Branch Strategy

| Branch  | Environment | Deployment                 |
| ------- | ----------- | -------------------------- |
| `dev`   | Development | Auto on push               |
| `stage` | Staging     | Auto on push               |
| `main`  | Production  | Manual (with confirmation) |

### Workflows

| Workflow                | Trigger         | Purpose                              |
| ----------------------- | --------------- | ------------------------------------ |
| `ci.yml`                | PR & push       | Lint, typecheck, build, test         |
| `deploy-dev.yml`        | Push to `dev`   | Deploy to development                |
| `deploy-stage.yml`      | Push to `stage` | Deploy to staging                    |
| `deploy-main.yml`       | Manual          | Deploy to production                 |
| `release.yml`           | Push to `main`  | Automated versioning with Changesets |
| `dependency-review.yml` | PR              | Dependency vulnerability checks      |

See `docs/ci-cd/` for deployment details.

---

## Monitoring and Hardening

- Frontend error boundary and global error capture are wired in `apps/web/src/lib/monitoring.ts`.
- Optional remote error endpoint can be configured via:
- `VITE_ERROR_MONITOR_ENDPOINT`
- Firestore index overrides are defined in `firestore.indexes.json` to reduce unnecessary index cost on large text fields.

---

## Environment Variables

Use `.env.example` as the template.

Core frontend variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ERROR_MONITOR_ENDPOINT` (optional)

---

## Testing

```bash
# All tests
pnpm test

# Workspace tests
pnpm --filter web test
pnpm --filter @repo/shared test

# Firestore rules
pnpm test:rules
```

---

## Version Requirements

| Tool         | Minimum Version |
| ------------ | --------------- |
| Node.js      | 20.x            |
| pnpm         | 8.x             |
| Turbo        | 2.x             |
| TypeScript   | 5.x             |
| Vitest       | 2.x             |
| ESLint       | 8.x             |
| Prettier     | 3.x             |
| Firebase CLI | 13.x            |

---

## Contributing

See `CONTRIBUTING.md` for branch workflow and coding standards.

---

Built for women-centered fitness, wellbeing, and sustainable progress.
