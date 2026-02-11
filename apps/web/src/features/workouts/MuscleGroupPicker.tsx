import { MUSCLE_GROUP_LABELS, type MuscleGroup } from '@repo/shared'

const ALL_GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroup[]

export function MuscleGroupPicker({
  label,
  selected,
  onChange,
}: {
  label: string
  selected: MuscleGroup[]
  onChange: (groups: MuscleGroup[]) => void
}) {
  function toggle(group: MuscleGroup) {
    if (selected.includes(group)) {
      onChange(selected.filter(g => g !== group))
    } else {
      onChange([...selected, group])
    }
  }

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {ALL_GROUPS.map(group => {
          const isSelected = selected.includes(group)
          return (
            <button
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
              key={group}
              onClick={() => toggle(group)}
              type="button"
            >
              {MUSCLE_GROUP_LABELS[group]}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
