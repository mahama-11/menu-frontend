/**
 * Upload Store
 * 
 * 上传状态管理（Zustand）
 */

import { create } from 'zustand';
import type { UploadTask, Asset, AssetFilter, AssetType } from '@/types/upload';
import { uploadService } from '@/services/upload';

interface UploadState {
  // 上传任务队列
  tasks: UploadTask[];
  // 资产库
  assets: Asset[];
  assetsLoading: boolean;
  assetsError: string | null;
  hasMore: boolean;
  total: number;
  // 筛选条件
  filter: AssetFilter;
  // 选中的资产
  selectedIds: string[];
  // 预览资产
  previewAsset: Asset | null;
  
  // Actions
  addTasks: (files: File[], type: AssetType) => void;
  updateTask: (taskId: string, updates: Partial<UploadTask>) => void;
  removeTask: (taskId: string) => void;
  clearCompleted: () => void;
  retryTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  
  fetchAssets: (reset?: boolean) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  setFilter: (filter: AssetFilter) => void;
  toggleSelection: (assetId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setPreviewAsset: (asset: Asset | null) => void;
  startUpload: (taskId: string, type: AssetType) => Promise<void>;
}

const generateTaskId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useUploadStore = create<UploadState>((set, get) => ({
  tasks: [],
  assets: [],
  assetsLoading: false,
  assetsError: null,
  hasMore: true,
  total: 0,
  filter: {},
  selectedIds: [],
  previewAsset: null,

  // 添加上传任务
  addTasks: (files, type) => {
    const newTasks: UploadTask[] = files.map(file => ({
      id: generateTaskId(),
      file,
      status: 'pending',
      progress: 0,
      speed: 0,
      remainingTime: 0,
      abortController: new AbortController()
    }));

    set(state => ({
      tasks: [...state.tasks, ...newTasks]
    }));

    // 自动开始上传
    newTasks.forEach(task => {
      get().startUpload(task.id, type);
    });
  },

  // 开始上传（内部方法）
  startUpload: async (taskId: string, type: AssetType) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      // 更新状态为上传中
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'uploading' } : t
        )
      }));

      // 压缩图片
      const compressedFile = await uploadService.compressImage(task.file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85
      });

      // 上传文件
      const response = await uploadService.uploadFile(
        compressedFile,
        type,
        (event) => {
          set(state => ({
            tasks: state.tasks.map(t =>
              t.id === taskId
                ? {
                    ...t,
                    progress: event.progress,
                    speed: event.speed,
                    remainingTime: event.remainingTime
                  }
                : t
            )
          }));
        },
        task.abortController?.signal
      );

      // 上传成功
      const asset: Asset = {
        id: response.asset_id,
        asset_id: response.asset_id,
        type: type as AssetType,
        url: response.url,
        thumbnail: response.thumbnail,
        filename: response.filename,
        size: response.size,
        width: response.width,
        height: response.height,
        mimeType: 'image/jpeg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId
            ? { ...t, status: 'completed', progress: 100, asset }
            : t
        ),
        assets: [asset, ...state.assets]
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      set(state => ({
        tasks: state.tasks.map(t =>
          t.id === taskId
            ? { ...t, status: 'failed', error: errorMessage }
            : t
        )
      }));
    }
  },

  // 更新任务
  updateTask: (taskId, updates) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      )
    }));
  },

  // 移除任务
  removeTask: (taskId) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === taskId);
    
    // 取消进行中的上传
    if (task?.status === 'uploading' && task.abortController) {
      task.abortController.abort();
    }

    set(state => ({
      tasks: state.tasks.filter(t => t.id !== taskId)
    }));
  },

  // 清空已完成任务
  clearCompleted: () => {
    set(state => ({
      tasks: state.tasks.filter(t => t.status !== 'completed')
    }));
  },

  // 重试任务
  retryTask: (taskId) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 重置任务状态
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? {
              ...t,
              status: 'pending',
              progress: 0,
              speed: 0,
              remainingTime: 0,
              error: undefined,
              abortController: new AbortController()
            }
          : t
      )
    }));

    // 重新开始上传
    get().startUpload(taskId, 'original');
  },

  // 取消任务
  cancelTask: (taskId) => {
    const { tasks } = get();
    const task = tasks.find(t => t.id === taskId);
    
    if (task?.abortController) {
      task.abortController.abort();
    }

    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === taskId
          ? { ...t, status: 'cancelled' }
          : t
      )
    }));
  },

  // 获取资产列表
  fetchAssets: async (reset: boolean = false) => {
    const { filter } = get();
    
    if (reset) {
      set({ assetsLoading: true, assetsError: null, assets: [] });
    } else {
      set({ assetsLoading: true });
    }

    try {
        const response = await uploadService.getAssets({
          ...filter,
          // page, // page removed to match the type signature
        });

      set(state => ({
        assets: reset ? response.assets : [...state.assets, ...response.assets],
        total: response.total,
        hasMore: response.hasMore,
        assetsLoading: false
      }));
    } catch (error) {
      set({
        assetsError: error instanceof Error ? error.message : 'Failed to fetch assets',
        assetsLoading: false
      });
    }
  },

  // 删除资产
  deleteAsset: async (assetId) => {
    try {
      await uploadService.deleteAsset(assetId);
      set(state => ({
        assets: state.assets.filter(a => a.asset_id !== assetId),
        selectedIds: state.selectedIds.filter(id => id !== assetId)
      }));
    } catch (error) {
      console.error('Failed to delete asset:', error);
      throw error;
    }
  },

  // 设置筛选条件
  setFilter: (filter) => {
    set({ filter });
    get().fetchAssets(true);
  },

  // 切换选中状态
  toggleSelection: (assetId) => {
    set(state => ({
      selectedIds: state.selectedIds.includes(assetId)
        ? state.selectedIds.filter(id => id !== assetId)
        : [...state.selectedIds, assetId]
    }));
  },

  // 全选
  selectAll: () => {
    set(state => ({
      selectedIds: state.assets.map(a => a.asset_id)
    }));
  },

  // 清空选择
  clearSelection: () => {
    set({ selectedIds: [] });
  },

  // 设置预览资产
  setPreviewAsset: (asset) => {
    set({ previewAsset: asset });
  }
}));
