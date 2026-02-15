Product Design Document (PDD)
Cleo-Aura-Fitness

1. Project Overview

Project Name: Cleo-Aura-Fitness
Product Type: Freemium SaaS Platform
Target Market: Women-focused fitness & holistic wellness (solo users and professional-supported users)

Cleo-Aura-Fitness is a casual but intelligent fitness and wellness tracking platform designed to help trainees—primarily women—build strength, confidence, and sustainable habits while working with professionals such as trainers, nutritionists, and counsellors.

The platform supports a bio-psycho-social approach to health by enabling users to track physical training, muscle development, nutrition habits, recovery, and mental wellbeing in one unified system. A core differentiator is trainee-owned data with permission-based sharing, allowing each professional to see only what is relevant to their role.

2. Product Objectives
   Primary Objectives

Enable sustainable fitness progress without burnout or overtraining

Improve collaboration and transparency between trainees and professionals

Replace fragmented tools (notes, messages, spreadsheets, wearables) with a single platform

Empower trainees with ownership, clarity, and confidence

Secondary Objectives

Support habit-based nutrition without diet culture

Normalize rest, recovery, and mental wellbeing as part of fitness

Provide actionable analytics without obsession

Non-Goals

The app is not a calorie-counting or restrictive diet platform

The app is not a social fitness network

The app is not a medical or emergency mental health system

3. Target Users & Personas
   3.1 Trainee (Primary User / Data Owner)

Individuals working toward fitness and wellbeing

May train independently or with professionals

Owns all personal data and controls access permissions

3.2 Trainer

Focuses on physical training, performance, and recovery

Manages one or multiple trainees

3.3 Nutritionist / Dietitian

Focuses on eating habits, nourishment, and energy levels

Avoids calorie micromanagement

3.4 Counsellor / Mental Wellness Professional

Focuses on emotional wellbeing, stress, mood, and sleep

Not intended for crisis intervention or emergency care

3.5 Admin (Internal Role)

Handles platform operations, billing, and compliance

Has no access to personal health content

4. User Roles & Permissions Model

Cleo-Aura-Fitness uses Role-Based Access Control (RBAC) with the Trainee as the Data Owner.

Role Default Access
Trainee Full access to all data and permission settings
Trainer Workouts, muscle groups, strength trends, recovery, wearable summaries
Nutritionist Eating habits, energy trends, digestion notes
Counsellor Mood, stress, sleep quality, energy, journaling (if enabled)
Admin Account and subscription metadata only

Permissions are:

Granular (module-level)

Read-only for professionals

Revocable instantly by the trainee

5. Core Product Epics & User Stories
   Epic 1: User Identity, Roles & Permissions

Goal: Secure, trainee-owned collaboration.

As a Trainee, I want to invite professionals via secure links

As a Trainee, I want to control which data modules each professional can view

As a Trainee, I want to revoke access instantly at any time

As a Professional, I want a multi-client dashboard

As a User, I want my privacy clearly protected

Epic 2: Workout & Muscle Group Tracking

Goal: Track training inputs clearly and efficiently.

As a Trainee, I want to log workouts quickly

As a Trainee, I want to tag workouts by primary and secondary muscle groups

As a Trainee, I want to log rest days and recovery sessions

As a Trainer, I want to see muscle group distribution over time

As a Trainer, I want to identify overuse or neglect of muscle groups

Epic 3: Muscle Development & Growth Tracking

Goal: Track outcomes, not just effort.

As a Trainee, I want to track optional body measurements (hips, waist, thighs, arms)

As a Trainee, I want to track strength progression on key lifts

As a Trainee, I want to upload private progress photos (optional)

As a Trainer, I want to correlate training frequency with strength and measurement trends

As a Trainee, I want growth trends framed positively and privately

Epic 4: Rest, Recovery & Break Tracking

Goal: Normalize rest as part of progress.

As a Trainee, I want to log rest days and deload periods

As a Trainee, I want recovery visualized as productive

As a Trainer, I want to monitor recovery frequency

As a Trainee, I want gentle reminders when recovery is recommended

Epic 5: Nutrition & Eating Habit Tracking

Goal: Support nourishment without restriction.

As a Trainee, I want to log meals using habit-based tags

As a Trainee, I want to add notes about digestion or energy

As a Nutritionist, I want to view nutrition consistency and patterns

As a Trainee, I want nutrition tracking to feel non-judgmental

As a Trainer, I want optional high-level nutrition context

Epic 6: Wellbeing & Mental Health Tracking

Goal: Support emotional and nervous system health.

As a Trainee, I want daily mood, stress, and energy check-ins

As a Trainee, I want optional journaling

As a Counsellor, I want to view wellbeing trends over time

As a Counsellor, I want correlation charts (sleep vs stress)

As a Trainee, I want wellbeing data to remain private by default

Epic 7: Wearable & Device Integration

Goal: Reduce manual logging.

As a Trainee, I want to connect my Apple Watch via HealthKit

As a Trainee, I want activity and workouts auto-synced

As a Trainer, I want summarized wearable insights

As a Trainee, I want to control what wearable data is shared

Epic 8: Analytics Dashboards

Goal: Provide insight without obsession.

Trainee Dashboard

Muscle balance charts

Strength and measurement trends

Consistency and recovery indicators

Professional Dashboards

Trainer: load, balance, progression

Nutritionist: habit adherence and energy

Counsellor: mood, stress, and sleep trends

Epic 9: Communication & Notes (Phase 2)

Secure in-app messaging

Professional notes and summaries

Trainee-visible feedback

6. MVP vs Phase 2 Scope
   MVP (Phase 1)

User roles and permissions

Workout and muscle group tracking

Habit-based nutrition logging

Wellbeing check-ins

Trainer and nutritionist dashboards

Apple HealthKit integration

Phase 2+

Muscle growth analytics

Progress photo tracking

Counsellor journaling tools

Predictive burnout alerts

Secure messaging

Expanded wearable integrations (Garmin, Oura, etc.)

7. Analytics & Insights Strategy

Focus on trends over time, not daily fluctuations

Positive framing: balance, growth, consistency

Correlation insights across training, recovery, and wellbeing

Avoid punitive or shame-based metrics

8. Non-Functional Requirements
   Privacy & Security

AES-256 encryption

GDPR compliant

HIPAA-lite handling (non-medical)

Scalability

Modular backend services

Scalable wearable data ingestion

Reliability

Offline-first logging

Background syncing

Usability

Fewer than three taps for daily logging

Calm, low-friction interface

9. Risks, Assumptions & Open Questions
   Assumptions

Trainees value holistic tracking

Professionals accept read-only access

Privacy controls increase trust

Risks

Data misuse → mitigated with instant revoke and audit logs

Scope creep → mitigated by clear MVP boundaries

Open Questions

Should professionals communicate with each other?

Should progress photos be trainer-visible by default?

How much automation is appropriate for a casual app?

10. Product Principle

Cleo-Aura-Fitness is not about pushing harder.
It’s about training smarter, recovering fully, and growing confidently.
