import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { MUSCLE_GROUP_LABELS, type MuscleGroup, type ProgressMeasurement } from '@repo/shared'
import { Button } from '@repo/ui/Button'
import { Card } from '@repo/ui/Card'
import { useProgressMeasurements } from './useProgressMeasurements'
import { useWorkouts } from '../workouts/useWorkouts'
import { useRecovery } from '../recovery/useRecovery'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

type RangeFilter = '30d' | '90d' | 'all'

type TrendPoint = {
  date: string
  label: string
  value: number
}

type WeeklyRollup = {
  weekKey: string
  workouts: number
  intenseWorkouts: number
  recovery: number
  progressEntries: number
  avgWorkoutDuration: number | null
}

function formatWeekKey(date: Date): string {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  copy.setDate(copy.getDate() + 4 - (copy.getDay() || 7))
  const yearStart = new Date(copy.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((copy.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${copy.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function filterDatesByRange<T extends { date: string }>(items: T[], range: RangeFilter): T[] {
  if (range === 'all') return items
  const days = range === '30d' ? 30 : 90
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (days - 1))
  return items.filter(item => new Date(item.date + 'T00:00:00') >= cutoff)
}

function exportCsv(entries: ProgressMeasurement[]): void {
  const headers = [
    'date',
    'bodyWeightKg',
    'bodyFatPct',
    'waistCm',
    'hipsCm',
    'chestCm',
    'thighsCm',
    'armsCm',
    'squat1RmKg',
    'bench1RmKg',
    'deadlift1RmKg',
    'notes',
  ]

  const rows = entries.map(entry =>
    [
      entry.date,
      entry.bodyWeightKg ?? '',
      entry.bodyFatPct ?? '',
      entry.waistCm ?? '',
      entry.hipsCm ?? '',
      entry.chestCm ?? '',
      entry.thighsCm ?? '',
      entry.armsCm ?? '',
      entry.squat1RmKg ?? '',
      entry.bench1RmKg ?? '',
      entry.deadlift1RmKg ?? '',
      `"${(entry.notes ?? '').replace(/"/g, '""')}"`,
    ].join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `progress-analytics-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function averagePerWeek(count: number, weeks: number): number {
  return Number((count / Math.max(1, weeks)).toFixed(1))
}

function estimateWeeks(entries: Array<{ date: string }>): number {
  if (entries.length < 2) return 4
  const sorted = entries.slice().sort((a, b) => a.date.localeCompare(b.date))
  const first = new Date(sorted[0].date + 'T00:00:00')
  const last = new Date(sorted[sorted.length - 1].date + 'T00:00:00')
  const diffDays = Math.max(1, Math.ceil((last.getTime() - first.getTime()) / 86_400_000))
  return Math.max(1, Math.ceil(diffDays / 7))
}

function toTrendPoints(
  entries: ProgressMeasurement[],
  key: keyof ProgressMeasurement
): TrendPoint[] {
  return entries
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter(entry => typeof entry[key] === 'number')
    .map(entry => ({
      date: entry.date,
      label: entry.date.slice(5),
      value: Number(entry[key]),
    }))
}

function pearsonCorrelation(pairs: Array<{ x: number; y: number }>): number | null {
  if (pairs.length < 3) return null

  const xs = pairs.map(pair => pair.x)
  const ys = pairs.map(pair => pair.y)
  const xMean = xs.reduce((sum, value) => sum + value, 0) / xs.length
  const yMean = ys.reduce((sum, value) => sum + value, 0) / ys.length

  let numerator = 0
  let xDen = 0
  let yDen = 0

  for (let index = 0; index < pairs.length; index += 1) {
    const xDiff = xs[index]! - xMean
    const yDiff = ys[index]! - yMean
    numerator += xDiff * yDiff
    xDen += xDiff * xDiff
    yDen += yDiff * yDiff
  }

  if (xDen === 0 || yDen === 0) return null
  return Number((numerator / Math.sqrt(xDen * yDen)).toFixed(2))
}

function LineChart({
  title,
  points,
  stroke,
}: {
  title: string
  points: TrendPoint[]
  stroke: string
}) {
  const width = 360
  const height = 130
  const padding = 14
  const min = Math.min(...points.map(point => point.value), 0)
  const max = Math.max(...points.map(point => point.value), 1)
  const span = max - min || 1

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : padding + (index / (points.length - 1)) * (width - padding * 2)
    const y = height - padding - ((point.value - min) / span) * (height - padding * 2)
    return { ...point, x, y }
  })
  const linePath = coords.map(point => `${point.x},${point.y}`).join(' ')

  return (
    <article className="rounded-lg border bg-white p-3">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {points.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Not enough data yet.</p>
      ) : (
        <>
          <svg className="mt-2 h-[130px] w-full" viewBox={`0 0 ${width} ${height}`}>
            <polyline
              fill="none"
              points={linePath}
              stroke={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {coords.map(point => (
              <circle cx={point.x} cy={point.y} fill={stroke} key={point.date} r="3.5">
                <title>{`${point.date}: ${point.value}`}</title>
              </circle>
            ))}
          </svg>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
            <span>{points[0]?.label}</span>
            <span>{points[points.length - 1]?.label}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Latest: {points[points.length - 1]?.value} | Start: {points[0]?.value}
          </p>
        </>
      )}
    </article>
  )
}

export function ProgressAnalyticsPage() {
  const { user, profile } = useOutletContext<AppContext>()
  const [activeRange, setActiveRange] = useState<RangeFilter>('30d')
  const { entries, loading, error } = useProgressMeasurements(user.uid)
  const { workouts } = useWorkouts(user.uid)
  const { entries: recovery } = useRecovery(user.uid)

  const filteredProgress = useMemo(
    () => filterDatesByRange(entries, activeRange),
    [activeRange, entries]
  )
  const filteredWorkouts = useMemo(
    () => filterDatesByRange(workouts, activeRange),
    [activeRange, workouts]
  )
  const filteredRecovery = useMemo(
    () => filterDatesByRange(recovery, activeRange),
    [activeRange, recovery]
  )
  const sortedProgress = useMemo(
    () => filteredProgress.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [filteredProgress]
  )

  const points = {
    weight: useMemo(() => toTrendPoints(filteredProgress, 'bodyWeightKg'), [filteredProgress]),
    bodyFat: useMemo(() => toTrendPoints(filteredProgress, 'bodyFatPct'), [filteredProgress]),
    squat: useMemo(() => toTrendPoints(filteredProgress, 'squat1RmKg'), [filteredProgress]),
    bench: useMemo(() => toTrendPoints(filteredProgress, 'bench1RmKg'), [filteredProgress]),
    deadlift: useMemo(() => toTrendPoints(filteredProgress, 'deadlift1RmKg'), [filteredProgress]),
  }

  const weeksWindow = useMemo(() => {
    if (activeRange === '30d') return 4
    if (activeRange === '90d') return 12
    return estimateWeeks(filteredWorkouts.length > 0 ? filteredWorkouts : filteredProgress)
  }, [activeRange, filteredProgress, filteredWorkouts])

  const intenseWorkouts = filteredWorkouts.filter(item => item.intensity === 'intense').length
  const avgWorkoutsPerWeek = averagePerWeek(filteredWorkouts.length, weeksWindow)
  const avgRecoveryPerWeek = averagePerWeek(filteredRecovery.length, weeksWindow)
  const recoveryVsIntensity =
    intenseWorkouts > 0 ? Number((filteredRecovery.length / intenseWorkouts).toFixed(2)) : 0

  const weeklyRollups = useMemo(() => {
    const map = new Map<string, WeeklyRollup>()
    const ensure = (date: string) => {
      const key = formatWeekKey(new Date(date + 'T00:00:00'))
      if (!map.has(key)) {
        map.set(key, {
          weekKey: key,
          workouts: 0,
          intenseWorkouts: 0,
          recovery: 0,
          progressEntries: 0,
          avgWorkoutDuration: null,
        })
      }
      return map.get(key)!
    }

    for (const workout of filteredWorkouts) {
      const row = ensure(workout.date)
      row.workouts += 1
      if (workout.intensity === 'intense') row.intenseWorkouts += 1
      if (typeof workout.durationMinutes === 'number') {
        row.avgWorkoutDuration = (row.avgWorkoutDuration ?? 0) + workout.durationMinutes
      }
    }
    for (const item of filteredRecovery) {
      ensure(item.date).recovery += 1
    }
    for (const item of filteredProgress) {
      ensure(item.date).progressEntries += 1
    }

    const durationCounts = new Map<string, number>()
    for (const workout of filteredWorkouts) {
      if (typeof workout.durationMinutes === 'number') {
        const key = formatWeekKey(new Date(workout.date + 'T00:00:00'))
        durationCounts.set(key, (durationCounts.get(key) ?? 0) + 1)
      }
    }

    return Array.from(map.values())
      .map(rollup => ({
        ...rollup,
        avgWorkoutDuration:
          rollup.avgWorkoutDuration === null
            ? null
            : Number(
                (rollup.avgWorkoutDuration / (durationCounts.get(rollup.weekKey) ?? 1)).toFixed(1)
              ),
      }))
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
  }, [filteredProgress, filteredRecovery, filteredWorkouts])

  const muscleBalanceSeries = useMemo(() => {
    const perWeek = new Map<string, Record<MuscleGroup, number>>()
    for (const workout of filteredWorkouts) {
      const key = formatWeekKey(new Date(workout.date + 'T00:00:00'))
      const row = perWeek.get(key) ?? {
        chest: 0,
        back: 0,
        shoulders: 0,
        biceps: 0,
        triceps: 0,
        forearms: 0,
        core: 0,
        glutes: 0,
        quadriceps: 0,
        hamstrings: 0,
        calves: 0,
        hip_flexors: 0,
        full_body: 0,
      }
      for (const group of workout.primaryMuscleGroups) row[group] += 2
      for (const group of workout.secondaryMuscleGroups) row[group] += 1
      perWeek.set(key, row)
    }

    const allKeys = Array.from(perWeek.keys()).sort((a, b) => a.localeCompare(b))
    const globalCounts = new Map<MuscleGroup, number>()
    for (const key of allKeys) {
      const row = perWeek.get(key)!
      for (const [group, count] of Object.entries(row)) {
        globalCounts.set(
          group as MuscleGroup,
          (globalCounts.get(group as MuscleGroup) ?? 0) + Number(count)
        )
      }
    }

    const trackedGroups = Array.from(globalCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([group]) => group)

    return allKeys.map(key => {
      const row = perWeek.get(key)!
      const total = trackedGroups.reduce((sum, group) => sum + row[group], 0) || 1
      return {
        weekKey: key,
        groups: trackedGroups.map(group => ({
          group,
          value: row[group],
          pct: Number(((row[group] / total) * 100).toFixed(1)),
        })),
      }
    })
  }, [filteredWorkouts])

  const weeklyTrendPoints = useMemo(() => {
    return weeklyRollups.map(rollup => ({
      label: rollup.weekKey.slice(5),
      date: rollup.weekKey,
      recovery: rollup.recovery,
      intense: rollup.intenseWorkouts,
    }))
  }, [weeklyRollups])

  const correlations = useMemo(() => {
    const byWeek = new Map<
      string,
      { workouts: number; strengthTotal: number | null; bodyWeight: number | null }
    >()
    for (const workout of filteredWorkouts) {
      const key = formatWeekKey(new Date(workout.date + 'T00:00:00'))
      const item = byWeek.get(key) ?? { workouts: 0, strengthTotal: null, bodyWeight: null }
      item.workouts += 1
      byWeek.set(key, item)
    }
    for (const measurement of filteredProgress) {
      const key = formatWeekKey(new Date(measurement.date + 'T00:00:00'))
      const item = byWeek.get(key) ?? { workouts: 0, strengthTotal: null, bodyWeight: null }
      const strength = [measurement.squat1RmKg, measurement.bench1RmKg, measurement.deadlift1RmKg]
        .filter(value => typeof value === 'number')
        .reduce((sum, value) => sum + (value ?? 0), 0)
      item.strengthTotal = strength > 0 ? strength : item.strengthTotal
      if (typeof measurement.bodyWeightKg === 'number') item.bodyWeight = measurement.bodyWeightKg
      byWeek.set(key, item)
    }

    const trainingVsStrengthPairs = Array.from(byWeek.values())
      .filter(item => item.strengthTotal !== null)
      .map(item => ({ x: item.workouts, y: item.strengthTotal as number }))

    const trainingVsWeightPairs = Array.from(byWeek.values())
      .filter(item => item.bodyWeight !== null)
      .map(item => ({ x: item.workouts, y: item.bodyWeight as number }))

    return {
      trainingVsStrength: pearsonCorrelation(trainingVsStrengthPairs),
      trainingVsWeight: pearsonCorrelation(trainingVsWeightPairs),
      sampleWeeksStrength: trainingVsStrengthPairs.length,
      sampleWeeksWeight: trainingVsWeightPairs.length,
    }
  }, [filteredProgress, filteredWorkouts])

  if (profile.role !== 'trainee') {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-slate-600">
          Analytics page is available only for trainees.
        </p>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Progress Analytics</h2>
          <div className="flex items-center gap-2">
            {(['30d', '90d', 'all'] as RangeFilter[]).map(option => (
              <Button
                key={option}
                size="sm"
                variant={activeRange === option ? 'default' : 'outline'}
                onClick={() => setActiveRange(option)}
                type="button"
              >
                {option.toUpperCase()}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportCsv(sortedProgress)}
              type="button"
            >
              Export CSV
            </Button>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Trends for muscle balance, intensity vs recovery, and progress correlations.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold">{avgWorkoutsPerWeek}</p>
          <p className="text-xs text-slate-600">Avg workouts/week ({weeksWindow} weeks)</p>
        </article>
        <article className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold">{avgRecoveryPerWeek}</p>
          <p className="text-xs text-slate-600">Avg recovery/week ({weeksWindow} weeks)</p>
        </article>
        <article className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold">{recoveryVsIntensity}</p>
          <p className="text-xs text-slate-600">Recovery-to-intense-workout ratio</p>
        </article>
      </div>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Strength and Measurement Trends</h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <LineChart points={points.weight} stroke="#059669" title="Body Weight (kg)" />
          <LineChart points={points.bodyFat} stroke="#0891b2" title="Body Fat (%)" />
          <LineChart points={points.squat} stroke="#d97706" title="Squat 1RM (kg)" />
          <LineChart points={points.bench} stroke="#7c3aed" title="Bench 1RM (kg)" />
          <LineChart points={points.deadlift} stroke="#e11d48" title="Deadlift 1RM (kg)" />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Muscle Group Balance Over Time</h3>
        {muscleBalanceSeries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No workout tagging data for selected range.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {muscleBalanceSeries.map(week => (
              <article className="rounded border p-3" key={week.weekKey}>
                <p className="mb-2 text-xs font-medium text-slate-600">{week.weekKey}</p>
                <div className="flex h-5 overflow-hidden rounded border">
                  {week.groups.map((item, index) => (
                    <div
                      className={`h-full ${
                        index % 6 === 0
                          ? 'bg-emerald-400'
                          : index % 6 === 1
                            ? 'bg-cyan-400'
                            : index % 6 === 2
                              ? 'bg-amber-400'
                              : index % 6 === 3
                                ? 'bg-violet-400'
                                : index % 6 === 4
                                  ? 'bg-rose-400'
                                  : 'bg-slate-400'
                      }`}
                      key={`${week.weekKey}-${item.group}`}
                      style={{ width: `${item.pct}%` }}
                      title={`${MUSCLE_GROUP_LABELS[item.group]}: ${item.pct}% (${item.value})`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-slate-600">
                  {week.groups
                    .map(item => `${MUSCLE_GROUP_LABELS[item.group]} ${item.pct}%`)
                    .join(' | ')}
                </p>
              </article>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Recovery vs Intensity Weekly Trend</h3>
        {weeklyTrendPoints.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No weekly trend data yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {weeklyTrendPoints.map(week => {
              const maxVal = Math.max(week.recovery, week.intense, 1)
              return (
                <article className="rounded border p-3" key={week.date}>
                  <p className="text-xs font-medium text-slate-600">{week.date}</p>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="mb-1 text-[11px] text-slate-600">
                        Intense workouts: {week.intense}
                      </p>
                      <div className="h-2 rounded bg-slate-100">
                        <div
                          className="h-2 rounded bg-amber-400"
                          style={{ width: `${(week.intense / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] text-slate-600">
                        Recovery entries: {week.recovery}
                      </p>
                      <div className="h-2 rounded bg-slate-100">
                        <div
                          className="h-2 rounded bg-emerald-500"
                          style={{ width: `${(week.recovery / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Correlation Signals</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <article className="rounded border p-3">
            <p className="text-sm font-medium text-slate-700">
              Training frequency vs strength total
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {correlations.trainingVsStrength === null
                ? 'Need at least 3 weekly data points.'
                : `r = ${correlations.trainingVsStrength} (${correlations.sampleWeeksStrength} weeks)`}
            </p>
          </article>
          <article className="rounded border p-3">
            <p className="text-sm font-medium text-slate-700">Training frequency vs bodyweight</p>
            <p className="mt-1 text-sm text-slate-600">
              {correlations.trainingVsWeight === null
                ? 'Need at least 3 weekly data points.'
                : `r = ${correlations.trainingVsWeight} (${correlations.sampleWeeksWeight} weeks)`}
            </p>
          </article>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Weekly Rollups</h3>
          <Link
            className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
            to="/app/progress/new"
          >
            Add measurement
          </Link>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading rollups and progress history...</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        {!loading && !error && weeklyRollups.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No rollups yet for the selected range.</p>
        ) : null}

        {!loading && !error && weeklyRollups.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {weeklyRollups.map(rollup => {
              const maxVal = Math.max(
                rollup.workouts,
                rollup.recovery,
                rollup.progressEntries,
                rollup.intenseWorkouts,
                1
              )
              const durationLabel =
                rollup.avgWorkoutDuration === null ? '—' : `${rollup.avgWorkoutDuration} min`
              return (
                <article
                  className="rounded-2xl border bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-sm"
                  key={rollup.weekKey}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{rollup.weekKey}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      Duration {durationLabel}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-slate-600">
                    <div>
                      <div className="flex justify-between">
                        <p>Workouts</p>
                        <p className="font-semibold text-slate-900">{rollup.workouts}</p>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-emerald-500"
                          style={{ width: `${(rollup.workouts / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <p>Intense</p>
                        <p className="font-semibold text-slate-900">{rollup.intenseWorkouts}</p>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-amber-500"
                          style={{ width: `${(rollup.intenseWorkouts / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <p>Recovery</p>
                        <p className="font-semibold text-slate-900">{rollup.recovery}</p>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-cyan-500"
                          style={{ width: `${(rollup.recovery / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <p>Progress entries</p>
                        <p className="font-semibold text-slate-900">{rollup.progressEntries}</p>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-rose-500"
                          style={{ width: `${(rollup.progressEntries / maxVal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <h3 className="text-lg font-semibold">Progress Measurement History</h3>
        {!loading && !error && sortedProgress.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No measurements yet.</p>
        ) : null}
        {!loading && !error && sortedProgress.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sortedProgress.map(entry => (
              <article
                key={entry.id}
                className="rounded-2xl border bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{entry.date}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                    Bodyweight: {entry.bodyWeightKg ?? '—'} kg
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded border border-emerald-100 bg-emerald-50/60 p-2">
                    <p className="font-semibold text-emerald-800">{entry.squat1RmKg ?? '—'} kg</p>
                    <p>Squat 1RM</p>
                  </div>
                  <div className="rounded border border-violet-100 bg-violet-50/60 p-2">
                    <p className="font-semibold text-violet-800">{entry.bench1RmKg ?? '—'} kg</p>
                    <p>Bench 1RM</p>
                  </div>
                  <div className="rounded border border-amber-100 bg-amber-50/60 p-2">
                    <p className="font-semibold text-amber-800">{entry.deadlift1RmKg ?? '—'} kg</p>
                    <p>Deadlift 1RM</p>
                  </div>
                  <div className="rounded border border-cyan-100 bg-cyan-50/60 p-2">
                    <p className="font-semibold text-cyan-800">
                      {entry.bodyFatPct ? `${entry.bodyFatPct}%` : '—'}
                    </p>
                    <p>Body Fat</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  )
}
