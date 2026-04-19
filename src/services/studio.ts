import { apiClient as api } from './api';
import type {
  AssetLibraryResponse,
  CreateJobRequest,
  CreateSharePostRequest,
  GenerationJob,
  JobHistoryResponse,
  RegisterAssetRequest,
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
    // mock api response when backend is not ready
    const mockId = `asset-${Date.now()}`;
    const mockUrl = data.source_url || ('url' in data ? data.url : undefined) || data.preview_url || '';
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          asset_id: mockId,
          type: 'original',
          asset_type: 'source',
          source_type: 'upload',
          url: mockUrl,
          source_url: mockUrl,
          preview_url: mockUrl,
          thumbnail: mockUrl,
          file_name: data.file_name || `asset-${Date.now()}.png`,
          status: 'ready',
          width: 1024,
          height: 1024,
          mime_type: 'image/png',
          size_bytes: 0,
          created_at: new Date().toISOString(),
        } as StudioAsset);
      }, 500);
    });
  },

  listAssets: async (params?: Record<string, any>): Promise<{ items: StudioAsset[] }> => {
    const res = await api.get<{ items: StudioAsset[] }, { items: StudioAsset[] }>('/studio/assets', { params });
    return { items: (res.items || []).map(normalizeAsset) };
  },

  getLibrary: async (params?: Record<string, any>): Promise<AssetLibraryResponse> => {
    const res = await api.get<AssetLibraryResponse, AssetLibraryResponse>('/studio/library/assets', { params });
    return {
      ...res,
      items: (res.items || []).map((item: AssetLibraryResponse['items'][number]) => ({
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
      items: (res.items || []).map((item: JobHistoryResponse['items'][number]) => ({
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

  createPost: async (data: CreateSharePostRequest): Promise<SharePost> => {
    return api.post<SharePost, SharePost>('/share/posts', data);
  },

  getPost: async (shareId: string): Promise<SharePost> => {
    return api.get<SharePost, SharePost>(`/share/posts/${shareId}`);
  },
};

function normalizeAsset(asset: StudioAsset): StudioAsset {
  return {
    ...asset,
    url: asset.url || asset.preview_url || asset.source_url,
    thumbnail: asset.thumbnail || asset.preview_url || asset.source_url,
    type: asset.type || asset.asset_type,
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
