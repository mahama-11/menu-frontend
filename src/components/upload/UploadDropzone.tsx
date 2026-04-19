/**
 * UploadDropzone Component
 *
 * 拖拽上传区域组件 - 支持拖拽、点击、多文件、压缩预览
 */

import React, { useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertCircle, X } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useAuthStore } from '@/store/authStore';
import type { AssetType } from '@/types/upload';

interface UploadDropzoneProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // bytes
  maxFiles?: number;
  disabled?: boolean;
  onUpload: (files: File[]) => void;
  type: AssetType;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic';

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  accept = ACCEPTED_TYPES,
  multiple = true,
  maxSize = MAX_FILE_SIZE,
  maxFiles = 10,
  disabled = false,
  onUpload,
  type
}) => {
  const { t } = useI18n();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return `${file.name}: ${t('upload.error.notImage') || 'Not an image file'}`;
    }
    if (file.size > maxSize) {
      return `${file.name}: ${t('upload.error.tooLarge') || 'File too large (max 10MB)'}`;
    }
    return null;
  }, [maxSize, t]);

  const createPreview = (file: File): Promise<{ file: File; url: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({ file, url: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || disabled) return;

    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    // 验证文件数量
    if (fileArray.length > maxFiles) {
      newErrors.push(t('upload.error.tooMany') || `Maximum ${maxFiles} files allowed`);
      setErrors(newErrors);
      return;
    }

    // 验证每个文件
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    setErrors(newErrors);

    // 创建预览
    if (validFiles.length > 0) {
      const newPreviews = await Promise.all(validFiles.map(createPreview));
      setPreviews((prev) => [...prev, ...newPreviews]);
      onUpload(validFiles);
    }
  }, [disabled, maxFiles, onUpload, t, validateFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    handleFiles(e.dataTransfer.files);
  }, [handleFiles, isAuthenticated, navigate]);

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    if (!disabled) inputRef.current?.click();
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearErrors = () => setErrors([]);

  return (
    <div className="w-full space-y-4">
      {/* 错误提示 */}
      {errors.length > 0 && (
        <div className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-300 mb-1">
                {t('upload.error.title') || 'Upload Error'}
              </p>
              <ul className="text-xs text-red-400/80 space-y-0.5">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={clearErrors}
              className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 拖拽区域 */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer
          glass rounded-2xl p-8 sm:p-12
          border-2 border-dashed transition-all duration-300
          ${isDragging
            ? 'border-primary-500 bg-primary-500/10 scale-[1.02]'
            : 'border-white/20 hover:border-primary-500/50 hover:bg-white/5'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center text-center space-y-4">
          {/* 图标 */}
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center
            transition-all duration-300
            ${isDragging
              ? 'bg-primary-500 shadow-lg shadow-primary-500/30'
              : 'bg-white/10 group-hover:bg-primary-500/20'
            }
          `}>
            <Upload className={`
              w-8 h-8 transition-colors
              ${isDragging ? 'text-white' : 'text-primary-400'}
            `} />
          </div>

          {/* 文字 */}
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">
              {isDragging
                ? t('upload.dropHere') || 'Drop files here'
                : t('upload.dragOrClick') || 'Drag & drop or click to upload'
              }
            </p>
            <p className="text-sm text-gray-400">
              {t('upload.supportedFormats') || 'Supports: JPG, PNG, WebP, HEIC'}
            </p>
            <p className="text-xs text-gray-500">
              {t('upload.maxSize') || 'Max 10MB per file'} · {t('upload.maxFiles') || `Max ${maxFiles} files`}
            </p>
          </div>

          {/* 类型标签 */}
          <div className="flex items-center gap-2">
            <span className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${type === 'original' ? 'bg-blue-500/20 text-blue-400' : ''}
              ${type === 'menu' ? 'bg-green-500/20 text-green-400' : ''}
              ${type === 'social' ? 'bg-purple-500/20 text-purple-400' : ''}
            `}>
              {type === 'original' && (t('upload.type.original') || 'Original')}
              {type === 'menu' && (t('upload.type.menu') || 'Menu')}
              {type === 'social' && (t('upload.type.social') || 'Social')}
            </span>
          </div>
        </div>

        {/* 拖拽时的光晕效果 */}
        {isDragging && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/20 via-transparent to-primary-500/20 animate-pulse" />
        )}
      </div>

      {/* 预览区域 */}
      {previews.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-300">
              {t('upload.previews') || 'Previews'} ({previews.length})
            </p>
            <button
              onClick={() => setPreviews([])}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              {t('upload.clear') || 'Clear'}
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {previews.map((preview, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-xl overflow-hidden group"
              >
                <img
                  src={preview.url}
                  alt={preview.file.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePreview(index);
                    }}
                    className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-[10px] text-white truncate px-1">
                    {preview.file.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
