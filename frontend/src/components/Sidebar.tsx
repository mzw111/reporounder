import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { icon: 'dashboard',   label: 'Dashboard',   path: '/dashboard' },
  { icon: 'code_blocks', label: 'Reviews',      path: '/reviews' },
  { icon: 'group',       label: 'Team',         path: '/team' },
  { icon: 'settings',   label: 'Settings',     path: '/settings' },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant/30 z-50 flex flex-col justify-between py-space-md shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
      {/* Top */}
      <div className="flex flex-col gap-space-lg">
        {/* Logo */}
        <div className="px-space-lg flex items-center gap-space-sm">
          <div className="h-8 w-8 rounded-lg bg-surface-container-highest border border-outline-variant/40 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-lg">code_blocks</span>
          </div>
          <div className="flex flex-col">
            <span className="text-headline-sm font-semibold text-primary tracking-tight leading-none">RepoRounder</span>
            <span className="font-mono text-code-sm text-on-surface-variant tracking-wider mt-0.5">v0.1 · dev</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-space-xs px-space-md">
          {NAV.map(({ icon, label, path }) => {
            const active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors text-label-md font-medium ${
                  active
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: user + logout */}
      <div className="flex flex-col gap-space-xs px-space-md">
        {/* Live ping */}
        <div className="mb-space-xs p-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot" />
            <span className="font-mono text-code-sm text-on-surface-variant">All systems normal</span>
          </div>
        </div>

        {/* User card */}
        <div className="illuminable flex items-center justify-between p-space-sm rounded-lg bg-surface-container border border-outline-variant/30">
          <div className="flex items-center gap-space-sm overflow-hidden">
            <div className="h-7 w-7 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-mono text-label-sm text-primary font-semibold flex-shrink-0">
              {user?.display_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-body-sm font-medium text-on-surface truncate">{user?.display_name}</span>
              <span className="font-mono text-code-sm text-on-surface-variant truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0 ml-1"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
