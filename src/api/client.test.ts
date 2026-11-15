import { describe, expect, it, vi } from 'vitest';
import { api, ApiError, UNAUTHORIZED_EVENT, withQuery } from './client';

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('api()', () => {
  it('envoie l’en-tête X-SIGA-Admin et le corps JSON (même origine)', async () => {
    const fetchMock = mockFetch(200, { ok: true });
    await api('/admin/settings', { method: 'POST', body: { reviewMode: true } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/admin/settings');
    expect(init?.credentials).toBe('same-origin');
    expect(init?.headers).toMatchObject({
      'X-SIGA-Admin': '1',
      'Content-Type': 'application/json',
    });
    expect(init?.body).toBe('{"reviewMode":true}');
  });

  it('401 : déclenche le retour à la page de connexion', async () => {
    mockFetch(401, { message: 'Unauthorized' });
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    await expect(api('/admin/stats')).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('401 sur la connexion elle-même : pas de redirection', async () => {
    mockFetch(401, { message: 'Identifiants invalides' });
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);
    await expect(api('/admin/auth/login', { method: 'POST', body: {} })).rejects.toThrow(
      'Identifiants invalides',
    );
    expect(listener).not.toHaveBeenCalled();
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it('assemble les messages de validation renvoyés par l’API', async () => {
    mockFetch(400, { message: ['verdict: Invalid enum value', 'reason: too short'] });
    await expect(api('/admin/review/1', { method: 'POST', body: {} })).rejects.toThrow(
      'verdict: Invalid enum value · reason: too short',
    );
  });

  it('message par défaut si le corps n’est pas du JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('boom', { status: 409 }));
    await expect(api('/admin/review/1')).rejects.toThrow('Déjà traité par ailleurs');
  });
});

describe('withQuery', () => {
  it('ignore les valeurs vides', () => {
    expect(withQuery('/x', { a: 1, b: '', c: undefined, d: 'z' })).toBe('/x?a=1&d=z');
    expect(withQuery('/x', {})).toBe('/x');
  });
});
