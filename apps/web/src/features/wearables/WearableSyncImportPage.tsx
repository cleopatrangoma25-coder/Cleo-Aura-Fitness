import { FormEvent, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { HealthKitSyncPayloadSchema } from '@repo/shared'
import type { User } from 'firebase/auth'
import { useWearablesSummary } from './useWearablesSummary'

type AppContext = {
  user: User
  profile: { uid: string; role: string | null }
}

const SAMPLE_PAYLOAD = `{
  "version": "2026-02-12",
  "device": {
    "platform": "ios",
    "appVersion": "1.0.0",
    "timezone": "America/New_York"
  },
  "summaries": [
    {
      "date": "2026-02-12",
      "source": "apple_watch",
      "steps": 9820,
      "sleepHours": 7.4,
      "readinessScore": 80
    }
  ]
}`

export function WearableSyncImportPage() {
  const { user, profile } = useOutletContext<AppContext>()
  const { upsertManySummaries } = useWearablesSummary(user.uid)
  const navigate = useNavigate()
  const [payload, setPayload] = useState(SAMPLE_PAYLOAD)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setResult(null)

    if (profile.role !== 'trainee') {
      setError('Only trainees can import wearable sync payloads.')
      return
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(payload)
    } catch {
      setError('Payload must be valid JSON.')
      return
    }

    const parsed = HealthKitSyncPayloadSchema.safeParse(parsedJson)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid HealthKit sync payload.')
      return
    }

    setIsSubmitting(true)
    try {
      await upsertManySummaries(parsed.data.summaries)
      setResult(`Imported ${parsed.data.summaries.length} daily summary records.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to import sync payload.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">HealthKit Sync Import</h2>
      <p className="mt-1 text-sm text-slate-600">
        Phase 2 path: import iOS companion payloads into Firestore wearable summaries.
      </p>

      <form className="mt-4 space-y-3" onSubmit={handleImport}>
        <label className="grid gap-1 text-sm">
          HealthKit payload (JSON)
          <textarea
            className="min-h-[280px] rounded border px-3 py-2 font-mono text-xs"
            onChange={event => setPayload(event.target.value)}
            value={payload}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {result ? <p className="text-sm text-emerald-700">{result}</p> : null}

        <div className="flex gap-2">
          <button
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Importing...' : 'Import Payload'}
          </button>
          <button className="rounded border px-4 py-2 text-sm" onClick={() => navigate('/app')} type="button">
            Back
          </button>
        </div>
      </form>
    </section>
  )
}
