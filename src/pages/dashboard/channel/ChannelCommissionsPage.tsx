import { useCallback, useEffect, useMemo, useState } from 'react';
import { HandCoins, Loader2, ReceiptText } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { channelService } from '@/services/channel';
import type { ChannelCommissionView } from '@/types/channel';
import { useToastStore } from '@/store/toastStore';
import { getDashboardText } from '../copy';
import {
  ChannelDataRow,
  ChannelDetailPanel,
  ChannelEmptyState,
  formatDate,
  formatMetric,
  formatPercentFromBps,
  getChannelStatusLabel,
  getChannelStatusTone,
  parseStructuredText,
} from './channelUi';

const filters = ['all', 'pending', 'earned', 'settlement_in_progress', 'settled', 'reversed'] as const;

export default function ChannelCommissionsPage() {
  const { lang } = useI18n();
  const showToast = useToastStore((state) => state.showToast);
  const [status, setStatus] = useState<(typeof filters)[number]>('all');
  const [items, setItems] = useState<ChannelCommissionView[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tDash = useCallback((key: string) => getDashboardText(lang, key), [lang]);

  useEffect(() => {
    let active = true;
    void channelService.getCommissions(status === 'all' ? undefined : status)
      .then((result) => {
        if (!active) return;
        setItems(result.items);
        setSelectedId((current) => {
          if (current && result.items.some((item) => item.ledger.id === current)) {
            return current;
          }
          return result.items[0]?.ledger.id || null;
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

  const selected = useMemo(() => items.find((item) => item.ledger.id === selectedId) || items[0], [items, selectedId]);
  const dimensionRows = useMemo(() => parseStructuredText(selected?.ledger.dimensions), [selected]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
      <section className="dashboard-surface rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="dashboard-kicker text-primary-300/80">{tDash('dash.channel.commissions.kicker')}</p>
            <h2 className="mt-2 text-2xl font-black text-white">{tDash('dash.channel.commissions.title')}</h2>
            <p className="dashboard-copy mt-2 text-sm leading-6">{tDash('dash.channel.commissions.desc')}</p>
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
              icon={<HandCoins className="h-6 w-6" />}
              title={tDash('dash.channel.empty.commissionTitle')}
              description={tDash('dash.channel.empty.commissionDesc')}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <button
                key={item.ledger.id}
                onClick={() => setSelectedId(item.ledger.id)}
                className={`interactive-panel block w-full rounded-[24px] border p-5 text-left transition-all ${
                  selected?.ledger.id === item.ledger.id
                    ? 'border-primary-400/24 bg-primary-400/10 shadow-[0_16px_40px_rgba(249,115,22,0.08)]'
                    : 'border-white/8 bg-black/20 hover:border-white/14'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getChannelStatusTone(item.ledger.status)}`}>
                        {getChannelStatusLabel(tDash, item.ledger.status)}
                      </span>
                      <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/70">
                        {item.program?.name || item.ledger.applies_to || '--'}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-black text-white">{item.partner?.name || item.ledger.channel_partner_id}</p>
                    <p className="mt-1 text-sm text-white/45">{item.ledger.source_charge_id}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-white">{formatMetric(item.ledger.commission_amount, lang)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{item.ledger.currency}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ChannelDataRow label={tDash('dash.channel.fields.rate')} value={formatPercentFromBps(item.ledger.commission_rate_bps)} />
                  <ChannelDataRow label={tDash('dash.channel.fields.settleable')} value={formatMetric(item.ledger.settleable_amount, lang)} />
                  <ChannelDataRow label={tDash('dash.channel.fields.availableAt')} value={formatDate(item.ledger.available_at, lang)} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <div>
        {selected ? (
          <ChannelDetailPanel
            kicker={tDash('dash.channel.commissions.detailKicker')}
            title={selected.partner?.name || selected.ledger.ledger_no}
            description={selected.program?.name || selected.ledger.billable_item_code || tDash('dash.channel.commissions.detailDesc')}
          >
            <ChannelDataRow label={tDash('dash.channel.fields.ledgerNo')} value={selected.ledger.ledger_no} mono />
            <ChannelDataRow label={tDash('dash.channel.fields.sourceCharge')} value={selected.ledger.source_charge_id} mono />
            <ChannelDataRow label={tDash('dash.channel.fields.netCollected')} value={formatMetric(selected.ledger.net_collected_amount, lang)} accent />
            <ChannelDataRow label={tDash('dash.channel.fields.holdback')} value={formatMetric(selected.ledger.holdback_amount, lang)} />
            <ChannelDataRow label={tDash('dash.channel.fields.earnedAt')} value={formatDate(selected.ledger.earned_at, lang)} />
            <ChannelDataRow label={tDash('dash.channel.fields.settledAt')} value={formatDate(selected.ledger.settled_at, lang)} />

            {dimensionRows.length > 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <ReceiptText className="h-4 w-4 text-primary-300" />
                  {tDash('dash.channel.commissions.dimensions')}
                </div>
                <div className="space-y-2">
                  {dimensionRows.map((entry) => (
                    <ChannelDataRow key={entry.key} label={entry.key} value={entry.value} mono={entry.key === 'raw'} />
                  ))}
                </div>
              </div>
            ) : null}
          </ChannelDetailPanel>
        ) : (
          <ChannelEmptyState
            icon={<HandCoins className="h-6 w-6" />}
            title={tDash('dash.channel.commissions.detailEmptyTitle')}
            description={tDash('dash.channel.commissions.detailEmptyDesc')}
          />
        )}
      </div>
    </div>
  );
}
