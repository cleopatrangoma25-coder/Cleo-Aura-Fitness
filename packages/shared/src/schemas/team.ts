import { z } from 'zod'

export const ProfessionalRoleEnum = z.enum(['trainer', 'nutritionist', 'counsellor'])
export type ProfessionalRole = z.infer<typeof ProfessionalRoleEnum>

export const MODULE_KEYS = ['workouts', 'recovery', 'nutrition', 'wellbeing', 'progress'] as const
export type ModuleKey = (typeof MODULE_KEYS)[number]

export const ModulePermissionsSchema = z.object({
  workouts: z.boolean(),
  recovery: z.boolean(),
  nutrition: z.boolean(),
  wellbeing: z.boolean(),
  progress: z.boolean(),
})
export type ModulePermissions = z.infer<typeof ModulePermissionsSchema>

export const TeamMemberSchema = z.object({
  uid: z.string().min(1),
  role: ProfessionalRoleEnum,
  displayName: z.string().max(120).default(''),
  email: z.string().email(),
  status: z.enum(['active', 'revoked']).default('active'),
  inviteCode: z.string().min(6).max(32).optional(),
  invitedAt: z.unknown(),
  acceptedAt: z.unknown().nullable().default(null),
  updatedAt: z.unknown(),
})
export type TeamMember = z.infer<typeof TeamMemberSchema>

export const GrantSchema = z.object({
  memberUid: z.string().min(1),
  role: ProfessionalRoleEnum,
  active: z.boolean().default(true),
  inviteCode: z.string().min(6).max(32).optional(),
  modules: ModulePermissionsSchema,
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
})
export type Grant = z.infer<typeof GrantSchema>

export const InviteSchema = z.object({
  code: z.string().min(6).max(32),
  traineeId: z.string().min(1),
  role: ProfessionalRoleEnum,
  createdBy: z.string().min(1),
  status: z.enum(['pending', 'accepted', 'revoked']).default('pending'),
  createdAt: z.unknown(),
  acceptedAt: z.unknown().nullable().default(null),
  acceptedByUid: z.string().nullable().default(null),
  acceptedByEmail: z.string().email().nullable().default(null),
  updatedAt: z.unknown(),
})
export type Invite = z.infer<typeof InviteSchema>

export function defaultModulesForRole(role: ProfessionalRole): ModulePermissions {
  if (role === 'trainer') {
    return {
      workouts: true,
      recovery: true,
      nutrition: false,
      wellbeing: false,
      progress: true,
    }
  }

  if (role === 'nutritionist') {
    return {
      workouts: false,
      recovery: false,
      nutrition: true,
      wellbeing: false,
      progress: false,
    }
  }

  return {
    workouts: false,
    recovery: false,
    nutrition: false,
    wellbeing: true,
    progress: false,
  }
}
