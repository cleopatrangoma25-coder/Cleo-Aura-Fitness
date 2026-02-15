import { FormEvent, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { CreateRecoverySchema, RECOVERY_TYPE_LABELS, type RecoveryType } from '@repo/shared'
import type { User } from 'firebase/auth'
import { Button } from '@repo/ui/Button'
import { Card } from '@repo/ui/Card'
import { useRecovery } from './useRecovery'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

const RECOVERY_TYPES = Object.keys(RECOVERY_TYPE_LABELS) as RecoveryType[]

export function RecoveryForm() {
  const { user, profile } = useOutletContext<AppContext>()
  const { addRecovery } = useRecovery(user.uid)
  const navigate = useNavigate()

  const [type, setType] = useState<RecoveryType>('rest_day')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]!)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (profile.role !== 'trainee') {
      setError('Only trainees can log recovery.')
      return
    }

    const parsed = CreateRecoverySchema.safeParse({
      type,
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
      await addRecovery(parsed.data)
      navigate('/app/history')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save recovery entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profile.role !== 'trainee') {
    return (
      <Card className="p-5">
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="mt-1 text-sm text-slate-600">Only trainees can log recovery entries.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app')} type="button">
          Back to home
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <h2 className="text-xl font-semibold">Recovery is Progress</h2>
      <p className="mt-1 text-sm text-slate-600">
        Rest days help your body grow stronger. Log your recovery to keep your journey balanced.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Recovery type</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {RECOVERY_TYPES.map(t => (
              <button
                className={`rounded border px-3 py-2 text-left text-sm transition-colors ${
                  type === t
                    ? 'border-violet-500 bg-violet-50 text-violet-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                key={t}
                onClick={() => setType(t)}
                type="button"
              >
                {RECOVERY_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-1 text-sm">
          Date
          <input
            className="rounded border px-3 py-2"
            onChange={e => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </label>

        <label className="grid gap-1 text-sm">
          Notes (optional)
          <textarea
            className="rounded border px-3 py-2"
            maxLength={500}
            onChange={e => setNotes(e.target.value)}
            placeholder="How are you feeling?"
            rows={3}
            value={notes}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-2">
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Saving...' : 'Log Recovery'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/app')} type="button">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
