import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'cleo-aura-fitness-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

async function seedUser(uid: string, role: 'trainee' | 'trainer' | 'nutritionist' | 'counsellor') {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users', uid), {
      uid,
      email: `${uid}@example.com`,
      displayName: uid,
      role,
    })
  })
}

describe('Firestore Security Rules', () => {
  describe('Users collection', () => {
    it('allows reading and updating own user profile', async () => {
      const uid = 'user123'
      await seedUser(uid, 'trainee')
      const context = testEnv.authenticatedContext(uid)
      const userRef = doc(context.firestore(), 'users', uid)

      await assertSucceeds(getDoc(userRef))
      await assertSucceeds(updateDoc(userRef, { displayName: 'Updated Name' }))
    })

    it('denies reading another user profile', async () => {
      await seedUser('user123', 'trainee')
      await seedUser('user456', 'trainer')
      const context = testEnv.authenticatedContext('user123')
      const otherRef = doc(context.firestore(), 'users', 'user456')
      await assertFails(getDoc(otherRef))
    })
  })

  describe('Trainee ownership', () => {
    it('allows trainee to create own trainee doc', async () => {
      const traineeId = 'trainee123'
      await seedUser(traineeId, 'trainee')
      const context = testEnv.authenticatedContext(traineeId)
      const traineeRef = doc(context.firestore(), 'trainees', traineeId)

      await assertSucceeds(setDoc(traineeRef, { uid: traineeId, ownerId: traineeId }))
    })

    it('denies professional from creating own trainee doc', async () => {
      const trainerId = 'trainer123'
      await seedUser(trainerId, 'trainer')
      const context = testEnv.authenticatedContext(trainerId)
      const traineeRef = doc(context.firestore(), 'trainees', trainerId)

      await assertFails(setDoc(traineeRef, { uid: trainerId, ownerId: trainerId }))
    })
  })

  describe('Milestone 4 logging', () => {
    it('allows trainee to write nutrition and wellbeing days', async () => {
      const traineeId = 'trainee123'
      await seedUser(traineeId, 'trainee')
      const context = testEnv.authenticatedContext(traineeId)

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
      })

      const nutritionRef = doc(context.firestore(), 'trainees', traineeId, 'nutritionDays', '20260211')
      const wellbeingRef = doc(context.firestore(), 'trainees', traineeId, 'wellbeingDays', '20260211')

      await assertSucceeds(
        setDoc(nutritionRef, {
          date: '2026-02-11',
          mealsOnTrack: true,
          mealQuality: 'good',
          hydration: 'moderate',
        })
      )

      await assertSucceeds(
        setDoc(wellbeingRef, {
          date: '2026-02-11',
          mood: 4,
          stress: 2,
          energy: 4,
          sleepQuality: 4,
        })
      )
    })
  })

  describe('Milestone 5 team access', () => {
    it('allows professional to accept invite and create self team/grant docs', async () => {
      const traineeId = 'trainee123'
      const trainerId = 'trainer123'
      const inviteCode = 'INVITE01'

      await seedUser(traineeId, 'trainee')
      await seedUser(trainerId, 'trainer')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'invites', inviteCode), {
          code: inviteCode,
          traineeId,
          role: 'trainer',
          createdBy: traineeId,
          status: 'pending',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        })
      })

      const trainerCtx = testEnv.authenticatedContext(trainerId)
      const inviteRef = doc(trainerCtx.firestore(), 'trainees', traineeId, 'invites', inviteCode)

      await assertSucceeds(
        updateDoc(inviteRef, {
          status: 'accepted',
          acceptedByUid: trainerId,
          traineeId,
          role: 'trainer',
        })
      )

      await assertSucceeds(
        setDoc(doc(trainerCtx.firestore(), 'trainees', traineeId, 'teamMembers', trainerId), {
          uid: trainerId,
          role: 'trainer',
          displayName: 'Coach',
          email: 'trainer123@example.com',
          status: 'active',
          inviteCode,
        })
      )

      await assertSucceeds(
        setDoc(doc(trainerCtx.firestore(), 'trainees', traineeId, 'grants', trainerId), {
          memberUid: trainerId,
          role: 'trainer',
          active: true,
          inviteCode,
          modules: {
            workouts: false,
            recovery: false,
            nutrition: false,
            wellbeing: false,
            progress: false,
            wearables: false,
          },
        })
      )
    })

    it('allows granted professional read-only access to workouts', async () => {
      const traineeId = 'trainee123'
      const trainerId = 'trainer123'
      await seedUser(traineeId, 'trainee')
      await seedUser(trainerId, 'trainer')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'teamMembers', trainerId), {
          uid: trainerId,
          role: 'trainer',
          status: 'active',
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'grants', trainerId), {
          memberUid: trainerId,
          role: 'trainer',
          active: true,
          modules: {
            workouts: true,
            recovery: false,
            nutrition: false,
            wellbeing: false,
            progress: false,
            wearables: false,
          },
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'workouts', 'w1'), {
          type: 'strength',
          date: '2026-02-11',
        })
      })

      const trainerCtx = testEnv.authenticatedContext(trainerId)
      const workoutRef = doc(trainerCtx.firestore(), 'trainees', traineeId, 'workouts', 'w1')
      await assertSucceeds(getDoc(workoutRef))
      await assertFails(setDoc(workoutRef, { type: 'cardio', date: '2026-02-11' }))
    })

    it('denies professional read if module is not granted', async () => {
      const traineeId = 'trainee123'
      const nutritionistId = 'nutritionist123'
      await seedUser(traineeId, 'trainee')
      await seedUser(nutritionistId, 'nutritionist')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'teamMembers', nutritionistId), {
          uid: nutritionistId,
          role: 'nutritionist',
          status: 'active',
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'grants', nutritionistId), {
          memberUid: nutritionistId,
          role: 'nutritionist',
          active: true,
          modules: {
            workouts: false,
            recovery: false,
            nutrition: true,
            wellbeing: false,
            progress: false,
            wearables: false,
          },
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'wellbeingDays', '20260211'), {
          date: '2026-02-11',
          mood: 3,
        })
      })

      const nutritionistCtx = testEnv.authenticatedContext(nutritionistId)
      const wellbeingRef = doc(
        nutritionistCtx.firestore(),
        'trainees',
        traineeId,
        'wellbeingDays',
        '20260211'
      )
      await assertFails(getDoc(wellbeingRef))
    })

    it('allows trainee to revoke instantly by deleting team member and grant', async () => {
      const traineeId = 'trainee123'
      const trainerId = 'trainer123'
      await seedUser(traineeId, 'trainee')
      await seedUser(trainerId, 'trainer')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'teamMembers', trainerId), {
          uid: trainerId,
          role: 'trainer',
          status: 'active',
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'grants', trainerId), {
          memberUid: trainerId,
          role: 'trainer',
          active: true,
          modules: {
            workouts: true,
            recovery: false,
            nutrition: false,
            wellbeing: false,
            progress: false,
            wearables: false,
          },
        })
      })

      const traineeCtx = testEnv.authenticatedContext(traineeId)
      await assertSucceeds(
        deleteDoc(doc(traineeCtx.firestore(), 'trainees', traineeId, 'teamMembers', trainerId))
      )
      await assertSucceeds(deleteDoc(doc(traineeCtx.firestore(), 'trainees', traineeId, 'grants', trainerId)))
    })
  })

  describe('Milestone 7 progress measurements', () => {
    it('allows trainee to write progress measurements', async () => {
      const traineeId = 'trainee123'
      await seedUser(traineeId, 'trainee')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
      })

      const traineeCtx = testEnv.authenticatedContext(traineeId)
      const progressRef = doc(
        traineeCtx.firestore(),
        'trainees',
        traineeId,
        'progressMeasurements',
        'pm1'
      )

      await assertSucceeds(
        setDoc(progressRef, {
          date: '2026-02-12',
          bodyWeightKg: 68.2,
          squat1RmKg: 70,
        })
      )
    })

    it('allows professional read when progress module is granted', async () => {
      const traineeId = 'trainee123'
      const trainerId = 'trainer123'
      await seedUser(traineeId, 'trainee')
      await seedUser(trainerId, 'trainer')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'teamMembers', trainerId), {
          uid: trainerId,
          role: 'trainer',
          status: 'active',
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'grants', trainerId), {
          memberUid: trainerId,
          role: 'trainer',
          active: true,
          modules: {
            workouts: false,
            recovery: false,
            nutrition: false,
            wellbeing: false,
            progress: true,
            wearables: false,
          },
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'progressMeasurements', 'pm1'), {
          date: '2026-02-12',
          bodyWeightKg: 68.2,
        })
      })

      const trainerCtx = testEnv.authenticatedContext(trainerId)
      const progressRef = doc(
        trainerCtx.firestore(),
        'trainees',
        traineeId,
        'progressMeasurements',
        'pm1'
      )
      await assertSucceeds(getDoc(progressRef))
      await assertFails(setDoc(progressRef, { date: '2026-02-12', bodyWeightKg: 67.5 }))
    })
  })

  describe('Milestone 8 wearable summaries', () => {
    it('allows trainee to write wearable summary', async () => {
      const traineeId = 'trainee123'
      await seedUser(traineeId, 'trainee')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
      })

      const traineeCtx = testEnv.authenticatedContext(traineeId)
      const wearableRef = doc(traineeCtx.firestore(), 'trainees', traineeId, 'wearablesSummary', '20260212')
      await assertSucceeds(
        setDoc(wearableRef, {
          date: '2026-02-12',
          source: 'manual',
          steps: 8234,
        })
      )
    })

    it('allows professional read when wearables module is granted', async () => {
      const traineeId = 'trainee123'
      const trainerId = 'trainer123'
      await seedUser(traineeId, 'trainee')
      await seedUser(trainerId, 'trainer')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'teamMembers', trainerId), {
          uid: trainerId,
          role: 'trainer',
          status: 'active',
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'grants', trainerId), {
          memberUid: trainerId,
          role: 'trainer',
          active: true,
          modules: {
            workouts: false,
            recovery: false,
            nutrition: false,
            wellbeing: false,
            progress: false,
            wearables: true,
          },
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'wearablesSummary', '20260212'), {
          date: '2026-02-12',
          source: 'manual',
          steps: 8234,
        })
      })

      const trainerCtx = testEnv.authenticatedContext(trainerId)
      const wearableRef = doc(trainerCtx.firestore(), 'trainees', traineeId, 'wearablesSummary', '20260212')
      await assertSucceeds(getDoc(wearableRef))
      await assertFails(setDoc(wearableRef, { date: '2026-02-12', source: 'manual', steps: 9000 }))
    })

    it('denies professional read when wearables module is off', async () => {
      const traineeId = 'trainee123'
      const trainerId = 'trainer123'
      await seedUser(traineeId, 'trainee')
      await seedUser(trainerId, 'trainer')

      await testEnv.withSecurityRulesDisabled(async admin => {
        await setDoc(doc(admin.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'teamMembers', trainerId), {
          uid: trainerId,
          role: 'trainer',
          status: 'active',
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'grants', trainerId), {
          memberUid: trainerId,
          role: 'trainer',
          active: true,
          modules: {
            workouts: false,
            recovery: false,
            nutrition: false,
            wellbeing: false,
            progress: false,
            wearables: false,
          },
        })
        await setDoc(doc(admin.firestore(), 'trainees', traineeId, 'wearablesSummary', '20260212'), {
          date: '2026-02-12',
          source: 'manual',
          steps: 8234,
        })
      })

      const trainerCtx = testEnv.authenticatedContext(trainerId)
      const wearableRef = doc(trainerCtx.firestore(), 'trainees', traineeId, 'wearablesSummary', '20260212')
      await assertFails(getDoc(wearableRef))
    })
  })
})
