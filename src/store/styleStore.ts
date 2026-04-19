/**
 * @deprecated 
 * THIS STORE IS DEPRECATED.
 * The backend architecture has migrated from a "prompt tool API" to a "stable AI image processing task system".
 * Please use `src/store/studioStore.ts` instead, which models `StudioAsset`, `StylePreset`, `GenerationJob`, and `GenerationVariant`.
 * See `v-menu-backend/docs/architecture/STUDIO_FRONTEND_INTEGRATION.md` for details.
 * 
 * Style Store
 *
 * 风格与加工任务状态管理（Zustand）
 */

import { create } from 'zustand';
import type {
  Style,
  StylePreset,
  ProcessingJob,
  BatchProcessingConfig,
  StyleCategory,
  StyleVisibility
} from '@/types/style';
import { styleService, processingService, MOCK_PRESETS } from '@/services/style';

// ==================== State 定义 ====================

interface StyleState {
  // 风格列表
  styles: Style[];
  presets: StylePreset[];
  favorites: string[];
  selectedStyleId: string | null;

  // 加载状态
  stylesLoading: boolean;
  presetsLoading: boolean;

  // 筛选与分页
  filter: {
    category?: StyleCategory;
    visibility?: StyleVisibility;
    search?: string;
    sort_by: 'popular' | 'newest' | 'rating' | 'usage';
  };
  page: number;
  pageSize: number;
  hasMore: boolean;
  total: number;

  // 加工任务
  jobs: ProcessingJob[];
  activeJobId: string | null;
  jobsLoading: boolean;

  // 批量加工
  batchConfig: BatchProcessingConfig | null;
  batchJobs: ProcessingJob[];

  // ==================== Actions ====================

  // 风格管理
  fetchStyles: (reset?: boolean) => Promise<void>;
  fetchPresets: () => Promise<void>;
  selectStyle: (styleId: string | null) => void;
  toggleFavorite: (styleId: string) => Promise<void>;
  setFilter: (filter: Partial<StyleState['filter']>) => void;
  loadMore: () => Promise<void>;

  // 加工任务
  createJob: (inputAssets: string[], styleId: string, customParams?: ProcessingJob['custom_params']) => Promise<ProcessingJob>;
  createBatchJob: (config: BatchProcessingConfig) => Promise<void>;
  fetchJobs: () => Promise<void>;
  pollJobStatus: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  clearCompletedJobs: () => void;

  // 批量配置
  setBatchConfig: (config: BatchProcessingConfig | null) => void;
  updateBatchConfig: (updates: Partial<BatchProcessingConfig>) => void;
}

// ==================== Store 实现 ====================

export const useStyleStore = create<StyleState>((set, get) => ({
  // 初始状态
  styles: [],
  presets: [],
  favorites: [],
  selectedStyleId: null,

  stylesLoading: false,
  presetsLoading: false,

  filter: {
    sort_by: 'popular'
  },
  page: 1,
  pageSize: 20,
  hasMore: true,
  total: 0,

  jobs: [],
  activeJobId: null,
  jobsLoading: false,

  batchConfig: null,
  batchJobs: [],

  // ==================== 风格管理 Actions ====================

  fetchStyles: async (reset = true) => {
    const { filter, page, pageSize } = get();
    const currentPage = reset ? 1 : page;

    set({ stylesLoading: true });

    try {
      const response = await styleService.listStyles({
        category: filter.category,
        visibility: filter.visibility,
        search: filter.search,
        sort_by: filter.sort_by,
        page: currentPage,
        page_size: pageSize
      });

      set({
        styles: reset ? response.styles : [...get().styles, ...response.styles],
        total: response.total,
        page: currentPage + 1,
        hasMore: response.styles.length === pageSize,
        stylesLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch styles:', error);
      set({ stylesLoading: false });
    }
  },

  fetchPresets: async () => {
    set({ presetsLoading: true });

    try {
      // MVP 阶段使用 mock 数据
      // const presets = await styleService.listPresets();
      const presets = MOCK_PRESETS;

      set({
        presets,
        presetsLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch presets:', error);
      set({ presetsLoading: false });
    }
  },

  selectStyle: (styleId) => {
    set({ selectedStyleId: styleId });
  },

  toggleFavorite: async (styleId) => {
    const { favorites } = get();
    const isFavorite = favorites.includes(styleId);

    try {
      await styleService.toggleFavorite(styleId, !isFavorite);

      set({
        favorites: isFavorite
          ? favorites.filter(id => id !== styleId)
          : [...favorites, styleId]
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  },

  setFilter: (newFilter) => {
    set({
      filter: { ...get().filter, ...newFilter },
      page: 1,
      hasMore: true
    });
    // 自动重新加载
    get().fetchStyles(true);
  },

  loadMore: async () => {
    const { hasMore, stylesLoading } = get();
    if (!hasMore || stylesLoading) return;

    await get().fetchStyles(false);
  },

  // ==================== 加工任务 Actions ====================

  createJob: async (inputAssets, styleId, customParams) => {
    try {
      const response = await processingService.createJob({
        type: 'single',
        input_assets: inputAssets,
        style_id: styleId,
        custom_params: customParams
      });

      const job = response.job;

      set({
        jobs: [job, ...get().jobs],
        activeJobId: job.job_id
      });

      // 开始轮询任务状态
      get().pollJobStatus(job.job_id);

      return job;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  },

  createBatchJob: async (config) => {
    try {
      const response = await processingService.createBatchJob(config);
      const job = response.job;

      set({
        batchJobs: [job, ...get().batchJobs],
        jobs: [job, ...get().jobs],
        activeJobId: job.job_id
      });

      get().pollJobStatus(job.job_id);
    } catch (error) {
      console.error('Failed to create batch job:', error);
      throw error;
    }
  },

  fetchJobs: async () => {
    set({ jobsLoading: true });

    try {
      const response = await processingService.listJobs({
        page: 1,
        page_size: 50
      });

      set({
        jobs: response.jobs,
        jobsLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      set({ jobsLoading: false });
    }
  },

  pollJobStatus: async (jobId) => {
    const poll = async () => {
      try {
        const job = await processingService.getJob(jobId);

        set(state => ({
          jobs: state.jobs.map(j =>
            j.job_id === jobId ? job : j
          ),
          batchJobs: state.batchJobs.map(j =>
            j.job_id === jobId ? job : j
          )
        }));

        // 如果任务还在进行中，继续轮询
        if (
          job.status === 'pending' ||
          job.status === 'queued' ||
          job.status === 'preprocessing' ||
          job.status === 'processing' ||
          job.status === 'postprocessing'
        ) {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    };

    poll();
  },

  cancelJob: async (jobId) => {
    try {
      await processingService.cancelJob(jobId);

      set(state => ({
        jobs: state.jobs.map(j =>
          j.job_id === jobId ? { ...j, status: 'cancelled' as const } : j
        )
      }));
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  },

  retryJob: async (jobId) => {
    try {
      const job = await processingService.retryJob(jobId);

      set(state => ({
        jobs: state.jobs.map(j =>
          j.job_id === jobId ? job : j
        )
      }));

      get().pollJobStatus(jobId);
    } catch (error) {
      console.error('Failed to retry job:', error);
    }
  },

  clearCompletedJobs: () => {
    set(state => ({
      jobs: state.jobs.filter(j =>
        j.status !== 'completed' && j.status !== 'failed' && j.status !== 'cancelled'
      )
    }));
  },

  // ==================== 批量配置 Actions ====================

  setBatchConfig: (config) => {
    set({ batchConfig: config });
  },

  updateBatchConfig: (updates) => {
    const { batchConfig } = get();
    if (batchConfig) {
      set({
        batchConfig: { ...batchConfig, ...updates }
      });
    }
  }
}));
