# siga-admin

Back-office du bot WhatsApp **SIGA** : relecture des cas douteux, vérifications, vendeurs et paiements,
statistiques, paramètres.

React 18 · Vite 6 · TypeScript · Tailwind CSS 4 · Radix UI · TanStack Query · Recharts.
Palette **Indigo nuit**, thème clair / sombre / système.

## Développement

L'API doit tourner (`npm run start:dev` dans `../siga-api`, avec MySQL et Redis de Laragon).

```bash
npm install
npm run dev        # http://localhost:5173/backoffice/
```

Vite redirige les appels `/admin/*` vers `http://localhost:3000` : même origine, le cookie de session fonctionne.

Connexion : un login de `ADMIN_USERS` (fichier `.env` de l'API) et son mot de passe
(`npm run admin:hash -- <login> "<mot de passe>" --write` dans `siga-api`).

## Production

```bash
npm run build      # → dist/
```

L'API sert `dist/` sous **`/backoffice`** (variable `ADMIN_UI_DIR`, par défaut `../siga-admin/dist`).
Depuis la racine du dépôt, `npm run build` construit les deux projets ; `railway.json` fait de même sur Railway.

## Tests

```bash
npm test           # Vitest + Testing Library
npm run typecheck
```

## Écrans

| Page | Contenu |
|---|---|
| **Relecture** | file d'attente (rafraîchie toutes les 15 s), images agrandissables, SMS collé, règles déclenchées, confiance OCR ; Confirmer / Modifier (aperçu du message vendeur) / Rejeter ; raccourcis C, M, R, ↑, ↓ |
| **Vérifications** | filtres (statut, verdict, vendeur, dates) conservés dans l'URL, pagination, détail en panneau latéral |
| **Vendeurs** | recherche, plan, droits ; fiche : quota du mois, paiements, enregistrement d'un paiement, blocage |
| **Statistiques** | indicateurs, verdicts par jour, répartition des verdicts (7 / 30 / 90 jours) |
| **Paramètres** | mode relecture, rechargement des formats, journal d'audit |

## Sécurité

- Session dans un cookie `httpOnly`, `SameSite=Strict` (`Secure` en production), expiration glissante de 8 h.
- Chaque requête envoie l'en-tête `X-SIGA-Admin` : l'API l'exige pour toute modification (protection CSRF).
- 5 échecs de connexion en 15 minutes → blocage temporaire.
- Police et ressources servies localement ; CSP stricte côté API (`default-src 'self'`).

## Organisation

```
src/
  api/          client fetch, types des réponses, hooks TanStack Query
  components/   mise en page, badges, détail d'une vérification, composants ui/
  lib/          formats (FCFA, dates Dakar), libellés des règles et des verdicts
  pages/        Login, Review, Verifications, Sellers, SellerDetail, Stats, Settings
  styles/       theme.css : palette (variables CSS clair / sombre)
  theme/        ThemeProvider
```

La palette se modifie uniquement dans `src/styles/theme.css`. Le vert, l'ambre et le rouge sont
réservés aux verdicts ; les contrastes respectent le niveau WCAG AA.
