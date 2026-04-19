/**
 * ProcessingPanel Component
 *
 * 加工任务面板 - 显示任务进度、结果、支持对比和微调
 */

import React, { useState } from 'react';
import { X, RotateCcw, Download, Wand2, Clock, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import type { ProcessingJob, ProcessingStatus } from '@/types/style';

interface ProcessingPanelProps {
  job?: ProcessingJob;
  inputImageUrl?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onRefinement?: () => void;
  onDownload?: (url: string) => void;
}

const STATUS_CONFIG: Record<ProcessingStatus, { icon: React.ElementType; label: string; color: string }> = {
  pending: { icon: Clock, label: '等待中', color: 'text-gray-400' },
  queued: { icon: Clock, label: '队列中', color: 'text-yellow-400' },
  preprocessing: { icon: Loader2, label: '预处理', color: 'text-blue-400' },
  processing: { icon: Loader2, label: '加工中', color: 'text-primary-400' },
  postprocessing: { icon: Loader2, label: '后处理', color: 'text-purple-400' },
  completed: { icon: CheckCircle2, label: '已完成', color: 'text-green-400' },
  failed: { icon: AlertCircle, label: '失败', color: 'text-red-400' },
  cancelled: { icon: X, label: '已取消', color: 'text-gray-500' }
};

export const ProcessingPanel: React.FC<ProcessingPanelProps> = ({
  job,
  inputImageUrl,
  onCancel,
  onRetry,
  onRefinement,
  onDownload
}) => {
  const { t } = useI18n();
  const [showComparison, setShowComparison] = useState(false);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState(0);

  if (!job) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {t('processing.empty.title') || '准备开始加工'}
        </h3>
        <p className="text-sm text-gray-400">
          {t('processing.empty.desc') || '选择一张图片和风格后开始 AI 加工'}
        </p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status];
  const StatusIcon = statusConfig.icon;
  const isProcessing = ['pending', 'queued', 'preprocessing', 'processing', 'postprocessing'].includes(job.status);
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';

  const outputUrl = job.output_urls?.[selectedOutputIndex];

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* 头部 - 状态栏 */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isProcessing ? 'bg-primary-500/20' :
            isCompleted ? 'bg-green-500/20' :
            'bg-red-500/20'
          }`}>
            <StatusIcon className={`w-5 h-5 ${statusConfig.color} ${isProcessing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {t(`processing.status.${job.status}`) || statusConfig.label}
            </h3>
            <p className="text-xs text-gray-400">
              {job.type === 'single' ? t('processing.type.single') || '单图加工' :
               job.type === 'batch' ? t('processing.type.batch') || '批量加工' :
               t('processing.type.refinement') || '局部微调'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 对比切换 */}
          {isCompleted && inputImageUrl && outputUrl && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showComparison
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'glass text-gray-400 hover:text-white'
              }`}
            >
              {showComparison ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showComparison
                ? t('processing.compare.hide') || '隐藏对比'
                : t('processing.compare.show') || '对比原图'}
            </button>
          )}

          {/* 操作按钮 */}
          {isProcessing && onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium glass text-gray-400 hover:text-red-400 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              {t('processing.action.cancel') || '取消'}
            </button>
          )}

          {isFailed && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('processing.action.retry') || '重试'}
            </button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {isProcessing && (
        <div className="px-6 py-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              {t('processing.progress') || '加工进度'}
            </span>
            <span className="text-xs font-medium text-primary-400">
              {job.progress}%
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          {job.estimated_seconds && (
            <p className="text-xs text-gray-500 mt-2">
              {t('processing.eta') || '预计剩余'}: {formatETA(job.estimated_seconds)}
            </p>
          )}
          {job.queue_position && job.queue_position > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {t('processing.queue') || '队列位置'}: #{job.queue_position}
            </p>
          )}
        </div>
      )}

      {/* 错误信息 */}
      {isFailed && job.error && (
        <div className="px-6 py-4 border-b border-white/10 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">
                {t('processing.error.title') || '加工失败'}
              </p>
              <p className="text-xs text-red-300/70 mt-1">
                {job.error.message}
              </p>
              {job.error.retryable && (
                <p className="text-xs text-gray-400 mt-2">
                  {t('processing.error.retryable') || '您可以点击重试按钮再次尝试'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 图片展示区域 */}
      {(isCompleted || isProcessing) && (
        <div className="p-6">
          {isProcessing ? (
            // 加工中 - 显示原图和占位
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
              {inputImageUrl ? (
                <img
                  src={inputImageUrl}
                  alt="Input"
                  className="w-full h-full object-contain opacity-50"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-700" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-3" />
                  <p className="text-white font-medium">
                    {t('processing.working') || 'AI 正在加工中...'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {t('processing.pleaseWait') || '请稍候，即将完成'}
                  </p>
                </div>
              </div>
            </div>
          ) : showComparison && inputImageUrl && outputUrl ? (
            // 对比模式
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs text-gray-400 text-center">{t('processing.original') || '原图'}</p>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                  <img
                    src={inputImageUrl}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-primary-400 text-center">{t('processing.result') || '加工后'}</p>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                  <img
                    src={outputUrl}
                    alt="Processed"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>
          ) : outputUrl ? (
            // 结果展示
            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                <img
                  src={outputUrl}
                  alt="Processed"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* 多输出选择 */}
              {job.output_urls && job.output_urls.length > 1 && (
                <div className="flex gap-2 justify-center">
                  {job.output_urls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOutputIndex(index)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedOutputIndex === index
                          ? 'border-primary-500'
                          : 'border-transparent hover:border-white/30'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Variant ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 底部操作栏 */}
      {isCompleted && outputUrl && (
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onRefinement && (
              <button
                onClick={onRefinement}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
              >
                <Wand2 className="w-4 h-4" />
                {t('processing.action.refinement') || '局部微调'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <button
                onClick={() => onDownload(outputUrl)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-all"
              >
                <Download className="w-4 h-4" />
                {t('processing.action.download') || '下载'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 格式化预计时间
function formatETA(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}秒`;
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}小时${remainingMinutes}分钟`;
}
