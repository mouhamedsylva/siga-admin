import { RotateCcw, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useVerification, useVerifications } from '@/api/hooks';
import type { Verdict, VerificationFilters, VerificationStatus } from '@/api/types';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatusBadge,
  VerdictBadge,
} from '@/components/common';
import { Pagination } from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Dialog, SheetContent } from '@/components/ui/dialog';
import {
  Card,
  Input,
  Label,
  NativeSelect,
  Skeleton,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';
import { VerificationSummary } from '@/components/VerificationDetail';
import { formatDateTime, formatFcfa, OPERATOR_LABEL } from '@/lib/format';
import { RULES } from '@/lib/rules';
import { STATUS_LABEL, VERDICT_LABEL } from '@/lib/verdict';

const PAGE_SIZE = 25;

export function VerificationsPage() {
  // Filtres dans l'URL : la vue est partageable et survit au rechargement
  const [params, setParams] = useSearchParams();
  const filters: VerificationFilters = {
    status: (params.get('status') as VerificationStatus) || undefined,
    verdict: (params.get('verdict') as Verdict) || undefined,
    sellerId: params.get('sellerId') || undefined,
    from: params.get('from') || undefined,
    to: params.get('to') ? `${params.get('to')}T23:59:59` : undefined,
    page: Number(params.get('page')) || 1,
    pageSize: PAGE_SIZE,
  };
  const { data, isLoading, isFetching, error } = useVerifications(filters);
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = useVerification(openId);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const hasFilters = ['status', 'verdict', 'sellerId', 'from', 'to'].some((k) => params.get(k));

  return (
    <>
      <PageHeader
        title="Vérifications"
        description="Toutes les preuves reçues, avec leur statut et leur verdict."
      />

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <div className="space-y-1">
            <Label htmlFor="f-status" className="text-xs text-muted-foreground">Statut</Label>
            <NativeSelect
              id="f-status"
              value={params.get('status') ?? ''}
              onChange={(e) => setFilter('status', e.target.value)}
            >
              <option value="">Tous</option>
              {Object.entries(STATUS_LABEL).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-verdict" className="text-xs text-muted-foreground">Verdict</Label>
            <NativeSelect
              id="f-verdict"
              value={params.get('verdict') ?? ''}
              onChange={(e) => setFilter('verdict', e.target.value)}
            >
              <option value="">Tous</option>
              {Object.entries(VERDICT_LABEL).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-seller" className="text-xs text-muted-foreground">Vendeur n°</Label>
            <Input
              id="f-seller"
              inputMode="numeric"
              value={params.get('sellerId') ?? ''}
              onChange={(e) => setFilter('sellerId', e.target.value.replace(/\D/g, ''))}
              placeholder="ex. 12"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-from" className="text-xs text-muted-foreground">Du</Label>
            <Input
              id="f-from"
              type="date"
              value={params.get('from') ?? ''}
              onChange={(e) => setFilter('from', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-to" className="text-xs text-muted-foreground">Au</Label>
            <Input
              id="f-to"
              type="date"
              value={params.get('to') ?? ''}
              onChange={(e) => setFilter('to', e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              className="w-full"
              disabled={!hasFilters}
              onClick={() => setParams({}, { replace: true })}
            >
              <RotateCcw /> Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {error && <ErrorState error={error} />}

      <Card className={isFetching && !isLoading ? 'opacity-70 transition-opacity' : ''}>
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !data?.rows.length ? (
          <EmptyState
            icon={<SearchX />}
            title="Aucune vérification"
            description={hasFilters ? 'Aucun résultat pour ces filtres.' : 'Les preuves envoyées par les vendeurs apparaîtront ici.'}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>N°</Th>
                  <Th>Reçue le</Th>
                  <Th>Vendeur</Th>
                  <Th>Opérateur</Th>
                  <Th className="text-right">Montant</Th>
                  <Th>Verdict</Th>
                  <Th>Statut</Th>
                  <Th>Règle principale</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((v) => {
                  const main = v.reasons.find((r) => r.effect !== 'warning') ?? v.reasons[0];
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setOpenId(v.id)}
                      className="cursor-pointer transition-colors hover:bg-surface-muted"
                    >
                      <Td className="font-mono text-xs text-muted-foreground">{v.id}</Td>
                      <Td className="whitespace-nowrap">{formatDateTime(v.createdAt)}</Td>
                      <Td>
                        <Link
                          to={`/vendeurs/${v.sellerId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline"
                        >
                          n°{v.sellerId}
                        </Link>
                      </Td>
                      <Td>{v.operator ? OPERATOR_LABEL[v.operator] ?? v.operator : '—'}</Td>
                      <Td className="text-right font-medium tabular-nums">{formatFcfa(v.amountXof)}</Td>
                      <Td><VerdictBadge verdict={v.verdict} /></Td>
                      <Td><StatusBadge status={v.status} /></Td>
                      <Td className="text-muted-foreground">
                        {main ? `${main.rule} · ${RULES[main.rule]?.title ?? ''}` : '—'}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination
              page={filters.page}
              pageSize={PAGE_SIZE}
              total={data.total}
              onPage={(p) => setFilter('page', String(p))}
            />
          </>
        )}
      </Card>

      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent title={openId ? `Vérification n°${openId}` : 'Vérification'} className="max-w-4xl">
          {detail.isLoading && <Skeleton className="h-96" />}
          {detail.error && <ErrorState error={detail.error} />}
          {detail.data && <VerificationSummary v={detail.data} />}
        </SheetContent>
      </Dialog>
    </>
  );
}
