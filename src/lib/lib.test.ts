import { describe, expect, it } from 'vitest';
import { formatAgo, formatFcfa, formatPhone } from './format';
import { primaryRule } from './rules';
import { previewSellerMessage } from './verdict';

describe('primaryRule (même priorité que l’API)', () => {
  it('faux probable : R05 passe avant R02', () => {
    expect(
      primaryRule(
        [
          { rule: 'R02', effect: 'blocking' },
          { rule: 'R05', effect: 'blocking' },
          { rule: 'R09', effect: 'doubt' },
        ],
        'faux_probable',
      ),
    ).toBe('R05');
  });
  it('douteux : seules les règles de doute comptent', () => {
    expect(
      primaryRule(
        [
          { rule: 'R04', effect: 'doubt' },
          { rule: 'R01', effect: 'doubt' },
        ],
        'douteux',
      ),
    ).toBe('R01');
  });
  it('cohérent : aucune', () => {
    expect(primaryRule([{ rule: 'R06', effect: 'warning' }], 'coherent')).toBeNull();
  });
});

describe('previewSellerMessage', () => {
  it('ne contient jamais le code de la règle', () => {
    const m = previewSellerMessage('faux_probable', 'R05');
    expect(m).toContain('déjà été utilisée');
    expect(m).not.toContain('R05');
  });
  it('utilise la raison de l’admin si fournie', () => {
    expect(previewSellerMessage('douteux', 'R04', 'Montant illisible')).toContain(
      'Douteux. Montant illisible.',
    );
  });
  it('rappelle toujours de vérifier dans l’application', () => {
    for (const v of ['coherent', 'douteux', 'faux_probable'] as const) {
      expect(previewSellerMessage(v, null)).toMatch(/vérifie/i);
    }
  });
  it('ajoute l’avertissement de doublon interne', () => {
    expect(previewSellerMessage('coherent', null, undefined, true)).toContain(
      'déjà vérifié cette référence',
    );
  });
});

describe('formats', () => {
  it('FCFA avec espaces normales', () => expect(formatFcfa(15000)).toBe('15 000 F'));
  it('numéro sénégalais lisible', () =>
    expect(formatPhone('221771234567')).toBe('+221 77 123 45 67'));
  it('numéro masqué inchangé', () => expect(formatPhone('2217******67')).toBe('+2217******67'));
  it('ancienneté relative', () => {
    const now = Date.parse('2026-11-14T12:00:00Z');
    expect(formatAgo('2026-11-14T11:55:00Z', now)).toBe('il y a 5 min');
    expect(formatAgo('2026-11-14T09:00:00Z', now)).toBe('il y a 3 h');
  });
});
