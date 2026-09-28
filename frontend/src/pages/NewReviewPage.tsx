import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAnalysisStatus } from '../hooks/useAnalysisStatus';
import { createReview, getApiErrorMessage } from '../lib/reviewApi';
import { getMyTeams } from '../lib/teamApi';

export function NewReviewPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [diff, setDiff] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: getMyTeams });
  const [teamId, setTeamId] = useState(() => localStorage.getItem('selected_team_id') ?? '');

  const statusQuery = useAnalysisStatus(reviewId, Boolean(reviewId));
  const status = statusQuery.data?.status ?? 'pending';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const review = await createReview(title, diff, teamId || undefined);
      setReviewId(review.id);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to create review'));
    } finally {
      setSubmitting(false);
    }
  }

  if (reviewId && status !== 'complete' && status !== 'error') {
    return (
      <>
        <div className="spotlight-card max-w-xl w-full rounded-xl bg-surface-container-low p-space-xl border border-outline-variant/30 text-center">
          <p className="text-headline-md font-semibold text-on-surface">Analysis in progress...</p>
          <p className="mt-space-md text-body-md text-on-surface-variant">AI is reviewing your code.</p>
          <p className="text-body-md text-on-surface-variant">This usually takes a few seconds.</p>
          <div className="mt-space-lg flex justify-center">
            <span className="material-symbols-outlined text-primary animate-pulse text-4xl">sync</span>
          </div>
        </div>
      </>
    );
  }

  if (reviewId && status === 'complete') {
    return (
      <>
        <div className="spotlight-card max-w-3xl w-full rounded-xl bg-surface-container-low p-space-xl border border-outline-variant/30">
          <p className="text-headline-md font-semibold text-on-surface">Analysis complete</p>
          <div className="mt-space-lg space-y-space-md">
            {statusQuery.data && statusQuery.data.status === 'complete' ? (
              <span className="text-body-md text-primary">Review is ready.</span>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
      <form onSubmit={handleSubmit} className="spotlight-card w-full max-w-2xl rounded-xl bg-surface-container-low p-space-xl border border-outline-variant/30">
        <h1 className="text-headline-lg font-semibold text-on-surface">New review</h1>
        <div className="mt-space-lg flex flex-col gap-space-md">
          <label className="flex flex-col gap-space-xs">
            <span className="font-mono text-label-md text-on-surface-variant">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-lg border border-outline-variant/50 bg-surface-container text-on-surface px-space-md py-space-sm focus:border-primary outline-none"
            />
          </label>

          {teamsQuery.data && teamsQuery.data.length > 0 && (
            <label className="flex flex-col gap-space-xs">
              <span className="font-mono text-label-md text-on-surface-variant">Team workspace</span>
              <select value={teamId} onChange={(event) => { setTeamId(event.target.value); localStorage.setItem('selected_team_id', event.target.value) }} className="rounded-lg border border-outline-variant/50 bg-surface-container px-space-md py-space-sm text-on-surface outline-none focus:border-primary">
                <option value="">Personal review</option>
                {teamsQuery.data.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-space-xs">
            <span className="font-mono text-label-md text-on-surface-variant">Diff</span>
            <textarea
              value={diff}
              onChange={(e) => setDiff(e.target.value)}
              required
              rows={14}
              className="rounded-lg border border-outline-variant/50 bg-surface-container text-on-surface px-space-md py-space-sm focus:border-primary outline-none font-mono text-code-sm"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-error/40 bg-error-container/20 p-space-sm text-error text-body-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="illuminable mt-space-sm inline-flex items-center justify-center rounded-lg bg-primary px-space-md py-space-sm text-on-primary font-semibold disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit review'}
          </button>
        </div>
      </form>
      </div>
  );
}
