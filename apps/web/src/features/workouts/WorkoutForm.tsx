import { FormEvent, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  CreateWorkoutSchema,
  WORKOUT_TYPE_LABELS,
  INTENSITY_LABELS,
  type WorkoutType,
  type Intensity,
  type MuscleGroup,
} from '@repo/shared'
import type { User } from 'firebase/auth'
import { useWorkouts } from './useWorkouts'
import { MuscleGroupPicker } from './MuscleGroupPicker'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

const WORKOUT_TYPES = Object.keys(WORKOUT_TYPE_LABELS) as WorkoutType[]
const INTENSITIES = Object.keys(INTENSITY_LABELS) as Intensity[]

export function WorkoutForm() {
  const { user, profile } = useOutletContext<AppContext>()
  const { addWorkout } = useWorkouts(user.uid)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<WorkoutType>('strength')
  const [primaryMuscleGroups, setPrimaryMuscleGroups] = useState<MuscleGroup[]>([])
  const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<MuscleGroup[]>([])
  const [durationMinutes, setDurationMinutes] = useState('')
  const [intensity, setIntensity] = useState<Intensity | null>(null)
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]!)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (profile.role !== 'trainee') {
      setError('Only trainees can log workouts.')
      return
    }

    const parsed = CreateWorkoutSchema.safeParse({
      title: title.trim(),
      type,
      primaryMuscleGroups,
      secondaryMuscleGroups,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      intensity,
      notes: notes.trim(),
      date,
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      setError(firstIssue?.message ?? 'Please check your input.')
      return
    }

    setIsSubmitting(true)
    try {
      await addWorkout(parsed.data)
      navigate('/app/history')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save workout.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profile.role !== 'trainee') {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="mt-1 text-sm text-slate-600">Only trainees can log workouts.</p>
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
      <h2 className="text-xl font-semibold">Log Your Workout</h2>
      <p className="mt-1 text-sm text-slate-600">
        Track your training to see your progress over time.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm">
          Title
          <input
            className="rounded border px-3 py-2"
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Upper Body Push"
            required
            value={title}
          />
        </label>

        <label className="grid gap-1 text-sm">
          Workout type
          <select
            className="rounded border px-3 py-2"
            onChange={e => setType(e.target.value as WorkoutType)}
            value={type}
          >
            {WORKOUT_TYPES.map(t => (
              <option key={t} value={t}>
                {WORKOUT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Date
          <input
            className="rounded border px-3 py-2"
            onChange={e => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </label>

        <MuscleGroupPicker
          label="Primary muscle groups (at least one)"
          onChange={setPrimaryMuscleGroups}
          selected={primaryMuscleGroups}
        />

        <MuscleGroupPicker
          label="Secondary muscle groups (optional)"
          onChange={setSecondaryMuscleGroups}
          selected={secondaryMuscleGroups}
        />

        <label className="grid gap-1 text-sm">
          Duration (optional)
          <input
            className="rounded border px-3 py-2"
            min={1}
            onChange={e => setDurationMinutes(e.target.value)}
            placeholder="Minutes"
            type="number"
            value={durationMinutes}
          />
        </label>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Intensity (optional)</legend>
          <div className="flex gap-2">
            {INTENSITIES.map(level => (
              <button
                className={`rounded border px-3 py-2 text-sm transition-colors ${
                  intensity === level
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                key={level}
                onClick={() => setIntensity(intensity === level ? null : level)}
                type="button"
              >
                {INTENSITY_LABELS[level]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-sm">
          Notes (optional)
          <textarea
            className="rounded border px-3 py-2"
            maxLength={500}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did it go?"
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
            {isSubmitting ? 'Saving...' : 'Log Workout'}
          </button>
          <button
            className="rounded border px-4 py-2 text-sm"
            onClick={() => navigate('/app')}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
