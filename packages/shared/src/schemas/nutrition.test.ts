import { describe, expect, it } from 'vitest'
import { NutritionDaySchema, UpsertNutritionDaySchema } from './nutrition'

describe('NutritionDaySchema', () => {
  it('validates a complete nutrition day', () => {
    const result = NutritionDaySchema.safeParse({
      id: '20260211',
      date: '2026-02-11',
      mealsOnTrack: true,
      mealQuality: 'good',
      hydration: 'moderate',
      notes: 'Good day',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid date id', () => {
    const result = NutritionDaySchema.safeParse({
      id: '2026-02-11',
      date: '2026-02-11',
      mealsOnTrack: true,
      mealQuality: 'good',
      hydration: 'moderate',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })
})

describe('UpsertNutritionDaySchema', () => {
  it('accepts day payload without id/timestamps', () => {
    const result = UpsertNutritionDaySchema.safeParse({
      date: '2026-02-11',
      mealsOnTrack: true,
      mealQuality: 'great',
      hydration: 'high',
    })
    expect(result.success).toBe(true)
  })
})
