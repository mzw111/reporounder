import { createContext, useContext, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { api } from '../lib/api'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth'

interface AuthContextValue {
  user: User | undefined
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  error: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>('/api/v1/auth/me')
  return data
}

function getApiError(error: unknown, fallback: string) {
  return axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
    ? error.response.data.detail
    : fallback
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem('access_token')))
  const [error, setError] = useState<string | null>(null)

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'], queryFn: fetchMe, enabled: hasToken, retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => api.post<AuthResponse>('/api/v1/auth/login', payload).then((response) => response.data),
    onSuccess: ({ user, tokens }) => {
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      setHasToken(true)
      queryClient.setQueryData(['me'], user)
      setError(null)
    },
    onError: (mutationError) => setError(getApiError(mutationError, 'Login failed')),
  })

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => api.post<AuthResponse>('/api/v1/auth/register', payload).then((response) => response.data),
    onSuccess: ({ user, tokens }) => {
      localStorage.setItem('access_token', tokens.access_token)
      localStorage.setItem('refresh_token', tokens.refresh_token)
      setHasToken(true)
      queryClient.setQueryData(['me'], user)
      setError(null)
    },
    onError: (mutationError) => setError(getApiError(mutationError, 'Registration failed')),
  })

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setHasToken(false)
    queryClient.removeQueries({ queryKey: ['me'] })
  }

  return <AuthContext.Provider value={{
    user, isLoading: hasToken && isLoading, isAuthenticated: Boolean(user),
    login: async (payload) => { await loginMutation.mutateAsync(payload) },
    register: async (payload) => { await registerMutation.mutateAsync(payload) }, logout, error,
  }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}