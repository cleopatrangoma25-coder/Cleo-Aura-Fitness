import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'
import { MemoryRouter } from 'react-router-dom'
import { TraineeDashboard } from '../features/dashboard/TraineeDashboard'
import { ProfessionalSessions } from '../features/sessions/ProfessionalSessions'

expect.extend(toHaveNoViolations)

// Shared outlet context mock so pages think a user is signed in
const { mockOutletContext } = vi.hoisted(() => ({
  mockOutletContext: vi.fn(() => ({
    user: { uid: 'u-123', email: 'test@example.com', displayName: 'Test User' },
    profile: { uid: 'u-123', displayName: 'Test User', role: 'trainee', plan: 'pro' },
  })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useOutletContext: mockOutletContext,
    useNavigate: () => vi.fn(),
  }
})

vi.mock('../features/workouts/useWorkouts', () => ({
  useWorkouts: () => ({
    workouts: [
      {
        id: 'w1',
        date: '2026-02-10',
        intensity: 'moderate',
        primaryMuscleGroups: ['back'],
        secondaryMuscleGroups: [],
      },
    ],
    loading: false,
  }),
}))

vi.mock('../features/recovery/useRecovery', () => ({
  useRecovery: () => ({
    entries: [{ id: 'r1', date: '2026-02-09', readiness: 7, fatigue: 3 }],
    loading: false,
  }),
}))

vi.mock('../features/progress/useProgressMeasurements', () => ({
  useProgressMeasurements: () => ({
    entries: [
      {
        date: '2026-02-08',
        bodyWeightKg: 70,
        squat1RmKg: 120,
        bench1RmKg: 90,
        deadlift1RmKg: 150,
      },
      {
        date: '2026-02-12',
        bodyWeightKg: 71,
        squat1RmKg: 122,
        bench1RmKg: 92,
        deadlift1RmKg: 152,
      },
    ],
    loading: false,
  }),
}))

vi.mock('../features/wearables/useWearablesSummary', () => ({
  useWearablesSummary: () => ({
    entries: [{ date: '2026-02-12', steps: 8000, workoutMinutes: 45, sleepHours: 8 }],
    loading: false,
  }),
}))

vi.mock('../features/timeline/useTimeline', () => ({
  useTimeline: () => [
    { type: 'workout', data: { id: 't1', title: 'Workout' } },
    { type: 'recovery', data: { id: 't2', title: 'Recovery' } },
  ],
}))

vi.mock('../features/timeline/TimelineEntry', () => ({
  TimelineEntry: ({ entry }: { entry: { data: { id: string } } }) => (
    <div data-testid="timeline-entry">{entry.data.id}</div>
  ),
}))

vi.mock('../features/team/useProfessionalClients', () => ({
  useProfessionalClients: () => ({
    clients: [
      {
        traineeId: 'client-1',
        active: true,
        modules: {
          workouts: true,
          recovery: true,
          wearables: false,
          nutrition: false,
          wellbeing: false,
        },
      },
    ],
    summary: {
      activeClients: 1,
      workoutClients: 1,
      recoveryClients: 1,
      wearablesClients: 0,
      nutritionClients: 0,
      wellbeingClients: 0,
    },
    loading: false,
    error: null,
  }),
}))

vi.mock('../features/sessions/useSessions', () => ({
  useSessions: (scope: string) => ({
    sessions: [
      {
        id: 'sess-1',
        title: scope === 'upcoming' ? 'Upcoming Session' : 'Default Session',
        description: 'Great for form checks.',
        audience: 'trainee',
        createdByRole: 'trainer',
        createdByName: 'Coach Kay',
        createdByUid: 'pro-123',
        isDefault: scope !== 'upcoming',
        scheduledAt: { toDate: () => new Date('2026-02-20T12:00:00Z') },
      },
    ],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../features/sessions/useSessionEnrollments', () => ({
  useSessionEnrollments: () => ({
    enrollments: [],
    loading: false,
    error: null,
    savingId: null,
    enroll: vi.fn(),
    cancel: vi.fn(),
  }),
}))

vi.mock('../providers/ServiceProvider', () => ({
  useServices: () => ({
    session: { create: vi.fn() },
  }),
}))

describe('A11y smoke checks', () => {
  it('Trainee dashboard has no axe violations', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <TraineeDashboard />
        </MemoryRouter>
      </QueryClientProvider>
    )

    const results = await axe(container, {
      rules: { region: { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })

  it('Professional sessions page has no axe violations', async () => {
    mockOutletContext.mockReturnValueOnce({
      user: { uid: 'pro-123', email: 'coach@example.com', displayName: 'Coach Kay' },
      profile: { uid: 'pro-123', displayName: 'Coach Kay', role: 'trainer', plan: 'pro' },
    })

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { container } = render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ProfessionalSessions />
        </MemoryRouter>
      </QueryClientProvider>
    )

    const results = await axe(container, {
      rules: { region: { enabled: false } },
    })
    expect(results).toHaveNoViolations()
  })
})
