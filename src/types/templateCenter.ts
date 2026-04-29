export interface TemplateMetaOption {
  id: string;
  label: string;
  description?: string;
}

export interface TemplatePlatformOption extends TemplateMetaOption {
  width?: number;
  height?: number;
  ratio?: string;
  format?: string;
}

export interface TemplateCenterMeta {
  cuisines: TemplateMetaOption[];
  dish_types: TemplateMetaOption[];
  platforms: TemplatePlatformOption[];
  moods: TemplateMetaOption[];
  plans: TemplateMetaOption[];
}

export interface TemplateCatalogSummary {
  template_id: string;
  slug: string;
  name: string;
  description: string;
  cuisine: string;
  dish_type: string;
  platforms: string[];
  moods: string[];
  tags: string[];
  plan_required: string;
  credits_cost: number;
  locked: boolean;
  is_favorite: boolean;
  cover_asset_id?: string;
  recommend_score: number;
}

export interface TemplateCatalogExample {
  id?: string;
  template_version_id?: string;
  example_type: string;
  title?: string;
  description?: string;
  source_ref?: string;
  storage_key?: string;
  asset_id?: string;
  preview_url?: string;
  input_asset_url?: string;
  output_asset_url?: string;
  metadata_json?: string;
  metadata?: Record<string, any>;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateCatalogDetail extends TemplateCatalogSummary {
  current_version_id: string;
  prompt_templates: Record<string, string>;
  copy_templates: Record<string, any>;
  hashtags: Record<string, string[]>;
  design_spec: Record<string, any>;
  export_specs: Record<string, any>;
  input_schema: Record<string, any>;
  execution_profile: Record<string, any>;
  examples: TemplateCatalogExample[];
  metadata?: Record<string, any>;
}

export interface ListTemplateCatalogsParams {
  cuisine?: string;
  dish_type?: string;
  platform?: string;
  mood?: string;
  query?: string;
  plan?: string;
}

export interface UseTemplateRequest {
  target_platform: string;
  language?: string;
  upload_image_url?: string;
  custom_copy?: Record<string, string>;
}

export interface TemplateUseResult {
  template_id: string;
  template_version_id: string;
  target_route: string;
  target_method: string;
  credits_cost: number;
  plan_required: string;
  prefilled_job: {
    mode: string;
    provider?: string;
    prompt?: string;
    requested_variants?: number;
    params?: Record<string, any>;
    metadata?: Record<string, any>;
  };
  template_context?: Record<string, any>;
}

export interface CopyTemplateRequest {
  name?: string;
  visibility?: string;
}

export interface CopyTemplateResult {
  style_id: string;
  name: string;
  visibility: string;
  source_catalog_id: string;
  source_version_id: string;
}

export interface TemplateStudioLaunchPayload {
  templateId: string;
  templateVersionId: string;
  templateName: string;
  description?: string;
  previewUrl?: string;
  tags: string[];
  targetPlatform: string;
  requestedVariants: number;
  creditsCost: number;
  planRequired: string;
  provider?: string;
  exportSpec?: Record<string, any>;
  templateContext?: Record<string, any>;
}
