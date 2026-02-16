import { z } from 'zod'

export const enrollmentSchema = z.object({
  sessionId: z.string().min(1),
  traineeId: z.string().min(1),
})

export type EnrollmentSchema = z.infer<typeof enrollmentSchema>
