import { useEffect, useState, useCallback } from 'react'
import { Session } from '../../domain/Session'
import { useServices } from '../../providers/ServiceProvider'

export type SessionOffer = Session

export function useSessions(roleFilter: 'all' | 'upcoming' = 'upcoming') {
  const { session: sessionService } = useServices()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const results = await sessionService.list(roleFilter)
      setSessions(results)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }, [roleFilter, sessionService])

  useEffect(() => {
    void load()
  }, [load])

  return { sessions, loading, error, reload: load }
}
