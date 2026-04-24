import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useOutletContext } from 'react-router-dom';
import { Loader2, Receipt, Sparkles } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { channelService } from '@/services/channel';
import type { ChannelAdjustmentCreateInput, ChannelAdjustmentView } from '@/types/channel';
import { useToastStore } from '@/store/toastStore';
import { getDashboardText } from '../copy';
import type { ChannelOutletContext } from './ChannelLayout';
import { ChannelDataRow, ChannelEmptyState, formatDate, formatMetric, getChannelStatusLabel, getChannelStatusTone } from './channelUi';

const defaultAdjustmentInput: ChannelAdjustmentCreateInput = {
  channel_partner_id: '',
  channel_program_id: '',
  adjustment_type: 'manual_credit',
  currency: 'CNY',
  adjustment_amount: 0,
  reason_code: '',
};

export default function ChannelAdjustmentsPage() {
  const { lang } = useI18n();
  const { canManageChannel, overview } = useOutletContext<ChannelOutletContext>();
  const showToast = useToastStore((state) => state.showToast);
  const [items, setItems] = useState<ChannelAdjustmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ChannelAdjustmentCreateInput>(defaultAdjustmentInput);
  const tDash = useCallback((key: string) => getDashboardText(lang, key), [lang]);

  useEffect(() => {
    let active = true;
    void channelService.getAdjustments()
      .then((result) => {
        if (active) setItems(result.items);
      })
      .catch((error) => {
        console.error(error);
        if (active) showToast(error instanceof Error ? error.message : tDash('dash.channel.loadError'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast, tDash]);

  useEffect(() => {
    const binding = overview.current_bindings[0];
    if (!binding) return;
    setForm((state) => ({
      ...state,
      channel_partner_id: state.channel_partner_id || binding.binding.channel_partner_id,
      channel_program_id: state.channel_program_id || binding.binding.channel_program_id,
    }));
  }, [overview.current_bindings]);

  if (!canManageChannel) {
    return <Navigate to="/dashboard/channel" replace />;
  }

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = await channelService.createAdjustment(form);
      setItems((state) => [created, ...state]);
      setForm((state) => ({ ...defaultAdjustmentInput, channel_partner_id: state.channel_partner_id, channel_program_id: state.channel_program_id, currency: state.currency || 'CNY' }));
      showToast(tDash('dash.channel.adjustments.created'), 'success');
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : tDash('dash.channel.loadError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_minmax(0,1.1fr)]">
      <section className="dashboard-surface rounded-[30px] p-6">
        <div className="flex items-center gap-3">
          <div className="dashboard-accent-danger flex h-12 w-12 items-center justify-center rounded-2xl">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="dashboard-kicker text-primary-300/80">{tDash('dash.channel.adjustments.kicker')}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{tDash('dash.channel.adjustments.title')}</h2>
          </div>
        </div>
        <p className="dashboard-copy mt-3 text-sm leading-6">{tDash('dash.channel.adjustments.desc')}</p>

        <div className="mt-6 space-y-4">
          <AdjustmentField label={tDash('dash.channel.adjustments.fields.partner')}>
            <input value={form.channel_partner_id} onChange={(event) => setForm((state) => ({ ...state, channel_partner_id: event.target.value }))} className="channel-input" />
          </AdjustmentField>
          <AdjustmentField label={tDash('dash.channel.adjustments.fields.program')}>
            <input value={form.channel_program_id} onChange={(event) => setForm((state) => ({ ...state, channel_program_id: event.target.value }))} className="channel-input" />
          </AdjustmentField>
          <AdjustmentField label={tDash('dash.channel.adjustments.fields.type')}>
            <select value={form.adjustment_type} onChange={(event) => setForm((state) => ({ ...state, adjustment_type: event.target.value }))} className="channel-input">
              <option value="manual_credit">manual_credit</option>
              <option value="manual_debit">manual_debit</option>
              <option value="reprice_delta">reprice_delta</option>
              <option value="cost_true_up">cost_true_up</option>
              <option value="dispute_resolution">dispute_resolution</option>
            </select>
          </AdjustmentField>
          <AdjustmentField label={tDash('dash.channel.adjustments.fields.amount')}>
            <input type="number" value={form.adjustment_amount} onChange={(event) => setForm((state) => ({ ...state, adjustment_amount: Number(event.target.value) }))} className="channel-input" />
          </AdjustmentField>
          <AdjustmentField label={tDash('dash.channel.adjustments.fields.reason')}>
            <input value={form.reason_code} onChange={(event) => setForm((state) => ({ ...state, reason_code: event.target.value }))} className="channel-input" />
          </AdjustmentField>
          <button onClick={() => void handleCreate()} disabled={saving} className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {tDash('dash.channel.adjustments.create')}
          </button>
        </div>
      </section>

      <section className="dashboard-surface rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="dashboard-kicker">{tDash('dash.channel.adjustments.listKicker')}</p>
            <h2 className="mt-1 text-2xl font-black text-white">{tDash('dash.channel.adjustments.listTitle')}</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary-300" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <ChannelEmptyState
              icon={<Receipt className="h-6 w-6" />}
              title={tDash('dash.channel.adjustments.emptyTitle')}
              description={tDash('dash.channel.adjustments.emptyDesc')}
            />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <div key={item.item.id} className="rounded-[24px] border border-white/8 bg-black/20 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getChannelStatusTone(item.item.status)}`}>
                        {getChannelStatusLabel(tDash, item.item.status)}
                      </span>
                      <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/70">
                        {item.item.adjustment_type}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-black text-white">{item.partner?.name || item.item.channel_partner_id}</p>
                    <p className="mt-1 text-sm text-white/45">{item.item.reason_code}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-black text-white">{formatMetric(item.item.adjustment_amount, lang)}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/35">{item.item.currency}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ChannelDataRow label={tDash('dash.channel.adjustments.fields.program')} value={item.program?.name || item.item.channel_program_id} />
                  <ChannelDataRow label={tDash('dash.channel.adjustments.fields.effective')} value={formatDate(item.item.effective_at, lang)} />
                  <ChannelDataRow label={tDash('dash.channel.adjustments.fields.batch')} value={item.item.applied_settlement_batch_id || '--'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdjustmentField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block rounded-[24px] border border-white/8 bg-black/20 p-4">
      <span className="mb-2 block text-sm text-white/52">{label}</span>
      {children}
    </label>
  );
}
