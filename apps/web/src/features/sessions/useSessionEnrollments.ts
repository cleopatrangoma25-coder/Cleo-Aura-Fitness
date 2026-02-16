import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Enrollment } from '../../domain/Enrollment'
import { useServices } from '../../providers/ServiceProvider'

export function useSessionEnrollments(traineeId?: string) {
  const { enrollment: enrollmentService } = useServices()
  const queryClient = useQueryClient()

  const {
    data: enrollments = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sessionEnrollments', traineeId],
    queryFn: () => enrollmentService.listByTrainee(traineeId!),
    enabled: Boolean(traineeId),
    staleTime: 30_000,
  })

  const {
    mutateAsync: enroll,
    isPending: enrolling,
    variables: enrollingSessionId,
  } = useMutation({
    mutationFn: (sessionId: string) => enrollmentService.enroll(sessionId, traineeId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessionEnrollments', traineeId] })
    },
  })

  const {
    mutateAsync: cancel,
    isPending: cancelling,
    variables: cancellingSessionId,
  } = useMutation({
    mutationFn: (sessionId: string) => enrollmentService.cancel(sessionId, traineeId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sessionEnrollments', traineeId] })
    },
  })

  const savingId =
    enrollingSessionId ?? cancellingSessionId ?? (enrolling || cancelling ? 'loading' : null)

  return {
    enrollments,
    loading,
    error: error ? (error instanceof Error ? error.message : 'Failed to load enrollments.') : null,
    savingId,
    enroll,
    cancel,
    reload: refetch,
  }
}
