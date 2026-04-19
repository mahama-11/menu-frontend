/**
 * @deprecated 
 * THIS SERVICE IS DEPRECATED.
 * The backend architecture has migrated from a "prompt tool API" to a "stable AI image processing task system".
 * Please use `src/services/studio.ts` instead, which models the correct endpoints for `StudioAsset`, `StylePreset`, `GenerationJob`, and `GenerationVariant`.
 * See `v-menu-backend/docs/architecture/STUDIO_FRONTEND_INTEGRATION.md` for details.
 * 
 * Style Service
 * 
 * 风格管理与加工任务 API 服务
 */

import { menuApiClient } from './api';
import type {
  Style,
  StylePreset,
  ProcessingJob,
  BatchProcessingConfig,
  ListStylesRequest,
  ListStylesResponse,
  CreateJobRequest,
  CreateJobResponse,
  RefinementMask,
  StyleCollection
} from '@/types/style';

// ==================== 风格管理 ====================

export const styleService = {
  /**
   * 获取风格列表
   */
  listStyles: async (params: ListStylesRequest): Promise<ListStylesResponse> => {
    const response = await menuApiClient.get('/v1/styles', { params });
    return response.data;
  },

  /**
   * 获取系统预设风格
   */
  listPresets: async (): Promise<StylePreset[]> => {
    const response = await menuApiClient.get('/v1/styles/presets');
    return response.data.styles;
  },

  /**
   * 获取风格详情
   */
  getStyle: async (styleId: string): Promise<Style> => {
    const response = await menuApiClient.get(`/v1/styles/${styleId}`);
    return response.data;
  },

  /**
   * 创建自定义风格
   */
  createStyle: async (data: Partial<Style>): Promise<Style> => {
    const response = await menuApiClient.post('/v1/styles', data);
    return response.data;
  },

  /**
   * 更新风格
   */
  updateStyle: async (styleId: string, data: Partial<Style>): Promise<Style> => {
    const response = await menuApiClient.put(`/v1/styles/${styleId}`, data);
    return response.data;
  },

  /**
   * 删除风格
   */
  deleteStyle: async (styleId: string): Promise<void> => {
    await menuApiClient.delete(`/v1/styles/${styleId}`);
  },

  /**
   * 克隆风格 (创建派生版本)
   */
  forkStyle: async (styleId: string, customizations: Partial<Style>): Promise<Style> => {
    const response = await menuApiClient.post(`/v1/styles/${styleId}/fork`, customizations);
    return response.data;
  },

  /**
   * 评分风格
   */
  rateStyle: async (styleId: string, rating: number, feedback?: string): Promise<void> => {
    await menuApiClient.post(`/v1/styles/${styleId}/rate`, { rating, feedback });
  },

  /**
   * 收藏/取消收藏风格
   */
  toggleFavorite: async (styleId: string, favorite: boolean): Promise<void> => {
    await menuApiClient.post(`/v1/styles/${styleId}/favorite`, { favorite });
  },

  /**
   * 获取我的收藏
   */
  listFavorites: async (): Promise<Style[]> => {
    const response = await menuApiClient.get('/v1/styles/favorites');
    return response.data.styles;
  }
};

// ==================== 加工任务 ====================

export const processingService = {
  /**
   * 创建加工任务
   */
  createJob: async (request: CreateJobRequest): Promise<CreateJobResponse> => {
    const response = await menuApiClient.post('/v1/processing/jobs', request);
    return response.data;
  },

  /**
   * 获取任务详情
   */
  getJob: async (jobId: string): Promise<ProcessingJob> => {
    const response = await menuApiClient.get(`/v1/processing/jobs/${jobId}`);
    return response.data;
  },

  /**
   * 获取任务列表
   */
  listJobs: async (params?: {
    status?: string;
    type?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ jobs: ProcessingJob[]; total: number }> => {
    const response = await menuApiClient.get('/v1/processing/jobs', { params });
    return response.data;
  },

  /**
   * 取消任务
   */
  cancelJob: async (jobId: string): Promise<void> => {
    await menuApiClient.post(`/v1/processing/jobs/${jobId}/cancel`);
  },

  /**
   * 重试失败任务
   */
  retryJob: async (jobId: string): Promise<ProcessingJob> => {
    const response = await menuApiClient.post(`/v1/processing/jobs/${jobId}/retry`);
    return response.data;
  },

  /**
   * 删除任务记录
   */
  deleteJob: async (jobId: string): Promise<void> => {
    await menuApiClient.delete(`/v1/processing/jobs/${jobId}`);
  },

  /**
   * 创建批量加工任务
   */
  createBatchJob: async (config: BatchProcessingConfig): Promise<CreateJobResponse> => {
    const response = await menuApiClient.post('/v1/processing/batch', config);
    return response.data;
  },

  /**
   * 创建局部微调任务
   */
  createRefinementJob: async (
    baseJobId: string,
    outputIndex: number,
    masks: RefinementMask[],
    instruction: string
  ): Promise<CreateJobResponse> => {
    const response = await menuApiClient.post('/v1/processing/refinement', {
      base_job_id: baseJobId,
      output_index: outputIndex,
      masks,
      instruction
    });
    return response.data;
  },

  /**
   * 获取任务进度 (WebSocket 备选)
   */
  pollJobProgress: async (jobId: string): Promise<ProcessingJob> => {
    const response = await menuApiClient.get(`/v1/processing/jobs/${jobId}/progress`);
    return response.data;
  }
};

// ==================== 风格收藏集 ====================

export const collectionService = {
  /**
   * 获取收藏集列表
   */
  listCollections: async (): Promise<StyleCollection[]> => {
    const response = await menuApiClient.get('/v1/collections');
    return response.data.collections;
  },

  /**
   * 创建收藏集
   */
  createCollection: async (name: string, description?: string): Promise<StyleCollection> => {
    const response = await menuApiClient.post('/v1/collections', { name, description });
    return response.data;
  },

  /**
   * 更新收藏集
   */
  updateCollection: async (
    collectionId: string,
    data: Partial<StyleCollection>
  ): Promise<StyleCollection> => {
    const response = await menuApiClient.put(`/v1/collections/${collectionId}`, data);
    return response.data;
  },

  /**
   * 删除收藏集
   */
  deleteCollection: async (collectionId: string): Promise<void> => {
    await menuApiClient.delete(`/v1/collections/${collectionId}`);
  },

  /**
   * 添加风格到收藏集
   */
  addToCollection: async (collectionId: string, styleId: string): Promise<void> => {
    await menuApiClient.post(`/v1/collections/${collectionId}/styles`, { style_id: styleId });
  },

  /**
   * 从收藏集移除风格
   */
  removeFromCollection: async (collectionId: string, styleId: string): Promise<void> => {
    await menuApiClient.delete(`/v1/collections/${collectionId}/styles/${styleId}`);
  }
};

// ==================== 预设数据 (MVP 阶段前端 mock) ====================

export const MOCK_PRESETS: StylePreset[] = [
  {
    style_id: 'preset-chinese-cuisine',
    name: '中式餐饮',
    name_en: 'Chinese Cuisine',
    category: 'cuisine',
    tags: ['中餐', '传统', '精致'],
    prompt: {
      positive: 'Chinese restaurant food photography, elegant plating, warm lighting, traditional ceramic dishes, steam rising, appetizing presentation, professional food styling, high-end dining atmosphere, rich colors, detailed textures',
      negative: 'blurry, dark, unappetizing, plastic containers, messy plating, cold lighting',
      cfg_scale: 7,
      steps: 30
    },
    sample_images: [],
    visibility: 'public',
    creator_id: 'system',
    usage_count: 1250,
    rating: 4.8,
    rating_count: 156,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_system: true,
    order: 1,
    is_featured: true
  },
  {
    style_id: 'preset-western-cuisine',
    name: '西式餐饮',
    name_en: 'Western Cuisine',
    category: 'cuisine',
    tags: ['西餐', '现代', '简约'],
    prompt: {
      positive: 'Western fine dining photography, minimalist plating, natural lighting, white porcelain, clean background, gourmet presentation, contemporary food styling, elegant shadows, vibrant ingredients, professional quality',
      negative: 'cluttered, dark shadows, casual dining, plasticware, blurry',
      cfg_scale: 7,
      steps: 30
    },
    sample_images: [],
    visibility: 'public',
    creator_id: 'system',
    usage_count: 980,
    rating: 4.7,
    rating_count: 124,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_system: true,
    order: 2,
    is_featured: true
  },
  {
    style_id: 'preset-japanese-cuisine',
    name: '日式料理',
    name_en: 'Japanese Cuisine',
    category: 'cuisine',
    tags: ['日料', '精致', '清新'],
    prompt: {
      positive: 'Japanese cuisine photography, zen aesthetic, natural wood elements, soft diffused lighting, minimalist composition, fresh ingredients, delicate presentation, sushi and sashimi style, harmonious colors, serene atmosphere',
      negative: 'heavy sauce, greasy, cluttered background, harsh lighting, oversaturated',
      cfg_scale: 7,
      steps: 30
    },
    sample_images: [],
    visibility: 'public',
    creator_id: 'system',
    usage_count: 1100,
    rating: 4.9,
    rating_count: 178,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_system: true,
    order: 3,
    is_featured: true
  },
  {
    style_id: 'preset-korean-cuisine',
    name: '韩式料理',
    name_en: 'Korean Cuisine',
    category: 'cuisine',
    tags: ['韩料', '热烈', '丰富'],
    prompt: {
      positive: 'Korean food photography, vibrant colors, sizzling hot plates, banchan side dishes, warm inviting atmosphere, modern Korean aesthetic, appetizing steam, rich textures, family-style presentation, contemporary styling',
      negative: 'cold food, dull colors, empty plates, poor lighting, blurry',
      cfg_scale: 7,
      steps: 30
    },
    sample_images: [],
    visibility: 'public',
    creator_id: 'system',
    usage_count: 750,
    rating: 4.6,
    rating_count: 89,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_system: true,
    order: 4,
    is_featured: false
  },
  {
    style_id: 'preset-outdoor-scene',
    name: '户外场景',
    name_en: 'Outdoor Scene',
    category: 'scene',
    tags: ['户外', '自然光', '野餐'],
    prompt: {
      positive: 'Outdoor dining photography, natural sunlight, garden or patio setting, fresh air atmosphere, wooden table, natural elements, warm golden hour lighting, relaxed dining mood, greenery background, al fresco dining',
      negative: 'indoor, artificial lighting, dark, cramped space, plastic furniture',
      cfg_scale: 7,
      steps: 30
    },
    sample_images: [],
    visibility: 'public',
    creator_id: 'system',
    usage_count: 620,
    rating: 4.5,
    rating_count: 76,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_system: true,
    order: 5,
    is_featured: false
  },
  {
    style_id: 'preset-indoor-studio',
    name: '室内工作室',
    name_en: 'Indoor Studio',
    category: 'scene',
    tags: ['室内', '专业', '布光'],
    prompt: {
      positive: 'Professional studio food photography, controlled lighting setup, seamless background, perfect exposure, sharp focus, professional food styling, commercial quality, clean aesthetic, consistent lighting, high-end restaurant interior',
      negative: 'amateur, poor lighting, cluttered, distracting background, blurry, overexposed',
      cfg_scale: 7,
      steps: 30
    },
    sample_images: [],
    visibility: 'public',
    creator_id: 'system',
    usage_count: 890,
    rating: 4.7,
    rating_count: 112,
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_system: true,
    order: 6,
    is_featured: true
  }
];
