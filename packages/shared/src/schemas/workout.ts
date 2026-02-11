import { z } from 'zod'

export const MuscleGroupEnum = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'glutes',
  'quadriceps',
  'hamstrings',
  'calves',
  'hip_flexors',
  'full_body',
])

export type MuscleGroup = z.infer<typeof MuscleGroupEnum>

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  core: 'Core',
  glutes: 'Glutes',
  quadriceps: 'Quadriceps',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  hip_flexors: 'Hip Flexors',
  full_body: 'Full Body',
}

export const WorkoutTypeEnum = z.enum(['strength', 'cardio', 'flexibility', 'sport', 'other'])

export type WorkoutType = z.infer<typeof WorkoutTypeEnum>

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  flexibility: 'Flexibility',
  sport: 'Sport',
  other: 'Other',
}

export const IntensityEnum = z.enum(['light', 'moderate', 'intense'])

export type Intensity = z.infer<typeof IntensityEnum>

export const INTENSITY_LABELS: Record<Intensity, string> = {
  light: 'Light',
  moderate: 'Moderate',
  intense: 'Intense',
}

export const WorkoutSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  type: WorkoutTypeEnum,
  primaryMuscleGroups: z.array(MuscleGroupEnum).min(1),
  secondaryMuscleGroups: z.array(MuscleGroupEnum).default([]),
  durationMinutes: z.number().int().positive().nullable().default(null),
  intensity: IntensityEnum.nullable().default(null),
  notes: z.string().max(500).default(''),
  date: z.string(),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
})

export const CreateWorkoutSchema = WorkoutSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type Workout = z.infer<typeof WorkoutSchema>
export type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>
