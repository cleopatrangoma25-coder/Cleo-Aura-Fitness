import { describe, expect, it } from 'vitest'
import { UpsertWellbeingDaySchema, WellbeingDaySchema } from './wellbeing'

describe('WellbeingDaySchema', () => {
  it('validates a complete wellbeing day', () => {
    const result = WellbeingDaySchema.safeParse({
      id: '20260211',
      date: '2026-02-11',
      mood: 4,
      stress: 2,
      energy: 4,
      sleepQuality: 3,
      notes: 'Felt steady',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects out-of-range scores', () => {
    const result = WellbeingDaySchema.safeParse({
      id: '20260211',
      date: '2026-02-11',
      mood: 6,
      stress: 2,
      energy: 4,
      sleepQuality: 3,
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })
})

describe('UpsertWellbeingDaySchema', () => {
  it('accepts day payload without id/timestamps', () => {
    const result = UpsertWellbeingDaySchema.safeParse({
      date: '2026-02-11',
      mood: 3,
      stress: 3,
      energy: 3,
      sleepQuality: 3,
    })
    expect(result.success).toBe(true)
  })
})
