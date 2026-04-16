export interface ReferralProgram {
  id: string;
  product_code: string;
  program_code: string;
  name: string;
  status: string;
  trigger_type: string;
  commission_policy: string;
  commission_currency: string;
  commission_fixed_amount: number;
  commission_rate_bps: number;
  settlement_delay_days: number;
  allow_repeat: boolean;
}

export interface ReferralCode {
  id: string;
  program_id: string;
  product_code: string;
  code: string;
  promoter_subject_type: string;
  promoter_subject_id: string;
  status: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralConversion {
  id: string;
  program_id: string;
  referral_code_id: string;
  product_code: string;
  trigger_type: string;
  referred_subject_type: string;
  referred_subject_id: string;
  commission_currency: string;
  commission_amount: number;
  commission_ledger_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  settled_at?: string;
  description?: string;
}

export interface ReferralCodeResolve {
  code: string;
  program_id: string;
  program_name: string;
  trigger_type: string;
  promoter_name?: string;
  promoter_id?: string;
}

export interface ReferralOverview {
  total_conversions: number;
  total_commissions_earned: number;
  total_commissions_pending: number;
  currency: string;
  programs: ReferralProgram[];
  active_codes: ReferralCode[];
  recent_conversions: ReferralConversion[];
  recent_commissions: Commission[];
}
