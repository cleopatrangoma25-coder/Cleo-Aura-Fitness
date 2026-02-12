import { z } from 'zod'

const nullablePositive = z.number().positive().nullable().default(null)

export const WearableSourceEnum = z.enum(['apple_watch', 'manual', 'other'])
export type WearableSource = z.infer<typeof WearableSourceEnum>

export const WEARABLE_SOURCE_LABELS: Record<WearableSource, string> = {
  apple_watch: 'Apple Watch',
  manual: 'Manual',
  other: 'Other',
}

export const WearableSummarySchema = z.object({
  id: z.string().regex(/^\d{8}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: WearableSourceEnum,
  steps: z.number().int().nonnegative().nullable().default(null),
  activeCaloriesKcal: nullablePositive,
  workoutMinutes: z.number().int().nonnegative().nullable().default(null),
  avgHeartRateBpm: nullablePositive,
  restingHeartRateBpm: nullablePositive,
  sleepHours: nullablePositive,
  readinessScore: z.number().int().min(1).max(100).nullable().default(null),
  notes: z.string().max(500).default(''),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
})

export const UpsertWearableSummarySchema = WearableSummarySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  value =>
    value.steps !== null ||
    value.activeCaloriesKcal !== null ||
    value.workoutMinutes !== null ||
    value.avgHeartRateBpm !== null ||
    value.restingHeartRateBpm !== null ||
    value.sleepHours !== null ||
    value.readinessScore !== null,
  { message: 'Provide at least one wearable metric.' }
)

export type WearableSummary = z.infer<typeof WearableSummarySchema>
export type UpsertWearableSummaryInput = z.infer<typeof UpsertWearableSummarySchema>
