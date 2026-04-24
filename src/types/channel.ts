export interface ChannelPartnerSummary {
  id: string;
  code: string;
  name: string;
  partner_type: string;
  status: string;
  risk_level: string;
}

export interface ChannelProgramSummary {
  id: string;
  program_code: string;
  name: string;
  program_type: string;
  status: string;
}

export interface ChannelBinding {
  id: string;
  product_code: string;
  org_id: string;
  channel_partner_id: string;
  channel_program_id: string;
  binding_source: string;
  source_code: string;
  source_ref_id: string;
  binding_scope: string;
  status: string;
  effective_from?: string;
  effective_to?: string;
  locked_until?: string;
  replaced_by_binding_id: string;
  reason_code: string;
  evidence: string;
  created_by: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelBindingView {
  binding: ChannelBinding;
  partner?: ChannelPartnerSummary;
  program?: ChannelProgramSummary;
}

export interface ChannelCommissionLedger {
  id: string;
  ledger_no: string;
  product_code: string;
  channel_partner_id: string;
  channel_program_id: string;
  binding_id: string;
  policy_id: string;
  policy_version_id: string;
  profit_snapshot_id: string;
  assignment_level: string;
  matched_rule_code: string;
  calculation_formula_code: string;
  rounding_mode: string;
  calculation_trace_id: string;
  settlement_subject_type: string;
  settlement_subject_id: string;
  source_event_id: string;
  source_charge_id: string;
  source_order_id: string;
  billable_item_code: string;
  applies_to: string;
  currency: string;
  gross_amount: number;
  discount_amount: number;
  paid_amount: number;
  refunded_amount: number;
  net_collected_amount: number;
  commissionable_amount: number;
  commission_rate_bps: number;
  commission_amount: number;
  holdback_amount: number;
  settleable_amount: number;
  status: string;
  available_at?: string;
  earned_at?: string;
  settled_at?: string;
  reversed_at?: string;
  reversal_event_id?: string;
  reversal_reason_code: string;
  dimensions: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelCommissionView {
  partner?: ChannelPartnerSummary;
  program?: ChannelProgramSummary;
  ledger: ChannelCommissionLedger;
}

export interface ChannelSettlementBatch {
  id: string;
  batch_no: string;
  product_code: string;
  channel_program_id: string;
  settlement_cycle: string;
  period_start: string;
  period_end: string;
  currency: string;
  status: string;
  total_partner_count: number;
  total_item_count: number;
  gross_commission_amount: number;
  gross_clawback_amount: number;
  net_settleable_amount: number;
  generated_at?: string;
  confirmed_at?: string;
  closed_at?: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelSettlementItem {
  id: string;
  settlement_batch_id: string;
  channel_partner_id: string;
  currency: string;
  commission_amount: number;
  clawback_amount: number;
  adjustment_amount: number;
  net_amount: number;
  status: string;
  statement_snapshot: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelSettlementView {
  partner?: ChannelPartnerSummary;
  program?: ChannelProgramSummary;
  batch?: ChannelSettlementBatch;
  item: ChannelSettlementItem;
}

export interface ChannelAdjustmentLedger {
  id: string;
  product_code: string;
  channel_partner_id: string;
  channel_program_id: string;
  source_commission_ledger_id: string;
  source_profit_snapshot_id: string;
  adjustment_type: string;
  currency: string;
  adjustment_amount: number;
  reason_code: string;
  status: string;
  effective_at?: string;
  applied_settlement_batch_id: string;
  operator_id: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelAdjustmentView {
  partner?: ChannelPartnerSummary;
  program?: ChannelProgramSummary;
  item: ChannelAdjustmentLedger;
}

export interface ChannelProfitSnapshot {
  id: string;
  source_event_id: string;
  product_code: string;
  org_id: string;
  user_id: string;
  source_charge_id: string;
  source_order_id: string;
  billable_item_code: string;
  currency: string;
  gross_amount: number;
  discount_amount: number;
  paid_amount: number;
  refunded_amount: number;
  net_collected_amount: number;
  payment_fee_amount: number;
  tax_amount: number;
  service_delivery_cost_amount: number;
  infra_variable_cost_amount: number;
  risk_reserve_amount: number;
  manual_adjustment_amount: number;
  recognized_cost_amount: number;
  distributable_profit_amount: number;
  snapshot_basis: string;
  snapshot_hash: string;
  commission_recognition_at: string;
  dimensions: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelPolicyResolutionPreviewResult {
  matched: boolean;
  mode: string;
  binding_id?: string;
  channel_id?: string;
  channel_program_id?: string;
  policy_id?: string;
  policy_version_id?: string;
  assignment_id?: string;
  assignment_level?: string;
  matched_rule_code?: string;
  commissionable_amount: number;
  commission_amount: number;
  holdback_amount: number;
  settleable_amount: number;
  status?: string;
  snapshot?: ChannelProfitSnapshot;
  candidate_snapshot?: string;
  legacy_policy?: {
    id: string;
    policy_code: string;
    commission_base: string;
    fixed_rate_bps: number;
    cooldown_days: number;
    holdback_rate_bps: number;
  };
}

export interface ChannelPreviewView {
  partner?: ChannelPartnerSummary;
  program?: ChannelProgramSummary;
  result: ChannelPolicyResolutionPreviewResult;
}

export interface ChannelPreviewInput {
  user_id?: string;
  policy_version_id?: string;
  region_code?: string;
  partner_tier?: string;
  billable_item_code?: string;
  applies_to?: string;
  source_charge_id?: string;
  source_order_id?: string;
  currency?: string;
  gross_amount?: number;
  discount_amount?: number;
  paid_amount?: number;
  refunded_amount?: number;
  net_collected_amount?: number;
  payment_fee_amount?: number;
  tax_amount?: number;
  service_delivery_cost_amount?: number;
  infra_variable_cost_amount?: number;
  risk_reserve_amount?: number;
  manual_adjustment_amount?: number;
  occurred_at?: string;
  commission_recognition_at?: string;
  snapshot_basis?: string;
  dimensions?: string;
  metadata?: string;
}

export interface ChannelAdjustmentCreateInput {
  channel_partner_id: string;
  channel_program_id: string;
  source_commission_ledger_id?: string;
  source_profit_snapshot_id?: string;
  adjustment_type: string;
  currency?: string;
  adjustment_amount: number;
  reason_code: string;
  effective_at?: string;
  operator_id?: string;
  metadata?: string;
}

export interface ChannelOverview {
  partners: ChannelPartnerSummary[];
  current_bindings: ChannelBindingView[];
  total_commission: number;
  pending_commission: number;
  earned_commission: number;
  settled_commission: number;
  reversed_commission: number;
  pending_clawback: number;
  applied_clawback: number;
  settlement_count: number;
  recent_settlements: ChannelSettlementView[];
}
