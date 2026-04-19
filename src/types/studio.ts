export type JobMode = 'single' | 'batch' | 'variation' | 'refinement';
export type JobStatus = 'queued' | 'dispatching' | 'processing' | 'running' | 'completed' | 'failed' | 'canceled';
export type JobStage =
  | 'queued'
  | 'dispatching'
  | 'provider_accepted'
  | 'running'
  | 'retry_scheduled'
  | 'completed'
  | 'failed'
  | 'canceled';

export interface StudioAsset {
  asset_id: string;
  user_id?: string;
  organization_id?: string;
  asset_type: string;
  source_type: string;
  status: string;
  file_name: string;
  source_url: string;
  preview_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;

  // Compatibility fields for current Studio UI
  url: string;
  thumbnail?: string;
  type: string;
  width?: number;
  height?: number;
  mime_type?: string;
  size_bytes?: number;
}

export interface StyleDimension {
  type: string;
  key: string;
  label: string;
}

export interface StylePreset {
  style_preset_id: string;
  owner_user_id?: string;
  organization_id?: string;
  name: string;
  description?: string;
  dimensions: StyleDimension[];
  tags: string[];
  visibility: 'private' | 'public' | 'organization';
  version: number;
  parent_style_id?: string;
  preview_url?: string;
  execution_profile?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ChargeStatus = 'created' | 'reserved' | 'settled' | 'released' | 'failed_need_reconcile';

export interface JobChargeSummary {
  billing_enabled: boolean;
  billable: boolean;
  charge_mode?: string;
  resource_type?: string;
  billable_item_code?: string;
  status?: ChargeStatus;
  failure_code?: string;
  failure_message?: string;
  reservation_id?: string;
  settlement_id?: string;
  estimated_units?: number;
  final_units?: number;
  currency?: string;
  quota_consumed?: number;
  credits_consumed?: number;
  wallet_asset_code?: string;
  wallet_debited?: number;
  gross_amount?: number;
  discount_amount?: number;
  net_amount?: number;
  charge_priority_asset_codes?: string[];
}

export interface GenerationVariant {
  variant_id: string;
  job_id: string;
  asset_id: string;
  index: number;
  status: 'pending' | 'ready' | 'failed' | 'completed';
  score?: number;
  is_selected: boolean;
  parent_variant_id?: string;
  asset?: StudioAsset;
  created_at: string;
}

export interface GenerationJob {
  job_id: string;
  user_id?: string;
  organization_id?: string;
  mode: JobMode;
  status: JobStatus;
  stage: JobStage;
  stage_message: string;
  progress: number;
  provider?: string;
  provider_job_id?: string;
  style_preset_id?: string;
  source_asset_ids: string[];
  requested_variants: number;
  variants: GenerationVariant[];
  selected_variant_id?: string;
  child_job_count?: number;
  child_jobs?: GenerationJob[];
  parent_job_id?: string;
  parent_variant_id?: string;
  queue_position?: number;
  eta_seconds?: number;
  error_code?: string;
  error_message?: string;
  charge?: JobChargeSummary;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  canceled_at?: string;
}

export interface SharePostSummary {
  share_id: string;
  status: string;
  visibility: string;
  share_url?: string;
  view_count: number;
  like_count: number;
  favorite_count: number;
  metadata?: Record<string, any>;
  published_at?: string;
}

export interface AssetLibraryItem {
  asset: StudioAsset;
  origin_role: string;
  produced_by_job_id?: string;
  variant_id?: string;
  latest_job?: Pick<GenerationJob, 'job_id' | 'status' | 'stage' | 'stage_message' | 'progress' | 'error_code' | 'error_message' | 'mode' | 'eta_seconds'>;
  can_refine: boolean;
  can_share: boolean;
  share?: SharePostSummary;
}

export interface AssetLibraryResponse {
  items: AssetLibraryItem[];
  total: number;
}

export interface JobHistoryItem {
  job: GenerationJob;
  source_assets: StudioAsset[];
  result_assets: StudioAsset[];
  selected_asset?: StudioAsset;
}

export interface JobHistoryResponse {
  items: JobHistoryItem[];
  total: number;
}

export interface SharePost {
  share_id: string;
  asset_id: string;
  job_id?: string;
  variant_id?: string;
  title?: string;
  caption?: string;
  visibility: 'private' | 'organization' | 'public';
  status: string;
  share_url?: string;
  view_count: number;
  like_count: number;
  favorite_count: number;
  metadata?: Record<string, any>;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SharePostListResponse {
  items: SharePost[];
}

export interface CreateSharePostRequest {
  asset_id: string;
  job_id?: string;
  variant_id?: string;
  title?: string;
  caption?: string;
  visibility: 'private' | 'organization' | 'public';
  metadata?: Record<string, any>;
}

export const StudioBillingErrorCode = {
  ALLOWANCE_INSUFFICIENT: 'STUDIO_BILLING_ALLOWANCE_INSUFFICIENT',
  CREDITS_INSUFFICIENT: 'STUDIO_BILLING_CREDITS_INSUFFICIENT',
  WALLET_INSUFFICIENT: 'STUDIO_BILLING_WALLET_INSUFFICIENT',
  CONFIG_MISSING: 'STUDIO_BILLING_CONFIG_MISSING',
  UPSTREAM_FAILED: 'STUDIO_BILLING_UPSTREAM_FAILED',
  JOB_CREATE_FAILED: 'STUDIO_JOB_CREATE_FAILED',
} as const;

export interface CreateJobRequest {
  mode: JobMode;
  provider?: string;
  idempotency_key?: string;
  style_preset_id?: string;
  source_asset_ids: string[];
  requested_variants?: number;
  params?: Record<string, any>;
  metadata?: Record<string, any>;
  parent_job_id?: string;
  parent_variant_id?: string;
}

export interface RegisterAssetRequest {
  asset_type: string;
  source_type: string;
  file_name: string;
  source_url: string;
  preview_url?: string;
  metadata?: Record<string, any>;
}
