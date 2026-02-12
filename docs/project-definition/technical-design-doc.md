Technical Design Document (TDD)
Cleo-Aura-Fitness

1. Project Overview

Project Name: Cleo-Aura-Fitness
Product Type: Freemium SaaS Platform
Primary Platform: Web (React)
Target Users: Trainees, Trainers, Nutritionists, Counsellors

Cleo-Aura-Fitness is a holistic fitness and wellness tracking platform built as a frontend-driven React application using Firebase Authentication and Cloud Firestore. The platform enables trainees to log workouts, muscle group usage, muscle development, recovery, nutrition habits, wellbeing signals, and wearable summaries, while selectively sharing data with professionals through a role-based, permission-controlled collaboration model.

The system intentionally avoids a traditional backend and relies on:

Client-side logic (React + TypeScript)

Firestore Security Rules for authorization

Strong data modeling and validation for correctness

2. Technical Objectives
   Primary Technical Objectives

Implement a scalable, frontend-first SaaS architecture

Enforce role-based access without Firebase Functions or custom servers

Maintain a clean, extensible Firestore data model

Enable real-time, permissioned collaboration

Preserve strong type safety across frontend and data models

Secondary Technical Objectives

Minimize operational overhead

Support future native integrations (Apple Watch)

Ensure privacy, security, and compliance readiness

Technical Non-Goals

No SQL or relational database

No Firebase Functions in MVP

No medical or emergency mental health workflows

3. Prescribed Technology Stack
   Monorepo Tooling

pnpm (package management)

Turborepo (build orchestration)

Frontend

React + Vite

TypeScript

Tailwind CSS

shadcn/ui

TanStack Query

Validation & Typing

Zod (shared schemas)

TypeScript strict mode

Backend Services

Firebase Authentication

Cloud Firestore

Firebase Storage (Phase 2 – progress photos)

4. Monorepo Structure (Hytel Way)

Cleo-Aura-Fitness follows the Hytel monorepo pattern, with shared packages and a single primary web application.

├── .github/
│ ├── workflows/ # CI/CD pipelines
│ ├── CODEOWNERS
│ └── ISSUE_TEMPLATE/
│
├── apps/
│ ├── web/ # Main Cleo-Aura-Fitness React app
│ │ ├── src/
│ │ │ ├── App.tsx
│ │ │ ├── routes/ # App routes (dashboard, tracking, analytics)
│ │ │ ├── hooks/ # Custom hooks (useWorkouts, usePermissions)
│ │ │ ├── features/ # Feature modules (workouts, nutrition, wellbeing)
│ │ │ ├── lib/ # Firebase client, query client
│ │ │ └── providers/ # Auth, Theme, Query providers
│ │ └── public/
│ │
│ └── functions/ # Reserved for future (unused in MVP)
│
├── packages/
│ ├── ui/ # Shared UI components (shadcn-based)
│ │ └── components/
│ │
│ ├── shared/ # Shared types and Zod schemas
│ │ └── src/schemas/
│ │ ├── user.schema.ts
│ │ ├── workout.schema.ts
│ │ ├── nutrition.schema.ts
│ │ └── wellbeing.schema.ts
│ │
│ ├── firebase/ # Firebase client setup (recommended)
│ │ ├── auth.ts
│ │ ├── firestore.ts
│ │ └── converters.ts
│ │
│ ├── eslint-config/
│ └── typescript-config/
│
├── docs/
│ └── technical/ # Architecture & rule documentation
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json

Key design decision:
All Cleo-Aura-Fitness business logic lives in apps/web and shared packages. No server-side application logic is required for MVP.

5. System Architecture Overview

User authenticates via Firebase Authentication

React app initializes Firebase client

UI reads/writes directly to Firestore

Authorization is enforced via Firestore Security Rules

TanStack Query manages caching and async state

Aggregations and analytics are computed client-side

There is no application server in MVP.

6. Authentication & Identity Management
   Authentication

Firebase Authentication (Web SDK)

Email/password and Google OAuth

Apple Sign-In planned for future

User Identity

Each user has a Firestore document:

Collection: users/{uid}
Fields:

displayName

email

role

status

createdAt

Roles are stored in Firestore (not custom claims) to avoid backend dependencies.

7. Authorization & Permissions Model
   Core Principle

The trainee owns all data.

Implementation

Professional relationships stored under trainee documents

Module-level permission grants per professional

Professionals have read-only access

Trainee can revoke access instantly

Authorization is enforced entirely through Firestore Security Rules.

8. Firestore Data Model
   Core Collections

users/{uid}

trainees/{traineeId}

Relationship & Permissions

trainees/{traineeId}/teamMembers/{memberUid}

trainees/{traineeId}/grants/{memberUid}

Tracking Subcollections

workouts/{workoutId}

recovery/{recoveryId}

nutritionDays/{yyyyMMdd}

wellbeingDays/{yyyyMMdd}

progressMeasurements/{measurementId}

wearablesSummary/{yyyyMMdd}

Rollups (Optional)

rollups/{yyyyWww} for weekly analytics

This model supports:

Efficient querying

Permission checks

Future extensibility

9. Wearable & External Integrations
   Apple Watch / HealthKit

HealthKit cannot be accessed directly from a browser.

Planned approach:

MVP: Manual logging + wearable summaries

Phase 2: iOS companion payload sync path implemented via validated JSON import into `wearablesSummary`

10. Analytics & Dashboards
    Trainee Dashboard

Muscle group balance

Strength & measurement trends

Recovery & habit consistency

Professional Dashboards

Trainer: training load & balance

Nutritionist: habit adherence

Counsellor: wellbeing trends

All analytics are derived from Firestore queries and optional rollups.

11. Freemium & Feature Gating
    MVP

UI-based feature gating

No backend billing enforcement

Future

Trusted billing integration to set plan flags securely

12. Testing Strategy

Zod schema validation tests

Firestore rule tests (Emulator)

UI unit tests (Vitest)

Optional E2E tests

13. Non-Functional Requirements

Privacy: GDPR, encrypted data

Scalability: Firestore-native scaling

Reliability: Offline-first writes

Usability: <3 taps for daily logging

14. Risks & Open Questions
    Risks

Role abuse → mitigated by revocation

Analytics complexity → mitigated via rollups

Open Questions

Professional-to-professional communication?

Progress photo default visibility?

Automation limits for a casual app?

15. Reference Documentation
    Firebase Auth:
    https://firebase.google.com/docs/auth

Cloud Firestore:
https://firebase.google.com/docs/firestore

Firestore Security Rules:
https://firebase.google.com/docs/firestore/security/get-started

Firestore Data Modeling:
https://firebase.google.com/docs/firestore/data-model

Apple HealthKit:
https://developer.apple.com/documentation/healthkit
