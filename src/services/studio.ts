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
    if (typeof sourceUrl === 'string' && sourceUrl.startsWith('blob:')) {
      throw new Error('blob URLs must be converted to data URLs before registering studio assets');
    }
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
    return stabilizeAssetForDisplay(normalizeAsset(res), typeof sourceUrl === 'string' ? sourceUrl : undefined);
  },

  listAssets: async (params?: Record<string, any>): Promise<{ items: StudioAsset[] }> => {
    const res = await api.get<{ items?: StudioAssetApi[] }, { items?: StudioAssetApi[] }>('/studio/assets', { params });
    return { items: await Promise.all((res.items || []).map((item) => stabilizeAssetForDisplay(normalizeAsset(item)))) };
  },

  getLibrary: async (params?: Record<string, any>): Promise<AssetLibraryResponse> => {
    const res = await api.get<AssetLibraryResponseApi, AssetLibraryResponseApi>('/studio/library/assets', { params });
    return {
      total: res.total || 0,
      items: await Promise.all((res.items || []).map(async (item) => ({
        ...item,
        asset: await stabilizeAssetForDisplay(normalizeAsset(item.asset)),
      }))),
    };
  },

  getAssetObjectURL: async (assetId: string): Promise<string> => {
    return fetchStudioAssetObjectURL(assetId);
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
    return normalizeJobForDisplay(res);
  },

  getJob: async (jobId: string): Promise<GenerationJob> => {
    const res = await api.get<GenerationJob, GenerationJob>(`/studio/jobs/${jobId}`);
    return normalizeJobForDisplay(res);
  },

  listJobs: async (params?: Record<string, any>): Promise<{ items: GenerationJob[] }> => {
    const res = await api.get<{ items: GenerationJob[] }, { items: GenerationJob[] }>('/studio/jobs', { params });
    return { items: await Promise.all((res.items || []).map(normalizeJobForDisplay)) };
  },

  getHistory: async (params?: Record<string, any>): Promise<JobHistoryResponse> => {
    const res = await api.get<JobHistoryResponse, JobHistoryResponse>('/studio/history/jobs', { params });
    return {
      ...res,
      items: await Promise.all((res.items || []).map(async (item) => ({
        ...item,
        job: await normalizeJobForDisplay(item.job),
        source_assets: (item.source_assets || []).map(normalizeAsset),
        result_assets: (item.result_assets || []).map(normalizeAsset),
        selected_asset: item.selected_asset ? normalizeAsset(item.selected_asset) : undefined,
      }))),
    };
  },

  cancelJob: async (jobId: string): Promise<GenerationJob> => {
    const res = await api.post<GenerationJob, GenerationJob>(`/studio/jobs/${jobId}/cancel`);
    return normalizeJobForDisplay(res);
  },

  selectVariant: async (jobId: string, variantId: string): Promise<GenerationJob> => {
    const res = await api.post<GenerationJob, GenerationJob>(`/studio/jobs/${jobId}/select-variant`, { variant_id: variantId });
    return normalizeJobForDisplay(res);
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
  const displayUrl = asset.display_url && (asset.display_url.startsWith('blob:') || asset.display_url.startsWith('data:'))
    ? asset.display_url
    : '';

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
    display_url: displayUrl,
    type: asset.type || asset.asset_type || '',
  };
}

const studioAssetObjectUrlCache = new Map<string, string>();
const studioAssetObjectUrlInflight = new Map<string, Promise<string>>();

async function fetchStudioAssetObjectURL(assetId: string, directContentUrl?: string): Promise<string> {
  if (studioAssetObjectUrlCache.has(assetId)) {
    return studioAssetObjectUrlCache.get(assetId)!;
  }
  if (studioAssetObjectUrlInflight.has(assetId)) {
    return studioAssetObjectUrlInflight.get(assetId)!;
  }

  const promise = Promise.resolve(directContentUrl)
    .then((contentUrl) => {
      if (contentUrl) {
        return fetch(contentUrl, {
          credentials: 'same-origin',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('v_menu_token') || ''}`,
            'X-Organization-ID': localStorage.getItem('v_menu_org_id') || '',
          },
        }).then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch studio asset content: ${response.status}`);
          }
          return response.blob();
        });
      }
      return api.get<Blob, Blob>(`/studio/assets/${assetId}/content`, { responseType: 'blob' });
    })
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      studioAssetObjectUrlCache.set(assetId, objectUrl);
      studioAssetObjectUrlInflight.delete(assetId);
      return objectUrl;
    })
    .catch((error) => {
      studioAssetObjectUrlInflight.delete(assetId);
      throw error;
    });

  studioAssetObjectUrlInflight.set(assetId, promise);
  return promise;
}

function isLocalDisplayUrl(url?: string): boolean {
  return Boolean(url && (url.startsWith('blob:') || url.startsWith('data:')));
}

function isExpiringStudioContentUrl(url?: string): boolean {
  if (!url) return false;
  return /\/studio\/assets\/[^/]+\/content(\?|$)/.test(url);
}

async function stabilizeAssetForDisplay(asset: StudioAsset, preferredDisplayUrl?: string): Promise<StudioAsset> {
  if (preferredDisplayUrl && isLocalDisplayUrl(preferredDisplayUrl)) {
    return {
      ...asset,
      display_url: preferredDisplayUrl,
      source_url: preferredDisplayUrl,
      preview_url: preferredDisplayUrl,
      url: preferredDisplayUrl,
      thumbnail: preferredDisplayUrl,
    };
  }

  const existingUrl = asset.url || asset.preview_url || asset.source_url;
  if (isLocalDisplayUrl(existingUrl)) {
    return asset;
  }
  if (!asset.asset_id) {
    return asset;
  }
  if (existingUrl && !isExpiringStudioContentUrl(existingUrl)) {
    return asset;
  }

  try {
    const objectUrl = await fetchStudioAssetObjectURL(asset.asset_id, existingUrl);
    return {
      ...asset,
      display_url: objectUrl,
      source_url: objectUrl,
      preview_url: objectUrl,
      url: objectUrl,
      thumbnail: objectUrl,
    };
  } catch (error) {
    console.error('Failed to stabilize studio asset display URL:', error);
    return {
      ...asset,
      display_url: '',
    };
  }
}

async function hydrateVariantAsset(variant: GenerationJob['variants'][number]): Promise<GenerationJob['variants'][number]> {
  const normalizedAsset = variant.asset ? normalizeAsset(variant.asset) : undefined;
  const existingUrl = normalizedAsset?.url || normalizedAsset?.preview_url || normalizedAsset?.source_url || variant.preview_url;
  if (existingUrl || !variant.asset_id) {
    return {
      ...variant,
      status: variant.status === 'ready' ? 'completed' : variant.status,
      asset: normalizedAsset ? await stabilizeAssetForDisplay(normalizedAsset) : undefined,
    };
  }

  try {
    const objectUrl = await fetchStudioAssetObjectURL(variant.asset_id, existingUrl);
    return {
      ...variant,
      status: variant.status === 'ready' ? 'completed' : variant.status,
      asset: normalizeAsset({
        asset_id: variant.asset_id,
        asset_type: 'generated',
        source_type: 'generated',
        status: 'ready',
        source_url: objectUrl,
        preview_url: objectUrl,
        url: objectUrl,
        display_url: objectUrl,
        thumbnail: objectUrl,
        file_name: `${variant.asset_id}.png`,
      }),
    };
  } catch (error) {
    console.error('Failed to hydrate studio asset preview:', error);
    return {
      ...variant,
      status: variant.status === 'ready' ? 'completed' : variant.status,
      asset: normalizedAsset ? { ...normalizedAsset, display_url: '' } : undefined,
    };
  }
}

async function normalizeJobForDisplay(job: GenerationJob): Promise<GenerationJob> {
  return {
    ...job,
    status: job.status === 'running' || job.status === 'dispatching' ? 'processing' : job.status,
    variants: await Promise.all((job.variants || []).map(hydrateVariantAsset)),
    child_jobs: job.child_jobs ? await Promise.all(job.child_jobs.map(normalizeJobForDisplay)) : undefined,
  };
}
