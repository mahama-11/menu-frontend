/**
 * Upload Service
 * 
 * 图片上传 API 服务
 */

import { menuApiClient } from './api';
import type { UploadResponse, Asset, AssetFilter } from '@/types/upload';

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  progress: number;
  speed: number;
  remainingTime: number;
}

export const uploadService = {
  /**
   * 上传单个文件
   */
  uploadFile: async (
    file: File,
    type: string,
    onProgress?: (event: UploadProgressEvent) => void,
    signal?: AbortSignal
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 进度监控
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const now = Date.now();
          const loaded = event.loaded;
          const total = event.total;
          const progress = Math.round((loaded / total) * 100);
          
          // 计算速度 (bytes/second)
          const timeDiff = (now - lastTime) / 1000;
          const loadedDiff = loaded - lastLoaded;
          const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
          
          // 计算剩余时间
          const remainingBytes = total - loaded;
          const remainingTime = speed > 0 ? remainingBytes / speed : 0;
          
          lastLoaded = loaded;
          lastTime = now;
          
          onProgress({
            loaded,
            total,
            progress,
            speed,
            remainingTime
          });
        }
      });

      // 完成处理
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data || response);
          } catch {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      // 错误处理
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // 取消信号处理
      if (signal) {
        signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      xhr.open('POST', '/api/upload');
      xhr.send(formData);
    });
  },

  /**
   * 获取资产列表
   */
  getAssets: async (filter?: AssetFilter, page = 1, limit = 20): Promise<{ assets: Asset[]; total: number; hasMore: boolean }> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filter?.type) params.append('type', filter.type);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom);
    if (filter?.dateTo) params.append('dateTo', filter.dateTo);
    if (filter?.aiProcessed !== undefined) params.append('aiProcessed', filter.aiProcessed.toString());

    const response = await menuApiClient.get(`/api/assets?${params.toString()}`);
    return response as unknown as { assets: Asset[]; total: number; hasMore: boolean };
  },

  /**
   * 删除资产
   */
  deleteAsset: async (assetId: string): Promise<void> => {
    await menuApiClient.delete(`/api/assets/${assetId}`);
  },

  /**
   * 获取单个资产详情
   */
  getAsset: async (assetId: string): Promise<Asset> => {
    const response = await menuApiClient.get(`/api/assets/${assetId}`);
    return (response as unknown as { data: Asset }).data;
  },

  /**
   * 压缩图片（客户端预处理）
   */
  compressImage: async (
    file: File,
    options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
  ): Promise<File> => {
    const { maxWidth = 1920, maxHeight = 1920, quality = 0.8 } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        let { width, height } = img;
        
        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }
};
