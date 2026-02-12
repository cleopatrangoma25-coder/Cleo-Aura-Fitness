import { FormEvent, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { CreateProgressMeasurementSchema } from '@repo/shared'
import type { User } from 'firebase/auth'
import { useProgressMeasurements } from './useProgressMeasurements'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function ProgressMeasurementForm() {
  const { user, profile } = useOutletContext<AppContext>()
  const { addEntry } = useProgressMeasurements(user.uid)
  const navigate = useNavigate()

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]!)
  const [bodyWeightKg, setBodyWeightKg] = useState('')
  const [bodyFatPct, setBodyFatPct] = useState('')
  const [waistCm, setWaistCm] = useState('')
  const [hipsCm, setHipsCm] = useState('')
  const [chestCm, setChestCm] = useState('')
  const [thighsCm, setThighsCm] = useState('')
  const [armsCm, setArmsCm] = useState('')
  const [squat1RmKg, setSquat1RmKg] = useState('')
  const [bench1RmKg, setBench1RmKg] = useState('')
  const [deadlift1RmKg, setDeadlift1RmKg] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (profile.role !== 'trainee') {
      setError('Only trainees can log progress measurements.')
      return
    }

    const parsed = CreateProgressMeasurementSchema.safeParse({
      date,
      bodyWeightKg: toOptionalNumber(bodyWeightKg),
      bodyFatPct: toOptionalNumber(bodyFatPct),
      waistCm: toOptionalNumber(waistCm),
      hipsCm: toOptionalNumber(hipsCm),
      chestCm: toOptionalNumber(chestCm),
      thighsCm: toOptionalNumber(thighsCm),
      armsCm: toOptionalNumber(armsCm),
      squat1RmKg: toOptionalNumber(squat1RmKg),
      bench1RmKg: toOptionalNumber(bench1RmKg),
      deadlift1RmKg: toOptionalNumber(deadlift1RmKg),
      notes: notes.trim(),
    })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your measurements.')
      return
    }

    setIsSubmitting(true)
    try {
      await addEntry(parsed.data)
      navigate('/app')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save progress entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profile.role !== 'trainee') {
    return (
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="mt-1 text-sm text-slate-600">Only trainees can log progress measurements.</p>
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
      <h2 className="text-xl font-semibold">Log Progress Measurement</h2>
      <p className="mt-1 text-sm text-slate-600">
        Track body metrics and key strength markers over time.
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

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            Body weight (kg)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setBodyWeightKg(event.target.value)}
              step="0.1"
              type="number"
              value={bodyWeightKg}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Body fat (%)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setBodyFatPct(event.target.value)}
              step="0.1"
              type="number"
              value={bodyFatPct}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Waist (cm)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setWaistCm(event.target.value)}
              step="0.1"
              type="number"
              value={waistCm}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Hips (cm)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setHipsCm(event.target.value)}
              step="0.1"
              type="number"
              value={hipsCm}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Chest (cm)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setChestCm(event.target.value)}
              step="0.1"
              type="number"
              value={chestCm}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Thighs (cm)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setThighsCm(event.target.value)}
              step="0.1"
              type="number"
              value={thighsCm}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Arms (cm)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setArmsCm(event.target.value)}
              step="0.1"
              type="number"
              value={armsCm}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Squat 1RM (kg)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setSquat1RmKg(event.target.value)}
              step="0.5"
              type="number"
              value={squat1RmKg}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Bench 1RM (kg)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setBench1RmKg(event.target.value)}
              step="0.5"
              type="number"
              value={bench1RmKg}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Deadlift 1RM (kg)
            <input
              className="rounded border px-3 py-2"
              min={0}
              onChange={event => setDeadlift1RmKg(event.target.value)}
              step="0.5"
              type="number"
              value={deadlift1RmKg}
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
            {isSubmitting ? 'Saving...' : 'Save Progress'}
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
