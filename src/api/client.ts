/**
 * Client HTTP du back-office.
 * Même origine que l'API : le cookie de session part automatiquement.
 * L'en-tête X-SIGA-Admin est exigé par l'API pour toute modification (anti-CSRF)
 * et évite la fenêtre de connexion du navigateur.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Émis quand la session a expiré : l'application renvoie vers la page de connexion. */
export const UNAUTHORIZED_EVENT = 'siga:unauthorized';

type Query = Record<string, string | number | boolean | undefined | null>;

export function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function api<T>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; query?: Query } = {},
): Promise<T> {
  const res = await fetch(withQuery(path, init.query), {
    method: init.method ?? 'GET',
    credentials: 'same-origin',
    headers: {
      'X-SIGA-Admin': '1',
      Accept: 'application/json',
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

  if (res.status === 401 && !path.endsWith('/auth/login')) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(' · ');
    if (body.message) return body.message;
  } catch {
    // corps non JSON
  }
  return DEFAULT_MESSAGES[res.status] ?? `Erreur ${res.status}`;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Données invalides',
  401: 'Session expirée, reconnecte-toi',
  403: 'Action refusée',
  404: 'Introuvable',
  409: 'Déjà traité par ailleurs',
  429: 'Trop de tentatives, réessaie plus tard',
  500: 'Erreur du serveur',
  503: 'Service momentanément indisponible',
};
