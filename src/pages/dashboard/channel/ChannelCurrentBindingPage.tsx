import { useCallback, useEffect, useState } from 'react';
import { Building2, Compass, Loader2, ShieldCheck, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/hooks/useI18n';
import { channelService } from '@/services/channel';
import type { ChannelBindingView } from '@/types/channel';
import { useToastStore } from '@/store/toastStore';
import { getDashboardText } from '../copy';
import {
  ChannelDataRow,
  ChannelEmptyState,
  formatDate,
  getChannelStatusLabel,
  getChannelStatusTone,
  getRiskTone,
} from './channelUi';

export default function ChannelCurrentBindingPage() {
  const { lang } = useI18n();
  const showToast = useToastStore((state) => state.showToast);
  const [items, setItems] = useState<ChannelBindingView[]>([]);
  const [loading, setLoading] = useState(true);
  const tDash = useCallback((key: string) => getDashboardText(lang, key), [lang]);

  useEffect(() => {
    let active = true;
    void channelService.getCurrentBinding()
      .then((result) => {
        if (active) setItems(result.items);
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
  }, [showToast, tDash]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary-400" />
        </div>
        <p className="text-sm font-medium text-white/50 tracking-widest uppercase">{tDash('dash.channel.binding.loading')}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <ChannelEmptyState
          icon={<Compass className="h-6 w-6" />}
          title={tDash('dash.channel.empty.bindingTitle')}
          description={tDash('dash.channel.empty.bindingDesc')}
        />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="grid gap-6 xl:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div 
              key={item.binding.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="dashboard-surface relative overflow-hidden rounded-[30px] p-6 lg:p-8 bg-black/40 backdrop-blur-xl border border-white/10 transition-all hover:bg-black/50 hover:border-white/20"
            >
              {/* Ambient Glow */}
              <div className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-[60px]" />
              <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-primary-500/10 blur-[60px]" />
              
              <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse-glow rounded-2xl bg-cyan-400/20 blur-xl" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                      <Building2 className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="pt-1">
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
                      <Link2 className="h-3 w-3" />
                      {tDash('dash.channel.binding.partner')}
                    </p>
                    <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">{item.partner?.name || item.binding.channel_partner_id}</h2>
                    <p className="mt-1 text-sm text-white/50">{item.program?.name || item.binding.channel_program_id}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1 sm:pt-0 sm:justify-end">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${getChannelStatusTone(item.binding.status)}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                    {getChannelStatusLabel(tDash, item.binding.status)}
                  </span>
                  {item.partner?.risk_level ? (
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${getRiskTone(item.partner.risk_level)}`}>
                      {item.partner.risk_level}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="relative z-10 mt-8 grid gap-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-1">
                  <ChannelDataRow label={tDash('dash.channel.fields.source')} value={item.binding.source_code || item.binding.binding_source || '--'} mono accent />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />
                  <ChannelDataRow label={tDash('dash.channel.fields.scope')} value={item.binding.binding_scope || '--'} />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />
                  <ChannelDataRow label={tDash('dash.channel.fields.reason')} value={item.binding.reason_code || '--'} />
                </div>
                
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-1">
                  <ChannelDataRow label={tDash('dash.channel.fields.effective')} value={formatDate(item.binding.effective_from, lang, tDash('dash.channel.fields.immediate'))} />
                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />
                  <ChannelDataRow label={tDash('dash.channel.fields.lockedUntil')} value={formatDate(item.binding.locked_until, lang, '--')} />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_0.9fr]">
        <div className="dashboard-surface rounded-[30px] p-6 lg:p-8 bg-black/40 backdrop-blur-xl border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-400">{tDash('dash.channel.binding.timelineKicker')}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{tDash('dash.channel.binding.timelineTitle')}</h2>
          <div className="mt-8 space-y-4">
            {items.map((item, index) => (
              <motion.div 
                key={`${item.binding.id}-timeline`} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex gap-5"
              >
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-500/20 bg-primary-500/10 text-primary-400 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="mt-3 h-full w-px bg-gradient-to-b from-primary-500/40 to-transparent" />
                </div>
                <div className="pb-8 pt-1">
                  <p className="text-lg font-black text-white">{item.partner?.name || item.binding.channel_partner_id}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {tDash('dash.channel.binding.timelineDesc')}
                  </p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                    {formatDate(item.binding.created_at, lang)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="dashboard-surface rounded-[30px] p-6 lg:p-8 bg-gradient-to-b from-white/[0.04] to-transparent backdrop-blur-xl border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">{tDash('dash.channel.binding.rulesKicker')}</p>
          <h3 className="mt-2 text-2xl font-black text-white">{tDash('dash.channel.binding.rulesTitle')}</h3>
          <div className="mt-8 space-y-3">
            <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">{tDash('dash.channel.binding.rule1Label')}</p>
              <p className="text-sm font-medium text-white/90">{tDash('dash.channel.binding.rule1Value')}</p>
            </div>
            <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">{tDash('dash.channel.binding.rule2Label')}</p>
              <p className="text-sm font-medium text-white/90">{tDash('dash.channel.binding.rule2Value')}</p>
            </div>
            <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
              <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">{tDash('dash.channel.binding.rule3Label')}</p>
              <p className="text-sm font-medium text-white/90">{tDash('dash.channel.binding.rule3Value')}</p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
