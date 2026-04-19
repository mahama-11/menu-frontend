import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { generationJobService } from '@/services/studio';
import type { JobHistoryItem } from '@/types/studio';
import { useToastStore } from '@/store/toastStore';
import { Clock3, Layers3, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import BeforeAfterSlider from '@/components/ui/BeforeAfterSlider';

export default function JobHistorySection() {
  const { t } = useI18n();
  const { showToast } = useToastStore();
  const [items, setItems] = useState<JobHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await generationJobService.getHistory({ limit: 20, offset: 0 });
        setItems(result.items || []);
      } catch (error) {
        console.error(error);
        showToast(error instanceof Error ? error.message : t('dash.jobHistory.error'), 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast, t]);

  if (loading) {
    return <SectionLoading />;
  }

  return (
    <div className="glass rounded-3xl p-6 md:p-8">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 text-primary-400 shadow-[0_0_30px_rgba(249,115,22,0.15)] border border-white/10">
          <Layers3 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">{t('dash.jobHistory.title')}</h3>
          <p className="text-sm text-gray-400 mt-1">{t('dash.jobHistory.subtitle')}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-6 h-6" />}
          title={t('dash.jobHistory.emptyTitle')}
          description={t('dash.jobHistory.emptyDesc')}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
          {items.map((entry) => (
            <JobCard key={entry.job.job_id} entry={entry} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ entry, t }: { entry: JobHistoryItem; t: any }) {
  const isProcessing = ['queued', 'dispatching', 'running', 'processing'].includes(entry.job.status);
  const isCompleted = entry.job.status === 'completed';
  const isFailed = entry.job.status === 'failed' || entry.job.status === 'canceled';

  const sourceAsset = entry.source_assets?.[0];
  const resultAsset = entry.selected_asset || entry.result_assets?.[0];

  return (
    <div className="group relative rounded-3xl border border-white/10 bg-[#12121A] overflow-hidden shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]">
      {/* Dynamic Ambient Background Glow */}
      {isProcessing && <div className="absolute inset-0 bg-purple-500/5 animate-pulse pointer-events-none" />}
      {isCompleted && <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />}

      {/* Top Header */}
      <div className="relative z-10 p-5 flex items-start justify-between border-b border-white/5 bg-white/[0.02]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StatusPill status={entry.job.status} isProcessing={isProcessing} isCompleted={isCompleted} isFailed={isFailed} t={t} />
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
              {entry.job.mode}
            </span>
          </div>
          <p className="text-sm font-bold text-white tracking-wide">
            {entry.job.stage_message || `${t('dash.jobHistory.jobLabel')} ${entry.job.job_id.slice(0, 8)}`}
          </p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
            <Clock3 className="w-3 h-3" />
            {new Date(entry.job.created_at).toLocaleDateString()}
          </p>
          {isProcessing && (
            <p className="text-xl font-black text-purple-400">{entry.job.progress}%</p>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 relative z-10">
        {/* Magic Before/After Slider if Completed and has both images */}
        {isCompleted && sourceAsset && resultAsset ? (
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-inner h-64 relative group/slider cursor-ew-resize">
            <BeforeAfterSlider 
              beforeImage={sourceAsset.preview_url || sourceAsset.source_url} 
              afterImage={resultAsset.preview_url || resultAsset.source_url} 
            />
          </div>
        ) : isProcessing && sourceAsset ? (
          /* Processing State: Scanning Skeleton */
          <div className="rounded-2xl overflow-hidden border border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)] h-64 relative">
            <img 
              src={sourceAsset.preview_url || sourceAsset.source_url} 
              className="w-full h-full object-cover opacity-30 grayscale blur-sm scale-105" 
              alt="Processing Source" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/20 to-purple-500/50 animate-[scan_2s_ease-in-out_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            </div>
          </div>
        ) : (
          /* Fallback for failed or missing assets */
          <div className="rounded-2xl border border-white/5 bg-black/20 h-64 flex flex-col items-center justify-center text-gray-500">
            {isFailed ? <AlertCircle className="w-8 h-8 mb-2 text-red-400/50" /> : <Sparkles className="w-8 h-8 mb-2 opacity-20" />}
            <span className="text-sm font-medium">{isFailed ? t('dash.jobHistory.failedAsset') : t('dash.jobHistory.noAssetAvailable')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status, isProcessing, isCompleted, isFailed, t }: any) {
  if (isProcessing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200 animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        {t('dash.jobHistory.status.processing')}
      </span>
    );
  }
  if (isCompleted) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        {t('dash.jobHistory.status.completed')}
      </span>
    );
  }
  if (isFailed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300">
        <AlertCircle className="w-3 h-3" />
        {t('dash.jobHistory.status.failed')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-gray-500/30 bg-gray-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
      {status}
    </span>
  );
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/5 bg-white/[0.02]">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-primary-400 shadow-inner">{icon}</div>
      <p className="text-xl font-bold text-white tracking-tight">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>
    </div>
  );
}

function SectionLoading() {
  return (
    <div className="glass rounded-3xl p-6 md:p-8">
      <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
    </div>
  );
}
