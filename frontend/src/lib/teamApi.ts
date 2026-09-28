import axios from 'axios'
import { api } from './api'

export type TeamRole = 'owner' | 'reviewer' | 'viewer'

export interface TeamMember {
  id: string
  user_id: string
  email: string
  display_name: string
  role: TeamRole
  joined_at: string
}

export interface Team {
  id: string
  name: string
  role: TeamRole
  created_at: string
  members: TeamMember[]
}

export async function createTeam(name: string): Promise<Team> {
  const { data } = await api.post<Team>('/api/v1/teams', { name })
  return data
}

export async function getMyTeams(): Promise<Team[]> {
  const { data } = await api.get<Team[]>('/api/v1/teams/me')
  return data
}

export async function inviteMember(teamId: string, email: string): Promise<Team> {
  const { data } = await api.post<Team>(`/api/v1/teams/${teamId}/invite`, { email })
  return data
}

export async function changeRole(teamId: string, userId: string, role: TeamRole): Promise<Team> {
  const { data } = await api.put<Team>(`/api/v1/teams/${teamId}/members/${userId}/role`, { role })
  return data
}

export function getTeamApiError(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string'
    ? error.response.data.detail
    : fallback
}