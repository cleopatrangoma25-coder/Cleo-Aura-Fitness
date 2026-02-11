import {
  WORKOUT_TYPE_LABELS,
  MUSCLE_GROUP_LABELS,
  INTENSITY_LABELS,
  type Workout,
} from '@repo/shared'

export function WorkoutCard({ workout }: { workout: Workout }) {
  const typeLabel = WORKOUT_TYPE_LABELS[workout.type]
  const primaryLabels = workout.primaryMuscleGroups.map(g => MUSCLE_GROUP_LABELS[g]).join(', ')
  const secondaryLabels = workout.secondaryMuscleGroups.map(g => MUSCLE_GROUP_LABELS[g]).join(', ')

  const meta: string[] = []
  if (workout.durationMinutes) meta.push(`${workout.durationMinutes} min`)
  if (workout.intensity) meta.push(INTENSITY_LABELS[workout.intensity])

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{workout.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {workout.date}
            {meta.length > 0 ? ` · ${meta.join(' · ')}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {typeLabel}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-700">
        <span className="font-medium">Primary:</span> {primaryLabels}
      </p>
      {secondaryLabels ? (
        <p className="text-sm text-slate-500">
          <span className="font-medium">Secondary:</span> {secondaryLabels}
        </p>
      ) : null}

      {workout.notes ? (
        <p className="mt-2 text-sm italic text-slate-500">"{workout.notes}"</p>
      ) : null}
    </div>
  )
}
