import { Link, useOutletContext } from 'react-router-dom'
import { MUSCLE_GROUP_LABELS } from '@repo/shared'
import { Card } from '@repo/ui/Card'
import type { User } from 'firebase/auth'
import { useWorkouts } from '../workouts/useWorkouts'
import { useRecovery } from '../recovery/useRecovery'
import { useTimeline } from '../timeline/useTimeline'
import { TimelineEntry } from '../timeline/TimelineEntry'
import { useProfessionalClients } from '../team/useProfessionalClients'
import { useProgressMeasurements } from '../progress/useProgressMeasurements'
import { useWearablesSummary } from '../wearables/useWearablesSummary'
import { useSessions } from '../sessions/useSessions'

type UserRole = 'trainee' | 'trainer' | 'nutritionist' | 'counsellor'

type AppContext = {
  user: User
  profile: { uid: string; displayName: string; role: UserRole | null; plan: 'free' | 'pro' }
}

const ROLE_COPY: Record<UserRole, string> = {
  trainee: 'Track workouts, recovery, nutrition, and wellbeing in one place.',
  trainer: 'Monitor shared training load, recovery patterns, and progress trends.',
  nutritionist: 'Review shared meal habits, hydration, and qualitative notes.',
  counsellor: 'Review shared mood, stress, sleep, and wellbeing patterns.',
}

const PROFESSIONAL_ROLE_LABELS: Record<Exclude<UserRole, 'trainee'>, string> = {
  trainer: 'Trainer',
  nutritionist: 'Nutritionist',
  counsellor: 'Counsellor',
}

const PROFESSIONAL_ROLE_THEME: Record<
  Exclude<UserRole, 'trainee'>,
  {
    accentText: string
    accentStrong: string
    border: string
    borderStrong: string
    borderAccent: string
    surface: string
    surfaceSoft: string
    chip: string
    button: string
    gradient: string
  }
> = {
  trainer: {
    accentText: 'text-amber-700',
    accentStrong: 'text-amber-900',
    border: 'border-amber-200',
    borderStrong: 'border-amber-300',
    borderAccent: 'border-l-amber-400',
    surface: 'bg-amber-50',
    surfaceSoft: 'bg-amber-50/60',
    chip: 'bg-amber-100 text-amber-800 border-amber-200',
    button: 'border-amber-300 text-amber-900 hover:bg-amber-50',
    gradient: 'from-amber-50 via-amber-100/50 to-white',
  },
  nutritionist: {
    accentText: 'text-emerald-700',
    accentStrong: 'text-emerald-900',
    border: 'border-emerald-200',
    borderStrong: 'border-emerald-300',
    borderAccent: 'border-l-emerald-400',
    surface: 'bg-emerald-50',
    surfaceSoft: 'bg-emerald-50/60',
    chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    button: 'border-emerald-300 text-emerald-900 hover:bg-emerald-50',
    gradient: 'from-emerald-50 via-emerald-100/40 to-white',
  },
  counsellor: {
    accentText: 'text-sky-700',
    accentStrong: 'text-sky-900',
    border: 'border-sky-200',
    borderStrong: 'border-sky-300',
    borderAccent: 'border-l-sky-400',
    surface: 'bg-sky-50',
    surfaceSoft: 'bg-sky-50/60',
    chip: 'bg-sky-100 text-sky-800 border-sky-200',
    button: 'border-sky-300 text-sky-900 hover:bg-sky-50',
    gradient: 'from-sky-50 via-sky-100/40 to-white',
  },
}

export function TraineeDashboard() {
  const { user, profile } = useOutletContext<AppContext>()
  const isTrainee = profile.role === 'trainee'
  const hasProPlan = profile.plan === 'pro'
  const isProfessional =
    profile.role === 'trainer' || profile.role === 'nutritionist' || profile.role === 'counsellor'
  const professionalTheme =
    profile.role && profile.role !== 'trainee' ? PROFESSIONAL_ROLE_THEME[profile.role] : null

  const { workouts, loading: workoutsLoading } = useWorkouts(user.uid, isTrainee)
  const { entries: recovery, loading: recoveryLoading } = useRecovery(user.uid, isTrainee)
  const { entries: progressEntries, loading: progressLoading } = useProgressMeasurements(
    user.uid,
    isTrainee
  )
  const { entries: wearableEntries, loading: wearablesLoading } = useWearablesSummary(
    user.uid,
    isTrainee
  )
  const timeline = useTimeline(workouts, recovery)

  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    summary,
  } = useProfessionalClients(user.uid, isProfessional)
  const { sessions, loading: sessionsLoading, error: sessionsError } = useSessions('upcoming')
  const activeClients = clients.filter(client => client.active)
  const roleFocusedClientsList = activeClients.filter(client => {
    if (profile.role === 'trainer') {
      return client.modules.workouts || client.modules.recovery || client.modules.wearables
    }
    if (profile.role === 'nutritionist') {
      return client.modules.nutrition
    }
    if (profile.role === 'counsellor') {
      return client.modules.wellbeing || client.modules.wearables
    }
    return false
  })
  const roleFocusedClients = roleFocusedClientsList.length
  const roleMissingAccess = summary.activeClients - roleFocusedClients

  const recentEntries = timeline.slice(0, 5)
  const loading = workoutsLoading || recoveryLoading
  const latestWearable = wearableEntries[0] ?? null

  const traineeInsights = (() => {
    const last28Cutoff = new Date()
    last28Cutoff.setDate(last28Cutoff.getDate() - 27)
    const last28Workouts = workouts.filter(
      workout => new Date(workout.date + 'T00:00:00') >= last28Cutoff
    )

    const intenseWorkouts = workouts.filter(workout => workout.intensity === 'intense').length
    const recoveryCount = recovery.length
    const recoveryVsIntensity =
      intenseWorkouts > 0 ? Number((recoveryCount / intenseWorkouts).toFixed(2)) : 0

    const muscleLoad = new Map<string, number>()
    for (const workout of workouts) {
      for (const group of workout.primaryMuscleGroups) {
        muscleLoad.set(group, (muscleLoad.get(group) ?? 0) + 2)
      }
      for (const group of workout.secondaryMuscleGroups) {
        muscleLoad.set(group, (muscleLoad.get(group) ?? 0) + 1)
      }
    }
    const rankedMuscles = Array.from(muscleLoad.entries()).sort((a, b) => b[1] - a[1])

    const recentProgress = [...progressEntries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-2)
    const latest = recentProgress.length > 0 ? recentProgress[recentProgress.length - 1] : null
    const previous = recentProgress.length > 1 ? recentProgress[recentProgress.length - 2] : null

    const strengthTotal = (entry: typeof latest) => {
      if (!entry) return null
      return [entry.squat1RmKg, entry.bench1RmKg, entry.deadlift1RmKg]
        .filter(value => typeof value === 'number')
        .reduce((sum, value) => sum + (value ?? 0), 0)
    }

    const latestStrength = strengthTotal(latest)
    const previousStrength = strengthTotal(previous)

    return {
      workoutsPerWeek: Number((last28Workouts.length / 4).toFixed(1)),
      recoveryVsIntensity,
      topMuscles: rankedMuscles.slice(0, 3),
      weakestMuscles: rankedMuscles.slice(-3).reverse(),
      strengthDelta:
        latestStrength !== null && previousStrength !== null
          ? Number((latestStrength - previousStrength).toFixed(1))
          : null,
      weightDelta:
        latest?.bodyWeightKg !== null &&
        latest?.bodyWeightKg !== undefined &&
        previous?.bodyWeightKg !== null &&
        previous?.bodyWeightKg !== undefined
          ? Number((latest.bodyWeightKg - previous.bodyWeightKg).toFixed(1))
          : null,
      progressCount: progressEntries.length,
    }
  })()

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="text-xl font-semibold">
          Welcome back{profile.displayName ? `, ${profile.displayName}` : ''}
        </h2>
        {profile.role ? (
          <p className="mt-1 text-sm text-slate-600">{ROLE_COPY[profile.role]}</p>
        ) : null}
      </Card>

      {isTrainee ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              className="rounded-xl border bg-emerald-50 p-5 shadow-sm transition-colors hover:bg-emerald-100"
              to="/app/workouts/new"
            >
              <h3 className="text-lg font-semibold text-emerald-800">Log Workout</h3>
              <p className="mt-1 text-sm text-emerald-600">
                Track training with muscle group tagging.
              </p>
            </Link>
            <Link
              className="rounded-xl border bg-violet-50 p-5 shadow-sm transition-colors hover:bg-violet-100"
              to="/app/recovery/new"
            >
              <h3 className="text-lg font-semibold text-violet-800">Log Recovery</h3>
              <p className="mt-1 text-sm text-violet-600">Rest days are part of your progress.</p>
            </Link>
            <Link
              className="rounded-xl border bg-sky-50 p-5 shadow-sm transition-colors hover:bg-sky-100"
              to="/app/check-in"
            >
              <h3 className="text-lg font-semibold text-sky-800">Daily Check-In</h3>
              <p className="mt-1 text-sm text-sky-600">
                Nutrition and wellbeing in one quick flow.
              </p>
            </Link>
            <Link
              className="rounded-xl border bg-amber-50 p-5 shadow-sm transition-colors hover:bg-amber-100"
              to="/app/progress/new"
            >
              <h3 className="text-lg font-semibold text-amber-800">Log Progress</h3>
              <p className="mt-1 text-sm text-amber-600">Body metrics and strength snapshots.</p>
            </Link>
          </div>

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Upcoming coach sessions</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Sessions posted by trainers and nutritionists.
                </p>
              </div>
            </div>
            {sessionsLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading sessions...</p>
            ) : sessionsError ? (
              <p className="mt-2 text-sm text-red-600">{sessionsError}</p>
            ) : sessions.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No sessions have been posted yet.</p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {sessions
                  .filter(session => session.audience === 'all' || session.audience === 'trainee')
                  .slice(0, 4)
                  .map(session => (
                    <article className="rounded border bg-slate-50 p-3" key={session.id}>
                      <p className="text-sm font-semibold text-slate-900">{session.title}</p>
                      <p className="mt-1 text-sm text-slate-600 line-clamp-3">
                        {session.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        When: {session.scheduledAt?.toDate().toLocaleString() ?? 'TBD'}
                      </p>
                      <p className="text-xs text-slate-500">
                        By: {session.createdByName} ({session.createdByRole})
                      </p>
                    </article>
                  ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold">Progress Analytics</h3>
            <p className="mt-1 text-sm text-slate-600">
              Early milestone insights based on workouts, recovery, and measurements.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <article className="rounded border bg-slate-50 p-3">
                <p className="text-2xl font-semibold">{traineeInsights.workoutsPerWeek}</p>
                <p className="text-xs text-slate-600">Avg workouts per week (last 4 weeks)</p>
              </article>
              <article className="rounded border bg-slate-50 p-3">
                <p className="text-2xl font-semibold">{traineeInsights.recoveryVsIntensity}</p>
                <p className="text-xs text-slate-600">Recovery-to-intense-workout ratio</p>
              </article>
              <article className="rounded border bg-slate-50 p-3">
                <p className="text-2xl font-semibold">
                  {progressLoading ? '...' : traineeInsights.progressCount}
                </p>
                <p className="text-xs text-slate-600">Progress measurements logged</p>
              </article>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <article className="rounded border p-3">
                <p className="text-sm font-medium text-slate-700">Muscle balance (most trained)</p>
                <p className="mt-1 text-sm text-slate-600">
                  {traineeInsights.topMuscles.length > 0
                    ? traineeInsights.topMuscles
                        .map(
                          ([group, score]) =>
                            `${MUSCLE_GROUP_LABELS[group as keyof typeof MUSCLE_GROUP_LABELS]} (${score})`
                        )
                        .join(', ')
                    : 'No workout muscle tagging yet.'}
                </p>
              </article>
              <article className="rounded border p-3">
                <p className="text-sm font-medium text-slate-700">Muscle balance (least trained)</p>
                <p className="mt-1 text-sm text-slate-600">
                  {traineeInsights.weakestMuscles.length > 0
                    ? traineeInsights.weakestMuscles
                        .map(
                          ([group, score]) =>
                            `${MUSCLE_GROUP_LABELS[group as keyof typeof MUSCLE_GROUP_LABELS]} (${score})`
                        )
                        .join(', ')
                    : 'No workout muscle tagging yet.'}
                </p>
              </article>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <article className="rounded border p-3">
                <p className="text-sm font-medium text-slate-700">
                  Strength trend (latest vs previous)
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {traineeInsights.strengthDelta === null
                    ? 'Log at least two strength-based progress entries.'
                    : `${traineeInsights.strengthDelta > 0 ? '+' : ''}${traineeInsights.strengthDelta} kg total (Squat + Bench + Deadlift)`}
                </p>
              </article>
              <article className="rounded border p-3">
                <p className="text-sm font-medium text-slate-700">
                  Bodyweight trend (latest vs previous)
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {traineeInsights.weightDelta === null
                    ? 'Log at least two bodyweight entries.'
                    : `${traineeInsights.weightDelta > 0 ? '+' : ''}${traineeInsights.weightDelta} kg`}
                </p>
              </article>
            </div>
          </Card>

          {hasProPlan ? (
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Wearable Summary</h3>
                <Link
                  className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
                  to="/app/wearables/new"
                >
                  Log Wearable Day
                </Link>
              </div>
              {wearablesLoading ? (
                <p className="mt-2 text-sm text-slate-500">Loading wearable summary...</p>
              ) : latestWearable ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <article className="rounded border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="font-semibold">{latestWearable.date}</p>
                  </article>
                  <article className="rounded border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Steps</p>
                    <p className="font-semibold">{latestWearable.steps ?? '-'}</p>
                  </article>
                  <article className="rounded border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Workout Minutes</p>
                    <p className="font-semibold">{latestWearable.workoutMinutes ?? '-'}</p>
                  </article>
                  <article className="rounded border bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Sleep Hours</p>
                    <p className="font-semibold">{latestWearable.sleepHours ?? '-'}</p>
                  </article>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  No wearable summaries yet. Add your first daily summary.
                </p>
              )}
            </Card>
          ) : (
            <section className="rounded-xl border bg-amber-50 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-900">Pro features available</h3>
              <p className="mt-1 text-sm text-amber-800">
                Upgrade to Pro to unlock wearable summaries, advanced analytics, and team access
                controls.
              </p>
              <Link
                className="mt-3 inline-block rounded border border-amber-300 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100"
                to="/app/settings"
              >
                Manage plan
              </Link>
            </section>
          )}

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
        </>
      ) : null}

      {isProfessional ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <article
              className={`rounded-xl border p-4 shadow-sm ${
                professionalTheme
                  ? `${professionalTheme.surface} ${professionalTheme.border}`
                  : 'bg-white'
              }`}
            >
              <p className="text-2xl font-semibold">{summary.activeClients}</p>
              <p className="text-sm text-slate-600">Active clients</p>
            </article>
            <article
              className={`rounded-xl border p-4 shadow-sm ${
                professionalTheme
                  ? `${professionalTheme.surface} ${professionalTheme.border}`
                  : 'bg-white'
              }`}
            >
              <p className="text-2xl font-semibold">{roleFocusedClients}</p>
              <p className="text-sm text-slate-600">
                {profile.role === 'trainer'
                  ? 'Clients with training access'
                  : profile.role === 'nutritionist'
                    ? 'Clients with nutrition access'
                    : 'Clients with wellbeing access'}
              </p>
            </article>
            <article
              className={`rounded-xl border p-4 shadow-sm ${
                professionalTheme
                  ? `${professionalTheme.surface} ${professionalTheme.border}`
                  : 'bg-white'
              }`}
            >
              <p className="text-2xl font-semibold">{roleMissingAccess}</p>
              <p className="text-sm text-slate-600">Active clients without role module access</p>
            </article>
          </div>

          {profile.role ? (
            <section
              className={`rounded-2xl border p-5 shadow-sm ${
                professionalTheme
                  ? `bg-gradient-to-br ${professionalTheme.gradient} ${professionalTheme.border}`
                  : 'bg-white'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {PROFESSIONAL_ROLE_LABELS[profile.role as Exclude<UserRole, 'trainee'>]} focus
                    overview
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Snapshot of access granted to your role across connected clients.
                  </p>
                </div>
                {professionalTheme ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${professionalTheme.chip}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${professionalTheme.accentText.replace('text-', 'bg-')}`}
                    />
                    {PROFESSIONAL_ROLE_LABELS[profile.role as Exclude<UserRole, 'trainee'>]} view
                  </span>
                ) : null}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {profile.role === 'trainer' ? (
                  <>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {summary.workoutClients}
                      </p>
                      <p className="text-xs text-slate-600">Clients sharing workouts</p>
                    </article>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {summary.recoveryClients}
                      </p>
                      <p className="text-xs text-slate-600">Clients sharing recovery</p>
                    </article>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {summary.wearablesClients}
                      </p>
                      <p className="text-xs text-slate-600">Clients sharing wearables</p>
                    </article>
                  </>
                ) : null}
                {profile.role === 'nutritionist' ? (
                  <>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {summary.nutritionClients}
                      </p>
                      <p className="text-xs text-slate-600">Clients sharing nutrition</p>
                    </article>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {
                          activeClients.filter(
                            client => client.modules.nutrition && !client.modules.wellbeing
                          ).length
                        }
                      </p>
                      <p className="text-xs text-slate-600">Nutrition-only clients</p>
                    </article>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {roleMissingAccess}
                      </p>
                      <p className="text-xs text-slate-600">Need nutrition permission</p>
                    </article>
                  </>
                ) : null}
                {profile.role === 'counsellor' ? (
                  <>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {summary.wellbeingClients}
                      </p>
                      <p className="text-xs text-slate-600">Clients sharing wellbeing</p>
                    </article>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {
                          activeClients.filter(
                            client => client.modules.wellbeing && !client.modules.nutrition
                          ).length
                        }
                      </p>
                      <p className="text-xs text-slate-600">Wellbeing-only clients</p>
                    </article>
                    <article
                      className={`rounded-lg border p-3 ${
                        professionalTheme
                          ? `${professionalTheme.surfaceSoft} ${professionalTheme.borderStrong}`
                          : ''
                      }`}
                    >
                      <p
                        className={`text-2xl font-semibold ${professionalTheme?.accentStrong ?? ''}`}
                      >
                        {summary.wearablesClients}
                      </p>
                      <p className="text-xs text-slate-600">Clients sharing wearables</p>
                    </article>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}

          <section
            className={`rounded-xl border p-5 shadow-sm ${
              professionalTheme
                ? `${professionalTheme.surfaceSoft} ${professionalTheme.border}`
                : 'bg-white'
            }`}
          >
            <Link
              className={`inline-block rounded border px-3 py-2 text-sm transition ${
                professionalTheme ? professionalTheme.button : 'hover:bg-slate-50'
              }`}
              to="/app/invite"
            >
              Accept New Invite
            </Link>
            <p className="mt-2 text-sm text-slate-600">
              Join trainee teams and start reviewing shared data.
            </p>
          </section>

          <section
            className={`rounded-xl border p-5 shadow-sm ${
              professionalTheme
                ? `${professionalTheme.surfaceSoft} ${professionalTheme.border}`
                : 'bg-white'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">
                {profile.role === 'trainer'
                  ? 'Trainer client workspace'
                  : profile.role === 'nutritionist'
                    ? 'Nutrition client workspace'
                    : 'Counselling client workspace'}
              </h3>
              {professionalTheme ? (
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${professionalTheme.chip}`}
                >
                  Role access
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Open each client to review only the modules they have granted to your role.
            </p>

            {clientsLoading ? (
              <p className="mt-3 text-sm text-slate-500">Loading clients...</p>
            ) : null}
            {clientsError ? <p className="mt-3 text-sm text-red-600">{clientsError}</p> : null}

            {clients.length === 0 && !clientsLoading ? (
              <p className="mt-3 text-sm text-slate-500">
                No connected clients yet. Ask a trainee to share their invite link or code.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {clients.map(client => (
                  <article
                    className={`rounded-lg border p-3 ${
                      professionalTheme ? `border-l-4 ${professionalTheme.borderAccent}` : ''
                    }`}
                    key={client.traineeId}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">Client ID: {client.traineeId}</p>
                        <p className="text-xs text-slate-500">
                          Status: {client.active ? 'Active' : 'Disabled'}
                        </p>
                        {profile.role === 'trainer' ? (
                          <p className="mt-1 text-xs text-slate-600">
                            Workouts: {client.modules.workouts ? 'On' : 'Off'} | Recovery:{' '}
                            {client.modules.recovery ? 'On' : 'Off'} | Wearables:{' '}
                            {client.modules.wearables ? 'On' : 'Off'}
                          </p>
                        ) : null}
                        {profile.role === 'nutritionist' ? (
                          <p className="mt-1 text-xs text-slate-600">
                            Nutrition: {client.modules.nutrition ? 'On' : 'Off'} | Wearables:{' '}
                            {client.modules.wearables ? 'On' : 'Off'}
                          </p>
                        ) : null}
                        {profile.role === 'counsellor' ? (
                          <p className="mt-1 text-xs text-slate-600">
                            Wellbeing: {client.modules.wellbeing ? 'On' : 'Off'} | Wearables:{' '}
                            {client.modules.wearables ? 'On' : 'Off'}
                          </p>
                        ) : null}
                      </div>
                      <Link
                        className={`rounded border px-3 py-1.5 text-sm transition ${
                          professionalTheme ? professionalTheme.button : 'hover:bg-slate-50'
                        }`}
                        to={`/app/client/${client.traineeId}`}
                      >
                        Open Client View
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
