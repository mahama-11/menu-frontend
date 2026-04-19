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
  effective_from?: string;
  effective_to?: string;
  metadata?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReferralCode {
  id: string;
  program_id: string;
  product_code: string;
  code: string;
  status: string;
  metadata?: Record<string, unknown>;
  invite_url?: string;
  signup_url?: string;
  share_text?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralConversion {
  id: string;
  program_id: string;
  referral_code_id: string;
  product_code: string;
  trigger_type: string;
  promoter_subject_type?: string;
  promoter_subject_id?: string;
  referred_subject_type: string;
  referred_subject_id: string;
  settlement_subject_type?: string;
  settlement_subject_id?: string;
  reference_type?: string;
  reference_id?: string;
  commission_currency: string;
  commission_amount: number;
  commission_ledger_id: string;
  status: string;
  metadata?: string;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  product_code?: string;
  commission_type?: string;
  beneficiary_subject_type?: string;
  beneficiary_subject_id?: string;
  settlement_subject_type?: string;
  settlement_subject_id?: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at?: string;
  settled_at?: string;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  redeemed_reward_id?: string;
  metadata?: string;
}

export interface ReferralCodeResolve {
  code: string;
  product_code?: string;
  program_id: string;
  program_code?: string;
  program_name: string;
  trigger_type: string;
  commission_policy?: string;
  commission_currency?: string;
  commission_fixed_amount?: number;
  commission_rate_bps?: number;
  promoter_name?: string;
  promoter_id?: string;
  promoter_subject_type?: string;
  promoter_subject_id?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  reward_policy_desc?: string;
  settlement_delay_days?: number;
  allow_repeat?: boolean;
}

export interface ReferralOverview {
  programs: ReferralProgram[];
  codes: ReferralCode[];
  conversions: ReferralConversion[];
  commissions: Commission[];
  total_conversions: number;
  tracked_conversions?: number;
  earned_conversions?: number;
  reversed_conversions?: number;
  total_commission: number;
  earned_commission?: number;
  redeemable_commission: number;
  redeemed_commission: number;
  pending_commission: number;
  reversed_commission: number;
  redeem_target_asset_code: string;
  invite_base_url?: string;
}

export interface RedeemResponse {
  reward_ledger_id: string;
  asset_code: string;
  total_amount: number;
  commissions: Commission[];
}
