import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { authService } from '@/services/auth';
import type { AuditHistoryItem } from '@/types/wallet';
import { useToastStore } from '@/store/toastStore';
import { ClipboardList, History, ShieldCheck } from 'lucide-react';

export default function AuditHistorySection() {
  const { t } = useI18n();
  const { showToast } = useToastStore();
  const [items, setItems] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await authService.getAuditHistory(30, 0);
        setItems(result.items || []);
      } catch (error) {
        console.error(error);
        showToast(error instanceof Error ? error.message : t('dash.audit.error'), 'error');
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
    <div className="glass rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.12)]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">{t('dash.audit.title')}</h3>
          <p className="text-sm text-gray-400">{t('dash.audit.subtitle')}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-5 h-5" />}
          title={t('dash.audit.emptyTitle')}
          description={t('dash.audit.emptyDesc')}
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="interactive-panel rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-300">
                      {item.target_type}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                      item.status === 'success'
                        ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                        : 'border border-red-500/20 bg-red-500/10 text-red-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{item.action}</p>
                  <p className="mt-1 text-sm text-gray-400">{item.details || item.diff_summary || t('dash.audit.emptyItemDesc')}</p>
                </div>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                  {item.target_id && <p className="mt-2 font-mono text-xs text-gray-500">{item.target_id}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-blue-400">{icon}</div>
      <p className="text-base font-bold text-white">{title}</p>
      <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  );
}

function SectionLoading() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="h-24 animate-pulse rounded-xl bg-white/5" />
    </div>
  );
}
