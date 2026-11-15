import type { Plan, Verdict, VerificationStatus } from '@/api/types';

export const VERDICT_LABEL: Record<Verdict, string> = {
  coherent: 'Cohérent',
  douteux: 'Douteux',
  faux_probable: 'Faux probable',
};

export const VERDICT_STYLE: Record<Verdict, string> = {
  coherent: 'bg-coherent-soft text-coherent',
  douteux: 'bg-douteux-soft text-douteux',
  faux_probable: 'bg-faux-soft text-faux',
};

/** Couleur pleine (graphiques) */
export const VERDICT_COLOR: Record<Verdict, string> = {
  coherent: 'var(--coherent)',
  douteux: 'var(--douteux)',
  faux_probable: 'var(--faux)',
};

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  pending: 'Collecte',
  processing: 'Analyse',
  in_review: 'En relecture',
  sent: 'Envoyé',
  rejected: 'Rejeté',
  failed: 'Échec',
};

export const STATUS_STYLE: Record<VerificationStatus, string> = {
  pending: 'bg-surface-muted text-muted-foreground',
  processing: 'bg-accent-soft text-foreground',
  in_review: 'bg-primary-soft text-primary',
  sent: 'bg-surface-muted text-foreground',
  rejected: 'bg-surface-muted text-muted-foreground',
  failed: 'bg-faux-soft text-faux',
};

export const PLAN_LABEL: Record<Plan, string> = {
  trial: 'Essai',
  founder: 'Fondateur',
  standard: 'Standard',
};

/**
 * Aperçu du message vendeur : même logique que src/rules/verdict-message.ts côté API.
 * Raisons générales, jamais le détail des règles (pour ne pas guider un fraudeur).
 */
const REASONS: Record<string, string> = {
  R01: "Je n'ai pas reçu le SMS de confirmation pour comparer",
  R02: 'La capture et le SMS ne correspondent pas',
  R03: 'La capture et le SMS ne correspondent pas',
  R04: "La date ou l'heure du paiement pose question",
  R05: 'Cette référence a déjà été utilisée pour un autre paiement',
  R07: 'Certaines informations sont illisibles',
  R08: 'Je ne reconnais pas ce format de paiement',
  R09: "Les informations de l'expéditeur ne correspondent pas",
  R10: 'La capture et le SMS ne correspondent pas',
  C01: 'Certaines informations sont difficiles à lire',
};

export function previewSellerMessage(
  verdict: Verdict,
  primaryRule: string | null,
  customReason?: string,
  sameSellerDuplicate = false,
): string {
  const warning = sameSellerDuplicate
    ? '\nAttention : tu as déjà vérifié cette référence.'
    : '';
  if (verdict === 'coherent') {
    return (
      "✅ Cohérent. Montant, référence et heure correspondent, et cette référence n'a pas été vue ailleurs.\n" +
      'Pour une grosse commande, vérifie quand même dans ton application Wave ou Orange Money.' +
      warning
    );
  }
  const reason =
    customReason?.trim() ||
    (primaryRule ? REASONS[primaryRule] : undefined) ||
    'Je ne peux pas confirmer que tout est cohérent';
  if (verdict === 'douteux') {
    return `⚠️ Douteux. ${reason}.\nVérifie dans ton application avant de livrer.${warning}`;
  }
  return `❌ Faux probable. ${reason}.\nJe te conseille de ne pas livrer. Vérifie dans ton application.${warning}`;
}
