/**
 * StyleStudio Component
 *
 * AI 风格加工工作室 - 核心工作流组件
 * 整合: 图片选择 -> 风格选择 -> 加工预览 -> 结果导出
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, ArrowRight, ArrowLeft, Image as ImageIcon, Check, Sparkles } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useAuthStore } from '@/store/authStore';
import { useStyleStore } from '@/store/styleStore';
import { useUploadStore } from '@/store/uploadStore';
import type { Style, ProcessingJob } from '@/types/style';
import { StyleSelector } from './StyleSelector';
import { ProcessingPanel } from './ProcessingPanel';

type StudioStep = 'select-image' | 'select-style' | 'processing' | 'result';

interface StyleStudioProps {
  initialAssetId?: string;
  onComplete?: (job: ProcessingJob) => void;
  onNavigateToAssets?: () => void;
}

export const StyleStudio: React.FC<StyleStudioProps> = ({
  initialAssetId,
  onComplete,
  onNavigateToAssets
}) => {
  const { t, lang } = useI18n();
  const { assets } = useUploadStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const {
    selectedStyleId,
    jobs,
    activeJobId,
    createJob,
    cancelJob,
    retryJob,
    selectStyle
  } = useStyleStore();

  const [currentStep, setCurrentStep] = useState<StudioStep>(
    initialAssetId ? 'select-style' : 'select-image'
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    initialAssetId || null
  );
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // 获取当前选中的资产
  const selectedAsset = assets.find(a => a.asset_id === selectedAssetId);

  // 获取当前活跃任务
  const activeJob = jobs.find(j => j.job_id === activeJobId);

  // 步骤导航
  const canGoNext = () => {
    switch (currentStep) {
      case 'select-image':
        return !!selectedAssetId;
      case 'select-style':
        return !!selectedStyleId;
      case 'processing':
        return activeJob?.status === 'completed';
      default:
        return false;
    }
  };

  const goToNext = () => {
    switch (currentStep) {
      case 'select-image':
        setCurrentStep('select-style');
        break;
      case 'select-style':
        handleStartProcessing();
        break;
      case 'processing':
        if (activeJob?.status === 'completed') {
          setCurrentStep('result');
          onComplete?.(activeJob);
        }
        break;
    }
  };

  const goToPrev = () => {
    switch (currentStep) {
      case 'select-style':
        setCurrentStep('select-image');
        break;
      case 'processing':
        // 取消当前任务
        if (activeJobId) {
          cancelJob(activeJobId);
        }
        setCurrentStep('select-style');
        break;
      case 'result':
        setCurrentStep('select-style');
        break;
    }
  };

  // 开始加工
  const handleStartProcessing = async () => {
    if (!selectedAssetId || !selectedStyleId) return;

    setIsCreatingJob(true);
    setCurrentStep('processing');

    try {
      await createJob([selectedAssetId], selectedStyleId);
    } catch (error) {
      console.error('Failed to create job:', error);
      setCurrentStep('select-style');
    } finally {
      setIsCreatingJob(false);
    }
  };

  // 选择资产
  const handleSelectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
  };

  // 选择风格
  const handleSelectStyle = (style: Style) => {
    selectStyle(style.style_id);
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => {
    const steps = [
      { key: 'select-image', label: t('studio.step.image') || '选择图片', icon: ImageIcon },
      { key: 'select-style', label: t('studio.step.style') || '选择风格', icon: Sparkles },
      { key: 'processing', label: t('studio.step.process') || 'AI加工', icon: Wand2 },
      { key: 'result', label: t('studio.step.result') || '完成', icon: Check }
    ];

    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <React.Fragment key={step.key}>
              {index > 0 && (
                <div className={`w-8 h-0.5 ${
                  isCompleted ? 'bg-primary-500' : 'bg-white/10'
                }`} />
              )}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : isCompleted
                    ? 'text-primary-400'
                    : 'text-gray-500'
                }`}
              >
                <StepIcon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // 渲染当前步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-image':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                {t('studio.selectImage.title') || '选择要加工的图片'}
              </h3>
              <p className="text-sm text-gray-400">
                {t('studio.selectImage.desc') || '从您的资产库中选择一张图片开始加工'}
              </p>
            </div>

            {assets.length === 0 ? (
            <div className="glass rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden group">
              <div className="grid grid-cols-2 gap-6 mb-8 relative z-10 max-w-lg mx-auto">
                <div className="glass rounded-2xl p-5 text-center">
                  <div className="h-32 sm:h-48 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl mb-4 flex items-center justify-center text-4xl sm:text-6xl grayscale opacity-60">🍜</div>
                  <p className="text-gray-500 font-medium">{lang === 'th' ? 'ก่อน' : lang === 'zh' ? '优化前' : 'Before'}</p>
                </div>
                <div className="glass rounded-2xl p-5 text-center border border-primary-500/20 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-[50px] rounded-full pointer-events-none"></div>
                  <div className="h-32 sm:h-48 bg-gradient-to-br from-orange-500/80 to-red-700/60 rounded-xl mb-4 flex items-center justify-center text-4xl sm:text-6xl shadow-lg shadow-orange-500/30 relative z-10">🍜</div>
                  <p className="text-primary-500 font-medium">{lang === 'th' ? '✨ หลัง (AI)' : lang === 'zh' ? '✨ 优化后 (AI)' : '✨ After (AI)'}</p>
                </div>
              </div>
              <h4 className="text-xl font-bold text-white mb-2 relative z-10">
                {t('studio.selectImage.empty.title') || '暂无图片'}
              </h4>
              <p className="text-sm text-gray-400 mb-6 relative z-10">
                {!isAuthenticated 
                  ? (lang === 'th' ? 'อัปโหลดภาพอาหารของคุณแล้วให้ AI ช่วยตกแต่งให้สวยงาม' : lang === 'zh' ? '上传您的美食图片，让 AI 为您一键生成专业级菜单图' : 'Upload your food images and let AI generate professional menu photos')
                  : (t('studio.selectImage.empty.desc') || '请先上传一些图片到资产库')}
              </p>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/register');
                  } else {
                    onNavigateToAssets?.();
                  }
                }}
                className="btn-primary px-8 py-3 rounded-xl font-bold relative z-10 inline-flex items-center gap-2"
              >
                {!isAuthenticated ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {lang === 'th' ? 'ลงทะเบียนเพื่อใช้งานฟรี' : lang === 'zh' ? '注册免费使用' : 'Register to try for free'}
                  </>
                ) : (
                  t('studio.selectImage.empty.upload') || '去上传图片'
                )}
              </button>
            </div>
          ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {assets.map((asset) => (
                  <button
                    key={asset.asset_id}
                    onClick={() => handleSelectAsset(asset.asset_id)}
                    className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                      selectedAssetId === asset.asset_id
                        ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-[#060608]'
                        : 'hover:scale-[1.02]'
                    }`}
                  >
                    <img
                      src={asset.thumbnail || asset.url}
                      alt={asset.filename}
                      className="w-full h-full object-cover"
                    />
                    {selectedAssetId === asset.asset_id && (
                      <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 已选图片预览 */}
            {selectedAsset && (
              <div className="glass rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-3">
                  {t('studio.selectImage.selected') || '已选择'}
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={selectedAsset.thumbnail || selectedAsset.url}
                    alt={selectedAsset.filename}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-white font-medium">{selectedAsset.filename}</p>
                    <p className="text-xs text-gray-400">
                      {selectedAsset.width} x {selectedAsset.height} · {(selectedAsset.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'select-style':
        return (
          <div className="space-y-6">
            {/* 已选图片预览 */}
            {selectedAsset && (
              <div className="glass rounded-xl p-4 flex items-center gap-4">
                <img
                  src={selectedAsset.thumbnail || selectedAsset.url}
                  alt={selectedAsset.filename}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-400">
                    {t('studio.processing.image') || '待加工图片'}
                  </p>
                  <p className="text-white font-medium truncate">{selectedAsset.filename}</p>
                </div>
                <button
                  onClick={() => setCurrentStep('select-image')}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  {t('studio.action.change') || '更换'}
                </button>
              </div>
            )}

            {/* 风格选择器 */}
            <StyleSelector
              selectedStyleId={selectedStyleId || undefined}
              onSelect={handleSelectStyle}
            />
          </div>
        );

      case 'processing':
      case 'result':
        return (
          <div className="space-y-6">
            <ProcessingPanel
              job={activeJob}
              inputImageUrl={selectedAsset?.url}
              onCancel={() => activeJobId && cancelJob(activeJobId)}
              onRetry={() => activeJobId && retryJob(activeJobId)}
              onRefinement={() => {/* TODO: 打开局部微调 */}}
              onDownload={(url) => {
                // 下载图片
                const link = document.createElement('a');
                link.href = url;
                link.download = `processed-${Date.now()}.jpg`;
                link.click();
              }}
            />

            {/* 任务完成后显示继续操作 */}
            {activeJob?.status === 'completed' && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    selectStyle(null);
                    setSelectedAssetId(null);
                    setCurrentStep('select-image');
                  }}
                  className="btn-outline px-6 py-3 rounded-xl font-medium"
                >
                  {t('studio.action.new') || '加工新图片'}
                </button>
                <button
                  onClick={() => {
                    setCurrentStep('select-style');
                  }}
                  className="btn-primary px-6 py-3 rounded-xl font-medium"
                >
                  {t('studio.action.another') || '换种风格'}
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 步骤指示器 */}
      {renderStepIndicator()}

      {/* 步骤内容 */}
      <div className="animate-slide-up">
        {renderStepContent()}
      </div>

      {/* 底部导航 */}
      {(currentStep === 'select-image' || currentStep === 'select-style') && (
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <button
            onClick={goToPrev}
            disabled={currentStep === 'select-image'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('studio.nav.back') || '上一步'}
          </button>

          <button
            onClick={goToNext}
            disabled={!canGoNext() || isCreatingJob}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isCreatingJob ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('studio.processing.starting') || '启动中...'}
              </>
            ) : currentStep === 'select-style' ? (
              <>
                <Wand2 className="w-4 h-4" />
                {t('studio.action.start') || '开始加工'}
              </>
            ) : (
              <>
                {t('studio.nav.next') || '下一步'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
