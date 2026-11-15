import { Check, CheckCircle2, Loader2, PencilLine, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useReview, useReviewQueue } from '@/api/hooks';
import type { Verdict, VerificationDetail } from '@/api/types';
import {
  EmptyState,
  ErrorState,
  PageHeader,
  VerdictBadge,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, Input, Label, Skeleton } from '@/components/ui/primitives';
import { VerificationSummary } from '@/components/VerificationDetail';
import { formatAgo, formatFcfa, OPERATOR_LABEL } from '@/lib/format';
import { primaryRule } from '@/lib/rules';
import { cn } from '@/lib/utils';
import { previewSellerMessage, VERDICT_LABEL } from '@/lib/verdict';

type Mode = 'modify' | 'reject' | null;

export function ReviewPage() {
  const { data: queue, isLoading, error } = useReviewQueue();
  const review = useReview();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);

  // Sélection par défaut : le plus ancien ; si le cas sélectionné disparaît, on passe au suivant
  const selected = useMemo(
    () => queue?.find((v) => v.id === selectedId) ?? queue?.[0] ?? null,
    [queue, selectedId],
  );

  const decide = useCallback(
    (
      v: VerificationDetail,
      decision: Parameters<typeof review.mutate>[0]['decision'],
      success: string,
    ) => {
      const index = queue?.findIndex((q) => q.id === v.id) ?? -1;
      const next = queue?.[index + 1] ?? queue?.[index - 1] ?? null;
      review.mutate(
        { id: v.id, decision },
        {
          onSuccess: () => {
            toast.success(success);
            setMode(null);
            setSelectedId(next?.id ?? null);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    },
    [queue, review],
  );

  const confirm = useCallback(() => {
    if (!selected?.verdict || review.isPending) return;
    decide(
      selected,
      { action: 'send' },
      `Verdict « ${VERDICT_LABEL[selected.verdict]} » envoyé au vendeur`,
    );
  }, [selected, review.isPending, decide]);

  // Raccourcis : C confirmer, M modifier, R rejeter, ↑/↓ naviguer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mode || !selected || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 'c') confirm();
      else if (key === 'm') setMode('modify');
      else if (key === 'r') setMode('reject');
      else if ((key === 'arrowdown' || key === 'arrowup') && queue) {
        const i = queue.findIndex((q) => q.id === selected.id);
        const n = queue[i + (key === 'arrowdown' ? 1 : -1)];
        if (n) {
          e.preventDefault();
          setSelectedId(n.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, selected, queue, confirm]);

  return (
    <>
      <PageHeader
        title="Relecture"
        description="Cas douteux, formats inconnus et incidents à valider avant envoi au vendeur."
        actions={
          <span className="hidden text-xs text-muted-foreground md:block">
            Raccourcis : <Kbd>C</Kbd> confirmer · <Kbd>M</Kbd> modifier · <Kbd>R</Kbd> rejeter ·{' '}
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> naviguer
          </span>
        }
      />

      {error && <ErrorState error={error} />}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : !queue?.length ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 />}
            title="Rien à relire"
            description="Tous les cas ont été traités. La liste se met à jour toute seule toutes les 15 secondes."
          />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          {/* File d'attente */}
          <Card className="h-fit overflow-hidden lg:sticky lg:top-6">
            <div className="border-b px-4 py-3 text-sm font-medium">
              {queue.length} en attente
            </div>
            <ul className="max-h-[70vh] divide-y overflow-y-auto" role="listbox" aria-label="File de relecture">
              {queue.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected?.id === v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={cn(
                      'flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-surface-muted cursor-pointer',
                      selected?.id === v.id && 'bg-primary-soft hover:bg-primary-soft',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold tabular-nums">{formatFcfa(v.amountXof)}</span>
                      <VerdictBadge verdict={v.verdict} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {v.operator ? OPERATOR_LABEL[v.operator] ?? v.operator : 'Opérateur ?'} ·
                        vendeur n°{v.seller.id}
                      </span>
                      <span>{formatAgo(v.createdAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Détail et décision */}
          {selected && (
            <div className="space-y-4">
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="text-sm font-semibold">Vérification n°{selected.id}</div>
                  <div className="text-xs text-muted-foreground">
                    Reçue {formatAgo(selected.createdAt)} ·{' '}
                    {selected.verdict
                      ? `verdict proposé : ${VERDICT_LABEL[selected.verdict]}`
                      : 'aucun verdict calculé (incident technique)'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={confirm}
                    disabled={!selected.verdict || review.isPending}
                    title="Envoyer le verdict calculé (C)"
                  >
                    {review.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                    Confirmer
                  </Button>
                  <Button variant="outline" onClick={() => setMode('modify')} title="Modifier (M)">
                    <PencilLine /> Modifier
                  </Button>
                  <Button variant="outline" onClick={() => setMode('reject')} title="Rejeter (R)">
                    <XCircle /> Rejeter
                  </Button>
                </div>
              </Card>

              <VerificationSummary v={selected} />

              <ModifyDialog
                open={mode === 'modify'}
                onOpenChange={(o) => setMode(o ? 'modify' : null)}
                v={selected}
                pending={review.isPending}
                onSubmit={(verdict, reason) =>
                  decide(
                    selected,
                    { action: 'send', verdict, reason: reason || undefined },
                    `Verdict « ${VERDICT_LABEL[verdict]} » envoyé au vendeur`,
                  )
                }
              />
              <RejectDialog
                open={mode === 'reject'}
                onOpenChange={(o) => setMode(o ? 'reject' : null)}
                pending={review.isPending}
                onConfirm={() =>
                  decide(selected, { action: 'reject' }, 'Preuve rejetée : le vendeur va renvoyer une capture')
                }
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="mx-0.5 rounded border bg-surface px-1.5 py-0.5 font-mono text-[10px]">
      {children}
    </kbd>
  );
}

const VERDICTS: Verdict[] = ['coherent', 'douteux', 'faux_probable'];
const VERDICT_BUTTON: Record<Verdict, 'coherent' | 'douteux' | 'faux'> = {
  coherent: 'coherent',
  douteux: 'douteux',
  faux_probable: 'faux',
};

function ModifyDialog({
  open,
  onOpenChange,
  v,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  v: VerificationDetail;
  pending: boolean;
  onSubmit: (verdict: Verdict, reason: string) => void;
}) {
  const [verdict, setVerdict] = useState<Verdict>(v.verdict ?? 'douteux');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setVerdict(v.verdict ?? 'douteux');
      setReason('');
    }
  }, [open, v.id, v.verdict]);

  const tooShort = reason.trim().length > 0 && reason.trim().length < 3;
  const preview = previewSellerMessage(
    verdict,
    primaryRule(v.reasons, verdict),
    reason,
    v.reasons.some((r) => r.rule === 'R06'),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Modifier le verdict"
        description="Le vendeur recevra le message ci-dessous et la vérification sera décomptée."
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Verdict</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {VERDICTS.map((x) => (
                <Button
                  key={x}
                  type="button"
                  role="radio"
                  aria-checked={verdict === x}
                  variant={verdict === x ? VERDICT_BUTTON[x] : 'outline'}
                  className={cn(verdict === x && 'ring-2 ring-current ring-offset-1 ring-offset-surface')}
                  onClick={() => setVerdict(x)}
                >
                  {VERDICT_LABEL[x]}
                </Button>
              ))}
            </div>
          </div>
          {verdict !== 'coherent' && (
            <div className="space-y-1.5">
              <Label htmlFor="reason">Raison (facultatif)</Label>
              <Input
                id="reason"
                maxLength={120}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Raison générale, sans détailler les contrôles"
              />
              <p className={cn('text-xs', tooShort ? 'text-danger' : 'text-muted-foreground')}>
                {tooShort
                  ? '3 caractères minimum'
                  : 'Reste général pour ne pas guider un fraudeur. Vide : raison automatique.'}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Aperçu du message WhatsApp</Label>
            <div className="whitespace-pre-wrap rounded-lg rounded-tl-none border bg-coherent-soft/40 p-3 text-sm dark:bg-surface-muted">
              {preview}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button disabled={pending || tooShort} onClick={() => onSubmit(verdict, reason.trim())}>
              {pending && <Loader2 className="animate-spin" />}
              Envoyer au vendeur
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Rejeter la preuve ?"
        description="À utiliser si les images sont illisibles ou inexploitables. Le vendeur sera invité à renvoyer une meilleure capture ; rien ne sera décompté."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="danger" disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="animate-spin" />}
            Rejeter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
