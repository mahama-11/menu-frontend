import { Link, useOutletContext } from 'react-router-dom';
import { ArrowRight, BadgePercent, Building2, Compass, Landmark, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/hooks/useI18n';
import { getDashboardText } from '../copy';
import type { ChannelOutletContext } from './ChannelLayout';
import {
  ChannelDataRow,
  ChannelEmptyState,
  formatDate,
  formatMetric,
  getChannelStatusLabel,
  getChannelStatusTone,
  getRiskTone,
} from './channelUi';

export default function ChannelOverviewPage() {
  const { lang } = useI18n();
  const { overview } = useOutletContext<ChannelOutletContext>();
  const tDash = (key: string) => getDashboardText(lang, key);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_0.8fr]"
    >
      <section className="space-y-6">
        <div className="dashboard-surface relative overflow-hidden rounded-[30px] p-6 lg:p-8 backdrop-blur-xl bg-black/40 border border-white/10">
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <Compass className="h-32 w-32 text-primary-400" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-400">
                <Sparkles className="h-3.5 w-3.5" />
                {tDash('dash.channel.overview.liveKicker')}
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">{tDash('dash.channel.overview.liveTitle')}</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">{tDash('dash.channel.overview.liveDesc')}</p>
            </div>
            <Link to="/dashboard/channel/current-binding" className="group relative overflow-hidden rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
              <div className="flex items-center gap-2">
                {tDash('dash.channel.overview.liveCta')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </div>

          {overview.current_bindings.length === 0 ? (
            <div className="mt-8">
              <ChannelEmptyState
                icon={<Compass className="h-6 w-6" />}
                title={tDash('dash.channel.empty.bindingTitle')}
                description={tDash('dash.channel.empty.bindingDesc')}
              />
            </div>
          ) : (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {overview.current_bindings.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={item.binding.id} 
                  className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02] p-1 transition-all hover:bg-white/[0.04]"
                >
                  <div className="h-full rounded-[20px] bg-black/40 p-5 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-black text-white group-hover:text-primary-300 transition-colors">{item.partner?.name || item.binding.channel_partner_id}</p>
                        <p className="mt-1 text-sm text-white/50">{item.program?.name || item.binding.channel_program_id}</p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${getChannelStatusTone(item.binding.status)}`}>
                        {getChannelStatusLabel(tDash, item.binding.status)}
                      </span>
                    </div>

                    <div className="mt-6 space-y-2.5">
                      <ChannelDataRow label={tDash('dash.channel.fields.source')} value={item.binding.source_code || item.binding.binding_source || '--'} mono />
                      <ChannelDataRow label={tDash('dash.channel.fields.scope')} value={item.binding.binding_scope || '--'} />
                      <ChannelDataRow label={tDash('dash.channel.fields.effective')} value={formatDate(item.binding.effective_from, lang, tDash('dash.channel.fields.immediate'))} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-surface rounded-[30px] p-6 lg:p-8 bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">{tDash('dash.channel.overview.settlementKicker')}</p>
              <h2 className="mt-2 text-2xl font-black text-white">{tDash('dash.channel.overview.settlementTitle')}</h2>
            </div>
            <Link to="/dashboard/channel/settlements" className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/[0.08] hover:text-white">
              {tDash('dash.channel.overview.settlementCta')}
              <ExternalLink className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
            </Link>
          </div>

          {overview.recent_settlements.length === 0 ? (
            <div className="mt-8">
              <ChannelEmptyState
                icon={<Landmark className="h-6 w-6" />}
                title={tDash('dash.channel.empty.settlementTitle')}
                description={tDash('dash.channel.empty.settlementDesc')}
              />
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {overview.recent_settlements.map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={item.item.id} 
                  className="group rounded-[24px] border border-white/8 bg-gradient-to-r from-white/[0.03] to-transparent p-5 transition-colors hover:border-white/20 hover:from-white/[0.05]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-black text-white">{item.partner?.name || item.item.channel_partner_id}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-white/50">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/20"></span>
                        {item.batch?.batch_no || item.item.settlement_batch_id}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-black tracking-tight text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{formatMetric(item.item.net_amount, lang)}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/40">{item.item.currency || '--'}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <ChannelDataRow label={tDash('dash.channel.fields.commission')} value={formatMetric(item.item.commission_amount, lang)} />
                    <ChannelDataRow label={tDash('dash.channel.fields.clawback')} value={formatMetric(item.item.clawback_amount, lang)} />
                    <ChannelDataRow label={tDash('dash.channel.fields.periodEnd')} value={formatDate(item.batch?.period_end, lang)} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        <div className="dashboard-surface rounded-[30px] p-6 lg:p-8 bg-black/40 backdrop-blur-xl border border-white/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-400">{tDash('dash.channel.overview.partnerKicker')}</p>
          <h2 className="mt-2 text-2xl font-black text-white">{tDash('dash.channel.overview.partnerTitle')}</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">{tDash('dash.channel.overview.partnerDesc')}</p>

          <div className="mt-6 space-y-3">
            {overview.partners.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/50">
                {tDash('dash.channel.empty.partnerDesc')}
              </div>
            ) : (
              overview.partners.map((partner) => (
                <div key={partner.id} className="group rounded-[24px] border border-white/8 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05] hover:border-white/15">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="py-1">
                        <p className="font-bold text-white leading-tight">{partner.name}</p>
                        <p className="text-xs text-white/50 mt-0.5">{partner.code}</p>
                      </div>
                    </div>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getRiskTone(partner.risk_level)}`}>
                      {partner.risk_level || '--'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 pl-15">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getChannelStatusTone(partner.status)}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {getChannelStatusLabel(tDash, partner.status)}
                    </span>
                    <span className="inline-flex rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-xs font-medium text-white/70">
                      {partner.partner_type || '--'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-surface relative overflow-hidden rounded-[30px] p-6 lg:p-8 bg-gradient-to-b from-primary-900/20 to-black/40 backdrop-blur-xl border border-white/10">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <BadgePercent className="h-48 w-48 -translate-y-12 translate-x-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <BadgePercent className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-black text-white">{tDash('dash.channel.overview.snapshotTitle')}</h3>
            <div className="mt-6 space-y-3">
              <ChannelDataRow label={tDash('dash.channel.fields.totalCommission')} value={formatMetric(overview.total_commission, lang)} accent />
              <ChannelDataRow label={tDash('dash.channel.fields.reversed')} value={formatMetric(overview.reversed_commission, lang)} />
              <ChannelDataRow label={tDash('dash.channel.fields.appliedClawback')} value={formatMetric(overview.applied_clawback, lang)} />
            </div>
          </div>
        </div>
      </aside>
    </motion.div>
  );
}
