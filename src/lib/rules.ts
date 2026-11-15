import type { Effect, RuleId, Triggered, Verdict } from '@/api/types';

/**
 * Libellés détaillés des règles, réservés aux administrateurs
 * (le vendeur ne reçoit qu'une raison générale).
 */
export const RULES: Record<RuleId, { title: string; detail: string }> = {
  R01: { title: 'SMS absent', detail: 'Aucun SMS de confirmation fourni : comparaison impossible.' },
  R02: { title: 'Montants différents', detail: 'Le montant de la capture diffère de celui du SMS.' },
  R03: {
    title: 'Références différentes',
    detail: 'La référence de la capture diffère de celle du SMS (un seul caractère d’écart = doute).',
  },
  R04: { title: 'Date incohérente', detail: 'Date dans le futur, ou écart important entre capture et SMS.' },
  R05: { title: 'Référence réutilisée', detail: 'Référence déjà vue chez un autre vendeur (même opérateur).' },
  R06: {
    title: 'Déjà vérifiée par ce vendeur',
    detail: 'Doublon interne : simple avertissement, pas de nouveau décompte.',
  },
  R07: { title: 'Illisible ou incomplet', detail: 'Capture illisible ou champ obligatoire manquant.' },
  R08: { title: 'Format inconnu', detail: 'Format de SMS ou de capture non décrit dans config/formats.' },
  R09: { title: 'Expéditeur incohérent', detail: 'Le nom de l’expéditeur diffère entre capture et SMS.' },
  R10: { title: 'Opérateurs différents', detail: 'La capture et le SMS ne viennent pas du même opérateur.' },
  C01: { title: 'Confiance OCR faible', detail: 'La lecture automatique est peu fiable : vérifier les images.' },
};

export const EFFECT_LABEL: Record<Effect, string> = {
  reject: 'Rejet',
  blocking: 'Bloquant',
  doubt: 'Doute',
  warning: 'Avertissement',
};

export const EFFECT_STYLE: Record<Effect, string> = {
  reject: 'bg-surface-muted text-muted-foreground',
  blocking: 'bg-faux-soft text-faux',
  doubt: 'bg-douteux-soft text-douteux',
  warning: 'bg-primary-soft text-primary',
};

const PRIORITY: RuleId[] = ['R07', 'R05', 'R10', 'R02', 'R03', 'R08', 'R01', 'R04', 'R09', 'C01', 'R06'];

/** Règle principale expliquée au vendeur pour un verdict donné (même ordre que l'API). */
export function primaryRule(triggered: Triggered[], verdict: Verdict): RuleId | null {
  const effect: Effect | null =
    verdict === 'faux_probable' ? 'blocking' : verdict === 'douteux' ? 'doubt' : null;
  if (!effect) return null;
  const found = triggered
    .filter((t) => t.effect === effect)
    .sort((a, b) => PRIORITY.indexOf(a.rule) - PRIORITY.indexOf(b.rule))[0];
  return found?.rule ?? null;
}
