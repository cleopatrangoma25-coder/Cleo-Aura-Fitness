import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { MUSCLE_GROUP_LABELS, type ModulePermissions } from '@repo/shared'
import { db } from '../../lib/firebase'
import { useWorkouts } from '../workouts/useWorkouts'
import { useRecovery } from '../recovery/useRecovery'
import { useNutritionDays } from '../nutrition/useNutritionDays'
import { useWellbeingDays } from '../wellbeing/useWellbeingDays'
import { WorkoutCard } from '../workouts/WorkoutCard'
import { RecoveryCard } from '../recovery/RecoveryCard'
import { buildTrainerMuscleInsights, countDigestionNotes, isWithinLastDays } from './insightsUtils'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

const EMPTY_PERMISSIONS: ModulePermissions = {
  workouts: false,
  recovery: false,
  nutrition: false,
  wellbeing: false,
  progress: false,
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
}

export function ProfessionalClientView() {
  const { user, profile } = useOutletContext<AppContext>()
  const { traineeId = '' } = useParams()
  const [permissions, setPermissions] = useState<ModulePermissions>(EMPTY_PERMISSIONS)
  const [grantActive, setGrantActive] = useState(false)
  const [loadingGrant, setLoadingGrant] = useState(true)
  const [grantError, setGrantError] = useState<string | null>(null)

  const workoutsAllowed = grantActive && permissions.workouts
  const recoveryAllowed = grantActive && permissions.recovery
  const nutritionAllowed = grantActive && permissions.nutrition
  const wellbeingAllowed = grantActive && permissions.wellbeing

  const workoutsState = useWorkouts(traineeId, workoutsAllowed)
  const recoveryState = useRecovery(traineeId, recoveryAllowed)
  const nutritionState = useNutritionDays(traineeId, nutritionAllowed)
  const wellbeingState = useWellbeingDays(traineeId, wellbeingAllowed)

  useEffect(() => {
    async function bootstrapGrant() {
      setLoadingGrant(true)
      setGrantError(null)

      try {
        const grantSnapshot = await getDoc(doc(db, 'trainees', traineeId, 'grants', user.uid))

        if (!grantSnapshot.exists()) {
          setGrantActive(false)
          setPermissions(EMPTY_PERMISSIONS)
          return
        }

        const data = grantSnapshot.data() as {
          active?: boolean
          modules?: Partial<ModulePermissions>
        }

        setGrantActive(Boolean(data.active))
        setPermissions({
          workouts: Boolean(data.modules?.workouts),
          recovery: Boolean(data.modules?.recovery),
          nutrition: Boolean(data.modules?.nutrition),
          wellbeing: Boolean(data.modules?.wellbeing),
          progress: Boolean(data.modules?.progress),
        })
      } catch (caught) {
        setGrantError(caught instanceof Error ? caught.message : 'Failed to load grant.')
      } finally {
        setLoadingGrant(false)
      }
    }

    if (!traineeId) {
      setLoadingGrant(false)
      setGrantError('Missing trainee id.')
      return
    }

    void bootstrapGrant()
  }, [traineeId, user.uid])

  const isProfessional = useMemo(() => {
    return profile.role === 'trainer' || profile.role === 'nutritionist' || profile.role === 'counsellor'
  }, [profile.role])

  const trainerInsights = useMemo(() => {
    const { recentWorkouts, topMuscles, heatmap } = buildTrainerMuscleInsights(workoutsState.workouts, 14)
    const recentRecovery = recoveryState.entries.filter(entry => isWithinLastDays(entry.date, 14))

    return {
      recentWorkouts: recentWorkouts.length,
      recentRecovery: recentRecovery.length,
      topMuscles,
      heatmap,
    }
  }, [recoveryState.entries, workoutsState.workouts])

  const nutritionInsights = useMemo(() => {
    const recentNutrition = nutritionState.entries.filter(entry => isWithinLastDays(entry.date, 14))
    const onTrackCount = recentNutrition.filter(entry => entry.mealsOnTrack).length

    const hydrationCounts = recentNutrition.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.hydration] = (acc[entry.hydration] ?? 0) + 1
      return acc
    }, {})

    const dominantHydration =
      Object.entries(hydrationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none'

    const avgEnergy = average(
      wellbeingAllowed
        ? wellbeingState.entries
            .filter(entry => isWithinLastDays(entry.date, 14))
            .map(entry => entry.energy)
        : []
    )

    return {
      totalCheckIns: recentNutrition.length,
      onTrackRate: recentNutrition.length > 0 ? Math.round((onTrackCount / recentNutrition.length) * 100) : 0,
      dominantHydration,
      digestionNotes: countDigestionNotes(recentNutrition),
      avgEnergy: wellbeingAllowed ? avgEnergy : null,
    }
  }, [nutritionState.entries, wellbeingAllowed, wellbeingState.entries])

  const wellbeingInsights = useMemo(() => {
    const recent = wellbeingState.entries.filter(entry => isWithinLastDays(entry.date, 14))

    const recent7 = recent.filter(entry => isWithinLastDays(entry.date, 7))
    const previous7 = recent.filter(
      entry => !isWithinLastDays(entry.date, 7) && isWithinLastDays(entry.date, 14)
    )

    const moodSeries = recent
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(entry => ({ date: entry.date, mood: entry.mood, stress: entry.stress, sleep: entry.sleepQuality }))

    return {
      moodAverage: average(recent.map(entry => entry.mood)),
      stressAverage: average(recent.map(entry => entry.stress)),
      sleepAverage: average(recent.map(entry => entry.sleepQuality)),
      moodTrend:
        average(recent7.map(entry => entry.mood)) - average(previous7.map(entry => entry.mood)),
      stressTrend:
        average(recent7.map(entry => entry.stress)) - average(previous7.map(entry => entry.stress)),
      sleepTrend:
        average(recent7.map(entry => entry.sleepQuality)) - average(previous7.map(entry => entry.sleepQuality)),
      moodSeries,
    }
  }, [wellbeingState.entries])

  if (!isProfessional) {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Client access restricted</h2>
        <p className="mt-2 text-sm text-slate-600">Only professional accounts can view shared client data.</p>
      </section>
    )
  }

  if (loadingGrant) {
    return <p className="text-sm text-slate-600">Loading client access...</p>
  }

  if (grantError) {
    return <p className="text-sm text-red-600">{grantError}</p>
  }

  if (!grantActive) {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">No active access</h2>
        <p className="mt-2 text-sm text-slate-600">
          This trainee has not granted active access, or access was revoked.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <header className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Client {traineeId}&apos;s shared data</h2>
        <p className="mt-1 text-sm text-slate-600">Read-only view based on module permissions.</p>
      </header>

      {profile.role === 'trainer' && (workoutsAllowed || recoveryAllowed) ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Trainer insights (last 14 days)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">{trainerInsights.recentWorkouts}</p>
              <p className="text-xs text-slate-600">Workouts logged</p>
            </article>
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">{trainerInsights.recentRecovery}</p>
              <p className="text-xs text-slate-600">Recovery entries</p>
            </article>
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">
                {trainerInsights.recentWorkouts > 0
                  ? (trainerInsights.recentRecovery / trainerInsights.recentWorkouts).toFixed(2)
                  : '0.00'}
              </p>
              <p className="text-xs text-slate-600">Recovery-to-workout ratio</p>
            </article>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Top muscle focus:{' '}
            {trainerInsights.topMuscles.length > 0
              ? trainerInsights.topMuscles
                  .map(([muscle, count]) => `${MUSCLE_GROUP_LABELS[muscle as keyof typeof MUSCLE_GROUP_LABELS]} (${count})`)
                  .join(', ')
              : 'No tagged workouts yet.'}
          </p>
          <div className="mt-4 rounded-lg border p-3">
            <p className="text-sm font-medium text-slate-700">Muscle group heatmap (last 14 days)</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {trainerInsights.heatmap.map(item => (
                <article className="rounded border p-2" key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-100">
                    <div
                      className="h-2 rounded bg-amber-400"
                      style={{ width: `${item.count === 0 ? 0 : Math.max(6, Math.round(item.ratio * 100))}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {profile.role === 'nutritionist' && nutritionAllowed ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Nutrition insights (last 14 days)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">{nutritionInsights.totalCheckIns}</p>
              <p className="text-xs text-slate-600">Check-ins logged</p>
            </article>
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">{nutritionInsights.onTrackRate}%</p>
              <p className="text-xs text-slate-600">Meals on-track rate</p>
            </article>
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold capitalize">{nutritionInsights.dominantHydration}</p>
              <p className="text-xs text-slate-600">Most common hydration status</p>
            </article>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <article className="rounded border p-3">
              <p className="text-sm font-medium text-slate-700">Energy signal</p>
              <p className="mt-1 text-sm text-slate-600">
                {nutritionInsights.avgEnergy === null
                  ? 'Enable wellbeing module to include energy trend.'
                  : `Average energy is ${nutritionInsights.avgEnergy}/5 over the last 14 days.`}
              </p>
            </article>
            <article className="rounded border p-3">
              <p className="text-sm font-medium text-slate-700">Digestion-related notes</p>
              <p className="mt-1 text-sm text-slate-600">
                {nutritionInsights.digestionNotes > 0
                  ? `${nutritionInsights.digestionNotes} note(s) mention digestion patterns.`
                  : 'No digestion keywords found in recent notes.'}
              </p>
            </article>
          </div>
        </section>
      ) : null}

      {profile.role === 'counsellor' && wellbeingAllowed ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Wellbeing insights (last 14 days)</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">{wellbeingInsights.moodAverage}</p>
              <p className="text-xs text-slate-600">Avg mood</p>
            </article>
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">{wellbeingInsights.stressAverage}</p>
              <p className="text-xs text-slate-600">Avg stress</p>
            </article>
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">{wellbeingInsights.sleepAverage}</p>
              <p className="text-xs text-slate-600">Avg sleep quality</p>
            </article>
            <article className="rounded border p-3">
              <p className="text-2xl font-semibold">
                {wellbeingInsights.moodTrend > 0 ? '+' : ''}
                {wellbeingInsights.moodTrend.toFixed(1)}
              </p>
              <p className="text-xs text-slate-600">Mood trend (7d vs prior 7d)</p>
            </article>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <article className="rounded border p-3">
              <p className="text-sm font-medium text-slate-700">Stress trend (7d vs prior 7d)</p>
              <p className="mt-1 text-sm text-slate-600">
                {wellbeingInsights.stressTrend > 0 ? '+' : ''}
                {wellbeingInsights.stressTrend.toFixed(1)}
              </p>
            </article>
            <article className="rounded border p-3">
              <p className="text-sm font-medium text-slate-700">Sleep trend (7d vs prior 7d)</p>
              <p className="mt-1 text-sm text-slate-600">
                {wellbeingInsights.sleepTrend > 0 ? '+' : ''}
                {wellbeingInsights.sleepTrend.toFixed(1)}
              </p>
            </article>
          </div>
          <div className="mt-3 rounded border p-3">
            <p className="text-sm font-medium text-slate-700">Mood trendline (recent)</p>
            <div className="mt-2 flex items-end gap-1">
              {wellbeingInsights.moodSeries.slice(-10).map(point => (
                <div className="flex flex-col items-center" key={point.date}>
                  <div className="w-4 rounded-t bg-sky-400" style={{ height: `${point.mood * 12}px` }} />
                  <span className="mt-1 text-[10px] text-slate-500">{point.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {workoutsAllowed ? (
        <section className="space-y-2">
          <h3 className="text-lg font-semibold">Workouts</h3>
          {workoutsState.error ? <p className="text-sm text-red-600">{workoutsState.error}</p> : null}
          {workoutsState.workouts.slice(0, 10).map(workout => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
          {workoutsState.workouts.length === 0 ? (
            <p className="text-sm text-slate-500">No workouts shared yet.</p>
          ) : null}
        </section>
      ) : null}

      {recoveryAllowed ? (
        <section className="space-y-2">
          <h3 className="text-lg font-semibold">Recovery</h3>
          {recoveryState.error ? <p className="text-sm text-red-600">{recoveryState.error}</p> : null}
          {recoveryState.entries.slice(0, 10).map(entry => (
            <RecoveryCard entry={entry} key={entry.id} />
          ))}
          {recoveryState.entries.length === 0 ? (
            <p className="text-sm text-slate-500">No recovery entries shared yet.</p>
          ) : null}
        </section>
      ) : null}

      {nutritionAllowed ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Nutrition</h3>
          {nutritionState.error ? <p className="text-sm text-red-600">{nutritionState.error}</p> : null}
          <div className="mt-2 space-y-2">
            {nutritionState.entries.slice(0, 10).map(entry => (
              <article className="rounded border p-3 text-sm" key={entry.id}>
                <p className="font-medium">{entry.date}</p>
                <p className="text-slate-600">
                  Meals on track: {entry.mealsOnTrack ? 'Yes' : 'No'} · Quality: {entry.mealQuality} ·
                  Hydration: {entry.hydration}
                </p>
                {entry.notes ? <p className="mt-1 italic text-slate-500">&quot;{entry.notes}&quot;</p> : null}
              </article>
            ))}
            {nutritionState.entries.length === 0 ? (
              <p className="text-sm text-slate-500">No nutrition entries shared yet.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {wellbeingAllowed ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Wellbeing</h3>
          {wellbeingState.error ? <p className="text-sm text-red-600">{wellbeingState.error}</p> : null}
          <div className="mt-2 space-y-2">
            {wellbeingState.entries.slice(0, 10).map(entry => (
              <article className="rounded border p-3 text-sm" key={entry.id}>
                <p className="font-medium">{entry.date}</p>
                <p className="text-slate-600">
                  Mood {entry.mood}/5 · Stress {entry.stress}/5 · Energy {entry.energy}/5 · Sleep{' '}
                  {entry.sleepQuality}/5
                </p>
                {entry.notes ? <p className="mt-1 italic text-slate-500">&quot;{entry.notes}&quot;</p> : null}
              </article>
            ))}
            {wellbeingState.entries.length === 0 ? (
              <p className="text-sm text-slate-500">No wellbeing entries shared yet.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {!workoutsAllowed && !recoveryAllowed && !nutritionAllowed && !wellbeingAllowed ? (
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-600">
            No modules are enabled yet. Ask the trainee to enable permissions in Team settings.
          </p>
          <Link className="mt-3 inline-block rounded border px-3 py-2 text-sm" to="/app/invite">
            Open invite page
          </Link>
        </section>
      ) : null}
    </section>
  )
}
