/**
 * UploadProgress Component
 *
 * 上传进度条组件 - 显示上传任务队列、进度、速度、可取消/重试
 */

import React from 'react';
import { X, RotateCcw, CheckCircle2, AlertCircle, Loader2, FileImage } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import type { UploadTask } from '@/types/upload';

interface UploadProgressProps {
  tasks: UploadTask[];
  onCancel: (taskId: string) => void;
  onRetry: (taskId: string) => void;
  onRemove: (taskId: string) => void;
  onClearCompleted: () => void;
  maxHeight?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '-';
  return formatFileSize(bytesPerSecond) + '/s';
};

const formatTime = (seconds: number): string => {
  if (seconds === 0 || !isFinite(seconds)) return '-';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

export const UploadProgress: React.FC<UploadProgressProps> = ({
  tasks,
  onCancel,
  onRetry,
  onRemove,
  onClearCompleted,
  maxHeight = '320px'
}) => {
  const { t } = useI18n();

  if (tasks.length === 0) return null;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const uploadingTasks = tasks.filter(t => t.status === 'uploading');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  const renderTask = (task: UploadTask) => {
    const isUploading = task.status === 'uploading';
    const isCompleted = task.status === 'completed';
    const isFailed = task.status === 'failed';
    const isPending = task.status === 'pending';

    return (
      <div
        key={task.id}
        className="glass rounded-xl p-3 border border-white/5 hover:border-white/10 transition group"
      >
        <div className="flex items-center gap-3">
          {/* 文件图标 */}
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center shrink-0
            ${isCompleted ? 'bg-green-500/20' : ''}
            ${isFailed ? 'bg-red-500/20' : ''}
            ${isUploading ? 'bg-primary-500/20' : ''}
            ${isPending ? 'bg-gray-500/20' : ''}
          `}>
            {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-400" />}
            {isFailed && <AlertCircle className="w-5 h-5 text-red-400" />}
            {isUploading && <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />}
            {isPending && <FileImage className="w-5 h-5 text-gray-400" />}
          </div>

          {/* 文件信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-white truncate">
                {task.file.name}
              </p>
              <span className="text-xs text-gray-500 shrink-0">
                {formatFileSize(task.file.size)}
              </span>
            </div>

            {/* 进度条 */}
            {(isUploading || isCompleted) && (
              <div className="mt-2">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`
                      h-full rounded-full transition-all duration-300
                      ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-yellow-400'}
                    `}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">
                    {isCompleted
                      ? t('upload.completed') || 'Completed'
                      : `${task.progress}%`
                    }
                  </span>
                  {isUploading && (
                    <span className="text-xs text-gray-500">
                      {formatSpeed(task.speed)} · {formatTime(task.remainingTime)} {t('upload.remaining') || 'remaining'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {isFailed && task.error && (
              <p className="text-xs text-red-400 mt-1">{task.error}</p>
            )}

            {/* 待上传提示 */}
            {isPending && (
              <p className="text-xs text-gray-500 mt-1">
                {t('upload.waiting') || 'Waiting...'}
              </p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            {isUploading && (
              <button
                onClick={() => onCancel(task.id)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                title={t('upload.cancel') || 'Cancel'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isFailed && (
              <button
                onClick={() => onRetry(task.id)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-primary-400 transition"
                title={t('upload.retry') || 'Retry'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {(isCompleted || isFailed) && (
              <button
                onClick={() => onRemove(task.id)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition opacity-0 group-hover:opacity-100"
                title={t('upload.remove') || 'Remove'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass rounded-2xl p-4 border border-white/10">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white">
            {t('upload.queue') || 'Upload Queue'}
          </h3>
          <div className="flex items-center gap-2">
            {uploadingTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-xs">
                {uploadingTasks.length} {t('upload.uploading') || 'uploading'}
              </span>
            )}
            {pendingTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs">
                {pendingTasks.length} {t('upload.pending') || 'pending'}
              </span>
            )}
            {completedTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                {completedTasks.length} {t('upload.completed') || 'completed'}
              </span>
            )}
            {failedTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                {failedTasks.length} {t('upload.failed') || 'failed'}
              </span>
            )}
          </div>
        </div>
        {completedTasks.length > 0 && (
          <button
            onClick={onClearCompleted}
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            {t('upload.clearCompleted') || 'Clear completed'}
          </button>
        )}
      </div>

      {/* 任务列表 */}
      <div
        className="space-y-2 overflow-y-auto pr-1"
        style={{ maxHeight }}
      >
        {/* 上传中 */}
        {uploadingTasks.map(renderTask)}
        
        {/* 待上传 */}
        {pendingTasks.map(renderTask)}
        
        {/* 失败 */}
        {failedTasks.map(renderTask)}
        
        {/* 已完成 */}
        {completedTasks.map(renderTask)}
      </div>
    </div>
  );
};
