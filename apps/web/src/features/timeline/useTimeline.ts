import { useMemo } from 'react'
import type { Workout, Recovery } from '@repo/shared'

export type TimelineEntry =
  | { kind: 'workout'; data: Workout }
  | { kind: 'recovery'; data: Recovery }

export function useTimeline(workouts: Workout[], recovery: Recovery[]): TimelineEntry[] {
  return useMemo(() => {
    const entries: TimelineEntry[] = [
      ...workouts.map(w => ({ kind: 'workout' as const, data: w })),
      ...recovery.map(r => ({ kind: 'recovery' as const, data: r })),
    ]
    entries.sort((a, b) => b.data.date.localeCompare(a.data.date))
    return entries
  }, [workouts, recovery])
}
