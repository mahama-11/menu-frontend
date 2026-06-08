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

