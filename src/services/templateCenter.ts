import { apiClient as api } from './api';
import type {
  CopyTemplateRequest,
  CopyTemplateResult,
  ListTemplateCatalogsParams,
  TemplateCatalogDetail,
  TemplateCatalogSummary,
  TemplateCenterMeta,
  TemplateStudioLaunchPayload,
  TemplateUseResult,
  UseTemplateRequest,
} from '@/types/templateCenter';

type ListEnvelope<T> = {
  items?: T[];
};

export const templateCenterService = {
  getMeta: async (): Promise<TemplateCenterMeta> => {
    return api.get<TemplateCenterMeta, TemplateCenterMeta>('/template-center/meta');
  },

  listCatalogs: async (params?: ListTemplateCatalogsParams): Promise<TemplateCatalogSummary[]> => {
    const result = await api.get<ListEnvelope<TemplateCatalogSummary> | TemplateCatalogSummary[], ListEnvelope<TemplateCatalogSummary> | TemplateCatalogSummary[]>(
      '/template-center/catalog',
      { params },
    );
    return Array.isArray(result) ? result : (result.items || []);
  },

  getCatalogDetail: async (templateId: string, plan?: string): Promise<TemplateCatalogDetail> => {
    return api.get<TemplateCatalogDetail, TemplateCatalogDetail>(`/template-center/catalog/${templateId}`, {
      params: plan ? { plan } : undefined,
    });
  },

  listFavorites: async (plan?: string): Promise<TemplateCatalogSummary[]> => {
    const result = await api.get<ListEnvelope<TemplateCatalogSummary> | TemplateCatalogSummary[], ListEnvelope<TemplateCatalogSummary> | TemplateCatalogSummary[]>(
      '/template-center/favorites',
      {
      params: plan ? { plan } : undefined,
      },
    );
    return Array.isArray(result) ? result : (result.items || []);
  },

  setFavorite: async (templateId: string): Promise<void> => {
    await api.post(`/template-center/favorites/${templateId}`);
  },

  removeFavorite: async (templateId: string): Promise<void> => {
    await api.delete(`/template-center/favorites/${templateId}`);
  },

  useTemplate: async (templateId: string, payload: UseTemplateRequest): Promise<TemplateUseResult> => {
    return api.post<TemplateUseResult, TemplateUseResult>(`/template-center/catalog/${templateId}/use`, payload);
  },

  copyToMyTemplates: async (templateId: string, payload?: CopyTemplateRequest): Promise<CopyTemplateResult> => {
    return api.post<CopyTemplateResult, CopyTemplateResult>(`/template-center/catalog/${templateId}/copy-to-my-templates`, payload || {});
  },
};

export async function prepareStudioTemplateLaunch(params: {
  templateId: string;
  targetPlatform?: string;
  language?: string;
  plan?: string;
}): Promise<TemplateStudioLaunchPayload> {
  const detail = await templateCenterService.getCatalogDetail(params.templateId, params.plan);
  const targetPlatform = params.targetPlatform || detail.platforms[0] || '';
  const useResult = await templateCenterService.useTemplate(params.templateId, {
    target_platform: targetPlatform,
    language: params.language,
  });
  return buildStudioLaunchPayload(detail, useResult, targetPlatform)
}

export function buildStudioLaunchPayload(
  detail: TemplateCatalogDetail,
  useResult: TemplateUseResult,
  targetPlatform: string,
): TemplateStudioLaunchPayload {
  return {
    templateId: useResult.template_id,
    templateVersionId: useResult.template_version_id,
    templateName: detail.name,
    description: detail.description,
    previewUrl: detail.examples.find((item) => item.preview_url)?.preview_url || detail.examples.find((item) => item.output_asset_url)?.output_asset_url || detail.examples.find((item) => item.input_asset_url)?.input_asset_url,
    tags: detail.tags || [],
    targetPlatform,
    requestedVariants: useResult.prefilled_job.requested_variants || 1,
    creditsCost: useResult.credits_cost,
    planRequired: useResult.plan_required,
    provider: useResult.prefilled_job.provider,
    exportSpec: useResult.template_context?.export_spec as Record<string, any> | undefined,
    templateContext: {
      ...useResult.template_context,
      prefilled_params: useResult.prefilled_job.params,
      prefilled_metadata: useResult.prefilled_job.metadata,
    },
  };
}
