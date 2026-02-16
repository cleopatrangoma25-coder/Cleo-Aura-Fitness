import { useQuery } from '@tanstack/react-query'
import { Session } from '../../domain/Session'
import { useServices } from '../../providers/ServiceProvider'

export type SessionOffer = Session

export function useSessions(roleFilter: 'all' | 'upcoming' = 'upcoming') {
  const { session: sessionService } = useServices()

  const {
    data: sessions = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessions', roleFilter],
    queryFn: () => sessionService.list(roleFilter),
    staleTime: 60_000,
  })

  return {
    sessions,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load sessions.') : null,
    reload: refetch,
  }
}
