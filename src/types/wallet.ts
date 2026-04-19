export type WalletHistoryCategory = 
  | 'charge'
  | 'reward'
  | 'redeem'
  | 'commission'
  | 'expiration'
  | 'recharge'
  | 'wallet_adjustment'
  | 'other';

export interface WalletHistoryEntry {
  id: string;
  category: WalletHistoryCategory;
  title: string;
  description?: string;
  flow_status?: string;
  direction: 'credit' | 'debit';
  amount: number;
  asset_code?: string;
  currency?: string;
  status: string;
  occurred_at: string;
  reference_type?: string;
  reference_id?: string;
  
  // Studio-specific fields
  job_id?: string;
  event_id?: string;
  billable_item_code?: string;
  charge_mode?: string;
  settlement_id?: string;
  wallet_debited?: number;
  credits_consumed?: number;
  quota_consumed?: number;
  metadata?: Record<string, unknown>;
}

export interface WalletHistoryResponse {
  items: WalletHistoryEntry[];
  total: number;
}

export interface AuditHistoryItem {
  id: string;
  request_id?: string;
  trace_id?: string;
  action: string;
  target_type: string;
  target_id?: string;
  status: string;
  route?: string;
  method?: string;
  details?: string;
  diff_summary?: string;
  created_at: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface AuditHistoryResponse {
  items: AuditHistoryItem[];
  total: number;
}
