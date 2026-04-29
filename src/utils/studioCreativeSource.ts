import type { TemplateCatalogSummary, TemplateStudioLaunchPayload } from '@/types/templateCenter';
import type { CreateJobRequest, StudioCreativeSource, StylePreset, StudioInputMode } from '@/types/studio';

export function creativeSourceKey(sourceType: StudioCreativeSource['source_type'], sourceId: string) {
  return `${sourceType}:${sourceId}`;
}

export function buildStylePresetCreativeSource(preset: StylePreset): StudioCreativeSource {
  return {
    source_id: preset.style_preset_id,
    source_type: 'style_preset',
    title: preset.name,
    description: preset.description,
    preview_url: preset.preview_url,
    tags: preset.tags || [],
    dimensions: preset.dimensions || [],
    execution_profile: preset.execution_profile,
    style_preset_id: preset.style_preset_id,
    badge_label: 'My Style',
  };
}

export function buildTemplateCreativeSource(payload: TemplateStudioLaunchPayload): StudioCreativeSource {
  return {
    source_id: payload.templateId,
    source_type: 'template',
    title: payload.templateName,
    description: payload.description,
    preview_url: payload.previewUrl,
    tags: payload.tags || [],
    dimensions: [],
    available_platforms: [payload.targetPlatform],
    metadata: {
      template_context: payload.templateContext,
      export_spec: payload.exportSpec,
    },
    plan_required: payload.planRequired,
    credits_cost: payload.creditsCost,
    requested_variants: payload.requestedVariants,
    target_platform: payload.targetPlatform,
    provider: payload.provider,
    locked: false,
    is_hydrated: true,
    template_id: payload.templateId,
    template_version_id: payload.templateVersionId,
    badge_label: 'Official Template',
  };
}

export function buildTemplateCatalogCreativeSource(summary: TemplateCatalogSummary): StudioCreativeSource {
  return {
    source_id: summary.template_id,
    source_type: 'template',
    title: summary.name,
    description: summary.description,
    preview_url: undefined,
    tags: summary.tags || [],
    dimensions: [],
    available_platforms: summary.platforms || [],
    plan_required: summary.plan_required,
    credits_cost: summary.credits_cost,
    target_platform: summary.platforms?.[0],
    locked: summary.locked,
    is_hydrated: false,
    template_id: summary.template_id,
    badge_label: 'Official Template',
  };
}

export function listStudioCreativeSources(
  presets: StylePreset[],
  officialTemplates: StudioCreativeSource[],
): StudioCreativeSource[] {
  return [...officialTemplates, ...presets.map(buildStylePresetCreativeSource)];
}

export function findCreativeSourceByKey(
  presets: StylePreset[],
  officialTemplates: StudioCreativeSource[],
  selectedSourceKey: string | null,
): StudioCreativeSource | null {
  if (!selectedSourceKey) return null;
  const sources = listStudioCreativeSources(presets, officialTemplates);
  return sources.find((item) => creativeSourceKey(item.source_type, item.source_id) === selectedSourceKey) || null;
}

export function buildCreateJobRequestFromCreativeSource(params: {
  source: StudioCreativeSource | null;
  sourceAssetIds: string[];
  inputMode: StudioInputMode;
  promptOverride?: string;
}): CreateJobRequest {
  const { source, sourceAssetIds, inputMode, promptOverride } = params;
  const effectivePrompt = promptOverride?.trim() || undefined;
  const templateContext = (source?.metadata?.template_context as Record<string, any> | undefined) || {};
  const prefilledParams = (templateContext.prefilled_params as Record<string, any> | undefined) || {};
  const prefilledMetadata = (templateContext.prefilled_metadata as Record<string, any> | undefined) || {};

  const request: CreateJobRequest = {
    mode: 'single',
    input_mode: inputMode,
    source_asset_ids: sourceAssetIds,
    style_preset_id: source?.source_type === 'style_preset' ? source.style_preset_id : undefined,
    provider: source?.provider,
    prompt: effectivePrompt,
    requested_variants: source?.requested_variants || 4,
    params: {
      ...prefilledParams,
    },
    metadata: {
      ...prefilledMetadata,
      creative_source: source
        ? {
            source_type: source.source_type,
            source_id: source.source_id,
            title: source.title,
            plan_required: source.plan_required,
            credits_cost: source.credits_cost,
            target_platform: source.target_platform,
            template_id: source.template_id,
            template_version_id: source.template_version_id,
            style_preset_id: source.style_preset_id,
          }
        : undefined,
      export_spec: source?.metadata?.export_spec,
    },
  };

  return request;
}
