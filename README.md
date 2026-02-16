👑 Cleo-Aura-Fitness

A holistic, trainer-connected fitness and wellness platform built for sustainable progress, confidence, and intelligent collaboration.

Cleo-Aura-Fitness enables trainees to track workouts, muscle development, recovery, nutrition habits, and wellbeing — while securely sharing selected data with trainers, nutritionists, and counsellors through a permission-based system.

✨ Core Philosophy

Trainee-owned data

Sustainable fitness (no burnout culture)

Habit-based nutrition (no calorie obsession)

Mental wellbeing integrated into physical progress

Role-based professional collaboration

🏗 Architecture Overview

Cleo-Aura-Fitness is a frontend-driven SaaS platform built using the Hytel monorepo stack.

Key Principles

No custom backend (MVP)

No Firebase Functions

Firestore as the only database

Authorization enforced via Firestore Security Rules

Business logic primarily in React

Strong typing via TypeScript + Zod

🧱 Tech Stack
Monorepo Tooling

pnpm – package manager

Turborepo – build orchestration

Frontend

React + Vite

TypeScript (strict mode)

Tailwind CSS

shadcn/ui

TanStack Query

Validation & Typing

Zod (shared schemas in packages/shared)

Backend Services

Firebase Authentication

Cloud Firestore

(Phase 2) Firebase Storage

📁 Monorepo Structure
├── apps/
│ ├── web/ # Main React application
│ └── functions/ # Reserved (unused in MVP)
│
├── packages/
│ ├── ui/ # Shared UI components
│ ├── shared/ # Shared Zod schemas & types
│ ├── firebase/ # Firebase client initialization
│ ├── eslint-config/
│ └── typescript-config/
│
├── docs/
│ └── technical/
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json

🔐 User Roles
Role Description
Trainee Data owner, logs workouts and habits
Trainer Views training & recovery data
Nutritionist Views nutrition & energy trends
Counsellor Views wellbeing & stress trends
Admin Internal platform management

All permissions are:

Granular (module-level)

Read-only for professionals

Revocable instantly by trainee

🚀 Getting Started
1️⃣ Prerequisites

Node.js 20+

pnpm 8+

Firebase CLI (optional for emulator)

A Firebase project created

2️⃣ Install Dependencies
pnpm install

3️⃣ Environment Variables

Create a .env file inside:

apps/web/.env

Add the following:

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

⚠️ After editing .env, restart the dev server.

4️⃣ Run Development Server
pnpm dev

App runs at:

http://localhost:5173

🧪 Local Firebase Emulator (Recommended)

To avoid touching production during development:

firebase emulators:start

Then configure the app to connect to emulator when import.meta.env.DEV === true.

🗄 Firestore Data Model (High-Level)

Main collections:

users/{uid}
trainees/{traineeId}
trainees/{traineeId}/teamMembers/{memberUid}
trainees/{traineeId}/grants/{memberUid}
trainees/{traineeId}/workouts/{workoutId}
trainees/{traineeId}/recovery/{recoveryId}
trainees/{traineeId}/nutritionDays/{yyyyMMdd}
trainees/{traineeId}/wellbeingDays/{yyyyMMdd}
trainees/{traineeId}/progressMeasurements/{measurementId}
trainees/{traineeId}/wearablesSummary/{yyyyMMdd}

📊 Core Features

Workout logging with muscle group tagging

Rest & recovery tracking

Habit-based nutrition logging

Mood/stress/energy check-ins

Muscle growth & measurement tracking

Professional dashboards (read-only)

Permission-based data sharing

🔐 Security Model

Firebase Authentication for identity

Firestore Security Rules enforce:

Ownership

Role-based access

Module-level permissions

No professionals can write trainee data

Instant access revocation supported

💎 Freemium Model

MVP uses UI-based feature gating.

Future versions may:

Add billing integration

Enforce plan-based access via Firestore rules

🧠 Development Philosophy

Keep logic simple and predictable

Avoid premature backend complexity

Prefer denormalized Firestore documents over relational thinking

Validate on client with Zod

Enforce ownership with Firestore rules

Optimize only when needed

🛠 Useful Commands
Command Description
pnpm dev Start development
pnpm build Production build
pnpm test Run tests
pnpm lint Lint code
pnpm precheck Run all checks
📈 Roadmap Highlights

Advanced analytics & rollups

iOS companion app for Apple Watch (HealthKit)

Secure messaging

Predictive burnout detection

Professional verification workflows!!


??? Planning & Acceptance
- MVP acceptance criteria live in GitHub Issues grouped by Milestones. Create an issue per user story and attach it to the milestone; PRs should reference the issue number.
- Roadmap: docs/roadmap.md
- Architecture decisions: see docs/adr/0001-firebase-backend.md

