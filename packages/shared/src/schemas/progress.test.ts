import { describe, expect, it } from 'vitest'
import { CreateProgressMeasurementSchema, ProgressMeasurementSchema } from './progress'

describe('ProgressMeasurementSchema', () => {
  it('validates a complete progress record', () => {
    const result = ProgressMeasurementSchema.safeParse({
      id: 'p1',
      date: '2026-02-12',
      bodyWeightKg: 68.4,
      bodyFatPct: 24.8,
      waistCm: 73,
      hipsCm: 96,
      chestCm: 88,
      thighsCm: 57,
      armsCm: 29,
      squat1RmKg: 70,
      bench1RmKg: 42.5,
      deadlift1RmKg: 95,
      notes: 'Steady progress',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid date format', () => {
    const result = ProgressMeasurementSchema.safeParse({
      id: 'p1',
      date: '12-02-2026',
      bodyWeightKg: 68.4,
      bodyFatPct: null,
      waistCm: null,
      hipsCm: null,
      chestCm: null,
      thighsCm: null,
      armsCm: null,
      squat1RmKg: null,
      bench1RmKg: null,
      deadlift1RmKg: null,
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })
})

describe('CreateProgressMeasurementSchema', () => {
  it('accepts creation payload with one metric', () => {
    const result = CreateProgressMeasurementSchema.safeParse({
      date: '2026-02-12',
      bodyWeightKg: 68.2,
    })
    expect(result.success).toBe(true)
  })

  it('rejects payload with no measurement values', () => {
    const result = CreateProgressMeasurementSchema.safeParse({
      date: '2026-02-12',
      bodyWeightKg: null,
      bodyFatPct: null,
      waistCm: null,
      hipsCm: null,
      chestCm: null,
      thighsCm: null,
      armsCm: null,
      squat1RmKg: null,
      bench1RmKg: null,
      deadlift1RmKg: null,
    })
    expect(result.success).toBe(false)
  })
})
