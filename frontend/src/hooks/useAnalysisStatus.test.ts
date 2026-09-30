import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getReviewStatus } from '../lib/reviewApi'
import { getAnalysisRefetchInterval, useAnalysisStatus } from './useAnalysisStatus'

vi.mock('../lib/reviewApi', () => ({ getReviewStatus: vi.fn() }))

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children)
  }
}

describe('useAnalysisStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns pending status initially', async () => {
    vi.mocked(getReviewStatus).mockResolvedValue({ status: 'pending' })
    const { result } = renderHook(() => useAnalysisStatus('review-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data?.status).toBe('pending'))
  })

  it('continues polling while pending', () => {
    expect(getAnalysisRefetchInterval('pending')).toBe(2000)
  })

  it('stops polling when complete', async () => {
    expect(getAnalysisRefetchInterval('complete')).toBe(false)
    vi.mocked(getReviewStatus).mockResolvedValue({ status: 'complete' })
    const { result } = renderHook(() => useAnalysisStatus('review-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.data?.status).toBe('complete'))
  })
})