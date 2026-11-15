import { Activity, ClipboardCheck, Crown, TrendingUp, Users } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStats } from '@/api/hooks';
import type { Verdict } from '@/api/types';
import { EmptyState, ErrorState, PageHeader } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/primitives';
import { formatNumber, formatPercent } from '@/lib/format';
import { VERDICT_COLOR, VERDICT_LABEL } from '@/lib/verdict';

const PERIODS = [7, 30, 90] as const;

export function StatsPage() {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading, error } = useStats(days);

  // Série continue : un point par jour, même sans vérification
  const series = useMemo(() => {
    if (!data) return [];
    const byDay = new Map(data.perDay.map((d) => [d.day, d.count]));
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
      return { day: d, label: d.slice(8, 10) + '/' + d.slice(5, 7), count: byDay.get(d) ?? 0 };
    });
  }, [data, days]);

  const verdicts = useMemo(
    () =>
      (['coherent', 'douteux', 'faux_probable'] as Verdict[])
        .map((v) => ({ key: v, name: VERDICT_LABEL[v], value: data?.verdicts[v] ?? 0 }))
        .filter((v) => v.value > 0),
    [data],
  );
  const total = series.reduce((s, d) => s + d.count, 0);

  return (
    <>
      <PageHeader
        title="Statistiques"
        description="Usage, conversion et qualité des verdicts."
        actions={
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              {PERIODS.map((p) => (
                <TabsTrigger key={p} value={String(p)}>
                  {p} jours
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />
      {error && <ErrorState error={error} />}
      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi icon={<Activity />} label="Verdicts envoyés" value={formatNumber(total)} hint={`sur ${days} jours`} />
            <Kpi icon={<Users />} label="Vendeurs actifs" value={formatNumber(data.activeSellers7d)} hint={`7 derniers jours · ${formatNumber(data.sellers)} inscrits`} />
            <Kpi icon={<TrendingUp />} label="Conversion essai → payant" value={formatPercent(data.trialToPaidRate)} hint={`${formatNumber(data.payingSellers)} vendeur(s) payant(s)`} />
            <Kpi icon={<Crown />} label="Places fondateur" value={formatNumber(data.founderSlotsLeft)} hint="restantes" />
            <Kpi icon={<ClipboardCheck />} label="File de relecture" value={formatNumber(data.reviewQueue)} hint={`${formatNumber(data.rejected)} rejet(s) sur la période`} accent={data.reviewQueue > 0} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Verdicts envoyés par jour</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {total === 0 ? (
                  <EmptyState title="Aucun verdict sur la période" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ fill: 'var(--surface-muted)' }}
                        contentStyle={tooltipStyle}
                        labelFormatter={(l) => `Le ${l}`}
                        formatter={(v) => [v, 'Verdicts']}
                      />
                      <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition des verdicts</CardTitle>
                <CardDescription>Verdicts envoyés sur la période</CardDescription>
              </CardHeader>
              <CardContent>
                {verdicts.length === 0 ? (
                  <EmptyState title="Pas encore de verdict" />
                ) : (
                  <>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={verdicts}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            outerRadius="90%"
                            paddingAngle={2}
                            stroke="var(--surface)"
                          >
                            {verdicts.map((v) => (
                              <Cell key={v.key} fill={VERDICT_COLOR[v.key]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {verdicts.map((v) => {
                        const sum = verdicts.reduce((s, x) => s + x.value, 0);
                        return (
                          <li key={v.key} className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="size-2.5 rounded-full" style={{ background: VERDICT_COLOR[v.key] }} />
                              {v.name}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatNumber(v.value)} · {formatPercent(v.value / sum)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--foreground)',
  fontSize: 12,
};

function Kpi({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={
            accent
              ? 'rounded-md bg-accent-soft p-1.5 text-foreground [&_svg]:size-4'
              : 'rounded-md bg-primary-soft p-1.5 text-primary [&_svg]:size-4'
          }
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
