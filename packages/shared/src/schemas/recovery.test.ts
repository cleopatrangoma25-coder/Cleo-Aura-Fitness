import { describe, it, expect } from 'vitest'
import { RecoverySchema, CreateRecoverySchema, RecoveryTypeEnum } from './recovery'

describe('RecoverySchema', () => {
  it('validates a complete recovery entry', () => {
    const result = RecoverySchema.safeParse({
      id: 'r1',
      type: 'rest_day',
      notes: 'Needed this after heavy leg day',
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid recovery type', () => {
    const result = RecoverySchema.safeParse({
      id: 'r1',
      type: 'nap',
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing date', () => {
    const result = RecoverySchema.safeParse({
      id: 'r1',
      type: 'rest_day',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(false)
  })

  it('defaults notes to empty string', () => {
    const result = RecoverySchema.safeParse({
      id: 'r1',
      type: 'active_recovery',
      date: '2026-02-11',
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe('')
    }
  })
})

describe('CreateRecoverySchema', () => {
  it('validates recovery creation input', () => {
    const result = CreateRecoverySchema.safeParse({
      type: 'stretching',
      date: '2026-02-11',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing type', () => {
    const result = CreateRecoverySchema.safeParse({
      date: '2026-02-11',
    })
    expect(result.success).toBe(false)
  })
})

describe('RecoveryTypeEnum', () => {
  it('accepts all valid recovery types', () => {
    const types = ['rest_day', 'active_recovery', 'deload', 'stretching', 'other']
    for (const type of types) {
      expect(RecoveryTypeEnum.safeParse(type).success).toBe(true)
    }
  })

  it('rejects invalid recovery type', () => {
    expect(RecoveryTypeEnum.safeParse('massage').success).toBe(false)
  })
})
