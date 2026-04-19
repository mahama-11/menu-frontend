import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Clock3, CreditCard, LayoutGrid, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { useAssetStore, useGenerationJobStore, useStylePresetStore } from '@/store/studioStore';
import { useAuthStore, useWalletBalances } from '@/store/authStore';
import { assetService, generationJobService } from '@/services/studio';
import { StudioBillingErrorCode } from '@/types/studio';

export default function ControlPanel({ onOpenMarket }: { onOpenMarket: () => void }) {
  const { t } = useTranslation();
  const { assets, addAsset, selectAsset, selectedAssetId } = useAssetStore();
  const { presets, selectedPresetId } = useStylePresetStore();
  const { upsertJob, setActiveJob, activeJobId, jobs } = useGenerationJobStore();
  const { usableBalance } = useWalletBalances();

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  React.useEffect(() => {
    void useAuthStore.getState().fetchWalletSummaries();
  }, []);

  const activeJob = jobs.find((job) => job.job_id === activeJobId);
  const isJobProcessing = Boolean(activeJob && ['queued', 'processing', 'running', 'dispatching'].includes(activeJob.status));
  const selectedAsset = assets.find((asset) => asset.asset_id === selectedAssetId);
  const selectedPreset = presets.find((preset) => preset.style_preset_id === selectedPresetId);
  const hasRequiredSelection = Boolean(selectedAsset && selectedPreset);
  const railStatusClass = hasRequiredSelection
    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
    : 'border-white/8 bg-white/[0.04] text-white/60';

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAssetId || !selectedPresetId) return;

    setGenerating(true);
    setBillingError(null);
    try {
      const job = await generationJobService.createJob({
        mode: 'single',
        style_preset_id: selectedPresetId,
        source_asset_ids: [selectedAssetId],
        requested_variants: 4,
      });
      upsertJob(job);
      setActiveJob(job.job_id);
    } catch (error: any) {
      console.error(error);
      const errorCode = error?.response?.data?.error_code || error?.error_code;

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
          setBillingError(t('studio.billing.unknown_error'));
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="relative z-20 rounded-[22px] border border-white/8 bg-[#08080C]/82 px-4 py-3 backdrop-blur-2xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3 xl:w-[290px] xl:shrink-0 xl:border-r xl:border-white/8 xl:pr-4">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${railStatusClass}`}>
            {hasRequiredSelection ? t('studio.panel.ready', { defaultValue: 'Ready' }) : t('studio.panel.missing', { defaultValue: 'Required' })}
          </span>
          {activeJob && (
            <span className="inline-flex items-center rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60">
              {activeJob.status}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">
              {t('studio.panel.summary', { defaultValue: 'Current Setup' })}
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {hasRequiredSelection
                ? t('studio.panel.generateReady', { defaultValue: 'Ready to generate four refined results.' })
                : t('studio.panel.generateLocked', { defaultValue: 'Select a base image and style preset to unlock generation.' })}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <input id="studio-rail-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading || isJobProcessing} />

          <button
            onClick={() => document.getElementById('studio-rail-upload')?.click()}
            className="interactive-panel flex min-w-[220px] flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-left transition hover:bg-white/[0.07] disabled:opacity-60"
            disabled={uploading || isJobProcessing}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-500/12 text-orange-200">
              {selectedAsset ? (
                <img src={selectedAsset.preview_url || selectedAsset.source_url || selectedAsset.url} alt={t('studio.panel.selectedAssetAlt', { defaultValue: 'Selected asset' })} className="h-full w-full object-cover" />
              ) : uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-orange-200/70">{t('studio.step1.title')}</p>
              <p className="truncate text-sm font-semibold text-white">
                {selectedAsset ? selectedAsset.file_name || t('studio.panel.baseImage') : t('studio.panel.baseImage', { defaultValue: 'Base image' })}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-white/42">
              {selectedAsset ? t('studio.panel.change', { defaultValue: 'Change' }) : t('studio.panel.upload', { defaultValue: 'Upload' })}
            </span>
          </button>

          <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/22 xl:block" />

          <button
            onClick={onOpenMarket}
            disabled={isJobProcessing}
            className="interactive-panel flex min-w-[220px] flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2.5 text-left transition hover:bg-white/[0.07] disabled:opacity-60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-400/12 text-purple-100">
              {selectedPreset?.preview_url ? (
                <img src={selectedPreset.preview_url} alt={selectedPreset.name} className="h-full w-full object-cover" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-purple-200/70">{t('studio.step2.title')}</p>
              <p className="truncate text-sm font-semibold text-white">
                {selectedPreset ? selectedPreset.name : t('studio.panel.notSelected', { defaultValue: 'Not selected' })}
              </p>
            </div>
            <span className="shrink-0 text-[11px] font-medium text-white/42">
              {selectedPreset ? t('studio.panel.change', { defaultValue: 'Change' }) : t('studio.step2.more')}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:justify-end xl:border-l xl:border-white/8 xl:pl-4">
          <CompactPill label={t('studio.step3.eta')} value="~15s" icon={<Clock3 className="h-3.5 w-3.5" />} />
          <CompactPill label={t('studio.step3.cost')} value="10 cr" icon={<CreditCard className="h-3.5 w-3.5" />} />
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/60 xl:hidden">
            <Sparkles className="h-3.5 w-3.5 text-primary-200" />
            <span>{usableBalance ?? '--'}</span>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!selectedAssetId || !selectedPresetId || isJobProcessing || generating}
            className="relative min-w-[220px] flex-1 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-500 hover:from-orange-500 hover:to-orange-400 hover:shadow-[0_0_30px_rgba(249,115,22,0.45)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-orange-600 xl:flex-none"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
              {isJobProcessing || generating ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  {generating ? t('studio.step3.creating') : t('studio.step3.processing')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5" />
                  {t('studio.step3.btn')}
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {billingError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div className="min-w-0">
            <p className="text-xs leading-tight text-red-400">{billingError}</p>
            {(billingError.includes('balance') || billingError.includes('余额') || billingError.includes('ยอดเงิน')) && (
              <a href="/dashboard" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-400 transition hover:text-orange-300">
                {t('studio.billing.go_to_dashboard', { defaultValue: 'Go to Dashboard to redeem' })}
                <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function CompactPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-2.5 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/20 text-primary-200">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] uppercase tracking-[0.14em] text-gray-500">{label}</p>
        <p className="truncate text-sm font-black text-white">{value}</p>
      </div>
    </div>
  );
}
