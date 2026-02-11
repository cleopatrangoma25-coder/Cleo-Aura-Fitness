import { RECOVERY_TYPE_LABELS, type Recovery } from '@repo/shared'

export function RecoveryCard({ entry }: { entry: Recovery }) {
  const typeLabel = RECOVERY_TYPE_LABELS[entry.type]

  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-violet-900">{typeLabel}</h3>
          <p className="mt-0.5 text-xs text-violet-500">{entry.date}</p>
        </div>
        <span className="shrink-0 rounded-full bg-violet-200 px-2 py-0.5 text-xs font-medium text-violet-700">
          Recovery
        </span>
      </div>

      {entry.notes ? <p className="mt-2 text-sm italic text-violet-600">"{entry.notes}"</p> : null}
    </div>
  )
}
