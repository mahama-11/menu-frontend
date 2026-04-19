/**
 * Upload Module Type Definitions
 * 
 * 图片上传与资产库类型定义
 */

import React from 'react';

export type AssetType = 'original' | 'menu' | 'social' | 'enhanced' | 'qr';

export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Asset {
  id: string;
  asset_id: string;
  type: AssetType;
  url: string;
  thumbnail: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    source?: string;
    aiProcessed?: boolean;
    tags?: string[];
  };
}

export interface UploadTask {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  speed: number; // bytes per second
  remainingTime: number; // seconds
  asset?: Asset;
  error?: string;
  abortController?: AbortController;
}

export interface UploadOptions {
  type: AssetType;
  onProgress?: (progress: number) => void;
  onSpeed?: (speed: number) => void;
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface UploadResponse {
  asset_id: string;
  type: AssetType;
  url: string;
  thumbnail: string;
  filename: string;
  size: number;
  width: number;
  height: number;
}

export interface AssetFilter {
  type?: AssetType;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  aiProcessed?: boolean;
}

export interface AssetGalleryProps {
  assets: Asset[];
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onDelete?: (id: string) => void;
  onPreview?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyAction?: React.ReactNode;
}

export interface UploadDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // bytes
  maxFiles?: number;
  disabled?: boolean;
  onUpload: (files: File[], options: UploadOptions) => void;
  type: AssetType;
}
