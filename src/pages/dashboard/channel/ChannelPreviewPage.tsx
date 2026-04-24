import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { Loader2, Microscope, Wand2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { channelService } from '@/services/channel';
import type { ChannelPreviewInput, ChannelPreviewView } from '@/types/channel';
import { useToastStore } from '@/store/toastStore';
import { getDashboardText } from '../copy';
import type { ChannelOutletContext } from './ChannelLayout';
import { ChannelDataRow, ChannelDetailPanel, ChannelEmptyState, formatMetric, parseStructuredText } from './channelUi';

const defaultPreviewInput: ChannelPreviewInput = {
  billable_item_code: 'ai_generation',
  applies_to: 'usage_charge',
  source_charge_id: 'preview-charge',
  currency: 'CNY',
  paid_amount: 10000,
  net_collected_amount: 10000,
  payment_fee_amount: 500,
  tax_amount: 1000,
};

export default function ChannelPreviewPage() {
  const { lang } = useI18n();
  const { canManageChannel } = useOutletContext<ChannelOutletContext>();
  const showToast = useToastStore((state) => state.showToast);
  const [form, setForm] = useState<ChannelPreviewInput>(defaultPreviewInput);
  const [result, setResult] = useState<ChannelPreviewView | null>(null);
  const [loading, setLoading] = useState(false);
  const tDash = (key: string) => getDashboardText(lang, key);

  const candidateRows = useMemo(() => parseStructuredText(result?.result.candidate_snapshot), [result]);

  if (!canManageChannel) {
    return <Navigate to="/dashboard/channel" replace />;
  }

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const next = await channelService.preview(form);
      setResult(next);
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : tDash('dash.channel.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_0.9fr]">
      <section className="dashboard-surface rounded-[30px] p-6">
        <div className="flex items-center gap-3">
          <div className="dashboard-accent-primary flex h-12 w-12 items-center justify-center rounded-2xl">
            <Microscope className="h-5 w-5" />
          </div>
          <div>
            <p className="dashboard-kicker text-primary-300/80">{tDash('dash.channel.preview.kicker')}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{tDash('dash.channel.preview.title')}</h2>
          </div>
        </div>
        <p className="dashboard-copy mt-3 text-sm leading-6">{tDash('dash.channel.preview.desc')}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PreviewField label={tDash('dash.channel.preview.fields.billableItem')}>
            <input value={form.billable_item_code || ''} onChange={(event) => setForm((state) => ({ ...state, billable_item_code: event.target.value }))} className="channel-input" />
          </PreviewField>
          <PreviewField label={tDash('dash.channel.preview.fields.currency')}>
            <input value={form.currency || ''} onChange={(event) => setForm((state) => ({ ...state, currency: event.target.value }))} className="channel-input" />
          </PreviewField>
          <PreviewField label={tDash('dash.channel.preview.fields.paidAmount')}>
            <input type="number" value={form.paid_amount || 0} onChange={(event) => setForm((state) => ({ ...state, paid_amount: Number(event.target.value) }))} className="channel-input" />
          </PreviewField>
          <PreviewField label={tDash('dash.channel.preview.fields.netCollected')}>
            <input type="number" value={form.net_collected_amount || 0} onChange={(event) => setForm((state) => ({ ...state, net_collected_amount: Number(event.target.value) }))} className="channel-input" />
          </PreviewField>
          <PreviewField label={tDash('dash.channel.preview.fields.paymentFee')}>
            <input type="number" value={form.payment_fee_amount || 0} onChange={(event) => setForm((state) => ({ ...state, payment_fee_amount: Number(event.target.value) }))} className="channel-input" />
          </PreviewField>
          <PreviewField label={tDash('dash.channel.preview.fields.tax')}>
            <input type="number" value={form.tax_amount || 0} onChange={(event) => setForm((state) => ({ ...state, tax_amount: Number(event.target.value) }))} className="channel-input" />
          </PreviewField>
          <PreviewField label={tDash('dash.channel.preview.fields.deliveryCost')}>
            <input type="number" value={form.service_delivery_cost_amount || 0} onChange={(event) => setForm((state) => ({ ...state, service_delivery_cost_amount: Number(event.target.value) }))} className="channel-input" />
          </PreviewField>
          <PreviewField label={tDash('dash.channel.preview.fields.manualAdjustment')}>
            <input type="number" value={form.manual_adjustment_amount || 0} onChange={(event) => setForm((state) => ({ ...state, manual_adjustment_amount: Number(event.target.value) }))} className="channel-input" />
          </PreviewField>
        </div>

        <button
          onClick={() => void handleSubmit()}
          disabled={loading}
          className="btn-primary mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {tDash('dash.channel.preview.run')}
        </button>
      </section>

      <div>
        {result ? (
          <ChannelDetailPanel
            kicker={tDash('dash.channel.preview.resultKicker')}
            title={result.partner?.name || result.result.channel_id || tDash('dash.channel.preview.resultTitle')}
            description={result.program?.name || result.result.mode}
          >
            <ChannelDataRow label={tDash('dash.channel.preview.result.mode')} value={result.result.mode || '--'} />
            <ChannelDataRow label={tDash('dash.channel.preview.result.assignment')} value={result.result.assignment_level || '--'} />
            <ChannelDataRow label={tDash('dash.channel.preview.result.rule')} value={result.result.matched_rule_code || '--'} mono />
            <ChannelDataRow label={tDash('dash.channel.preview.result.commissionable')} value={formatMetric(result.result.commissionable_amount, lang)} accent />
            <ChannelDataRow label={tDash('dash.channel.preview.result.commission')} value={formatMetric(result.result.commission_amount, lang)} />
            <ChannelDataRow label={tDash('dash.channel.preview.result.holdback')} value={formatMetric(result.result.holdback_amount, lang)} />
            <ChannelDataRow label={tDash('dash.channel.preview.result.settleable')} value={formatMetric(result.result.settleable_amount, lang)} />
            {result.result.snapshot ? (
              <>
                <ChannelDataRow label={tDash('dash.channel.preview.result.profit')} value={formatMetric(result.result.snapshot.distributable_profit_amount, lang)} />
                <ChannelDataRow label={tDash('dash.channel.preview.result.cost')} value={formatMetric(result.result.snapshot.recognized_cost_amount, lang)} />
              </>
            ) : null}
            {candidateRows.length > 0 ? candidateRows.slice(0, 4).map((entry) => (
              <ChannelDataRow key={entry.key} label={entry.key} value={entry.value} mono={entry.key === 'raw'} />
            )) : null}
          </ChannelDetailPanel>
        ) : (
          <ChannelEmptyState
            icon={<Microscope className="h-6 w-6" />}
            title={tDash('dash.channel.preview.emptyTitle')}
            description={tDash('dash.channel.preview.emptyDesc')}
          />
        )}
      </div>
    </div>
  );
}

function PreviewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="rounded-[24px] border border-white/8 bg-black/20 p-4">
      <span className="mb-2 block text-sm text-white/52">{label}</span>
      {children}
    </label>
  );
}
