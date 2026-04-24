import { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, Loader2, ScrollText } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { channelService } from '@/services/channel';
import type { ChannelSettlementView } from '@/types/channel';
import { useToastStore } from '@/store/toastStore';
import { getDashboardText } from '../copy';
import {
  ChannelDataRow,
  ChannelDetailPanel,
  ChannelEmptyState,
  formatDate,
  formatMetric,
  getChannelStatusLabel,
  getChannelStatusTone,
  parseStructuredText,
} from './channelUi';

const filters = ['all', 'generated', 'confirmed', 'processing', 'closed', 'canceled'] as const;

export default function ChannelSettlementsPage() {
  const { lang } = useI18n();
  const showToast = useToastStore((state) => state.showToast);
  const [status, setStatus] = useState<(typeof filters)[number]>('all');
  const [items, setItems] = useState<ChannelSettlementView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tDash = useCallback((key: string) => getDashboardText(lang, key), [lang]);

  useEffect(() => {
    let active = true;
    void channelService.getSettlements(status === 'all' ? undefined : status)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setSelectedId((current) => {
          if (current && result.items.some((item) => item.item.id === current)) {
            return current;
          }
          return result.items[0]?.item.id || null;
        });
      })
      .catch((error) => {
        console.error(error);
        if (active) {
          showToast(error instanceof Error ? error.message : tDash('dash.channel.loadError'), 'error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast, status, tDash]);

  const selected = useMemo(() => items.find((item) => item.item.id === selectedId) || items[0], [items, selectedId]);
  const snapshotRows = useMemo(() => parseStructuredText(selected?.item.statement_snapshot), [selected]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
      <section className="dashboard-surface rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="dashboard-kicker text-primary-300/80">{tDash('dash.channel.settlements.kicker')}</p>
            <h2 className="mt-2 text-2xl font-black text-white">{tDash('dash.channel.settlements.title')}</h2>
            <p className="dashboard-copy mt-2 text-sm leading-6">{tDash('dash.channel.settlements.desc')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setLoading(true);
                  setStatus(item);
                }}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  status === item ? 'bg-white/10 text-white' : 'bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {tDash(`dash.channel.filters.${item}`)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <ChannelEmptyState
              icon={<Landmark className="h-6 w-6" />}
              title={tDash('dash.channel.empty.settlementTitle')}
              description={tDash('dash.channel.empty.settlementDesc')}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <button
                key={item.item.id}
                onClick={() => setSelectedId(item.item.id)}
                className={`interactive-panel block w-full rounded-[24px] border p-5 text-left transition-all ${
                  selected?.item.id === item.item.id
                    ? 'border-cyan-400/24 bg-cyan-400/10 shadow-[0_16px_40px_rgba(34,211,238,0.08)]'
                    : 'border-white/8 bg-black/20 hover:border-white/14'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getChannelStatusTone(item.batch?.status || item.item.status)}`}>
                        {getChannelStatusLabel(tDash, item.batch?.status || item.item.status)}
                      </span>
                      <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/70">
                        {item.batch?.settlement_cycle || '--'}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-black text-white">{item.partner?.name || item.item.channel_partner_id}</p>
                    <p className="mt-1 text-sm text-white/45">{item.batch?.batch_no || item.item.settlement_batch_id}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-cyan-100">{formatMetric(item.item.net_amount, lang)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{item.item.currency}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ChannelDataRow label={tDash('dash.channel.fields.commission')} value={formatMetric(item.item.commission_amount, lang)} />
                  <ChannelDataRow label={tDash('dash.channel.fields.clawback')} value={formatMetric(item.item.clawback_amount, lang)} />
                  <ChannelDataRow label={tDash('dash.channel.fields.periodEnd')} value={formatDate(item.batch?.period_end, lang)} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <div>
        {selected ? (
          <ChannelDetailPanel
            kicker={tDash('dash.channel.settlements.detailKicker')}
            title={selected.batch?.batch_no || selected.item.settlement_batch_id}
            description={selected.partner?.name || tDash('dash.channel.settlements.detailDesc')}
          >
            <ChannelDataRow label={tDash('dash.channel.fields.periodStart')} value={formatDate(selected.batch?.period_start, lang)} />
            <ChannelDataRow label={tDash('dash.channel.fields.periodEnd')} value={formatDate(selected.batch?.period_end, lang)} />
            <ChannelDataRow label={tDash('dash.channel.fields.grossCommission')} value={formatMetric(selected.batch?.gross_commission_amount || 0, lang)} accent />
            <ChannelDataRow label={tDash('dash.channel.fields.grossClawback')} value={formatMetric(selected.batch?.gross_clawback_amount || 0, lang)} />
            <ChannelDataRow label={tDash('dash.channel.fields.netAmount')} value={formatMetric(selected.item.net_amount, lang)} />
            <ChannelDataRow label={tDash('dash.channel.fields.closedAt')} value={formatDate(selected.batch?.closed_at, lang)} />

            {snapshotRows.length > 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <ScrollText className="h-4 w-4 text-cyan-200" />
                  {tDash('dash.channel.settlements.snapshot')}
                </div>
                <div className="space-y-2">
                  {snapshotRows.map((entry) => (
                    <ChannelDataRow key={entry.key} label={entry.key} value={entry.value} mono={entry.key === 'raw'} />
                  ))}
                </div>
              </div>
            ) : null}
          </ChannelDetailPanel>
        ) : (
          <ChannelEmptyState
            icon={<Landmark className="h-6 w-6" />}
            title={tDash('dash.channel.settlements.detailEmptyTitle')}
            description={tDash('dash.channel.settlements.detailEmptyDesc')}
          />
        )}
      </div>
    </div>
  );
}
