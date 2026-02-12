import { z } from 'zod'

const scoreSchema = z.number().int().min(1).max(5)

export const WellbeingDaySchema = z.object({
  id: z.string().regex(/^\d{8}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: scoreSchema,
  stress: scoreSchema,
  energy: scoreSchema,
  sleepQuality: scoreSchema,
  notes: z.string().max(500).default(''),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
})

export const UpsertWellbeingDaySchema = WellbeingDaySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type WellbeingDay = z.infer<typeof WellbeingDaySchema>
export type UpsertWellbeingDayInput = z.infer<typeof UpsertWellbeingDaySchema>
