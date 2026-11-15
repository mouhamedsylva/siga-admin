import { ImageOff, MessageSquareText, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import type { Triggered, VerificationDetail as Detail } from '@/api/types';
import { formatDateTime, formatFcfa, OPERATOR_LABEL } from '@/lib/format';
import { EFFECT_LABEL, EFFECT_STYLE, RULES } from '@/lib/rules';
import { cn } from '@/lib/utils';
import { Field, PlanBadge, StatusBadge, VerdictBadge } from './common';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Badge, Card, CardContent, CardHeader, CardTitle } from './ui/primitives';

/** Images de la preuve, agrandissables. */
export function ProofImages({ items }: { items: Detail['items'] }) {
  const images = items.filter((i) => i.kind === 'image');
  if (!images.length) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <ImageOff className="size-4" /> Aucune image (SMS collé uniquement)
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {images.map((img, i) =>
        img.image ? (
          <ZoomableImage key={img.id} src={img.image} label={`Pièce ${i + 1}`} />
        ) : (
          <div
            key={img.id}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground"
          >
            <ImageOff className="size-5" />
            Image purgée
          </div>
        ),
      )}
    </div>
  );
}

function ZoomableImage({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground">
        <ImageOff className="size-5" />
        Image indisponible
      </div>
    );
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative overflow-hidden rounded-lg border bg-surface-muted cursor-zoom-in"
        >
          <img
            src={src}
            alt={label}
            loading="lazy"
            onError={() => setFailed(true)}
            className="aspect-[3/4] w-full object-contain transition-transform group-hover:scale-[1.02]"
          />
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-slate-950/70 px-2 py-1 text-xs text-white">
            <ZoomIn className="size-3" /> {label}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent title={label} className="max-w-4xl">
        <img src={src} alt={label} className="max-h-[80vh] w-full object-contain" />
      </DialogContent>
    </Dialog>
  );
}

export function PastedSms({ items }: { items: Detail['items'] }) {
  const texts = items.filter((i) => i.kind === 'text');
  if (!texts.length) return null;
  return (
    <div className="space-y-2">
      {texts.map((t) => (
        <div key={t.id} className="rounded-lg border bg-surface-muted p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquareText className="size-3.5" /> SMS collé par le vendeur
          </div>
          {t.text ? (
            <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{t.text}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Texte effacé après la décision (minimisation des données).
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function ConfidenceBar({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null) return null;
  const v = Math.round(value);
  const color = v >= 60 ? 'bg-coherent' : v >= 30 ? 'bg-douteux' : 'bg-faux';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{v} %</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

export function RulesList({ reasons }: { reasons: Triggered[] }) {
  if (!reasons.length) {
    return <p className="text-sm text-muted-foreground">Aucune règle déclenchée.</p>;
  }
  return (
    <ul className="space-y-2">
      {reasons.map((r, i) => (
        <li key={`${r.rule}-${i}`} className="flex items-start gap-3 rounded-md border p-3">
          <span className="mt-0.5 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold">
            {r.rule}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{RULES[r.rule]?.title ?? r.rule}</span>
              <Badge className={EFFECT_STYLE[r.effect]}>{EFFECT_LABEL[r.effect]}</Badge>
              {r.review && <Badge className="bg-primary-soft text-primary">Relecture</Badge>}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {RULES[r.rule]?.detail}
              {r.note ? ` (${r.note})` : ''}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Synthèse complète d'une vérification. */
export function VerificationSummary({ v }: { v: Detail }) {
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Verdict calculé">
          <VerdictBadge verdict={v.verdict} />
        </Field>
        <Field label="Statut">
          <StatusBadge status={v.status} />
        </Field>
        <Field label="Montant">
          <span className="tabular-nums">{formatFcfa(v.amountXof)}</span>
        </Field>
        <Field label="Opérateur">{v.operator ? OPERATOR_LABEL[v.operator] ?? v.operator : '—'}</Field>
        <Field label="Date du paiement">{formatDateTime(v.txDatetime)}</Field>
        <Field label="Reçue le">{formatDateTime(v.createdAt)}</Field>
        <Field label="Vendeur">
          <span className="flex items-center gap-2">
            n°{v.seller.id} <PlanBadge plan={v.seller.plan} />
          </span>
        </Field>
        <Field label="SMS fourni">{v.smsPresent ? 'Oui' : 'Non'}</Field>
      </dl>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <ProofImages items={v.items} />
          <PastedSms items={v.items} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Règles déclenchées</CardTitle>
            </CardHeader>
            <CardContent>
              <RulesList reasons={v.reasons} />
            </CardContent>
          </Card>
          {v.confidence && (
            <Card>
              <CardHeader>
                <CardTitle>Lecture automatique</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ConfidenceBar label="Confiance capture" value={v.confidence.capture} />
                <ConfidenceBar label="Confiance SMS" value={v.confidence.sms} />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>
                    Format capture :{' '}
                    <span className="font-mono text-foreground">
                      {v.confidence.captureFormat ?? 'inconnu'}
                    </span>
                  </div>
                  <div>
                    Format SMS :{' '}
                    <span className="font-mono text-foreground">
                      {v.confidence.smsFormat ?? 'inconnu'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {v.reviewedBy && (
            <p className="text-xs text-muted-foreground">
              Relu par <span className="font-medium text-foreground">{v.reviewedBy}</span> le{' '}
              {formatDateTime(v.reviewedAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
