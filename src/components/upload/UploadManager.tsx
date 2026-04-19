/**
 * UploadManager Component
 *
 * 上传管理器 - 组合上传、进度、资产库的核心组件
 */

import React, { useEffect } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useUploadStore } from '@/store/uploadStore';
import { useAuthStore } from '@/store/authStore';
import { UploadDropzone } from './UploadDropzone';
import { UploadProgress } from './UploadProgress';
import { AssetGallery } from './AssetGallery';
import type { AssetType } from '@/types/upload';

interface UploadManagerProps {
  type?: AssetType;
  showGallery?: boolean;
  showProgress?: boolean;
  maxFiles?: number;
}

export const UploadManager: React.FC<UploadManagerProps> = ({
  type = 'original',
  showGallery = true,
  showProgress = true,
  maxFiles = 10
}) => {
  const { t } = useI18n();
  const { isAuthenticated } = useAuthStore();
  
  const {
    tasks,
    assets,
    assetsLoading,
    hasMore,
    filter,
    selectedIds,
    addTasks,
    removeTask,
    retryTask,
    cancelTask,
    clearCompleted,
    fetchAssets,
    deleteAsset,
    setFilter,
    clearSelection
  } = useUploadStore();

  // 初始加载资产
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssets(true);
    }
  }, [fetchAssets, isAuthenticated]);

  // 筛选变化时重新加载
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssets(true);
    }
  }, [filter, fetchAssets, isAuthenticated]);

  const handleUpload = (files: File[]) => {
    addTasks(files, type);
  };

  const handleDelete = async (asset: { asset_id: string }) => {
    if (confirm(t('gallery.confirmDelete') || 'Are you sure you want to delete this asset?')) {
      await deleteAsset(asset.asset_id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-bold text-white">
            {t('upload.title') || 'Upload Images'}
          </h2>
        </div>
        
        <UploadDropzone
          type={type}
          maxFiles={maxFiles}
          onUpload={handleUpload}
        />
      </section>

      {/* 上传进度 */}
      {showProgress && tasks.length > 0 && (
        <section>
          <UploadProgress
            tasks={tasks}
            onCancel={cancelTask}
            onRetry={retryTask}
            onRemove={removeTask}
            onClearCompleted={clearCompleted}
          />
        </section>
      )}

      {/* 资产库 */}
      {showGallery && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-bold text-white">
                {t('upload.libraryTitle') || 'Asset Library'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-400 text-xs">
                {assets.length}
              </span>
            </div>
            
            {selectedIds.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                {t('gallery.clearSelection') || 'Clear selection'}
              </button>
            )}
          </div>

          <AssetGallery
            assets={assets}
            selectedIds={selectedIds}
            onSelect={(ids) => useUploadStore.setState({ selectedIds: ids })}
            onDelete={handleDelete}
            onPreview={(asset) => {
              // TODO: 打开预览模态框
              console.log('Preview:', asset);
            }}
            onEdit={(asset) => {
              // TODO: 跳转到编辑器
              console.log('Edit:', asset);
            }}
            loading={assetsLoading}
            hasMore={hasMore}
            onLoadMore={() => fetchAssets(false)}
            filter={filter}
            onFilterChange={setFilter}
            emptyAction={
              <UploadDropzone
                type={type}
                maxFiles={maxFiles}
                onUpload={handleUpload}
              />
            }
          />
        </section>
      )}
    </div>
  );
};
