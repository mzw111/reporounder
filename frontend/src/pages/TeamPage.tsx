import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { changeRole, createTeam, getMyTeams, getTeamApiError, inviteMember, type TeamRole } from '../lib/teamApi'

const selectedTeamKey = 'selected_team_id'

const roleStyles: Record<TeamRole, string> = {
  owner: 'border-primary/30 bg-primary/10 text-primary',
  reviewer: 'border-info/30 bg-info/10 text-info',
  viewer: 'border-outline-variant/40 bg-surface-container-high text-on-surface-variant',
}

export function TeamPage() {
  const queryClient = useQueryClient()
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: getMyTeams })
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem(selectedTeamKey) ?? '')
  const [email, setEmail] = useState('')
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const teams = teamsQuery.data ?? []
  const activeTeamId = teams.some((team) => team.id === selectedId) ? selectedId : teams[0]?.id ?? ''
  const selectedTeam = teams.find((team) => team.id === activeTeamId)

  const refreshTeams = (team: typeof selectedTeam) => {
    if (team) queryClient.setQueryData(['teams'], teams.map((item) => item.id === team.id ? team : item))
    setError(null)
  }

  const inviteMutation = useMutation({
    mutationFn: () => selectedTeam ? inviteMember(selectedTeam.id, email) : Promise.reject(new Error('Select a team first')),
    onSuccess: (team) => { refreshTeams(team); setEmail('') },
    onError: (inviteError) => setError(getTeamApiError(inviteError, 'Unable to invite member')),
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: TeamRole }) => selectedTeam ? changeRole(selectedTeam.id, userId, role) : Promise.reject(new Error('Select a team first')),
    onSuccess: refreshTeams,
    onError: (roleError) => setError(getTeamApiError(roleError, 'Unable to change role')),
  })

  const createMutation = useMutation({
    mutationFn: () => createTeam(teamName),
    onSuccess: (team) => {
      queryClient.setQueryData(['teams'], [...teams, team])
      setSelectedId(team.id)
      localStorage.setItem(selectedTeamKey, team.id)
      setTeamName('')
      setError(null)
    },
    onError: (createError) => setError(getTeamApiError(createError, 'Unable to create team')),
  })

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedTeam) inviteMutation.mutate()
  }

  function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate()
  }

  if (teamsQuery.isLoading) return <p className="text-on-surface">Loading teams...</p>
  if (teamsQuery.isError) return <p className="text-error">Unable to load teams.</p>

  return (
      <div className="mx-auto flex max-w-5xl flex-col gap-space-lg">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-end">
          <div>
            <p className="font-mono text-label-md uppercase tracking-wider text-primary">Workspace</p>
            <h1 className="text-headline-lg font-semibold text-on-surface">Team settings</h1>
            <p className="mt-space-xs text-body-md text-on-surface-variant">Manage collaborators and review access.</p>
          </div>
          {teams.length > 0 && (
            <label className="flex items-center gap-space-sm text-label-md text-on-surface-variant">
              <span>Active team</span>
              <select
                value={selectedTeam?.id ?? ''}
                onChange={(event) => { setSelectedId(event.target.value); localStorage.setItem(selectedTeamKey, event.target.value) }}
                className="rounded-lg border border-outline-variant/50 bg-surface-container px-space-md py-space-sm text-on-surface outline-none focus:border-primary"
              >
                {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
          )}
        </div>

        {error && <div className="rounded-lg border border-error/40 bg-error-container/20 p-space-sm text-body-sm text-error">{error}</div>}

        {selectedTeam && (
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-space-lg">
            <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-primary">add_business</span><h2 className="text-headline-sm font-semibold text-on-surface">Create another team</h2></div>
            <form onSubmit={submitTeam} className="mt-space-md flex flex-col gap-space-sm sm:flex-row">
              <input required minLength={2} value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Security engineering" className="flex-1 rounded-lg border border-outline-variant/50 bg-surface-container px-space-md py-space-sm text-on-surface outline-none focus:border-primary" />
              <button disabled={createMutation.isPending} className="rounded-lg bg-primary px-space-md py-space-sm font-semibold text-on-primary disabled:opacity-60">{createMutation.isPending ? 'Creating...' : 'Create team'}</button>
            </form>
          </section>
        )}

        {!selectedTeam ? (
          <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-space-lg">
            <h2 className="text-headline-sm font-semibold text-on-surface">Create your first team</h2>
            <form onSubmit={submitTeam} className="mt-space-md flex flex-col gap-space-sm sm:flex-row">
              <input required minLength={2} value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Platform team" className="flex-1 rounded-lg border border-outline-variant/50 bg-surface-container px-space-md py-space-sm text-on-surface outline-none focus:border-primary" />
              <button disabled={createMutation.isPending} className="rounded-lg bg-primary px-space-md py-space-sm font-semibold text-on-primary disabled:opacity-60">{createMutation.isPending ? 'Creating...' : 'Create team'}</button>
            </form>
          </section>
        ) : (
          <>
            <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-space-lg">
              <div className="flex items-center justify-between gap-space-md">
                <div>
                  <h2 className="text-headline-sm font-semibold text-on-surface">{selectedTeam.name}</h2>
                  <p className="mt-1 font-mono text-code-sm text-on-surface-variant">{selectedTeam.members.length} members</p>
                </div>
                <span className={`rounded-full border px-space-sm py-1 font-mono text-label-sm uppercase ${roleStyles[selectedTeam.role]}`}>{selectedTeam.role}</span>
              </div>
            </section>

            {selectedTeam.role === 'owner' && (
              <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-space-lg">
                <div className="flex items-center gap-space-sm"><span className="material-symbols-outlined text-primary">person_add</span><h2 className="text-headline-sm font-semibold text-on-surface">Invite a member</h2></div>
                <form onSubmit={submitInvite} className="mt-space-md flex flex-col gap-space-sm sm:flex-row">
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@company.dev" className="flex-1 rounded-lg border border-outline-variant/50 bg-surface-container px-space-md py-space-sm text-on-surface outline-none focus:border-primary" />
                  <button disabled={inviteMutation.isPending} className="rounded-lg bg-primary px-space-md py-space-sm font-semibold text-on-primary disabled:opacity-60">{inviteMutation.isPending ? 'Inviting...' : 'Invite as viewer'}</button>
                </form>
              </section>
            )}

            <section className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container-low">
              <div className="border-b border-outline-variant/30 px-space-lg py-space-md"><h2 className="text-headline-sm font-semibold text-on-surface">Members</h2></div>
              <div className="divide-y divide-outline-variant/20">
                {selectedTeam.members.map((member) => (
                  <div key={member.id} className="flex flex-col gap-space-sm px-space-lg py-space-md sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-space-sm">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-highest font-mono text-label-md text-primary">{member.display_name[0]?.toUpperCase()}</div>
                      <div className="min-w-0"><p className="truncate text-body-md font-medium text-on-surface">{member.display_name}</p><p className="truncate font-mono text-code-sm text-on-surface-variant">{member.email}</p></div>
                    </div>
                    {selectedTeam.role === 'owner' && member.role !== 'owner' ? (
                      <select value={member.role} onChange={(event) => roleMutation.mutate({ userId: member.user_id, role: event.target.value as TeamRole })} className={`w-fit rounded-full border px-space-sm py-1 font-mono text-label-sm outline-none ${roleStyles[member.role]}`}>
                        <option value="reviewer">reviewer</option><option value="viewer">viewer</option>
                      </select>
                    ) : <span className={`w-fit rounded-full border px-space-sm py-1 font-mono text-label-sm uppercase ${roleStyles[member.role]}`}>{member.role}</span>}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
  )
}