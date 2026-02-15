export const queryKeys = {
  workouts: (id: string) => ['trainees', id, 'workouts'] as const,
  recovery: (id: string) => ['trainees', id, 'recovery'] as const,
  nutrition: (id: string) => ['trainees', id, 'nutritionDays'] as const,
  wellbeing: (id: string) => ['trainees', id, 'wellbeingDays'] as const,
  progress: (id: string) => ['trainees', id, 'progressMeasurements'] as const,
  wearables: (id: string) => ['trainees', id, 'wearablesSummary'] as const,
  proClients: (id: string) => ['professional', id, 'clients'] as const,
  teamAccess: (id: string) => ['trainees', id, 'teamAccess'] as const,
}
