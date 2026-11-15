import { FileCode2, Loader2, RefreshCw, ScrollText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAudit, useReloadFormats, useSettings, useUpdateSettings } from '@/api/hooks';
import type { AuditEntry } from '@/api/types';
import { EmptyState, ErrorState, PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Switch,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/format';

/** Libellés lisibles des actions du journal */
const ACTION_LABEL: Record<string, string> = {
  'admin.login': 'Connexion',
  'admin.logout': 'Déconnexion',
  'admin.login_failed': 'Échec de connexion',
  'review.send': 'Verdict envoyé (relecture)',
  'review.reject': 'Preuve rejetée (relecture)',
  'payment.recorded': 'Paiement enregistré',
  'seller.blocked': 'Vendeur bloqué',
  'seller.unblocked': 'Vendeur débloqué',
  'seller.stopped': 'STOP du vendeur',
  'seller.resumed': 'REPRENDRE du vendeur',
  'settings.review_mode': 'Mode relecture modifié',
  'formats.reloaded': 'Formats rechargés',
  'consent.accepted': 'Conditions acceptées',
  'verification.decided': 'Analyse terminée',
  'alert.human_requested': 'Alerte : demande HUMAIN',
  'alert.review_pending': 'Alerte : cas à relire',
  'alert.unknown_format': 'Alerte : format inconnu',
  'alert.technical_error': 'Alerte : erreur technique',
  'alert.review_backlog': 'Alerte : relecture en retard',
  'maintenance.purge': 'Purge des images',
  'privacy.requested': 'Demande de suppression',
  'privacy.deleted': 'Données supprimées',
};

function actionStyle(action: string): string {
  if (action.startsWith('alert.')) return 'bg-douteux-soft text-douteux';
  if (action.includes('failed') || action.includes('blocked') || action.startsWith('privacy.'))
    return 'bg-faux-soft text-faux';
  if (action.startsWith('admin.') || action.startsWith('settings.') || action.startsWith('formats.'))
    return 'bg-primary-soft text-primary';
  return 'bg-surface-muted text-muted-foreground';
}

export function SettingsPage() {
  const settings = useSettings();
  const update = useUpdateSettings();
  const reload = useReloadFormats();
  const [page, setPage] = useState(1);
  const audit = useAudit(page);

  return (
    <>
      <PageHeader title="Paramètres" description="Réglages du service et journal des actions." />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mode relecture</CardTitle>
            <CardDescription>
              Les cas douteux et les formats inconnus attendent ta validation avant d’être envoyés au
              vendeur. Recommandé tant que les vrais formats de SMS ne sont pas en place.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            {settings.isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : settings.error ? (
              <ErrorState error={settings.error} />
            ) : (
              <>
                <span className="text-sm font-medium">
                  {settings.data?.reviewMode ? 'Activé' : 'Désactivé'}
                </span>
                <Switch
                  checked={!!settings.data?.reviewMode}
                  disabled={update.isPending}
                  aria-label="Mode relecture"
                  onCheckedChange={(reviewMode) =>
                    update.mutate(
                      { reviewMode },
                      {
                        onSuccess: () =>
                          toast.success(reviewMode ? 'Mode relecture activé' : 'Mode relecture désactivé'),
                        onError: (e) => toast.error(e.message),
                      },
                    )
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formats de SMS et de captures</CardTitle>
            <CardDescription>
              Après modification des fichiers de <code className="font-mono text-xs">config/formats</code>,
              recharge-les sans redémarrer l’API. Un fichier invalide est refusé et les anciens formats
              restent actifs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              disabled={reload.isPending}
              onClick={() =>
                reload.mutate(undefined, {
                  onSuccess: (r) => toast.success(`${r.formats} format(s) chargé(s)`),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              {reload.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Recharger les formats
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Journal d’audit</CardTitle>
            <CardDescription>Actions des administrateurs, alertes et événements du service.</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Plus récents
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={(audit.data?.length ?? 0) < 50}
              onClick={() => setPage(page + 1)}
            >
              Plus anciens
            </Button>
          </div>
        </CardHeader>
        {audit.error && <div className="px-5 pb-5"><ErrorState error={audit.error} /></div>}
        {audit.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : !audit.data?.length ? (
          <EmptyState icon={<ScrollText />} title="Journal vide" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Acteur</Th>
                <Th>Action</Th>
                <Th>Cible</Th>
                <Th>Détail</Th>
              </tr>
            </thead>
            <tbody>
              {audit.data.map((e) => (
                <AuditRow key={e.id} e={e} />
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <FileCode2 className="size-3.5" /> Les autres réglages (tarifs, quotas, seuils des règles) se
        font dans le fichier .env de l’API.
      </p>
    </>
  );
}

function AuditRow({ e }: { e: AuditEntry }) {
  const detail = e.detail
    ? Object.entries(e.detail)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
        .join(' · ')
    : '';
  return (
    <tr>
      <Td className="whitespace-nowrap text-muted-foreground">{formatDateTime(e.at)}</Td>
      <Td className="font-medium">{e.actor}</Td>
      <Td>
        <Badge className={actionStyle(e.action)}>{ACTION_LABEL[e.action] ?? e.action}</Badge>
      </Td>
      <Td className="font-mono text-xs text-muted-foreground">{e.target ?? '—'}</Td>
      <Td className="max-w-md truncate text-xs text-muted-foreground" title={detail}>
        {detail || '—'}
      </Td>
    </tr>
  );
}
