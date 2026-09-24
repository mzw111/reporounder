import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSpotlight } from '../../hooks/useSpotlight';

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['', 'Weak', 'Moderate', 'Good', 'Strong'];
  return { score, label: labels[score] ?? '' };
}

export function RegisterPage() {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useSpotlight();

  const strength = passwordStrength(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ email, password, display_name: displayName });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between relative overflow-x-hidden">
      <div id="cursor-spotlight" />

      {/* Background halos */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/[0.03] rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="w-full pt-space-xl pb-space-md flex items-center justify-center">
        <div className="flex items-center gap-space-sm">
          <div className="h-8 w-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">code_blocks</span>
          </div>
          <span className="text-headline-sm font-semibold text-on-surface tracking-tight">RepoRounder</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-gutter py-space-lg">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-stretch">

            {/* ── Left info panel ── */}
            <div className="spotlight-card lg:col-span-5 flex flex-col justify-between p-space-lg bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-2xl relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="flex flex-col gap-space-lg relative z-10">
                {/* Live status badge */}
                <div className="illuminable inline-flex items-center gap-space-xs px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/30 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
                  <span className="font-mono text-label-sm text-on-surface-variant tracking-wider">API online · &lt;18ms</span>
                </div>

                {/* Brand */}
                <div>
                  <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight leading-tight mb-space-sm">
                    Code review,<br />made intelligent
                  </h1>
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    Paste a PR diff, get AI findings pinned to exact lines. Review together with your team in real time.
                  </p>
                </div>

                {/* Feature list */}
                <div className="flex flex-col gap-space-sm">
                  {[
                    { icon: 'security', label: 'Security vulnerability detection' },
                    { icon: 'bolt',     label: 'Async AI analysis pipeline' },
                    { icon: 'group',    label: 'Real-time team collaboration' },
                    { icon: 'timeline', label: 'Review history and metrics' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="illuminable flex items-center gap-space-sm p-space-sm bg-surface-container-low border border-outline-variant/30 rounded-lg">
                      <span className="material-symbols-outlined text-primary text-base">{icon}</span>
                      <span className="text-body-sm text-on-surface-variant">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom stat */}
              <div className="illuminable mt-space-lg p-space-md bg-surface-container-low border border-outline-variant/30 rounded-lg relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-label-sm text-on-surface-variant mb-1">Avg. findings per review</div>
                    <div className="text-headline-md font-semibold text-on-surface">12 issues caught</div>
                    <div className="font-mono text-code-sm text-on-surface-variant">before they hit production</div>
                  </div>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '36px' }}>verified</span>
                </div>
              </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="spotlight-card lg:col-span-7 flex flex-col p-space-lg bg-surface-container border border-outline-variant/40 rounded-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-12 w-32 h-[1px] bg-primary z-10" />

              {/* Form header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs pb-space-md mb-space-md border-b border-outline-variant/20 relative z-10">
                <div>
                  <h2 className="text-headline-md font-semibold text-on-surface tracking-tight">Create your workspace</h2>
                  <p className="text-body-sm text-on-surface-variant">Free to start. No credit card needed.</p>
                </div>
                <div className="illuminable inline-flex items-center gap-1.5 px-space-sm py-1 rounded bg-surface-container-highest border border-outline-variant/40 font-mono text-label-sm text-on-surface-variant self-start sm:self-auto">
                  <span className="material-symbols-outlined text-primary text-sm">terminal</span>
                  <span>Free tier</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-space-md relative z-10">
                {/* Name + Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-label-md text-on-surface-variant" htmlFor="display-name">
                      Display name
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">badge</span>
                      <input
                        id="display-name"
                        type="text"
                        required
                        minLength={2}
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Zaid"
                        className="illuminable w-full pl-10 pr-space-md py-2.5 rounded bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-mono text-code-md placeholder:text-outline/50 focus:outline-none focus:border-primary focus:bg-surface-container-low transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-label-md text-on-surface-variant" htmlFor="reg-email">
                      Email
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">alternate_email</span>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@company.dev"
                        className="illuminable w-full pl-10 pr-space-md py-2.5 rounded bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-mono text-code-md placeholder:text-outline/50 focus:outline-none focus:border-primary focus:bg-surface-container-low transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Password + strength */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-label-md text-on-surface-variant" htmlFor="reg-password">
                      Password
                    </label>
                    {password && (
                      <span className={`font-mono text-code-sm font-medium ${
                        strength.score <= 1 ? 'text-on-surface-variant' :
                        strength.score === 2 ? 'text-warning' :
                        strength.score === 3 ? 'text-info' : 'text-primary'
                      }`}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">lock</span>
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 chars, include a number"
                      className="illuminable w-full pl-10 pr-10 py-2.5 rounded bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-mono text-code-md placeholder:text-outline/50 focus:outline-none focus:border-primary focus:bg-surface-container-low transition-all tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* Strength bars */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-colors duration-300 ${
                          i <= strength.score ? 'bg-primary' : 'bg-surface-container-highest'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between font-mono text-code-sm text-on-surface-variant">
                    <span>Min 8 characters</span>
                    <span>Include a number</span>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-space-xs p-space-sm bg-error-container/20 border border-error/30 rounded-lg">
                    <span className="material-symbols-outlined text-error text-base">error</span>
                    <p className="text-body-sm text-error">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-space-xs">
                  <button
                    type="submit"
                    disabled={loading}
                    className="illuminable w-full py-3 px-space-lg rounded bg-primary hover:bg-primary-fixed text-on-primary font-semibold text-headline-sm flex items-center justify-center gap-space-sm transition-all active:scale-[0.99] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-xl">rocket_launch</span>
                    <span>{loading ? 'Creating workspace...' : 'Create free account'}</span>
                    {!loading && <span className="material-symbols-outlined text-xl">arrow_forward</span>}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-center">
                  <span className="text-body-sm text-on-surface-variant">Already have an account?</span>
                  <Link to="/login" className="text-body-sm font-semibold text-on-surface hover:text-primary transition-colors underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-space-lg flex items-center justify-center text-on-surface-variant font-mono text-code-sm">
        <span>© 2026 RepoRounder</span>
      </footer>
    </div>
  );
}
