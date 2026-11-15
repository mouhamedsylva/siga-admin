import {
  BarChart3,
  ClipboardCheck,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { Suspense, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLogout, useMe, useReviewQueue } from '@/api/hooks';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './common';

const NAV: Array<{ to: string; label: string; icon: ReactNode; badge?: 'review' }> = [
  { to: '/relecture', label: 'Relecture', icon: <ClipboardCheck />, badge: 'review' },
  { to: '/verifications', label: 'Vérifications', icon: <ListChecks /> },
  { to: '/vendeurs', label: 'Vendeurs', icon: <Users /> },
  { to: '/statistiques', label: 'Statistiques', icon: <BarChart3 /> },
  { to: '/parametres', label: 'Paramètres', icon: <Settings /> },
];

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm dark:text-primary-foreground">
        <ShieldCheck className="size-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-bold tracking-wide text-sidebar-foreground">SIGA</div>
        <div className="text-[11px] text-sidebar-muted">Back-office</div>
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { data: me } = useMe();
  const { data: queue } = useReviewQueue();
  const logout = useLogout();
  const navigate = useNavigate();
  const waiting = queue?.length ?? 0;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Navigation principale">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-active/60 hover:text-sidebar-foreground [&_svg]:size-4',
                isActive && 'bg-sidebar-active text-sidebar-foreground',
              )
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge === 'review' && waiting > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-slate-950">
                {waiting}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 border-t border-white/10 p-4">
        <ThemeToggle />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11px] text-sidebar-muted">Connecté</div>
            <div className="truncate text-sm font-medium">{me?.login}</div>
          </div>
          <button
            type="button"
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/connexion') })}
            className="rounded-md p-2 text-sidebar-muted hover:bg-sidebar-active hover:text-sidebar-foreground cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-full">
      {/* Barre latérale fixe sur grand écran */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Tiroir sur mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64">
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 rounded-md bg-surface p-2 cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-sidebar px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-sidebar-foreground cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>
          <Logo />
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Suspense
              fallback={
                <div className="flex min-h-60 items-center justify-center text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
