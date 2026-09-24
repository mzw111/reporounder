import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/DashboardLayout';

// ── Mock data — replaced with real API data on Day 6 ──────────────────────
const MOCK_REVIEWS = [
  { id: '1', title: 'feat/auth-service refactor',    date: '2h ago',   findings: 8,  severity: 'critical', status: 'complete' },
  { id: '2', title: 'fix/websocket-reconnect',       date: '5h ago',   findings: 3,  severity: 'warning',  status: 'complete' },
  { id: '3', title: 'chore/dependency-updates',      date: 'Yesterday', findings: 1,  severity: 'info',     status: 'complete' },
  { id: '4', title: 'feat/redis-task-queue',         date: 'Yesterday', findings: 0,  severity: 'info',     status: 'pending'  },
  { id: '5', title: 'docs/api-reference-update',     date: '3 days ago', findings: 2, severity: 'warning',  status: 'complete' },
];

const MOCK_RECENT_FINDINGS = [
  { id: 'f1', severity: 'critical', message: 'SQL injection risk in user query builder',          line: 142, file: 'auth/queries.py' },
  { id: 'f2', severity: 'warning',  message: 'Unbounded Redis connection pool may exhaust memory', line: 38,  file: 'db/redis_client.py' },
  { id: 'f3', severity: 'warning',  message: 'JWT expiry not validated on refresh path',           line: 67,  file: 'core/security.py' },
  { id: 'f4', severity: 'info',     message: 'Function exceeds cyclomatic complexity threshold',   line: 201, file: 'services/review.py' },
];

const SEVERITY_COLOUR: Record<string, string> = {
  critical: 'text-critical border-critical/30 bg-critical/10',
  warning:  'text-warning  border-warning/30  bg-warning/10',
  info:     'text-info     border-info/30     bg-info/10',
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-critical',
  warning:  'bg-warning',
  info:     'bg-info',
};

export function DashboardPage() {
  const { user } = useAuth();

  const totalReviews  = MOCK_REVIEWS.length;
  const totalFindings = MOCK_REVIEWS.reduce((s, r) => s + r.findings, 0);
  const criticalCount = MOCK_RECENT_FINDINGS.filter(f => f.severity === 'critical').length;
  const completeCount = MOCK_REVIEWS.filter(r => r.status === 'complete').length;

  return (
    <DashboardLayout>
      <div className="flex flex-col w-full gap-space-lg">

        {/* ── Welcome banner ── */}
        <div className="spotlight-card relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-2xl">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-surface-container-highest/25 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm flex-wrap">
                <h1 className="text-headline-lg font-semibold text-primary tracking-tight">
                  Welcome back, {user?.display_name}
                </h1>
                <div className="flex items-center gap-space-xs bg-surface-container border border-outline-variant/40 px-space-sm py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-dot" />
                  <span className="font-mono text-code-sm text-primary">AI pipeline active</span>
                </div>
              </div>
              <p className="text-body-md text-on-surface-variant max-w-xl">
                {completeCount} of {totalReviews} reviews complete. {criticalCount} critical finding{criticalCount !== 1 ? 's' : ''} need attention.
              </p>
            </div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <Link
                to="/reviews/new"
                className="illuminable flex items-center gap-space-xs bg-primary text-on-primary font-semibold px-space-md py-space-sm rounded-lg text-label-md transition-all hover:bg-primary-fixed active:scale-95 shadow-[0_0_16px_rgba(255,255,255,0.15)]"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>New review</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
          {[
            { label: 'Total reviews',     value: totalReviews,  unit: 'submitted',  icon: 'code_blocks', trend: '+2 this week' },
            { label: 'Findings caught',   value: totalFindings, unit: 'total',      icon: 'bug_report',  trend: 'across all PRs' },
            { label: 'Critical issues',   value: criticalCount, unit: 'open',       icon: 'security',    trend: 'need attention' },
            { label: 'Reviews complete',  value: completeCount, unit: 'analysed',   icon: 'verified',    trend: `${Math.round(completeCount / totalReviews * 100)}% success rate` },
          ].map(({ label, value, unit, icon, trend }) => (
            <div key={label} className="spotlight-card relative overflow-hidden rounded-xl bg-surface-container-low p-space-md border border-outline-variant/30 shadow-md hover:border-outline-variant/60 transition-all">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-mono text-label-md text-on-surface-variant uppercase tracking-wider">{label}</span>
                <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
              </div>
              <div className="flex items-baseline gap-space-xs">
                <span className="text-headline-lg font-bold text-primary tracking-tight">{value}</span>
                <span className="font-mono text-code-sm text-on-surface-variant">{unit}</span>
              </div>
              <div className="mt-space-xs font-mono text-code-sm text-on-surface-variant">{trend}</div>
            </div>
          ))}
        </div>

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

          {/* ── Review history ── */}
          <div className="lg:col-span-8 spotlight-card rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between flex-wrap gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-2xl">history</span>
                <div>
                  <h2 className="text-headline-sm font-semibold text-on-surface">Recent reviews</h2>
                  <p className="font-mono text-code-sm text-on-surface-variant">{totalReviews} reviews in your workspace</p>
                </div>
              </div>
              <Link
                to="/reviews"
                className="illuminable flex items-center gap-1 bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/40 font-mono text-label-sm px-space-sm py-1.5 rounded-lg transition-all"
              >
                <span>View all</span>
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </Link>
            </div>

            <div className="flex flex-col gap-space-sm">
              {MOCK_REVIEWS.map(review => (
                <Link
                  key={review.id}
                  to={`/reviews/${review.id}`}
                  className="spotlight-card group flex flex-col sm:flex-row sm:items-center justify-between p-space-md bg-surface-container rounded-xl border border-outline-variant/30 hover:border-outline-variant/70 gap-space-sm transition-all"
                >
                  <div className="flex items-start gap-space-md min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-surface-container-highest border border-outline-variant/40 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined text-lg">merge</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-space-sm flex-wrap mb-1">
                        <span className="font-mono text-code-lg text-primary font-medium truncate">{review.title}</span>
                        {/* Status badge */}
                        <span className={`font-mono text-label-sm px-2 py-0.5 rounded border flex items-center gap-1 ${
                          review.status === 'pending'
                            ? 'bg-surface-container-highest border-outline-variant/40 text-on-surface-variant'
                            : 'bg-surface-container-highest border-outline-variant/40 text-primary'
                        }`}>
                          {review.status === 'pending' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse-dot" />
                          )}
                          {review.status === 'complete' && (
                            <span className="material-symbols-outlined text-xs text-primary">check_circle</span>
                          )}
                          {review.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-space-md font-mono text-code-sm text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {review.date}
                        </span>
                        {review.findings > 0 && (
                          <span className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[review.severity]}`} />
                            {review.findings} finding{review.findings !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-space-xs flex-shrink-0">
                    {review.findings > 0 && (
                      <span className={`font-mono text-label-sm px-2 py-0.5 rounded border ${SEVERITY_COLOUR[review.severity]}`}>
                        {review.severity}
                      </span>
                    )}
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-on-surface text-lg transition-colors">chevron_right</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Recent findings feed ── */}
          <div className="lg:col-span-4 spotlight-card rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/30 shadow-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">bug_report</span>
                <h2 className="text-headline-sm font-semibold text-on-surface">Recent findings</h2>
              </div>
              <span className="font-mono text-label-sm bg-primary text-on-primary px-space-xs py-0.5 rounded font-bold">
                {MOCK_RECENT_FINDINGS.length} open
              </span>
            </div>

            <div className="flex flex-col gap-space-md">
              {MOCK_RECENT_FINDINGS.map(finding => (
                <div key={finding.id} className="spotlight-card p-space-md rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-label-sm px-2 py-0.5 rounded border uppercase ${SEVERITY_COLOUR[finding.severity]}`}>
                      {finding.severity}
                    </span>
                    <span className="font-mono text-code-sm text-on-surface-variant">:{finding.line}</span>
                  </div>
                  <p className="text-body-sm text-on-surface leading-snug">{finding.message}</p>
                  <div className="flex items-center gap-1 font-mono text-code-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">code</span>
                    <span className="truncate">{finding.file}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Placeholder note */}
            <div className="mt-auto p-space-sm bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
              <p className="font-mono text-code-sm text-on-surface-variant text-center">
                Live findings from AI pipeline — Day 6
              </p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
