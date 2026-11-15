import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Ban, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useBlockSeller, useRecordPayment, useSeller } from '@/api/hooks';
import type { SellerDetail } from '@/api/types';
import {
  EmptyState,
  ErrorState,
  Field,
  PlanBadge,
  StatusBadge,
  VerdictBadge,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FieldError,
  Input,
  Label,
  NativeSelect,
  Skeleton,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';
import {
  formatAgo,
  formatDate,
  formatDateTime,
  formatFcfa,
  formatPhone,
} from '@/lib/format';
import { cn } from '@/lib/utils';
import { PLAN_LABEL } from '@/lib/verdict';
import { sellerRights } from './Sellers';

export function SellerDetailPage() {
  const { id = '' } = useParams();
  const { data: s, isLoading, error } = useSeller(id);

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <ErrorState error={error} />;
  if (!s) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/vendeurs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Vendeurs
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{formatPhone(s.waId)}</h1>
            <PlanBadge plan={s.plan} />
            {s.blocked && <Badge className="bg-faux-soft text-faux">Bloqué</Badge>}
            {s.stopped && <Badge className="bg-surface-muted text-muted-foreground">STOP</Badge>}
          </div>
          <div className="flex gap-2">
            <PaymentDialog seller={s} />
            <BlockButton seller={s} />
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Vendeur n°{s.id}
          {s.displayName ? ` · ${s.displayName}` : ''} · inscrit le {formatDate(s.createdAt)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Droits et consommation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Droits">{sellerRights(s)}</Field>
              <Field label="Essais restants">{s.freeLeft}</Field>
              <Field label="Abonné jusqu’au">{formatDate(s.paidUntil)}</Field>
              <Field label="Dernier message">{formatAgo(s.lastInboundAt)}</Field>
            </dl>
            {s.entitlement === 'subscription' && <QuotaBar seller={s} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Consentement</CardTitle>
          </CardHeader>
          <CardContent>
            {s.consents[0] ? (
              <dl className="space-y-3">
                <Field label="Version des conditions">{s.consents[0].docVersion}</Field>
                <Field label="Acceptées le">{formatDateTime(s.consents[0].acceptedAt)}</Field>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Conditions pas encore acceptées.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paiements</CardTitle>
        </CardHeader>
        {s.payments.length ? (
          <Table>
            <thead>
              <tr>
                <Th>Payé le</Th>
                <Th>Plan</Th>
                <Th className="text-right">Montant</Th>
                <Th>Période</Th>
                <Th>Méthode</Th>
                <Th>Référence</Th>
                <Th>Enregistré par</Th>
              </tr>
            </thead>
            <tbody>
              {s.payments.map((p) => (
                <tr key={p.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(p.paidAt)}</Td>
                  <Td><PlanBadge plan={p.plan} /></Td>
                  <Td className="text-right font-medium tabular-nums">{formatFcfa(p.amountXof)}</Td>
                  <Td className="whitespace-nowrap">{formatDate(p.periodStart)} → {formatDate(p.periodEnd)}</Td>
                  <Td>{p.method ?? '—'}</Td>
                  <Td className="font-mono text-xs">{p.externalId ?? '—'}</Td>
                  <Td>{p.recordedBy ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={<CreditCard />} title="Aucun paiement" description="Enregistre un paiement pour activer l’abonnement." />
        )}
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>20 dernières vérifications</CardTitle>
          <Link to={`/verifications?sellerId=${s.id}`} className="text-sm text-primary hover:underline">
            Tout voir
          </Link>
        </CardHeader>
        {s.verifications.length ? (
          <Table>
            <thead>
              <tr>
                <Th>N°</Th>
                <Th>Reçue le</Th>
                <Th className="text-right">Montant</Th>
                <Th>Verdict</Th>
                <Th>Statut</Th>
                <Th>Décomptée</Th>
              </tr>
            </thead>
            <tbody>
              {s.verifications.map((v) => (
                <tr key={v.id}>
                  <Td className="font-mono text-xs text-muted-foreground">{v.id}</Td>
                  <Td className="whitespace-nowrap">{formatDateTime(v.createdAt)}</Td>
                  <Td className="text-right tabular-nums">{formatFcfa(v.amountXof)}</Td>
                  <Td><VerdictBadge verdict={v.verdict} /></Td>
                  <Td><StatusBadge status={v.status} /></Td>
                  <Td>{v.counted ? 'Oui' : 'Non'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState title="Aucune vérification" />
        )}
      </Card>
    </div>
  );
}

function QuotaBar({ seller }: { seller: SellerDetail }) {
  const { used, quota, overage } = seller.usage;
  const pct = Math.min(100, Math.round((used / quota) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Forfait du mois</span>
        <span className="font-medium tabular-nums">
          {used} / {quota}
          {overage > 0 && <span className="ml-2 text-douteux">+{overage} hors forfait</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn('h-full rounded-full', pct >= 100 ? 'bg-douteux' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const paymentSchema = z.object({
  plan: z.enum(['founder', 'standard']),
  amountXof: z.coerce.number().int('Montant entier en FCFA').positive('Montant requis'),
  months: z.coerce.number().int().min(1).max(12),
  method: z.string().trim().max(40).optional(),
  externalId: z.string().trim().max(80).optional(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

/** Tarifs par défaut du cahier des charges (modifiables dans le formulaire). */
const DEFAULT_PRICE = { founder: 2000, standard: 3000 } as const;

function PaymentDialog({ seller }: { seller: SellerDetail }) {
  const [open, setOpen] = useState(false);
  const record = useRecordPayment(seller.id);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { plan: 'founder', amountXof: DEFAULT_PRICE.founder, months: 1, method: 'wave' },
  });
  const plan = watch('plan');
  const months = watch('months');

  const onSubmit = handleSubmit((values) =>
    record.mutate(
      { ...values, method: values.method || undefined, externalId: values.externalId || undefined },
      {
        onSuccess: (res) => {
          toast.success(
            res.notified
              ? 'Abonnement activé — le vendeur a été prévenu sur WhatsApp'
              : 'Abonnement activé (vendeur non prévenu : hors fenêtre de 24 h)',
          );
          setOpen(false);
          reset();
        },
        onError: (e) => toast.error(e.message),
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <CreditCard /> Enregistrer un paiement
      </Button>
      <DialogContent
        title="Enregistrer un paiement"
        description="Active ou prolonge l’abonnement. La période démarre à la fin de l’abonnement en cours."
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-plan">Plan</Label>
              <NativeSelect
                id="p-plan"
                {...register('plan', {
                  onChange: (e) =>
                    setValue('amountXof', DEFAULT_PRICE[e.target.value as 'founder' | 'standard'] * (Number(months) || 1)),
                })}
              >
                <option value="founder">{PLAN_LABEL.founder}</option>
                <option value="standard">{PLAN_LABEL.standard}</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-months">Durée (mois)</Label>
              <Input
                id="p-months"
                type="number"
                min={1}
                max={12}
                {...register('months', {
                  onChange: (e) => setValue('amountXof', DEFAULT_PRICE[plan] * (Number(e.target.value) || 1)),
                })}
              />
              <FieldError>{errors.months?.message}</FieldError>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-amount">Montant reçu (FCFA)</Label>
            <Input id="p-amount" type="number" min={1} {...register('amountXof')} />
            <FieldError>{errors.amountXof?.message}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-method">Méthode</Label>
              <NativeSelect id="p-method" {...register('method')}>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="especes">Espèces</option>
                <option value="autre">Autre</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-ref">Référence du paiement</Label>
              <Input id="p-ref" placeholder="facultatif" {...register('externalId')} />
            </div>
          </div>
          <p className="rounded-md bg-primary-soft px-3 py-2 text-xs text-primary">
            Vérifie d’abord la réception du paiement dans ton application Wave ou Orange Money.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={record.isPending}>
              {record.isPending && <Loader2 className="animate-spin" />}
              Activer l’abonnement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BlockButton({ seller }: { seller: SellerDetail }) {
  const [open, setOpen] = useState(false);
  const block = useBlockSeller(seller.id);
  const next = !seller.blocked;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant={seller.blocked ? 'outline' : 'danger'} onClick={() => setOpen(true)}>
        {seller.blocked ? <ShieldCheck /> : <Ban />}
        {seller.blocked ? 'Débloquer' : 'Bloquer'}
      </Button>
      <DialogContent
        title={next ? 'Bloquer ce vendeur ?' : 'Débloquer ce vendeur ?'}
        description={
          next
            ? 'SIGA ne répondra plus du tout à ce numéro. À réserver aux abus (tests de fraude en série…).'
            : 'Le vendeur pourra de nouveau utiliser SIGA.'
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            variant={next ? 'danger' : 'primary'}
            disabled={block.isPending}
            onClick={() =>
              block.mutate(next, {
                onSuccess: () => {
                  toast.success(next ? 'Vendeur bloqué' : 'Vendeur débloqué');
                  setOpen(false);
                },
                onError: (e) => toast.error(e.message),
              })
            }
          >
            {block.isPending && <Loader2 className="animate-spin" />}
            {next ? 'Bloquer' : 'Débloquer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
