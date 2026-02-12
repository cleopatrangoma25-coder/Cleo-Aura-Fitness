import { z } from 'zod'

export const UserPlanEnum = z.enum(['free', 'pro'])
export type UserPlan = z.infer<typeof UserPlanEnum>

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  plan: UserPlanEnum.default('free'),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  plan: UserPlanEnum.default('free'),
})

export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
