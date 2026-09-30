import { useQuery } from '@tanstack/react-query'
import { getReviewStatus } from '../lib/reviewApi'

export function getAnalysisRefetchInterval(status: string | undefined): number | false {
  return status === 'pending' ? 2000 : false
}

export function useAnalysisStatus(reviewId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['review-status', reviewId],
    queryFn: () => getReviewStatus(reviewId as string),
    enabled: Boolean(reviewId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return getAnalysisRefetchInterval(status)
    },
    refetchIntervalInBackground: false,
    retry: 1,
  })
}
