import { z } from 'zod'

export const RecoveryTypeEnum = z.enum([
  'rest_day',
  'active_recovery',
  'deload',
  'stretching',
  'other',
])

export type RecoveryType = z.infer<typeof RecoveryTypeEnum>

export const RECOVERY_TYPE_LABELS: Record<RecoveryType, string> = {
  rest_day: 'Rest Day',
  active_recovery: 'Active Recovery',
  deload: 'Deload',
  stretching: 'Stretching',
  other: 'Other',
}

export const RecoverySchema = z.object({
  id: z.string().min(1),
  type: RecoveryTypeEnum,
  notes: z.string().max(500).default(''),
  date: z.string(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
})

export const CreateRecoverySchema = RecoverySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type Recovery = z.infer<typeof RecoverySchema>
export type CreateRecoveryInput = z.infer<typeof CreateRecoverySchema>
