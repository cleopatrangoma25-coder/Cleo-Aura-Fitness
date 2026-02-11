import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { describe, beforeAll, afterAll, beforeEach, it } from 'vitest'

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

describe('Firestore Security Rules - Milestone 2', () => {
  describe('Users collection', () => {
    it('should allow a user to read their own profile', async () => {
      const userId = 'user123'
      const context = testEnv.authenticatedContext(userId)
      const userRef = doc(context.firestore(), 'users', userId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', userId), {
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'trainee',
        })
      })

      await assertSucceeds(getDoc(userRef))
    })

    it('should allow a user to create their own profile', async () => {
      const userId = 'user123'
      const context = testEnv.authenticatedContext(userId)
      const userRef = doc(context.firestore(), 'users', userId)

      await assertSucceeds(
        setDoc(userRef, {
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'trainee',
        })
      )
    })

    it('should allow a user to update their own profile', async () => {
      const userId = 'user123'
      const context = testEnv.authenticatedContext(userId)
      const userRef = doc(context.firestore(), 'users', userId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', userId), {
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'trainee',
        })
      })

      await assertSucceeds(
        updateDoc(userRef, {
          displayName: 'Updated Name',
        })
      )
    })

    it('should deny a user from reading another user profile', async () => {
      const userId = 'user123'
      const otherUserId = 'user456'
      const context = testEnv.authenticatedContext(userId)
      const otherUserRef = doc(context.firestore(), 'users', otherUserId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', otherUserId), {
          email: 'other@example.com',
          displayName: 'Other User',
          role: 'trainer',
        })
      })

      await assertFails(getDoc(otherUserRef))
    })

    it('should deny a user from creating another user profile', async () => {
      const userId = 'user123'
      const otherUserId = 'user456'
      const context = testEnv.authenticatedContext(userId)
      const otherUserRef = doc(context.firestore(), 'users', otherUserId)

      await assertFails(
        setDoc(otherUserRef, {
          email: 'other@example.com',
          displayName: 'Other User',
          role: 'trainer',
        })
      )
    })

    it('should deny a user from updating another user profile', async () => {
      const userId = 'user123'
      const otherUserId = 'user456'
      const context = testEnv.authenticatedContext(userId)
      const otherUserRef = doc(context.firestore(), 'users', otherUserId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', otherUserId), {
          email: 'other@example.com',
          displayName: 'Other User',
          role: 'trainer',
        })
      })

      await assertFails(
        updateDoc(otherUserRef, {
          displayName: 'Hacked Name',
        })
      )
    })

    it('should deny a user from deleting their own profile', async () => {
      const userId = 'user123'
      const context = testEnv.authenticatedContext(userId)
      const userRef = doc(context.firestore(), 'users', userId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', userId), {
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'trainee',
        })
      })

      await assertFails(deleteDoc(userRef))
    })

    it('should deny unauthenticated users from reading any profile', async () => {
      const userId = 'user123'
      const context = testEnv.unauthenticatedContext()
      const userRef = doc(context.firestore(), 'users', userId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', userId), {
          email: 'test@example.com',
          displayName: 'Test User',
          role: 'trainee',
        })
      })

      await assertFails(getDoc(userRef))
    })
  })

  describe('Trainees collection', () => {
    it('should allow a trainee to read their own data', async () => {
      const traineeId = 'trainee123'
      const context = testEnv.authenticatedContext(traineeId)
      const traineeRef = doc(context.firestore(), 'trainees', traineeId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
      })

      await assertSucceeds(getDoc(traineeRef))
    })

    it('should allow a trainee to create their own data', async () => {
      const traineeId = 'trainee123'
      const context = testEnv.authenticatedContext(traineeId)
      const traineeRef = doc(context.firestore(), 'trainees', traineeId)

      await assertSucceeds(
        setDoc(traineeRef, {
          uid: traineeId,
          ownerId: traineeId,
        })
      )
    })

    it('should allow a trainee to update their own data', async () => {
      const traineeId = 'trainee123'
      const context = testEnv.authenticatedContext(traineeId)
      const traineeRef = doc(context.firestore(), 'trainees', traineeId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
      })

      await assertSucceeds(
        updateDoc(traineeRef, {
          someField: 'updated value',
        })
      )
    })

    it('should deny a trainee from reading another trainee data', async () => {
      const traineeId = 'trainee123'
      const otherTraineeId = 'trainee456'
      const context = testEnv.authenticatedContext(traineeId)
      const otherTraineeRef = doc(context.firestore(), 'trainees', otherTraineeId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'trainees', otherTraineeId), {
          uid: otherTraineeId,
          ownerId: otherTraineeId,
        })
      })

      await assertFails(getDoc(otherTraineeRef))
    })

    it('should deny a trainee from creating another trainee data', async () => {
      const traineeId = 'trainee123'
      const otherTraineeId = 'trainee456'
      const context = testEnv.authenticatedContext(traineeId)
      const otherTraineeRef = doc(context.firestore(), 'trainees', otherTraineeId)

      await assertFails(
        setDoc(otherTraineeRef, {
          uid: otherTraineeId,
          ownerId: otherTraineeId,
        })
      )
    })

    it('should deny a trainee from deleting their own data', async () => {
      const traineeId = 'trainee123'
      const context = testEnv.authenticatedContext(traineeId)
      const traineeRef = doc(context.firestore(), 'trainees', traineeId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
      })

      await assertFails(deleteDoc(traineeRef))
    })

    it('should deny unauthenticated users from reading trainee data', async () => {
      const traineeId = 'trainee123'
      const context = testEnv.unauthenticatedContext()
      const traineeRef = doc(context.firestore(), 'trainees', traineeId)

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'trainees', traineeId), {
          uid: traineeId,
          ownerId: traineeId,
        })
      })

      await assertFails(getDoc(traineeRef))
    })
  })

  describe('Trainee subcollections (workouts, recovery, etc.)', () => {
    it('should allow a trainee to read their own workout data', async () => {
      const traineeId = 'trainee123'
      const context = testEnv.authenticatedContext(traineeId)
      const workoutRef = doc(context.firestore(), 'trainees', traineeId, 'workouts', 'workout1')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(
          doc(context.firestore(), 'trainees', traineeId, 'workouts', 'workout1'),
          {
            type: 'strength',
            date: '2024-01-01',
          }
        )
      })

      await assertSucceeds(getDoc(workoutRef))
    })

    it('should allow a trainee to create their own workout data', async () => {
      const traineeId = 'trainee123'
      const context = testEnv.authenticatedContext(traineeId)
      const workoutRef = doc(context.firestore(), 'trainees', traineeId, 'workouts', 'workout1')

      await assertSucceeds(
        setDoc(workoutRef, {
          type: 'strength',
          date: '2024-01-01',
        })
      )
    })

    it('should deny a trainee from reading another trainee workout data', async () => {
      const traineeId = 'trainee123'
      const otherTraineeId = 'trainee456'
      const context = testEnv.authenticatedContext(traineeId)
      const workoutRef = doc(
        context.firestore(),
        'trainees',
        otherTraineeId,
        'workouts',
        'workout1'
      )

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(
          doc(context.firestore(), 'trainees', otherTraineeId, 'workouts', 'workout1'),
          {
            type: 'strength',
            date: '2024-01-01',
          }
        )
      })

      await assertFails(getDoc(workoutRef))
    })

    it('should deny unauthenticated users from reading workout data', async () => {
      const traineeId = 'trainee123'
      const context = testEnv.unauthenticatedContext()
      const workoutRef = doc(context.firestore(), 'trainees', traineeId, 'workouts', 'workout1')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(
          doc(context.firestore(), 'trainees', traineeId, 'workouts', 'workout1'),
          {
            type: 'strength',
            date: '2024-01-01',
          }
        )
      })

      await assertFails(getDoc(workoutRef))
    })
  })
})
