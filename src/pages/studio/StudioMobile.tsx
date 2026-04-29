import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CreditCard, LayoutGrid, Loader2, Search, Sparkles, Upload, Wallet } from 'lucide-react';
import { useAssetStore, useStylePresetStore, useGenerationJobStore } from '@/store/studioStore';
import { useWalletBalances, useAuthStore } from '@/store/authStore';
import { assetService, generationJobService } from '@/services/studio';
import { StudioBillingErrorCode } from '@/types/studio';
import { readFileAsDataURL } from '@/utils/file';
import { buildCreateJobRequestFromCreativeSource, findCreativeSourceByKey, listStudioCreativeSources } from '@/utils/studioCreativeSource';
import { getStudioAssetDisplayUrl } from '@/utils/studioAsset';
import { useStudioSessionActions } from './hooks/useStudioSessionActions';
import WorkspaceCanvas from './components/WorkspaceCanvas';
import StyleMarketDrawer from './components/StyleMarketDrawer';

export default function StudioMobile() {
  const { t } = useTranslation();
  const { assets, addAsset, selectAsset, selectedAssetId, promptDraft, setPromptDraft, setInputMode } = useAssetStore();
  const { presets, officialTemplates, selectedSourceKey, selectPreset, selectOfficialTemplate } = useStylePresetStore();
  const { upsertJob, setActiveJob, startPolling } = useGenerationJobStore();
  const { usableBalance } = useWalletBalances();

  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { removeCurrentBaseAsset } = useStudioSessionActions();

  React.useEffect(() => {
    void useAuthStore.getState().fetchWalletSummaries();
  }, []);

  const selectedAsset = assets.find((asset) => asset.asset_id === selectedAssetId);
  const selectedSource = findCreativeSourceByKey(presets, officialTemplates, selectedSourceKey);
  const canUseSelectedSource = Boolean(selectedSource && !selectedSource.locked && (selectedSource.source_type !== 'template' || selectedSource.is_hydrated));
  const filteredSources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const sources = listStudioCreativeSources(presets, officialTemplates);
    if (!normalized) return sources.slice(0, 6);
    return sources.filter((source) => [source.title, source.description || '', ...(source.tags || [])].join(' ').toLowerCase().includes(normalized)).slice(0, 6);
  }, [officialTemplates, presets, query]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      const newAsset = await assetService.registerAsset({
        asset_type: 'source',
        source_type: 'upload',
        file_name: file.name,
        source_url: dataUrl,
        preview_url: dataUrl,
        mime_type: file.type,
        file_size: file.size,
        width: 1024,
        height: 1024,
      });
      addAsset(newAsset);
      selectAsset(newAsset.asset_id);
      setInputMode('image_to_image');
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAssetId || !promptDraft.trim() || !canUseSelectedSource) return;
    setGenerating(true);
    setBillingError(null);
    try {
      const job = await generationJobService.createJob({
        ...buildCreateJobRequestFromCreativeSource({
          source: selectedSource,
          sourceAssetIds: [selectedAssetId],
          inputMode: 'image_to_image',
          promptOverride: promptDraft.trim(),
        }),
      });
      upsertJob(job);
      setActiveJob(job.job_id);
      startPolling(job.job_id);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      const errorCode = err?.response?.data?.error_code || err?.error_code;
      const fallbackMessage = err?.message || t('studio.billing.unknown_error');
      switch (errorCode) {
        case StudioBillingErrorCode.ALLOWANCE_INSUFFICIENT:
        case StudioBillingErrorCode.CREDITS_INSUFFICIENT:
        case StudioBillingErrorCode.WALLET_INSUFFICIENT:
          setBillingError(t('studio.billing.insufficient_balance'));
          break;
        case StudioBillingErrorCode.CONFIG_MISSING:
          setBillingError(t('studio.billing.config_missing'));
          break;
        case StudioBillingErrorCode.UPSTREAM_FAILED:
          setBillingError(t('studio.billing.upstream_failed'));
          break;
        case StudioBillingErrorCode.JOB_CREATE_FAILED:
          setBillingError(t('studio.billing.create_failed'));
          break;
        default:
          setBillingError(fallbackMessage);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleResetBaseAsset = () => {
    removeCurrentBaseAsset();
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white overflow-hidden relative font-sans">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/8 rounded-full blur-[120px] pointer-events-none glow-orb" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none glow-orb" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-white/5 bg-black/35 backdrop-blur-2xl">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={handleBack} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-white/70">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{step === 1 ? t('studio.step1.title') : step === 2 ? t('studio.step2.title') : t('studio.step3.title')}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
              <span className="font-black text-white">{step}</span>/3
            </div>
          </div>
        </header>

        <div className="px-4 pt-4 pb-28 flex-1 overflow-y-auto space-y-5">
          <div className="interactive-panel interactive-panel-purple rounded-2xl border border-white/8 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t('studio.panel.mobileSummary', { defaultValue: 'Session Summary' })}</p>
                <p className="mt-2 text-sm font-black text-white">{selectedSource ? selectedSource.title : t('studio.panel.notSelected', { defaultValue: 'Not selected' })}</p>
                {selectedSource?.locked && (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-amber-200/70">
                    {selectedSource.plan_required || t('studio.market.locked', { defaultValue: 'Locked' })}
                  </p>
                )}
                {selectedSource?.source_type === 'template' && !selectedSource.is_hydrated && !selectedSource.locked && (
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-purple-200/70">
                    {t('studio.market.preparingTemplate', { defaultValue: 'Preparing template...' })}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/70 inline-flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-primary-300" />
                {usableBalance ?? '--'}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MobileStat label={t('studio.panel.baseImage', { defaultValue: 'Base image' })} value={selectedAsset ? t('studio.panel.ready', { defaultValue: 'Ready' }) : t('studio.panel.missing', { defaultValue: 'Required' })} />
              <MobileStat label={t('studio.panel.styleOptional', { defaultValue: 'Optional Style' })} value={selectedSource ? t('studio.panel.ready', { defaultValue: 'Ready' }) : t('studio.panel.optional', { defaultValue: 'Optional' })} />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <label className="interactive-panel relative flex flex-col items-center justify-center w-full h-[280px] border-2 border-dashed border-white/10 rounded-3xl hover:border-purple-400/30 hover:bg-purple-400/5 transition-all duration-500 ease-out cursor-pointer group glass-strong shadow-inner">
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                {uploading ? <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" /> : <Upload className="w-10 h-10 text-white/30 group-hover:text-purple-200 mb-4 transition-colors duration-500" />}
                <span className="text-base font-semibold text-white/80 text-center px-8">{uploading ? t('studio.step1.uploading') : t('studio.step1.desc')}</span>
                <span className="text-xs text-white/30 mt-2">{t('studio.step1.formats')}</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {selectedAsset && (
                <div className="rounded-2xl overflow-hidden border border-white/8 bg-white/[0.03] p-3">
                  <img src={getStudioAssetDisplayUrl(selectedAsset)} alt={t('studio.step1.title')} className="w-full h-44 object-cover rounded-xl" />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{selectedAsset.file_name || t('studio.step1.title')}</p>
                      <p className="text-xs text-gray-500">{t('studio.panel.baseImageReady', { defaultValue: 'Ready for generation and future refinement.' })}</p>
                    </div>
                    <button onClick={handleResetBaseAsset} className="text-xs font-semibold text-white/60">{t('studio.panel.change', { defaultValue: 'Change' })}</button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-4">
                <div>
                  <h3 className="text-base font-black text-white">{t('studio.panel.customPrompt', { defaultValue: 'Custom Prompt' })}</h3>
                  <p className="text-sm text-gray-400">{t('studio.prompt.imageToImageHelp', { defaultValue: '输入你希望在原图基础上做的具体改造，风格预设只是可选增强。' })}</p>
                </div>
                <textarea
                  value={promptDraft}
                  onChange={(e) => setPromptDraft(e.target.value)}
                  placeholder={t('studio.prompt.imageToImagePlaceholder', { defaultValue: '描述希望保留的主体、要替换的元素、风格、光线和构图...' })}
                  className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-400/25"
                />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-white">{t('studio.panel.styleOptional', { defaultValue: 'Optional Style' })}</h3>
                    <p className="text-sm text-gray-400">{t('studio.market.optionalHint', { defaultValue: '可以直接生成，需要更强风格化时再选风格市场。' })}</p>
                  </div>
                  <button onClick={() => setIsMarketOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
                    <LayoutGrid className="h-4 w-4" />
                    {t('studio.step2.more')}
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('studio.market.search')}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-400/25"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {filteredSources.map((source) => (
                    <button
                      key={`${source.source_type}:${source.source_id}`}
                      onClick={() => {
                        if (source.source_type === 'template') {
                          selectOfficialTemplate(source.template_id || source.source_id);
                        } else {
                          selectPreset(source.style_preset_id || source.source_id);
                        }
                      }}
                      className={`interactive-panel interactive-panel-purple overflow-hidden rounded-2xl border ${selectedSourceKey === `${source.source_type}:${source.source_id}` ? 'border-orange-500/30 shadow-[0_0_24px_rgba(249,115,22,0.16)]' : 'border-white/8'}`}
                    >
                      <img src={source.preview_url || `https://picsum.photos/seed/${source.source_id}/320/240`} alt={source.title} className="h-28 w-full object-cover" />
                      <div className="p-3 text-left">
                        <p className="truncate text-sm font-black text-white">{source.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-400">{source.description || t('studio.market.cardFallback', { defaultValue: 'Designed for restaurant-friendly commercial outputs.' })}</p>
                        {source.locked && (
                          <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-amber-200/70">
                            {source.plan_required || t('studio.market.locked', { defaultValue: 'Locked' })}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="grid grid-cols-2 gap-3">
                  <MobileStat label={t('studio.step3.cost')} value="10 cr" icon={<CreditCard className="h-3.5 w-3.5" />} />
                  <MobileStat label={t('studio.step3.eta')} value="~15s" icon={<Sparkles className="h-3.5 w-3.5" />} />
                </div>
                {billingError && <p className="mt-3 text-sm text-red-400">{billingError}</p>}
                <button
                  onClick={handleGenerate}
                  disabled={!selectedAssetId || !promptDraft.trim() || !canUseSelectedSource || generating}
                  className="mt-4 btn-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-bold disabled:opacity-60"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating
                    ? t('studio.step3.creating')
                    : !selectedSource
                      ? t('studio.step3.selectStyleFirst', { defaultValue: 'Select Style' })
                      : !canUseSelectedSource
                        ? selectedSource.locked
                          ? t('studio.market.locked', { defaultValue: 'Locked' })
                          : t('studio.market.preparingTemplate', { defaultValue: 'Preparing template...' })
                        : t('studio.step3.btn')}
                </button>
              </div>
            </div>
          )}

          {step === 3 && <WorkspaceCanvas />}
        </div>
      </div>

      <StyleMarketDrawer isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} />
    </div>
  );
}

function MobileStat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
      <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-500">{icon}{label}</p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}
