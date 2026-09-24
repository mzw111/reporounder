import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSpotlight } from '../../hooks/useSpotlight';

export function LoginPage() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useSpotlight();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between relative overflow-x-hidden">
      <div id="cursor-spotlight" />

      {/* Ambient background halo */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center -z-10">
        <div className="w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[140px]" />
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

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center px-gutter py-space-lg">
        <div className="w-full max-w-[480px]">
          {/* Ambient card glow */}
          <div className="absolute -translate-x-1/2 w-96 h-96 bg-white/[0.02] rounded-full blur-[120px] pointer-events-none -z-10" />

          <div className="spotlight-card bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-2xl p-space-xl flex flex-col relative overflow-hidden">
            {/* Top edge sheen */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            {/* Card header */}
            <div className="flex flex-col items-center text-center mb-space-lg relative z-10">
              <div className="illuminable mb-space-md p-2 bg-surface-container-high border border-outline-variant/40 rounded-xl shadow-md">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>code_blocks</span>
              </div>
              <h1 className="text-headline-lg font-semibold text-on-surface tracking-tight mb-space-xs">
                Welcome back
              </h1>
              <p className="text-body-md text-on-surface-variant max-w-sm">
                Sign in to your code review workspace
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-space-md relative z-10">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-label-md text-on-surface-variant font-mono" htmlFor="email">
                  Email
                </label>
                <div className="illuminable relative flex items-center rounded-lg">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-lg pointer-events-none z-10">
                    alternate_email
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.dev"
                    className="w-full pl-10 pr-space-md py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/50 hover:border-outline-variant rounded-lg outline-none transition-all placeholder:text-outline/50 focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-code-md"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-label-md text-on-surface-variant font-mono" htmlFor="password">
                    Password
                  </label>
                  <a href="#" className="text-body-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium">
                    Forgot password?
                  </a>
                </div>
                <div className="illuminable relative flex items-center rounded-lg">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-lg pointer-events-none z-10">
                    lock
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest text-on-surface border border-outline-variant/50 hover:border-outline-variant rounded-lg outline-none transition-all placeholder:text-outline/50 focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-code-md tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 text-outline hover:text-on-surface transition-colors z-10"
                    aria-label="Toggle password visibility"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
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
              <button
                type="submit"
                disabled={loading}
                className="illuminable w-full mt-space-xs py-3 px-space-md bg-primary hover:bg-primary-fixed text-on-primary font-semibold text-headline-sm rounded-lg shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-space-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {loading ? 'Signing in...' : 'Sign in'}
                </span>
                {!loading && (
                  <span className="material-symbols-outlined text-[20px] relative z-10">arrow_forward</span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-space-lg pt-space-md flex items-center justify-center relative z-10 border-t border-outline-variant/20">
              <p className="text-body-md text-on-surface-variant">
                No account?{' '}
                <Link to="/register" className="text-on-surface hover:text-primary font-semibold transition-colors underline underline-offset-4">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom status line */}
          <div className="mt-space-md flex items-center justify-center gap-space-md text-on-surface-variant font-mono text-code-sm">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>API connected</span>
            </div>
            <span>·</span>
            <span>RepoRounder v0.1</span>
          </div>
        </div>
      </main>

      <footer className="py-space-lg flex items-center justify-center text-on-surface-variant font-mono text-code-sm">
        <span>© 2026 RepoRounder</span>
      </footer>
    </div>
  );
}
