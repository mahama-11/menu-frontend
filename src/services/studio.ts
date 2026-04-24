import { apiClient as api } from './api';
import type {
  AssetLibraryResponse,
  CreateJobRequest,
  CreateSharePostRequest,
  GenerationJob,
  JobHistoryResponse,
  RegisterAssetRequest,
  SetShareEngagementRequest,
  ShareEngagement,
  SharePostDetail,
  SharePost,
  SharePostListResponse,
  StudioAsset,
  StylePreset,
} from '@/types/studio';

/**
 * Studio API Services
 * 
 * Defines all the backend endpoints for the AI image processing task system.
 */

// ==================== Studio Assets API ====================

export const assetService = {
  registerAsset: async (data: Partial<StudioAsset> | RegisterAssetRequest): Promise<StudioAsset> => {
    const sourceUrl = data.source_url || ('url' in data ? data.url : undefined) || data.preview_url || '';
    const payload: RegisterAssetRequest = {
      asset_type: data.asset_type || 'source',
      source_type: data.source_type || 'upload',
      file_name: data.file_name || `asset-${Date.now()}.png`,
      source_url: sourceUrl,
      preview_url: data.preview_url || sourceUrl,
      mime_type: data.mime_type,
      width: data.width,
      height: data.height,
      file_size: 'size_bytes' in data ? data.size_bytes : undefined,
      metadata: data.metadata,
    };
    const res = await api.post<StudioAssetApi, RegisterAssetRequest>('/studio/assets', payload);
    return normalizeAsset(res);
  },

  listAssets: async (params?: Record<string, any>): Promise<{ items: StudioAsset[] }> => {
    const res = await api.get<{ items?: StudioAssetApi[] }, { items?: StudioAssetApi[] }>('/studio/assets', { params });
    return { items: (res.items || []).map(normalizeAsset) };
  },

  getLibrary: async (params?: Record<string, any>): Promise<AssetLibraryResponse> => {
    const res = await api.get<AssetLibraryResponseApi, AssetLibraryResponseApi>('/studio/library/assets', { params });
    return {
      total: res.total || 0,
      items: (res.items || []).map((item) => ({
        ...item,
        asset: normalizeAsset(item.asset),
      })),
    };
  },
};

// ==================== Style Presets API ====================

export const stylePresetService = {
  listPresets: async (params?: Record<string, any>): Promise<{ presets: StylePreset[] }> => {
    const response = await api.get<{ items?: StylePreset[] } | StylePreset[], { items?: StylePreset[] } | StylePreset[]>('/studio/styles', { params });
    const items = Array.isArray(response) ? response : response.items || [];
    return { presets: items || [] };
  },

  getPreset: async (styleId: string): Promise<StylePreset> => {
    return api.get<StylePreset, StylePreset>(`/studio/styles/${styleId}`);
  },

  createPreset: async (data: Partial<StylePreset>): Promise<StylePreset> => {
    return api.post<StylePreset, StylePreset>('/studio/styles', data);
  },

  forkPreset: async (styleId: string, overrides: Partial<StylePreset>): Promise<StylePreset> => {
    return api.post<StylePreset, StylePreset>(`/studio/styles/${styleId}/fork`, overrides);
  },
};

// ==================== Generation Jobs API ====================

export const generationJobService = {
  createJob: async (request: CreateJobRequest): Promise<GenerationJob> => {
    const res = await api.post<GenerationJob, GenerationJob>('/studio/jobs', request);
    return normalizeJob(res);
  },

  getJob: async (jobId: string): Promise<GenerationJob> => {
    const res = await api.get<GenerationJob, GenerationJob>(`/studio/jobs/${jobId}`);
    return normalizeJob(res);
  },

  listJobs: async (params?: Record<string, any>): Promise<{ items: GenerationJob[] }> => {
    const res = await api.get<{ items: GenerationJob[] }, { items: GenerationJob[] }>('/studio/jobs', { params });
    return { items: (res.items || []).map(normalizeJob) };
  },

  getHistory: async (params?: Record<string, any>): Promise<JobHistoryResponse> => {
    const res = await api.get<JobHistoryResponse, JobHistoryResponse>('/studio/history/jobs', { params });
    return {
      ...res,
      items: (res.items || []).map((item) => ({
        ...item,
        job: normalizeJob(item.job),
        source_assets: (item.source_assets || []).map(normalizeAsset),
        result_assets: (item.result_assets || []).map(normalizeAsset),
        selected_asset: item.selected_asset ? normalizeAsset(item.selected_asset) : undefined,
      })),
    };
  },

  cancelJob: async (jobId: string): Promise<GenerationJob> => {
    const res = await api.post<GenerationJob, GenerationJob>(`/studio/jobs/${jobId}/cancel`);
    return normalizeJob(res);
  },

  selectVariant: async (jobId: string, variantId: string): Promise<GenerationJob> => {
    const res = await api.post<GenerationJob, GenerationJob>(`/studio/jobs/${jobId}/select-variant`, { variant_id: variantId });
    return normalizeJob(res);
  },
};

export const sharePostService = {
  listPosts: async (params?: Record<string, any>): Promise<SharePostListResponse> => {
    const res = await api.get<SharePostListResponse, SharePostListResponse>('/share/posts', { params });
    return { items: res.items || [] };
  },

  listPublicFeed: async (params?: Record<string, any>): Promise<SharePostListResponse> => {
    const res = await api.get<SharePostListResponse, SharePostListResponse>('/share/public', { params });
    return { items: res.items || [] };
  },

  listFavorites: async (params?: Record<string, any>): Promise<SharePostListResponse> => {
    const res = await api.get<SharePostListResponse, SharePostListResponse>('/share/me/favorites', { params });
    return { items: res.items || [] };
  },

  createPost: async (data: CreateSharePostRequest): Promise<SharePost> => {
    return api.post<SharePost, SharePost>('/share/posts', data);
  },

  getPost: async (shareId: string): Promise<SharePost> => {
    return api.get<SharePost, SharePost>(`/share/posts/${shareId}`);
  },

  getPublicPost: async (token: string): Promise<SharePostDetail> => {
    return api.get<SharePostDetail, SharePostDetail>(`/share/public/${token}`);
  },

  recordPublicView: async (token: string): Promise<ShareEngagement> => {
    return api.post<ShareEngagement, ShareEngagement>(`/share/public/${token}/view`);
  },

  getEngagement: async (shareId: string): Promise<ShareEngagement> => {
    return api.get<ShareEngagement, ShareEngagement>(`/share/posts/${shareId}/engagement`);
  },

  setLike: async (shareId: string, active: boolean): Promise<ShareEngagement> => {
    const payload: SetShareEngagementRequest = { active };
    return api.post<ShareEngagement, ShareEngagement>(`/share/posts/${shareId}/like`, payload);
  },

  setFavorite: async (shareId: string, active: boolean): Promise<ShareEngagement> => {
    const payload: SetShareEngagementRequest = { active };
    return api.post<ShareEngagement, ShareEngagement>(`/share/posts/${shareId}/favorite`, payload);
  },
};

type StudioAssetApi = Partial<StudioAsset> & {
  id?: string;
  file_size?: number;
};

type AssetLibraryItemApi = Omit<AssetLibraryResponse['items'][number], 'asset'> & {
  asset: StudioAssetApi;
};

type AssetLibraryResponseApi = {
  items?: AssetLibraryItemApi[];
  total?: number;
};

function normalizeAsset(asset: StudioAssetApi): StudioAsset {
  const assetId = asset.asset_id || asset.id || '';
  const sourceUrl = asset.source_url || asset.preview_url || asset.url || '';
  const previewUrl = asset.preview_url || asset.source_url || asset.url || '';

  return {
    ...asset,
    asset_id: assetId,
    asset_type: asset.asset_type || asset.type || '',
    source_type: asset.source_type || 'upload',
    status: asset.status || 'ready',
    file_name: asset.file_name || assetId,
    source_url: sourceUrl,
    preview_url: previewUrl,
    created_at: asset.created_at || '',
    size_bytes: asset.size_bytes ?? asset.file_size,
    url: asset.url || previewUrl,
    thumbnail: asset.thumbnail || previewUrl,
    type: asset.type || asset.asset_type || '',
  };
}

function normalizeJob(job: GenerationJob): GenerationJob {
  return {
    ...job,
    status: job.status === 'running' || job.status === 'dispatching' ? 'processing' : job.status,
    variants: (job.variants || []).map((variant) => ({
      ...variant,
      status: variant.status === 'ready' ? 'completed' : variant.status,
      asset: variant.asset ? normalizeAsset(variant.asset) : undefined,
    })),
    child_jobs: job.child_jobs?.map(normalizeJob),
  };
}
