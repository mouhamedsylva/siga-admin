import { Ban, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSellers } from '@/api/hooks';
import type { Plan, Seller } from '@/api/types';
import { EmptyState, ErrorState, PageHeader, PlanBadge } from '@/components/common';
import { Pagination } from '@/components/Pagination';
import {
  Badge,
  Card,
  Input,
  NativeSelect,
  Skeleton,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';
import { formatAgo, formatDate, formatPhone } from '@/lib/format';
import { PLAN_LABEL } from '@/lib/verdict';

const PAGE_SIZE = 25;

/** Droits du vendeur, comme côté API (BillingService.entitlement). */
export function sellerRights(s: Pick<Seller, 'paidUntil' | 'freeLeft'>): string {
  if (s.paidUntil && new Date(s.paidUntil) > new Date()) return `Abonné jusqu’au ${formatDate(s.paidUntil)}`;
  if (s.freeLeft > 0) return `${s.freeLeft} essai${s.freeLeft > 1 ? 's' : ''} restant${s.freeLeft > 1 ? 's' : ''}`;
  return 'Aucun droit (offre envoyée)';
}

export function SellersPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(params.get('q') ?? '');
  const page = Number(params.get('page')) || 1;

  // Recherche avec un léger délai pour ne pas interroger l'API à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (q.trim()) next.set('q', q.trim());
      else next.delete('q');
      if ((params.get('q') ?? '') !== q.trim()) next.delete('page');
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, error } = useSellers({
    q: params.get('q') || undefined,
    plan: (params.get('plan') as Plan) || undefined,
    blocked: (params.get('blocked') as 'true' | 'false') || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader title="Vendeurs" description="Profils, droits et abonnements." />

      <Card className="mb-4 flex flex-wrap gap-3 p-4">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un numéro ou un nom"
            className="pl-9"
            aria-label="Rechercher un vendeur"
          />
        </div>
        <NativeSelect
          className="w-40"
          value={params.get('plan') ?? ''}
          onChange={(e) => set('plan', e.target.value)}
          aria-label="Plan"
        >
          <option value="">Tous les plans</option>
          {Object.entries(PLAN_LABEL).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          className="w-40"
          value={params.get('blocked') ?? ''}
          onChange={(e) => set('blocked', e.target.value)}
          aria-label="Blocage"
        >
          <option value="">Tous</option>
          <option value="false">Actifs</option>
          <option value="true">Bloqués</option>
        </NativeSelect>
      </Card>

      {error && <ErrorState error={error} />}

      <Card>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !data?.rows.length ? (
          <EmptyState icon={<Users />} title="Aucun vendeur" description="Les vendeurs apparaissent dès leur premier message WhatsApp." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>N°</Th>
                  <Th>Numéro</Th>
                  <Th>Nom</Th>
                  <Th>Plan</Th>
                  <Th>Droits</Th>
                  <Th>Dernier message</Th>
                  <Th>Inscrit le</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/vendeurs/${s.id}`)}
                    className="cursor-pointer transition-colors hover:bg-surface-muted"
                  >
                    <Td className="font-mono text-xs text-muted-foreground">{s.id}</Td>
                    <Td className="whitespace-nowrap font-medium">{formatPhone(s.waId)}</Td>
                    <Td>{s.displayName ?? <span className="text-muted-foreground">—</span>}</Td>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <PlanBadge plan={s.plan} />
                        {s.blocked && (
                          <Badge className="bg-faux-soft text-faux">
                            <Ban className="size-3" /> Bloqué
                          </Badge>
                        )}
                        {s.stopped && !s.blocked && (
                          <Badge className="bg-surface-muted text-muted-foreground">STOP</Badge>
                        )}
                      </span>
                    </Td>
                    <Td className="text-muted-foreground">{sellerRights(s)}</Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{formatAgo(s.lastInboundAt)}</Td>
                    <Td className="whitespace-nowrap text-muted-foreground">{formatDate(s.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={(p) => set('page', String(p))} />
          </>
        )}
      </Card>
    </>
  );
}
