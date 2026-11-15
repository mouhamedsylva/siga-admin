import { AlertTriangle, Inbox, Monitor, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Plan, Verdict, VerificationStatus } from '@/api/types';
import { cn } from '@/lib/utils';
import {
  PLAN_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  VERDICT_LABEL,
  VERDICT_STYLE,
} from '@/lib/verdict';
import { useTheme, type ThemeChoice } from '@/theme/ThemeProvider';
import { Badge } from './ui/primitives';

const VERDICT_DOT: Record<Verdict, string> = {
  coherent: 'bg-coherent',
  douteux: 'bg-douteux',
  faux_probable: 'bg-faux',
};

export function VerdictBadge({
  verdict,
  className,
}: {
  verdict: Verdict | null;
  className?: string;
}) {
  if (!verdict) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge className={cn(VERDICT_STYLE[verdict], className)}>
      <span className={cn('size-1.5 rounded-full', VERDICT_DOT[verdict])} aria-hidden />
      {VERDICT_LABEL[verdict]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: VerificationStatus }) {
  return <Badge className={STATUS_STYLE[status]}>{STATUS_LABEL[status]}</Badge>;
}

export function PlanBadge({ plan }: { plan: Plan }) {
  const style =
    plan === 'founder'
      ? 'bg-primary-soft text-primary'
      : plan === 'standard'
        ? 'bg-accent-soft text-foreground'
        : 'bg-surface-muted text-muted-foreground';
  return <Badge className={style}>{PLAN_LABEL[plan]}</Badge>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="mb-2 rounded-full bg-primary-soft p-3 text-primary [&_svg]:size-6">
        {icon ?? <Inbox />}
      </div>
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-faux/30 bg-faux-soft px-4 py-3 text-sm text-faux">
      <AlertTriangle className="size-4 shrink-0" />
      {error instanceof Error ? error.message : 'Une erreur est survenue'}
    </div>
  );
}

const THEME_OPTIONS: Array<{ value: ThemeChoice; label: string; icon: ReactNode }> = [
  { value: 'light', label: 'Clair', icon: <Sun /> },
  { value: 'dark', label: 'Sombre', icon: <Moon /> },
  { value: 'system', label: 'Système', icon: <Monitor /> },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { choice, setChoice } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Thème"
      className={cn('inline-flex rounded-md bg-white/10 p-0.5', className)}
    >
      {THEME_OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={choice === o.value}
          title={o.label}
          onClick={() => setChoice(o.value)}
          className={cn(
            'rounded p-1.5 text-sidebar-muted transition-colors hover:text-sidebar-foreground [&_svg]:size-4 cursor-pointer',
            choice === o.value && 'bg-sidebar-active text-sidebar-foreground',
          )}
        >
          {o.icon}
          <span className="sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Ligne « libellé : valeur » des fiches de détail */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}
