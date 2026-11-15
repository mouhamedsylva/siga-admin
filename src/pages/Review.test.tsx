import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { VerificationDetail } from '@/api/types';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ReviewPage } from './Review';

const base: VerificationDetail = {
  id: '41',
  sellerId: '7',
  status: 'in_review',
  operator: 'wave',
  amountXof: 15000,
  txDatetime: '2026-11-14T10:05:00Z',
  smsPresent: false,
  verdict: 'douteux',
  reasons: [{ rule: 'R01', effect: 'doubt' }],
  confidence: { capture: 88, sms: null, captureFormat: 'wave-capture-v1', smsFormat: null },
  counted: false,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: '2026-11-14T10:06:00Z',
  sentAt: null,
  seller: { id: '7', waId: '2217******67', displayName: null, plan: 'trial', blocked: false },
  items: [
    {
      id: '90',
      kind: 'text',
      mimeType: null,
      receivedAt: '2026-11-14T10:06:00Z',
      deletedAt: null,
      text: 'Vous avez reçu 15.000F',
      image: null,
    },
  ],
};
const second: VerificationDetail = { ...base, id: '42', amountXof: 2500 };

function setup(queue: VerificationDetail[]) {
  const calls: Array<{ url: string; body?: unknown }> = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (url.startsWith('/admin/review/')) {
      const id = url.split('/').pop()!;
      return Response.json({ ...queue.find((q) => q.id === id), status: 'sent' });
    }
    if (url === '/admin/review') return Response.json(queue);
    return Response.json({});
  });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <ThemeProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ReviewPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { calls };
}

describe('ReviewPage', () => {
  it('file vide : message « Rien à relire »', async () => {
    setup([]);
    expect(await screen.findByText('Rien à relire')).toBeInTheDocument();
  });

  it('affiche le plus ancien cas, ses règles et le SMS collé', async () => {
    setup([base, second]);
    expect(await screen.findByText('Vérification n°41')).toBeInTheDocument();
    expect(screen.getByText('SMS absent')).toBeInTheDocument();
    expect(screen.getByText('Vous avez reçu 15.000F')).toBeInTheDocument();
    expect(screen.getByText('2 en attente')).toBeInTheDocument();
  });

  it('Confirmer envoie le verdict calculé puis passe au cas suivant', async () => {
    const { calls } = setup([base, second]);
    const user = userEvent.setup();
    await screen.findByText('Vérification n°41');
    await user.click(screen.getByRole('button', { name: /confirmer/i }));
    await waitFor(() =>
      expect(calls).toContainEqual({ url: '/admin/review/41', body: { action: 'send' } }),
    );
    expect(await screen.findByText('Vérification n°42')).toBeInTheDocument();
  });

  it('raccourci R puis Rejeter : envoie action reject', async () => {
    const { calls } = setup([base]);
    const user = userEvent.setup();
    await screen.findByText('Vérification n°41');
    await user.keyboard('r');
    await user.click(await screen.findByRole('button', { name: /^rejeter$/i }));
    await waitFor(() =>
      expect(calls).toContainEqual({ url: '/admin/review/41', body: { action: 'reject' } }),
    );
  });

  it('Modifier : choix du verdict, raison et aperçu du message', async () => {
    const { calls } = setup([base]);
    const user = userEvent.setup();
    await screen.findByText('Vérification n°41');
    await user.click(screen.getByRole('button', { name: /modifier/i }));
    await user.click(await screen.findByRole('radio', { name: 'Faux probable' }));
    await user.type(screen.getByLabelText(/raison/i), 'Capture retouchée');
    expect(screen.getByText(/Faux probable\. Capture retouchée\./)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /envoyer au vendeur/i }));
    await waitFor(() =>
      expect(calls).toContainEqual({
        url: '/admin/review/41',
        body: { action: 'send', verdict: 'faux_probable', reason: 'Capture retouchée' },
      }),
    );
  });

  it('sans verdict calculé (incident technique) : Confirmer est désactivé', async () => {
    setup([{ ...base, verdict: null, reasons: [] }]);
    await screen.findByText('Vérification n°41');
    expect(screen.getByRole('button', { name: /confirmer/i })).toBeDisabled();
  });
});
