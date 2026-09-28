import axios from 'axios'
import { api } from './api'

export interface ReviewFinding {
  line_number: number
  side: 'left' | 'right'
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  category: string
  message: string
  suggestion: string
}

export interface Review {
  id: string
  title: string
  diff: string
  team_id: string | null
  status: 'pending' | 'complete' | 'error'
  findings: ReviewFinding[]
  created_at: string
  updated_at: string
}

export interface ReviewStatusResponse {
  status: 'pending' | 'complete' | 'error'
}

export async function listReviews(): Promise<Review[]> {
  const { data } = await api.get<Review[]>('/api/v1/reviews')
  return data
}

export async function createReview(title: string, diff: string, team_id?: string): Promise<Review> {
  const { data } = await api.post<Review>('/api/v1/reviews', { title, diff, team_id })
  return data
}

export async function getReview(reviewId: string): Promise<Review> {
  const { data } = await api.get<Review>(`/api/v1/reviews/${reviewId}`)
  return data
}

export async function getReviewStatus(reviewId: string): Promise<ReviewStatusResponse> {
  const { data } = await api.get<ReviewStatusResponse>(`/api/v1/reviews/${reviewId}/status`)
  return data
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
    ? error.response.data.detail
    : fallback
}
