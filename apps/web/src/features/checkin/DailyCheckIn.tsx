import { FormEvent, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  HYDRATION_LABELS,
  MEAL_QUALITY_LABELS,
  type Hydration,
  type MealQuality,
  UpsertNutritionDaySchema,
  UpsertWellbeingDaySchema,
} from '@repo/shared'
import type { User } from 'firebase/auth'
import { Button } from '@repo/ui/Button'
import { Card } from '@repo/ui/Card'
import { useNutritionDays } from '../nutrition/useNutritionDays'
import { todayIsoDate, lastNDates } from './date'
import { useWellbeingDays } from '../wellbeing/useWellbeingDays'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

const MEAL_QUALITIES = Object.keys(MEAL_QUALITY_LABELS) as MealQuality[]
const HYDRATION_LEVELS = Object.keys(HYDRATION_LABELS) as Hydration[]

export function DailyCheckIn() {
  const { user, profile } = useOutletContext<AppContext>()
  const navigate = useNavigate()
  const [date, setDate] = useState(todayIsoDate())

  const { entries: nutritionDays, upsertNutritionDay } = useNutritionDays(user.uid)
  const { entries: wellbeingDays, upsertWellbeingDay } = useWellbeingDays(user.uid)

  const [mealsOnTrack, setMealsOnTrack] = useState(true)
  const [mealQuality, setMealQuality] = useState<MealQuality>('good')
  const [hydration, setHydration] = useState<Hydration>('moderate')
  const [nutritionNotes, setNutritionNotes] = useState('')

  const [mood, setMood] = useState(3)
  const [stress, setStress] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [sleepQuality, setSleepQuality] = useState(3)
  const [wellbeingNotes, setWellbeingNotes] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const weeklySummary = useMemo(() => {
    const last7 = lastNDates(7)
    const nutritionSet = new Set(nutritionDays.map(entry => entry.date))
    const wellbeingSet = new Set(wellbeingDays.map(entry => entry.date))

    const nutritionCount = last7.filter(day => nutritionSet.has(day)).length
    const wellbeingCount = last7.filter(day => wellbeingSet.has(day)).length

    let streak = 0
    for (const day of lastNDates(30)) {
      if (nutritionSet.has(day) && wellbeingSet.has(day)) {
        streak += 1
      } else {
        break
      }
    }

    return { nutritionCount, wellbeingCount, streak }
  }, [nutritionDays, wellbeingDays])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (profile.role !== 'trainee') {
      setError('Only trainees can submit a daily check-in.')
      return
    }

    const nutritionInput = UpsertNutritionDaySchema.safeParse({
      date,
      mealsOnTrack,
      mealQuality,
      hydration,
      notes: nutritionNotes.trim(),
    })

    if (!nutritionInput.success) {
      setError(nutritionInput.error.issues[0]?.message ?? 'Invalid nutrition input.')
      return
    }

    const wellbeingInput = UpsertWellbeingDaySchema.safeParse({
      date,
      mood,
      stress,
      energy,
      sleepQuality,
      notes: wellbeingNotes.trim(),
    })

    if (!wellbeingInput.success) {
      setError(wellbeingInput.error.issues[0]?.message ?? 'Invalid wellbeing input.')
      return
    }

    setIsSaving(true)
    try {
      await Promise.all([
        upsertNutritionDay(nutritionInput.data),
        upsertWellbeingDay(wellbeingInput.data),
      ])
      setMessage('Daily check-in saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save check-in.')
    } finally {
      setIsSaving(false)
    }
  }

  if (profile.role !== 'trainee') {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-slate-600">Only trainees can submit daily check-ins.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app')} type="button">
          Back to home
        </Button>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      <Card className="p-5">
        <h2 className="text-xl font-semibold">Daily Check-In</h2>
        <p className="mt-1 text-sm text-slate-600">
          Log nutrition and wellbeing in under a minute.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold">{weeklySummary.nutritionCount}/7</p>
          <p className="text-sm text-slate-600">Nutrition check-ins</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold">{weeklySummary.wellbeingCount}/7</p>
          <p className="text-sm text-slate-600">Wellbeing check-ins</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-semibold">{weeklySummary.streak}</p>
          <p className="text-sm text-slate-600">Current streak</p>
        </Card>
      </div>

      <Card className="p-5">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm">
            Date
            <input
              className="rounded border px-3 py-2"
              onChange={event => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Nutrition</legend>
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded border px-3 py-2 text-sm ${mealsOnTrack ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}
                onClick={() => setMealsOnTrack(true)}
                type="button"
              >
                Meals on track
              </button>
              <button
                className={`rounded border px-3 py-2 text-sm ${!mealsOnTrack ? 'border-amber-600 bg-amber-50' : 'border-slate-200'}`}
                onClick={() => setMealsOnTrack(false)}
                type="button"
              >
                Missed target
              </button>
            </div>
            <label className="grid gap-1 text-sm">
              Meal quality
              <select
                className="rounded border px-3 py-2"
                onChange={event => setMealQuality(event.target.value as MealQuality)}
                value={mealQuality}
              >
                {MEAL_QUALITIES.map(value => (
                  <option key={value} value={value}>
                    {MEAL_QUALITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Hydration
              <select
                className="rounded border px-3 py-2"
                onChange={event => setHydration(event.target.value as Hydration)}
                value={hydration}
              >
                {HYDRATION_LEVELS.map(value => (
                  <option key={value} value={value}>
                    {HYDRATION_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Nutrition notes (optional)
              <textarea
                className="rounded border px-3 py-2"
                maxLength={500}
                onChange={event => setNutritionNotes(event.target.value)}
                rows={2}
                value={nutritionNotes}
              />
            </label>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">Wellbeing (1-5)</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Mood
                <input
                  className="rounded border px-3 py-2"
                  max={5}
                  min={1}
                  onChange={event => setMood(Number(event.target.value))}
                  type="number"
                  value={mood}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Stress
                <input
                  className="rounded border px-3 py-2"
                  max={5}
                  min={1}
                  onChange={event => setStress(Number(event.target.value))}
                  type="number"
                  value={stress}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Energy
                <input
                  className="rounded border px-3 py-2"
                  max={5}
                  min={1}
                  onChange={event => setEnergy(Number(event.target.value))}
                  type="number"
                  value={energy}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Sleep quality
                <input
                  className="rounded border px-3 py-2"
                  max={5}
                  min={1}
                  onChange={event => setSleepQuality(Number(event.target.value))}
                  type="number"
                  value={sleepQuality}
                />
              </label>
            </div>
            <label className="grid gap-1 text-sm">
              Wellbeing notes (optional)
              <textarea
                className="rounded border px-3 py-2"
                maxLength={500}
                onChange={event => setWellbeingNotes(event.target.value)}
                rows={2}
                value={wellbeingNotes}
              />
            </label>
          </fieldset>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <div className="flex gap-2">
            <Button disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'Save Check-In'}
            </Button>
            <Button variant="outline" onClick={() => navigate('/app')} type="button">
              Back
            </Button>
          </div>
        </form>
      </Card>
    </section>
  )
}
