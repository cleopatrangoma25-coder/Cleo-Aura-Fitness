import { describe, expect, it } from 'vitest'
import { GrantSchema, InviteSchema, TeamMemberSchema, defaultModulesForRole } from './team'

describe('Team schemas', () => {
  it('validates team member', () => {
    const result = TeamMemberSchema.safeParse({
      uid: 'pro_1',
      role: 'trainer',
      displayName: 'Coach Ada',
      email: 'ada@example.com',
      status: 'active',
      invitedAt: null,
      acceptedAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('validates grant', () => {
    const result = GrantSchema.safeParse({
      memberUid: 'pro_1',
      role: 'trainer',
      active: true,
      modules: defaultModulesForRole('trainer'),
      createdAt: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('validates invite', () => {
    const result = InviteSchema.safeParse({
      code: 'ABC123XY',
      traineeId: 'trainee_1',
      role: 'nutritionist',
      createdBy: 'trainee_1',
      status: 'pending',
      createdAt: null,
      acceptedAt: null,
      acceptedByUid: null,
      acceptedByEmail: null,
      updatedAt: null,
    })
    expect(result.success).toBe(true)
  })
})
