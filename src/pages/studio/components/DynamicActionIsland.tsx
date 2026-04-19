import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LayoutGrid, Loader2, Upload, CheckCircle2, Download, RefreshCw, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAssetStore, useStylePresetStore, useGenerationJobStore, useVariantSelectionStore } from '@/store/studioStore';
import { assetService, generationJobService } from '@/services/studio';
import { useToastStore } from '@/store/toastStore';
import { StudioBillingErrorCode } from '@/types/studio';

export default function DynamicActionIsland({ onOpenMarket }: { onOpenMarket: () => void }) {
  const { t } = useTranslation();
  const { assets, addAsset, selectAsset, selectedAssetId } = useAssetStore();
  const { presets, selectedPresetId } = useStylePresetStore();
  const { activeJobId, jobs, upsertJob, setActiveJob, stopPolling } = useGenerationJobStore();
  const { selectVariant, selectedVariantId } = useVariantSelectionStore();
  const { showToast } = useToastStore();
  
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [shakeStyleBtn, setShakeStyleBtn] = useState(false);

  const selectedAsset = assets.find((asset) => asset.asset_id === selectedAssetId);
  const selectedPreset = presets.find((preset) => preset.style_preset_id === selectedPresetId);
  const activeJob = jobs.find((job) => job.job_id === activeJobId);

  // Derived View Mode
  const viewMode = useMemo(() => {
    if (activeJob) {
      if (['queued', 'processing', 'running', 'dispatching'].includes(activeJob.status)) return 'generating';
      if (activeJob.status === 'completed' && activeJob.variants?.length > 0) return 'result';
      if (activeJob.status === 'failed' || activeJob.status === 'canceled') return 'error';
    }
    if (selectedAssetId) return 'ready';
    return 'empty';
  }, [activeJob, selectedAssetId]);

  const currentVariant = useMemo(() => {
    if (!activeJob?.variants?.length) return null;
    return (
      activeJob.variants.find((variant) => variant.variant_id === selectedVariantId) ||
      activeJob.variants.find((variant) => variant.is_selected) ||
      activeJob.variants[0]
    );
  }, [activeJob, selectedVariantId]);

  const currentVariantIndex = useMemo(() => {
    if (!activeJob?.variants?.length || !currentVariant) return -1;
    return activeJob.variants.findIndex((variant) => variant.variant_id === currentVariant.variant_id);
  }, [activeJob, currentVariant]);

  const islandVariants = {
    empty: { width: 280, borderRadius: 40, height: 64 },
    ready: { width: 560, borderRadius: 28, height: 80 },
    generating: { width: 280, borderRadius: 40, height: 64 },
    result: { width: 600, borderRadius: 32, height: 'auto' },
    error: { width: 340, borderRadius: 40, height: 64 }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const mockUrl = URL.createObjectURL(file);
      const newAsset = await assetService.registerAsset({
        url: mockUrl,
        type: 'original',
        mime_type: file.type,
        size_bytes: file.size,
        width: 1024,
        height: 1024,
      });
      addAsset(newAsset);
      selectAsset(newAsset.asset_id);
      showToast(t('studio.panel.uploadSuccess', { defaultValue: 'Base image ready' }), 'success');
    } catch (err) {
      console.error(err);
      showToast(t('studio.panel.uploadFailed', { defaultValue: 'Upload failed' }), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAssetId || !selectedPresetId) return;
    setGenerating(true);
    try {
      const job = await generationJobService.createJob({
        mode: 'single',
        style_preset_id: selectedPresetId,
        source_asset_ids: [selectedAssetId],
        requested_variants: 4,
      });
      upsertJob(job);
      setActiveJob(job.job_id);
    } catch (err: any) {
      console.error(err);
      const errorCode = err?.response?.data?.error_code || err?.error_code;
      let msg = t('studio.billing.unknown_error', { defaultValue: 'Generation failed' });
      switch (errorCode) {
        case StudioBillingErrorCode.ALLOWANCE_INSUFFICIENT:
        case StudioBillingErrorCode.CREDITS_INSUFFICIENT:
        case StudioBillingErrorCode.WALLET_INSUFFICIENT:
          msg = t('studio.billing.insufficient_balance', { defaultValue: 'Insufficient credits' });
          break;
      }
      showToast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    if (!selectedPresetId) {
      // Guide user to select style by shaking the style button
      setShakeStyleBtn(true);
      setTimeout(() => setShakeStyleBtn(false), 400);
      return;
    }
    handleGenerate();
  };
  const handleCancelJob = async () => {
    if (!activeJob) return;
    try {
      const updatedJob = await generationJobService.cancelJob(activeJob.job_id);
      upsertJob(updatedJob);
      stopPolling(activeJob.job_id);
      showToast(t('studio.canvas.cancelSuccess', { defaultValue: 'Generation canceled' }), 'success');
    } catch {
      showToast(t('studio.canvas.cancelError', { defaultValue: 'Failed to cancel' }), 'error');
    }
  };

  const handleSetAsBase = () => {
    if (!currentVariant?.asset) return;
    const url = currentVariant.asset.url || currentVariant.asset.source_url;
    if (!url) return;
    
    const newAssetId = `asset-${Date.now()}`;
    addAsset({
      asset_id: newAssetId,
      url,
      source_url: url,
      preview_url: url,
      type: 'generated',
      asset_type: 'generated',
      source_type: 'generated',
      status: 'ready',
      width: 1024,
      height: 1024,
      mime_type: 'image/png',
      size_bytes: 0,
      created_at: new Date().toISOString(),
      file_name: 'refined-result.png',
    });
    selectAsset(newAssetId);
    setActiveJob(null); // Clear active job to return to ready state
    showToast(t('studio.canvas.reuseReady', { defaultValue: 'Moved back as base image' }), 'success');
  };

  return (
    <motion.div
      variants={islandVariants}
      initial={false}
      animate={viewMode}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="overflow-hidden border border-white/[0.08] bg-[#12121A]/80 backdrop-blur-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center w-full"
    >
      <AnimatePresence mode="wait">
        
        {/* State: Empty - Wait for upload */}
        {viewMode === 'empty' && (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex w-full items-center justify-center h-full px-4"
          >
            <label className="flex items-center justify-center gap-3 cursor-pointer hover:bg-white/5 px-6 py-2 rounded-full transition w-full">
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              {uploading ? (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 text-white/70" />
              )}
              <span className="text-sm font-bold text-white/90">
                {uploading ? t('studio.step1.uploading', { defaultValue: 'Uploading...' }) : t('studio.step1.title', { defaultValue: 'Upload Base Image' })}
              </span>
            </label>
          </motion.div>
        )}

        {/* State: Ready - Image + Style + Generate */}
        {viewMode === 'ready' && (
          <motion.div 
            key="ready"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex w-full items-center p-2 gap-2 h-full"
          >
            {/* Base Image Thumbnail */}
            <label className="flex items-center gap-3 rounded-2xl hover:bg-white/10 p-2 pr-4 transition cursor-pointer shrink-0">
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                  </div>
                ) : (
                  <img src={selectedAsset?.preview_url || selectedAsset?.url} className="h-full w-full object-cover" alt="Base" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">{t('studio.panel.baseImage', { defaultValue: 'Base Image' })}</p>
                <p className="text-sm font-bold text-white truncate max-w-[80px]">{t('studio.panel.ready', { defaultValue: 'Ready' })}</p>
              </div>
            </label>

            <div className="h-10 w-px bg-white/10 mx-1 shrink-0" />

            {/* Style Market Trigger */}
            <button 
              onClick={onOpenMarket} 
              className={`flex flex-1 items-center gap-3 rounded-2xl p-2 transition min-w-0 ${
                !selectedPreset 
                  ? 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 animate-pulse-ring' 
                  : 'hover:bg-white/10 border border-transparent'
              } ${shakeStyleBtn ? 'animate-shiver ring-2 ring-red-500/50' : ''}`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${selectedPreset ? 'border-white/10' : 'border-purple-400/50 bg-purple-400/20 text-purple-200'} shadow-inner overflow-hidden`}>
                {selectedPreset ? (
                  <img src={selectedPreset.preview_url} className="h-full w-full object-cover" alt="Style" />
                ) : (
                  <LayoutGrid className="w-5 h-5" />
                )}
              </div>
              <div className="text-left min-w-0">
                <p className={`text-[10px] uppercase font-bold tracking-wider ${selectedPreset ? 'text-purple-300/70' : 'text-purple-300'}`}>
                  {t('studio.panel.style', { defaultValue: 'Style Preset' })}
                </p>
                <p className={`text-sm font-bold truncate ${selectedPreset ? 'text-white' : 'text-purple-100'}`}>
                  {selectedPreset ? selectedPreset.name : t('studio.market.title', { defaultValue: 'Select Style' })}
                </p>
              </div>
            </button>

            {/* Generate CTA */}
            <button 
              onClick={handleGenerateClick}
              disabled={generating}
              className={`flex items-center gap-2 rounded-[20px] px-6 py-4 h-full font-bold shrink-0 transition-all ${
                selectedPreset
                  ? 'btn-primary shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] text-white'
                  : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed hover:bg-white/10'
              }`}
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span className="hidden sm:inline text-base">
                {selectedPreset ? t('studio.step3.btn', { defaultValue: 'Generate' }) : t('studio.step3.selectStyleFirst', { defaultValue: 'Select Style' })}
              </span>
            </button>
          </motion.div>
        )}

        {/* State: Generating */}
        {viewMode === 'generating' && (
          <motion.div 
            key="generating"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="flex w-full items-center justify-between px-6 h-full gap-4"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">{t('studio.canvas.processing', { defaultValue: 'Processing...' })}</span>
                <span className="text-[10px] text-purple-300/70 truncate max-w-[120px]">{activeJob?.stage_message || 'AI is refining your image'}</span>
              </div>
            </div>
            <button onClick={handleCancelJob} className="text-xs text-white/50 hover:text-red-400 transition bg-white/5 hover:bg-white/10 rounded-full px-3 py-1.5 font-medium">
              {t('studio.canvas.cancel', { defaultValue: 'Cancel' })}
            </button>
          </motion.div>
        )}

        {/* State: Error / Canceled */}
        {viewMode === 'error' && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            className="flex w-full items-center justify-between px-6 h-full gap-4"
          >
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-400" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  {activeJob?.status === 'canceled' ? t('studio.canvas.canceled', { defaultValue: 'Canceled' }) : t('studio.canvas.failed', { defaultValue: 'Failed' })}
                </span>
              </div>
            </div>
            <button onClick={() => setActiveJob(null)} className="text-xs text-white bg-white/10 hover:bg-white/20 rounded-full px-4 py-1.5 font-bold transition">
              {t('studio.canvas.retry', { defaultValue: 'Retry' })}
            </button>
          </motion.div>
        )}

        {/* State: Result (Expanded panel with filmstrip and actions) */}
        {viewMode === 'result' && activeJob?.variants && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="flex flex-col w-full p-4 gap-4"
          >
            {/* Top Action Bar */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('studio.canvas.done', { defaultValue: 'Completed' })}
                </div>
                <span className="text-xs text-white/50 px-2 border-l border-white/10">
                  {currentVariantIndex + 1} / {activeJob.variants.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSetAsBase}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-white transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t('studio.canvas.useAsBase', { defaultValue: 'Refine Further' })}</span>
                </button>
                <a
                  href={currentVariant?.asset?.url || currentVariant?.asset?.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 hover:bg-orange-500/20 px-4 py-2 text-xs font-bold text-orange-400 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t('studio.canvas.download', { defaultValue: 'Download' })}
                </a>
                <button onClick={() => setActiveJob(null)} className="ml-2 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Filmstrip */}
            <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-hide">
              {activeJob.variants.map((variant, index) => {
                const isActive = currentVariant?.variant_id === variant.variant_id;
                return (
                  <button
                    key={variant.variant_id}
                    onClick={() => selectVariant(variant.variant_id)}
                    className={`relative shrink-0 h-16 w-20 overflow-hidden rounded-xl border-2 transition-all duration-300 ${isActive ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img 
                      src={variant.asset?.url || variant.asset?.preview_url || variant.asset?.source_url} 
                      className="h-full w-full object-cover" 
                      alt={`Variant ${index + 1}`} 
                    />
                    {isActive && <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-xl" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
