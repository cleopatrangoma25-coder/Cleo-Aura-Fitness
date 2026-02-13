import { useCallback, useEffect, useState } from 'react'
import { Enrollment } from '../../domain/Enrollment'
import { useServices } from '../../providers/ServiceProvider'

export function useSessionEnrollments(traineeId?: string) {
  const { enrollment: enrollmentService } = useServices()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!traineeId) return
    setLoading(true)
    setError(null)
    try {
      const results = await enrollmentService.listByTrainee(traineeId)
      setEnrollments(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load enrollments.')
    } finally {
      setLoading(false)
    }
  }, [traineeId, enrollmentService])

  useEffect(() => {
    if (traineeId) void load()
  }, [traineeId, load])

  const enroll = useCallback(
    async (sessionId: string) => {
      if (!traineeId) return
      setSavingId(sessionId)
      setError(null)
      try {
        await enrollmentService.enroll(sessionId, traineeId)
        await load()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not enroll in session.')
      } finally {
        setSavingId(null)
      }
    },
    [traineeId, load, enrollmentService]
  )

  const cancel = useCallback(
    async (sessionId: string) => {
      if (!traineeId) return
      setSavingId(sessionId)
      setError(null)
      try {
        await enrollmentService.cancel(sessionId, traineeId)
        await load()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Could not cancel enrollment.')
      } finally {
        setSavingId(null)
      }
    },
    [traineeId, load, enrollmentService]
  )

  return { enrollments, loading, error, savingId, enroll, cancel, reload: load }
}
