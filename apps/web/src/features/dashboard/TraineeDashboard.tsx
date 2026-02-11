import { Link, useOutletContext } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { useWorkouts } from '../workouts/useWorkouts'
import { useRecovery } from '../recovery/useRecovery'
import { useTimeline } from '../timeline/useTimeline'
import { TimelineEntry } from '../timeline/TimelineEntry'

type UserRole = 'trainee' | 'trainer' | 'nutritionist' | 'counsellor'

type AppContext = {
  user: User
  profile: { uid: string; displayName: string; role: UserRole | null }
}

const ROLE_COPY: Record<UserRole, string> = {
  trainee: 'Log your fitness and wellbeing in one place.',
  trainer: 'Review trainee training and recovery trends.',
  nutritionist: 'Review nutrition habits and energy patterns.',
  counsellor: 'Review mood, stress, and sleep trends.',
}

export function TraineeDashboard() {
  const { user, profile } = useOutletContext<AppContext>()
  const { workouts, loading: workoutsLoading } = useWorkouts(user.uid)
  const { entries: recovery, loading: recoveryLoading } = useRecovery(user.uid)
  const timeline = useTimeline(workouts, recovery)

  const recentEntries = timeline.slice(0, 5)
  const loading = workoutsLoading || recoveryLoading

  return (
    <div className="space-y-5">
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">
          Welcome back{profile.displayName ? `, ${profile.displayName}` : ''}
        </h2>
        {profile.role ? (
          <p className="mt-1 text-sm text-slate-600">{ROLE_COPY[profile.role]}</p>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          className="rounded-xl border bg-emerald-50 p-5 shadow-sm transition-colors hover:bg-emerald-100"
          to="/app/workouts/new"
        >
          <h3 className="text-lg font-semibold text-emerald-800">Log Workout</h3>
          <p className="mt-1 text-sm text-emerald-600">
            Track your training with muscle group tagging.
          </p>
        </Link>
        <Link
          className="rounded-xl border bg-violet-50 p-5 shadow-sm transition-colors hover:bg-violet-100"
          to="/app/recovery/new"
        >
          <h3 className="text-lg font-semibold text-violet-800">Log Recovery</h3>
          <p className="mt-1 text-sm text-violet-600">Rest days are part of your progress.</p>
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          {timeline.length > 0 ? (
            <Link className="text-sm text-emerald-600 hover:underline" to="/app/history">
              View all
            </Link>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : recentEntries.length === 0 ? (
          <p className="text-sm text-slate-500">
            No activity yet. Start by logging your first workout or recovery session.
          </p>
        ) : (
          recentEntries.map(entry => <TimelineEntry entry={entry} key={entry.data.id} />)
        )}
      </section>
    </div>
  )
}
