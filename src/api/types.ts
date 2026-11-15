/**
 * Types des réponses de l'API siga-api (/admin).
 * Les identifiants BIGINT arrivent sous forme de chaînes ; les dates en ISO 8601.
 */
export type Id = string;
export type Verdict = 'coherent' | 'douteux' | 'faux_probable';
export type VerificationStatus =
  | 'pending'
  | 'processing'
  | 'in_review'
  | 'sent'
  | 'rejected'
  | 'failed';
export type Plan = 'trial' | 'founder' | 'standard';
export type Effect = 'reject' | 'blocking' | 'doubt' | 'warning';
export type RuleId =
  | 'R01'
  | 'R02'
  | 'R03'
  | 'R04'
  | 'R05'
  | 'R06'
  | 'R07'
  | 'R08'
  | 'R09'
  | 'R10'
  | 'C01';

export interface Triggered {
  rule: RuleId;
  effect: Effect;
  review?: boolean;
  note?: string;
}

export interface Confidence {
  capture: number | null;
  sms: number | null;
  captureFormat: string | null;
  smsFormat: string | null;
}

export interface Verification {
  id: Id;
  sellerId: Id;
  status: VerificationStatus;
  operator: string | null;
  amountXof: number | null;
  txDatetime: string | null;
  smsPresent: boolean;
  verdict: Verdict | null;
  reasons: Triggered[];
  confidence: Confidence | null;
  counted: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface VerificationItem {
  id: Id;
  kind: 'image' | 'text';
  mimeType: string | null;
  receivedAt: string;
  deletedAt: string | null;
  text: string | null;
  /** URL relative de l'image (servie avec la session), null si purgée */
  image: string | null;
}

export interface SellerSummary {
  id: Id;
  waId: string;
  displayName: string | null;
  plan: Plan;
  blocked: boolean;
}

export interface VerificationDetail extends Verification {
  seller: SellerSummary;
  items: VerificationItem[];
}

export interface Page<T> {
  total: number;
  page: number;
  pageSize: number;
  rows: T[];
}

export interface Seller {
  id: Id;
  waId: string;
  displayName: string | null;
  plan: Plan;
  freeLeft: number;
  paidUntil: string | null;
  state: 'new' | 'welcomed' | 'active';
  stopped: boolean;
  blocked: boolean;
  lastInboundAt: string | null;
  createdAt: string;
}

export interface Payment {
  id: Id;
  amountXof: number;
  plan: Exclude<Plan, 'trial'>;
  method: string | null;
  externalId: string | null;
  periodStart: string;
  periodEnd: string;
  recordedBy: string | null;
  paidAt: string;
}

export interface Usage {
  plan: Plan;
  freeLeft: number;
  paidUntil: string | null;
  used: number;
  quota: number;
  overage: number;
}

export interface SellerDetail extends Seller {
  payments: Payment[];
  consents: Array<{ id: Id; docVersion: string; acceptedAt: string }>;
  verifications: Verification[];
  entitlement: 'subscription' | 'trial' | 'none';
  usage: Usage;
}

export interface Stats {
  days: number;
  perDay: Array<{ day: string; count: number }>;
  verdicts: Partial<Record<Verdict | 'aucun', number>>;
  rejected: number;
  sellers: number;
  payingSellers: number;
  trialToPaidRate: number;
  activeSellers7d: number;
  reviewQueue: number;
  founderSlotsLeft: number;
}

export interface AuditEntry {
  id: Id;
  actor: string;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
  at: string;
}

export interface Settings {
  reviewMode: boolean;
}

export type ReviewDecision =
  | { action: 'send'; verdict?: Verdict; reason?: string }
  | { action: 'reject' };

export interface PaymentInput {
  amountXof: number;
  plan: 'founder' | 'standard';
  months: number;
  method?: string;
  externalId?: string;
}

export interface VerificationFilters {
  status?: VerificationStatus;
  verdict?: Verdict;
  sellerId?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface SellerFilters {
  q?: string;
  plan?: Plan;
  blocked?: 'true' | 'false';
  page: number;
  pageSize: number;
}
