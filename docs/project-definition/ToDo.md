Cleo-Aura-Fitness — TODO List (Milestones)
Milestone 1 — Auth + Role Bootstrapping

Goal: Users can sign up, log in, and be correctly identified as trainees or professionals.

Build authentication UI (login, signup, logout)

On first login, create users/{uid} Firestore profile

Implement role selection flow:

Trainee

Trainer

Nutritionist / Dietitian

Counsellor

Auto-create trainees/{uid} document when role = trainee

Protected routing (authenticated users only)

Basic account settings page:

View role

Update display name

Handle role immutability or role-change rules

Exit criteria:
User can log in, has a role, and lands in the correct base experience.

Milestone 2 — Firestore Security Rules (RBAC + Ownership)

Goal: Lock down data access safely and correctly.

Implement base Firestore rules:

Trainees can read/write their own data

Professionals have no access by default

Add rule helpers:

isSignedIn

isTraineeOwner

Add Firestore Emulator tests:

Trainee access success cases

Unauthorized access failure cases

Document rules in /docs/technical/

Exit criteria:
Unauthorized reads/writes are blocked; rules are tested.

Milestone 3 — Core Tracking: Workouts & Recovery

Goal: Trainees can log training activity with muscle group detail.

Implement workout logging UI

Define muscle group enums

Create Firestore collections:

trainees/{id}/workouts/{workoutId}

trainees/{id}/recovery/{recoveryId}

Enable tagging of:

Primary muscle groups

Secondary muscle groups

Add rest day and recovery session logging

Workout history list (date-based)

Exit criteria:
Trainee can log workouts and recovery and see them in a timeline.

Milestone 4 — Nutrition & Wellbeing Daily Logs

Goal: Support habit-based nutrition and mental wellbeing tracking.

Create nutritionDays/{yyyyMMdd} logging flow

Create wellbeingDays/{yyyyMMdd} logging flow

Build “daily check-in” UX (single low-friction screen)

Display weekly streaks and summaries

Store qualitative notes (optional)

Exit criteria:
Trainee can complete a daily check-in in under 1 minute.

Milestone 5 — Team Members & Permissions

Goal: Trainees can invite professionals and control access.

Create Firestore collections:

teamMembers/{memberUid}

grants/{memberUid}

Build invite flow (secure link or code)

Build invite acceptance flow (professional)

Permission toggles per module:

Workouts

Recovery

Nutrition

Wellbeing

Progress

Update Firestore rules for read-only professional access

Implement “instant revoke” access

Exit criteria:
Professional can view only permitted data; trainee can revoke instantly.

Milestone 6 — Professional Dashboards

Goal: Trainers, nutritionists, and counsellors can follow clients.

Multi-client overview for professionals

Trainer dashboard:

Workout frequency

Muscle group heatmap

Recovery overview

Nutritionist dashboard:

Habit adherence

Energy/digestion notes

Counsellor dashboard:

Mood/stress/sleep trends

Enforce read-only behavior in UI and rules

Exit criteria:
Each professional role sees only relevant, read-only data.

Milestone 7 — Trainee Analytics & Muscle Growth Tracking

Goal: Trainees can monitor progress and development.

Implement progressMeasurements tracking

Build analytics charts:

Muscle group balance over time

Workout consistency

Recovery vs intensity

Correlate strength, measurements, and training frequency

(Optional) Weekly rollups for performance

Exit criteria:
Trainee can clearly see progress trends, not just raw logs.

Milestone 8 — Wearables Integration (Roadmap)

Goal: Prepare and implement Apple Watch path.

Finalize wearable summary schema

Decide iOS companion vs Capacitor wrapper

Implement HealthKit → Firestore summary (Phase 2)

Overlay wearable data in dashboards

Exit criteria:
Wearable data appears in summaries without overwhelming UI.

Status update (2026-02-12):
- Completed: wearable summary schema + validation, trainee wearable logging flow, trainee dashboard overlay.
- Completed: team permission module for wearable summaries and Firestore rule enforcement.
- Completed: professional client wearable insights view (read-only, permission-gated).
- Completed: HealthKit Phase 2 app path via validated iOS companion payload import into `wearablesSummary`.

Milestone 9 — Freemium, Hardening & Launch

Goal: Production-ready release.

Define free vs paid feature gating

Add plan field to users/{uid}

Optimize Firestore queries and indexes

Add error monitoring (optional)

Final production deployment checks

Beta feedback & iteration

Exit criteria:
App is stable, secure, and ready for real users

Status update (2026-02-12):
- In progress: introduced `plan` model (`free` / `pro`) on user profile.
- In progress: implemented initial feature gating in UI/routes (analytics, wearables, team as Pro-gated for trainees).
- Completed: reduced high-volume dashboard queries with bounded result limits and removed N+1 client grant fetches.
- Completed: added Firestore index config (`firestore.indexes.json`) with disabled indexes on non-query `notes` fields to reduce write/index cost.
- Completed: added global frontend error monitoring hooks (error boundary + `window`/promise capture) with optional endpoint forwarding.
- Pending next: release checklist and beta feedback iteration.
