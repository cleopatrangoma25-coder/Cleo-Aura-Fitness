import { z } from 'zod'

export const sessionDraftSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  audience: z.enum(['trainee', 'trainer', 'nutritionist', 'counsellor', 'all']),
  scheduledAt: z.date(),
  createdByUid: z.string().min(1),
  createdByRole: z.enum(['trainer', 'nutritionist', 'counsellor']),
  createdByName: z.string().min(1),
  isDefault: z.boolean().optional(),
})

export type SessionDraftSchema = z.infer<typeof sessionDraftSchema>
