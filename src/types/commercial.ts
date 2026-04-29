export interface CommercialProduct {
  id: string;
  code: string;
  name: string;
  status: string;
  owner_team: string;
  metadata: string;
}

export interface CommercialSKU {
  id: string;
  product_id: string;
  code: string;
  name: string;
  sku_type: string;
  billing_mode: string;
  currency: string;
  list_price: number;
  status: string;
  metadata: string;
}

export interface CommercialPackage {
  id: string;
  product_id: string;
  code: string;
  name: string;
  package_type: string;
  status: string;
  metadata: string;
}

export interface CommercialBillableItem {
  id: string;
  product_id: string;
  code: string;
  name: string;
  meter_unit: string;
  billing_scope: string;
  settlement_mode: string;
  pricing_behavior: string;
  status: string;
  metadata: string;
}

export interface CommercialRateCard {
  id: string;
  product_id: string;
  code: string;
  target_type: string;
  target_id: string;
  price_model: string;
  currency: string;
  price_config: string;
  version: number;
  status: string;
  metadata: string;
}

export interface CommercialAssetDefinition {
  asset_code: string;
  product_code: string;
  asset_type: string;
  lifecycle_type: string;
  default_expire_days: number;
  reset_cycle: string;
  status: string;
  description: string;
  metadata: string;
}

export interface CommercialAllowancePolicy {
  id: string;
  product_code: string;
  billing_subject_type: string;
  billing_subject_id: string;
  asset_code: string;
  amount: number;
  reset_cycle: string;
  status: string;
  metadata: string;
}

export interface CommercialWalletSummary {
  billing_subject_type: string;
  billing_subject_id: string;
  product_code: string;
  total_balance: number;
  permanent_balance: number;
  reward_balance: number;
  allowance_balance: number;
}

export interface CommercialOfferingsView {
  product: CommercialProduct | null;
  skus: CommercialSKU[];
  packages: CommercialPackage[];
  billable_items: CommercialBillableItem[];
  rate_cards: CommercialRateCard[];
  asset_definitions: CommercialAssetDefinition[];
  allowance_policies: CommercialAllowancePolicy[];
}

export interface CommercialOfferingsResponse {
  product_code: string;
  offerings: CommercialOfferingsView;
  wallet_summary?: CommercialWalletSummary;
}

export interface CommercialOrderRecord {
  id: string;
  user_id: string;
  organization_id: string;
  product_code: string;
  sku_code: string;
  package_code: string;
  package_type: string;
  currency: string;
  quantity: number;
  unit_amount: number;
  total_amount: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  metadata: string;
  paid_at?: string;
  fulfilled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CommercialPaymentRecord {
  id: string;
  order_id: string;
  user_id: string;
  organization_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  provider_code: string;
  external_payment_id: string;
  status: string;
  metadata: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CommercialFulfillmentRecord {
  id: string;
  order_id: string;
  user_id: string;
  organization_id: string;
  package_code: string;
  fulfillment_mode: string;
  status: string;
  asset_code: string;
  amount: number;
  allowance_policy_id: string;
  cycle_key: string;
  wallet_account_id: string;
  wallet_bucket_id: string;
  wallet_ledger_id: string;
  metadata: string;
  expires_at?: string;
  fulfilled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CommercialOrderView {
  order?: CommercialOrderRecord;
  payment?: CommercialPaymentRecord;
  fulfillment?: CommercialFulfillmentRecord;
  wallet_summary?: CommercialWalletSummary;
}

export interface CommercialOrdersResult {
  items: CommercialOrderView[];
}
