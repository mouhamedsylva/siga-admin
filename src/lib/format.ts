/** Formats d'affichage (fr-FR, heure de Dakar = UTC). */
const TZ = 'Africa/Dakar';
const NARROW_SPACES = /[  ]/g;

export function formatFcfa(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${new Intl.NumberFormat('fr-FR').format(n).replace(NARROW_SPACES, ' ')} F`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n).replace(NARROW_SPACES, ' ');
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

/** « il y a 5 min », « il y a 2 h », « il y a 3 j » */
export function formatAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return '—';
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'à l’instant';
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 48) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function formatPercent(ratio: number): string {
  return `${(ratio * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

/** Numéro WhatsApp lisible : 221771234567 → +221 77 123 45 67 */
export function formatPhone(waId: string): string {
  if (waId.startsWith('del:')) return 'Données supprimées';
  if (waId.includes('*')) return `+${waId}`;
  const m = /^(221)(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(waId);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : `+${waId}`;
}

export const OPERATOR_LABEL: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
};
