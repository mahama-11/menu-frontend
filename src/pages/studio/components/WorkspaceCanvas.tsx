import { useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useGenerationJobStore, useVariantSelectionStore } from '@/store/studioStore';
import { useToastStore } from '@/store/toastStore';
import type { GenerationJob } from '@/types/studio';
import { generationJobService } from '@/services/studio';
import { CheckCircle2, Clock3, Download, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { getStudioAssetDisplayUrl } from '@/utils/studioAsset';
import { useStudioSessionActions } from '../hooks/useStudioSessionActions';
import WorkspaceShowcase from './WorkspaceShowcase';

export default function WorkspaceCanvas({ compactHeader = false }: { compactHeader?: boolean }) {
  const { t } = useTranslation();
  const { activeJobId, jobs, upsertJob, stopPolling, setActiveJob } = useGenerationJobStore();
  const { selectVariant, selectedVariantId } = useVariantSelectionStore();
  const { showToast } = useToastStore();
  const { reuseResultAsBase, clearJobContext } = useStudioSessionActions();
  const [isConfirming, setIsConfirming] = useState(false);
  const handledTerminalJobRef = useRef<string | null>(null);

  const activeJob = jobs.find((job) => job.job_id === activeJobId);

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

  useEffect(() => {
    if (currentVariant?.variant_id && currentVariant.variant_id !== selectedVariantId) {
      selectVariant(currentVariant.variant_id);
    }
  }, [currentVariant?.variant_id, selectVariant, selectedVariantId]);

  const isProcessing = activeJob && ['queued', 'processing', 'running', 'dispatching'].includes(activeJob.status);
  const isCompleted = activeJob?.status === 'completed' && activeJob.variants?.length > 0;
  const isFailed = activeJob?.status === 'failed';
  const isCanceled = activeJob?.status === 'canceled';

  useEffect(() => {
    if (!activeJob || !['failed', 'canceled'].includes(activeJob.status)) return;
    const handledKey = `${activeJob.job_id}:${activeJob.status}:${activeJob.updated_at}`;
    if (handledTerminalJobRef.current === handledKey) return;
    handledTerminalJobRef.current = handledKey;
    clearJobContext();
    if (activeJob.status === 'canceled') {
      showToast('已取消当前任务', 'success');
      return;
    }
    showToast(activeJob.error_message || activeJob.stage_message || '服务异常，请重试', 'error');
  }, [activeJob, clearJobContext, showToast]);

  const handleSelectFinal = async () => {
    if (!activeJob || !currentVariant) return;
    setIsConfirming(true);
    try {
      const updatedJob = await generationJobService.selectVariant(activeJob.job_id, currentVariant.variant_id);
      upsertJob(updatedJob);
      selectVariant(currentVariant.variant_id);
      showToast(t('studio.canvas.selected', { defaultValue: 'Final result selected' }), 'success');
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : t('studio.canvas.selectError', { defaultValue: 'Failed to select result' }), 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSetAsBase = () => {
    if (!currentVariant?.asset) {
      showToast(t('studio.canvas.noPreview', { defaultValue: 'Preview is not ready yet' }), 'error');
      return;
    }
    reuseResultAsBase(currentVariant.asset);
    showToast(t('studio.canvas.reuseReady', { defaultValue: 'Result moved back as a new base image' }), 'success');
  };

  const handleCancelJob = async () => {
    if (!activeJob) return;
    try {
      const updatedJob = await generationJobService.cancelJob(activeJob.job_id);
      upsertJob(updatedJob);
      clearJobContext();
      showToast(t('studio.canvas.cancelSuccess', { defaultValue: 'Generation job canceled' }), 'success');
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : t('studio.canvas.cancelError', { defaultValue: 'Failed to cancel generation job' }), 'error');
    }
  };

  return (
    <main className="h-full flex flex-col bg-[#060608] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.10),transparent_30%)] pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col p-4 lg:p-6 gap-4">
        {!compactHeader && (
          <StatusHeader
            activeJob={activeJob}
            isProcessing={Boolean(isProcessing)}
            isCompleted={Boolean(isCompleted)}
            isFailed={Boolean(isFailed)}
            isCanceled={Boolean(isCanceled)}
            onCancel={handleCancelJob}
            t={t}
          />
        )}

        {!activeJob ? (
          <div className="flex-1 min-h-0">
            <WorkspaceShowcase />
          </div>
        ) : isCompleted ? (
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="glass rounded-3xl p-4 lg:p-5 flex min-h-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  {compactHeader && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                      {t('studio.canvas.done', { defaultValue: 'Completed' })}
                    </div>
                  )}
                  <p className="text-sm font-black text-white">{t('studio.canvas.resultsTitle', { defaultValue: 'Generated Variants' })}</p>
                  <p className="text-sm text-gray-400">{t('studio.canvas.resultsDesc', { defaultValue: 'Pick the best result, confirm it, or send it back for another refinement pass.' })}</p>
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                  {activeJob.variants.length} {t('studio.canvas.variants', { defaultValue: 'variants' })}
                </div>
              </div>

              {currentVariant?.asset ? (
                <>
                  <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/8 bg-black/30 relative">
                    <img
                      src={getStudioAssetDisplayUrl(currentVariant.asset)}
                      alt="Selected variant"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                      {t('studio.canvas.previewTitle', { defaultValue: 'Active Result' })} {currentVariantIndex >= 0 ? currentVariantIndex + 1 : 1}
                    </div>
                    {currentVariant.is_selected && (
                      <div className="absolute right-4 top-4 rounded-full bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_0_16px_rgba(249,115,22,0.4)]">
                        {t('studio.canvas.finalBadge', { defaultValue: 'Final' })}
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
                  </div>

                  <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{t('studio.canvas.selectionPanel', { defaultValue: 'Selection Panel' })}</p>
                      <h3 className="mt-2 text-lg font-black text-white">{t('studio.canvas.selectionTitle', { defaultValue: 'Choose how to use this result' })}</h3>
                      <p className="mt-2 max-w-2xl text-sm text-gray-400">{t('studio.canvas.selectionDesc', { defaultValue: 'Confirm it as the final result, download it, or move it back as a new base image for another pass.' })}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/65">
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('studio.canvas.variantLabel', { defaultValue: 'Variant' })} {currentVariantIndex >= 0 ? currentVariantIndex + 1 : 1} / {activeJob.variants.length}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px]">
                    <button
                      onClick={handleSelectFinal}
                      disabled={isConfirming}
                      className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60"
                    >
                      {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t('studio.canvas.selectFinal', { defaultValue: 'Select as Final Result' })}
                    </button>
                    {activeJob.input_mode === 'image_to_image' && (
                      <button
                        onClick={handleSetAsBase}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/18 bg-purple-400/10 px-4 py-3 text-sm font-semibold text-purple-100 transition hover:bg-purple-400/14"
                      >
                        <RefreshCw className="h-4 w-4" />
                        {t('studio.canvas.useAsBase', { defaultValue: 'Use as New Base Image' })}
                      </button>
                    )}
                    <a
                      href={getStudioAssetDisplayUrl(currentVariant.asset)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
                    >
                      <Download className="h-4 w-4" />
                      {t('studio.canvas.openPreview', { defaultValue: 'Open Full Preview' })}
                    </a>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <InlineMetaChip label={t('studio.canvas.jobPrefix', { defaultValue: 'Job' })} value={activeJob.job_id.slice(0, 8)} />
                    <InlineMetaChip label={t('studio.canvas.variants', { defaultValue: 'variants' })} value={String(activeJob.variants.length)} />
                    <InlineMetaChip label={t('studio.canvas.live', { defaultValue: 'In Progress' })} value={t('studio.canvas.done', { defaultValue: 'Completed' })} />
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-gray-500">{t('studio.canvas.noVariant', { defaultValue: 'Select a variant to continue.' })}</div>
              )}
            </div>

            <div className="glass rounded-3xl p-3 lg:p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{t('studio.canvas.filmstripTitle', { defaultValue: 'Variant Filmstrip' })}</p>
                  <p className="mt-1 text-sm text-gray-400">{t('studio.canvas.filmstripDesc', { defaultValue: 'Compare every generated option here and switch the active preview instantly.' })}</p>
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/60">
                  {t('studio.canvas.previewTitle', { defaultValue: 'Active Result' })} {currentVariantIndex >= 0 ? currentVariantIndex + 1 : 1}
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {activeJob.variants.map((variant, index) => {
                  const isActive = currentVariant?.variant_id === variant.variant_id;
                  return (
                    <button
                      key={variant.variant_id}
                      onClick={() => selectVariant(variant.variant_id)}
                      className={`interactive-panel min-w-[150px] overflow-hidden rounded-2xl border text-left transition ${isActive ? 'border-purple-400/35 shadow-[0_0_24px_rgba(139,92,246,0.14)]' : 'border-white/5 bg-white/[0.02]'}`}
                    >
                      <div className="relative aspect-[4/3] bg-white/5">
                        {variant.asset ? (
                          <img src={getStudioAssetDisplayUrl(variant.asset)} alt={`Variant ${index + 1}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/30">{t('studio.canvas.noPreviewAvailable', { defaultValue: 'No Preview' })}</div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-white/85">
                              {t('studio.canvas.variantLabel', { defaultValue: 'Variant' })} {index + 1}
                            </span>
                            {variant.is_selected && (
                              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                {t('studio.canvas.finalBadge', { defaultValue: 'Final' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 glass rounded-3xl flex flex-col items-center justify-center gap-6 p-8 text-center">
            {compactHeader && activeJob && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
                {isProcessing
                  ? t('studio.canvas.live', { defaultValue: 'In Progress' })
                  : isFailed
                    ? t('studio.canvas.failed', { defaultValue: 'Failed' })
                    : t('studio.canvas.canceled', { defaultValue: 'Canceled' })}
              </div>
            )}
            {isProcessing && (
              <>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
                  <div className="absolute inset-0 rounded-full bg-primary-500/10 blur-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{t('studio.canvas.processing')}</h2>
                  <p className="mt-2 text-sm text-gray-400 max-w-md">{activeJob?.stage_message || t('studio.canvas.processingDesc', { defaultValue: 'Your generation is in progress. Keep this page open while we prepare multiple polished variants.' })}</p>
                </div>
              </>
            )}

            {isFailed && (
              <>
                <XCircle className="w-16 h-16 text-red-400" />
                <div>
                  <h2 className="text-2xl font-black text-white">{t('studio.canvas.failed')}</h2>
                  <p className="mt-2 text-sm text-gray-400 max-w-md">{activeJob?.error_message || t('studio.canvas.failedDesc', { defaultValue: 'This generation could not be completed. You can adjust the setup and try again.' })}</p>
                </div>
              </>
            )}

            {isCanceled && (
              <>
                <XCircle className="w-16 h-16 text-white/40" />
                <div>
                  <h2 className="text-2xl font-black text-white">{t('studio.canvas.canceled')}</h2>
                  <p className="mt-2 text-sm text-gray-400 max-w-md">{t('studio.canvas.canceledDesc', { defaultValue: 'The generation was canceled. Any reserved balance will be released automatically.' })}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusHeader({
  activeJob,
  isProcessing,
  isCompleted,
  isFailed,
  isCanceled,
  onCancel,
  t,
}: {
  activeJob?: GenerationJob;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isCanceled: boolean;
  onCancel: () => void;
  t: TFunction;
}) {
  const stageLabel = isCompleted
    ? t('studio.canvas.done', { defaultValue: 'Completed' })
    : isFailed
      ? t('studio.canvas.failed', { defaultValue: 'Failed' })
      : isCanceled
        ? t('studio.canvas.canceled', { defaultValue: 'Canceled' })
        : t('studio.canvas.live', { defaultValue: 'In Progress' });

  return (
    <header className="glass rounded-2xl px-4 py-3 lg:px-5 lg:py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">
          {stageLabel}
        </div>
        <p className="mt-2 text-sm lg:text-base font-black text-white">{activeJob ? `${t('studio.canvas.jobPrefix', { defaultValue: 'Job' })} ${activeJob.job_id.slice(0, 8)}` : t('studio.canvas.idle', { defaultValue: 'Studio Workspace' })}</p>
        <p className="mt-1 text-sm text-gray-400">{activeJob?.stage_message || t('studio.canvas.idleDesc', { defaultValue: 'Upload a base image and choose a style to start generating.' })}</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {activeJob?.eta_seconds ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
            <Clock3 className="h-3.5 w-3.5" />
            ~{activeJob.eta_seconds}s
          </div>
        ) : null}
        {isProcessing && (
          <button onClick={onCancel} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white">
            <XCircle className="h-3.5 w-3.5" />
            {t('studio.canvas.cancel')}
          </button>
        )}
        {!isProcessing && activeJob && (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
            <RefreshCw className="h-3.5 w-3.5" />
            {activeJob.progress}%
          </div>
        )}
      </div>
    </header>
  );
}

function InlineMetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-white/65">
      <span className="uppercase tracking-[0.16em] text-white/35">{label}</span>
      <span className="font-semibold text-white/85">{value}</span>
    </div>
  );
}
