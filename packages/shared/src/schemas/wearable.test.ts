import { describe, expect, it } from 'vitest'
import { UpsertWearableSummarySchema, WearableSummarySchema } from './wearable'

describe('WearableSummarySchema', () => {
  it('validates a complete wearable summary', () => {
    const result = WearableSummarySchema.safeParse({
      id: '20260212',
      date: '2026-02-12',
      source: 'apple_watch',
      steps: 10234,
      activeCaloriesKcal: 620,
      workoutMinutes: 54,
      avgHeartRateBpm: 123,
      restingHeartRateBpm: 58,
      sleepHours: 7.2,
      readinessScore: 81,
      notes: 'Felt strong',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid day id', () => {
    const result = WearableSummarySchema.safeParse({
      id: '2026-02-12',
      date: '2026-02-12',
      source: 'manual',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })
})

describe('UpsertWearableSummarySchema', () => {
  it('accepts a payload with one metric', () => {
    const result = UpsertWearableSummarySchema.safeParse({
      date: '2026-02-12',
      source: 'manual',
      steps: 5000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects payload with no metrics', () => {
    const result = UpsertWearableSummarySchema.safeParse({
      date: '2026-02-12',
      source: 'manual',
      steps: null,
      activeCaloriesKcal: null,
      workoutMinutes: null,
      avgHeartRateBpm: null,
      restingHeartRateBpm: null,
      sleepHours: null,
      readinessScore: null,
    })
    expect(result.success).toBe(false)
  })
})
