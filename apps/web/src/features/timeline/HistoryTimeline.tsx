import { useOutletContext } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { useWorkouts } from '../workouts/useWorkouts'
import { useRecovery } from '../recovery/useRecovery'
import { useTimeline } from './useTimeline'
import { TimelineEntry } from './TimelineEntry'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

function formatDateHeading(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]

  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'

  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function HistoryTimeline() {
  const { user } = useOutletContext<AppContext>()
  const { workouts, loading: workoutsLoading, error: workoutsError } = useWorkouts(user.uid)
  const {
    entries: recovery,
    loading: recoveryLoading,
    error: recoveryError,
  } = useRecovery(user.uid)
  const timeline = useTimeline(workouts, recovery)

  const loading = workoutsLoading || recoveryLoading
  const error = workoutsError ?? recoveryError

  if (loading) {
    return <p className="text-center text-sm text-slate-600">Loading your activity...</p>
  }

  if (error) {
    return <p className="text-center text-sm text-red-600">{error}</p>
  }

  if (timeline.length === 0) {
    return (
      <section className="rounded-xl border bg-white p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold">Your journey starts here</h2>
        <p className="mt-2 text-sm text-slate-600">
          Log your first workout or recovery session to begin tracking your progress.
        </p>
      </section>
    )
  }

  const grouped = new Map<string, typeof timeline>()
  for (const entry of timeline) {
    const dateKey = entry.data.date
    const existing = grouped.get(dateKey)
    if (existing) {
      existing.push(entry)
    } else {
      grouped.set(dateKey, [entry])
    }
  }

  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">Activity History</h2>
      {Array.from(grouped.entries()).map(([dateKey, entries]) => (
        <div key={dateKey}>
          <h3 className="mb-2 text-sm font-medium text-slate-500">{formatDateHeading(dateKey)}</h3>
          <div className="space-y-3">
            {entries.map(entry => (
              <TimelineEntry entry={entry} key={entry.data.id} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
