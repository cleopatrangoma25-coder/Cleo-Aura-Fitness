import { WorkoutCard } from '../workouts/WorkoutCard'
import { RecoveryCard } from '../recovery/RecoveryCard'
import type { TimelineEntry as TimelineEntryType } from './useTimeline'

export function TimelineEntry({ entry }: { entry: TimelineEntryType }) {
  if (entry.kind === 'workout') {
    return <WorkoutCard workout={entry.data} />
  }
  return <RecoveryCard entry={entry.data} />
}
