import { z } from 'zod'

export const MealQualityEnum = z.enum(['poor', 'okay', 'good', 'great'])
export type MealQuality = z.infer<typeof MealQualityEnum>

export const MEAL_QUALITY_LABELS: Record<MealQuality, string> = {
  poor: 'Poor',
  okay: 'Okay',
  good: 'Good',
  great: 'Great',
}

export const HydrationEnum = z.enum(['low', 'moderate', 'high'])
export type Hydration = z.infer<typeof HydrationEnum>

export const HYDRATION_LABELS: Record<Hydration, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
}

export const NutritionDaySchema = z.object({
  id: z.string().regex(/^\d{8}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealsOnTrack: z.boolean(),
  mealQuality: MealQualityEnum,
  hydration: HydrationEnum,
  notes: z.string().max(500).default(''),
  createdAt: z.unknown(),
  updatedAt: z.unknown(),
})

export const UpsertNutritionDaySchema = NutritionDaySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type NutritionDay = z.infer<typeof NutritionDaySchema>
export type UpsertNutritionDayInput = z.infer<typeof UpsertNutritionDaySchema>
