import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from './client';
import type {
  AuditEntry,
  Page,
  PaymentInput,
  ReviewDecision,
  Seller,
  SellerDetail,
  SellerFilters,
  Settings,
  Stats,
  VerificationDetail,
  Verification,
  VerificationFilters,
} from './types';

export const keys = {
  me: ['me'] as const,
  review: ['review'] as const,
  verifications: (f: VerificationFilters) => ['verifications', f] as const,
  verification: (id: string) => ['verification', id] as const,
  sellers: (f: SellerFilters) => ['sellers', f] as const,
  seller: (id: string) => ['seller', id] as const,
  stats: (days: number) => ['stats', days] as const,
  settings: ['settings'] as const,
  audit: (page: number) => ['audit', page] as const,
};

// ---------- Session ----------

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api<{ login: string }>('/admin/auth/me'),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { login: string; password: string }) =>
      api<{ login: string }>('/admin/auth/login', { method: 'POST', body }),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/admin/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(keys.me, null);
    },
  });
}

// ---------- Relecture ----------

export function useReviewQueue() {
  return useQuery({
    queryKey: keys.review,
    queryFn: () => api<VerificationDetail[]>('/admin/review'),
    refetchInterval: 15_000,
  });
}

export function useReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: ReviewDecision }) =>
      api<VerificationDetail>(`/admin/review/${id}`, {
        method: 'POST',
        body: decision,
      }),
    onSuccess: (v) => {
      qc.setQueryData<VerificationDetail[]>(keys.review, (rows) =>
        rows?.filter((r) => r.id !== v.id),
      );
      void qc.invalidateQueries({ queryKey: ['verifications'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
      qc.setQueryData(keys.verification(v.id), v);
    },
  });
}

// ---------- Vérifications ----------

export function useVerifications(filters: VerificationFilters) {
  return useQuery({
    queryKey: keys.verifications(filters),
    queryFn: () =>
      api<Page<Verification>>('/admin/verifications', { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });
}

export function useVerification(id: string | null) {
  return useQuery({
    queryKey: keys.verification(id ?? ''),
    queryFn: () => api<VerificationDetail>(`/admin/verifications/${id}`),
    enabled: !!id,
  });
}

// ---------- Vendeurs ----------

export function useSellers(filters: SellerFilters) {
  return useQuery({
    queryKey: keys.sellers(filters),
    queryFn: () => api<Page<Seller>>('/admin/sellers', { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });
}

export function useSeller(id: string) {
  return useQuery({
    queryKey: keys.seller(id),
    queryFn: () => api<SellerDetail>(`/admin/sellers/${id}`),
  });
}

export function useRecordPayment(sellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PaymentInput) =>
      api<{ notified: boolean }>(`/admin/sellers/${sellerId}/payments`, {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.seller(sellerId) });
      void qc.invalidateQueries({ queryKey: ['sellers'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useBlockSeller(sellerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blocked: boolean) =>
      api<Seller>(`/admin/sellers/${sellerId}/block`, {
        method: 'POST',
        body: { blocked },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.seller(sellerId) });
      void qc.invalidateQueries({ queryKey: ['sellers'] });
    },
  });
}

// ---------- Exploitation ----------

export function useStats(days: number) {
  return useQuery({
    queryKey: keys.stats(days),
    queryFn: () => api<Stats>('/admin/stats', { query: { days } }),
    placeholderData: keepPreviousData,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: keys.settings,
    queryFn: () => api<Settings>('/admin/settings'),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Settings) =>
      api<Settings>('/admin/settings', { method: 'POST', body }),
    onSuccess: (s) => qc.setQueryData(keys.settings, s),
  });
}

export function useReloadFormats() {
  return useMutation({
    mutationFn: () =>
      api<{ formats: number }>('/admin/formats/reload', { method: 'POST' }),
  });
}

export function useAudit(page: number) {
  return useQuery({
    queryKey: keys.audit(page),
    queryFn: () =>
      api<AuditEntry[]>('/admin/audit', { query: { page, pageSize: 50 } }),
    placeholderData: keepPreviousData,
  });
}
