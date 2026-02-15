import { z } from 'zod'

const nullablePositive = z.number().positive().nullable().default(null)

export const ProgressMeasurementSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bodyWeightKg: nullablePositive,
  bodyFatPct: nullablePositive,
  waistCm: nullablePositive,
  hipsCm: nullablePositive,
  chestCm: nullablePositive,
  thighsCm: nullablePositive,
  armsCm: nullablePositive,
  squat1RmKg: nullablePositive,
  bench1RmKg: nullablePositive,
  deadlift1RmKg: nullablePositive,
  notes: z.string().max(500).default(''),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
})

export const CreateProgressMeasurementSchema = ProgressMeasurementSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  value =>
    value.bodyWeightKg !== null ||
    value.bodyFatPct !== null ||
    value.waistCm !== null ||
    value.hipsCm !== null ||
    value.chestCm !== null ||
    value.thighsCm !== null ||
    value.armsCm !== null ||
    value.squat1RmKg !== null ||
    value.bench1RmKg !== null ||
    value.deadlift1RmKg !== null,
  { message: 'Provide at least one measurement value.' }
)

export type ProgressMeasurement = z.infer<typeof ProgressMeasurementSchema>
export type CreateProgressMeasurementInput = z.infer<typeof CreateProgressMeasurementSchema>
