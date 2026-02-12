import { FormEvent, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import {
  UpsertWearableSummarySchema,
  WEARABLE_SOURCE_LABELS,
  type WearableSource,
} from '@repo/shared'
import type { User } from 'firebase/auth'
import { useWearablesSummary } from './useWearablesSummary'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

const SOURCES = Object.keys(WEARABLE_SOURCE_LABELS) as WearableSource[]

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function WearableSummaryForm() {
  const { user, profile } = useOutletContext<AppContext>()
  const { upsertSummary } = useWearablesSummary(user.uid)
  const navigate = useNavigate()

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]!)
  const [source, setSource] = useState<WearableSource>('manual')
  const [steps, setSteps] = useState('')
  const [activeCaloriesKcal, setActiveCaloriesKcal] = useState('')
  const [workoutMinutes, setWorkoutMinutes] = useState('')
  const [avgHeartRateBpm, setAvgHeartRateBpm] = useState('')
  const [restingHeartRateBpm, setRestingHeartRateBpm] = useState('')
  const [sleepHours, setSleepHours] = useState('')
  const [readinessScore, setReadinessScore] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (profile.role !== 'trainee') {
      setError('Only trainees can log wearable summaries.')
      return
    }

    const parsed = UpsertWearableSummarySchema.safeParse({
      date,
      source,
      steps: toOptionalNumber(steps),
      activeCaloriesKcal: toOptionalNumber(activeCaloriesKcal),
      workoutMinutes: toOptionalNumber(workoutMinutes),
      avgHeartRateBpm: toOptionalNumber(avgHeartRateBpm),
      restingHeartRateBpm: toOptionalNumber(restingHeartRateBpm),
      sleepHours: toOptionalNumber(sleepHours),
      readinessScore: toOptionalNumber(readinessScore),
      notes: notes.trim(),
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your wearable summary input.')
      return
    }

    setIsSubmitting(true)
    try {
      await upsertSummary(parsed.data)
      navigate('/app')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save wearable summary.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profile.role !== 'trainee') {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="mt-1 text-sm text-slate-600">Only trainees can log wearable summaries.</p>
        <button
          className="mt-4 rounded border px-4 py-2 text-sm"
          onClick={() => navigate('/app')}
          type="button"
        >
          Back to home
        </button>
      </section>
    )
  }

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Log Wearable Summary</h2>
      <p className="mt-1 text-sm text-slate-600">
        Daily summary entry to prepare for Apple Watch / HealthKit integrations.
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Have iOS companion payload JSON?{' '}
        <Link className="text-emerald-700 underline" to="/app/wearables/import">
          Use HealthKit Sync Import
        </Link>
        .
      </p>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm">
          Date
          <input
            className="rounded border px-3 py-2"
            onChange={event => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </label>

        <label className="grid gap-1 text-sm">
          Source
          <select
            className="rounded border px-3 py-2"
            onChange={event => setSource(event.target.value as WearableSource)}
            value={source}
          >
            {SOURCES.map(value => (
              <option key={value} value={value}>
                {WEARABLE_SOURCE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Steps
            <input className="rounded border px-3 py-2" min={0} onChange={event => setSteps(event.target.value)} type="number" value={steps} />
          </label>
          <label className="grid gap-1 text-sm">
            Active calories (kcal)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setActiveCaloriesKcal(event.target.value)}
              step="0.1"
              type="number"
              value={activeCaloriesKcal}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Workout minutes
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setWorkoutMinutes(event.target.value)}
              type="number"
              value={workoutMinutes}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Avg heart rate (bpm)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setAvgHeartRateBpm(event.target.value)}
              step="0.1"
              type="number"
              value={avgHeartRateBpm}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Resting heart rate (bpm)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setRestingHeartRateBpm(event.target.value)}
              step="0.1"
              type="number"
              value={restingHeartRateBpm}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Sleep (hours)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setSleepHours(event.target.value)}
              step="0.1"
              type="number"
              value={sleepHours}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Readiness (1-100)
            <input
              className="rounded border px-3 py-2"
              max={100}
              min={1}
              onChange={event => setReadinessScore(event.target.value)}
              type="number"
              value={readinessScore}
            />
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          Notes (optional)
          <textarea
            className="rounded border px-3 py-2"
            maxLength={500}
            onChange={event => setNotes(event.target.value)}
            rows={3}
            value={notes}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-2">
          <button
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Saving...' : 'Save Wearable Summary'}
          </button>
          <button className="rounded border px-4 py-2 text-sm" onClick={() => navigate('/app')} type="button">
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
