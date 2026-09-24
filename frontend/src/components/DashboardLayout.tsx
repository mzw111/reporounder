import { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useSpotlight } from '../../hooks/useSpotlight';

interface Props { children: ReactNode; }

export function DashboardLayout({ children }: Props) {
  useSpotlight();

  return (
    <div className="dark min-h-screen bg-surface font-sans text-on-surface antialiased">
      <div id="cursor-spotlight" />
      <Sidebar />

      <div className="pl-64">
        {/* Top header */}
        <header className="fixed top-0 left-64 right-0 h-14 bg-surface/90 backdrop-blur-xl z-40 flex items-center justify-between px-space-xl border-b border-outline-variant/30">
          {/* Search */}
          <div className="relative flex items-center w-72 bg-surface-container rounded-lg px-space-md py-space-xs text-on-surface-variant border border-outline-variant/30">
            <span className="material-symbols-outlined text-base mr-space-sm text-on-surface-variant">search</span>
            <span className="text-body-sm flex-1 select-none">Search reviews...</span>
            <span className="font-mono text-label-sm bg-surface-container-highest text-on-surface-variant px-space-xs py-0.5 rounded border border-outline-variant/40">⌘K</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-space-md">
            <div className="hidden lg:flex items-center gap-space-xs bg-surface-container border border-outline-variant/40 px-space-md py-space-xs rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
              <span className="font-mono text-code-sm text-on-surface">AI pipeline ready</span>
            </div>
            <button className="relative p-space-xs text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="pt-14 min-h-screen px-space-xl py-space-lg">
          {children}
        </main>
      </div>
    </div>
  );
}
