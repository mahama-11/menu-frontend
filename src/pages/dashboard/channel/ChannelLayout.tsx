import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { BadgePercent, Building2, HandCoins, Landmark, Microscope, Receipt, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/hooks/useI18n';
import { channelService, createEmptyChannelOverview } from '@/services/channel';
import type { ChannelOverview } from '@/types/channel';
import { useToastStore } from '@/store/toastStore';
import { getDashboardText } from '../copy';
import { ChannelMetricCard, formatMetric, getChannelStatusLabel, getChannelStatusTone } from './channelUi';

type DashboardContext = {
  hasChannelAccess: boolean;
  canManageChannel: boolean;
};

export type ChannelOutletContext = {
  overview: ChannelOverview;
  overviewLoading: boolean;
  refreshOverview: () => Promise<void>;
  canManageChannel?: boolean;
};

export default function ChannelLayout() {
  const { lang } = useI18n();
  const location = useLocation();
  const { hasChannelAccess, canManageChannel } = useOutletContext<DashboardContext>();
  const showToast = useToastStore((state) => state.showToast);
  const [overview, setOverview] = useState<ChannelOverview>(createEmptyChannelOverview);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const tDash = useCallback((key: string) => getDashboardText(lang, key), [lang]);
  
  const channelTabs = useMemo(() => ([
    { to: '/dashboard/channel', key: 'dash.channel.tabs.overview', icon: <BadgePercent className="h-4 w-4" /> },
    { to: '/dashboard/channel/commissions', key: 'dash.channel.tabs.commissions', icon: <HandCoins className="h-4 w-4" /> },
    { to: '/dashboard/channel/settlements', key: 'dash.channel.tabs.settlements', icon: <Landmark className="h-4 w-4" /> },
    { to: '/dashboard/channel/current-binding', key: 'dash.channel.tabs.binding', icon: <Building2 className="h-4 w-4" /> },
    ...(canManageChannel ? [
      { to: '/dashboard/channel/preview', key: 'dash.channel.tabs.preview', icon: <Microscope className="h-4 w-4" /> },
      { to: '/dashboard/channel/adjustments', key: 'dash.channel.tabs.adjustments', icon: <Receipt className="h-4 w-4" /> },
    ] : []),
  ]), [canManageChannel]);

  const refreshOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const nextOverview = await channelService.getOverview();
      setOverview(nextOverview);
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : tDash('dash.channel.loadError'), 'error');
    } finally {
      setOverviewLoading(false);
    }
  }, [showToast, tDash]);

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  const activeTabTitle = useMemo(() => {
    const match = channelTabs.find((item) => location.pathname === item.to);
    return match ? tDash(match.key) : tDash('dash.channel.tabs.overview');
  }, [channelTabs, location.pathname, tDash]);

  if (!hasChannelAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  const primaryPartner = overview.partners[0];
  const currentBinding = overview.current_bindings[0];
  const bindingStatus = currentBinding?.binding.status || '';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <section className="dashboard-surface-strong relative overflow-hidden rounded-[34px] p-6 lg:p-8 bg-black/60 backdrop-blur-2xl border border-white/10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
        
        <div className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_340px]">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-400">
              <BadgePercent className="h-3.5 w-3.5" />
              {tDash('dash.channel.kicker')}
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">{tDash('dash.channel.heroTitle')}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/60 sm:text-base">{tDash('dash.channel.heroDesc')}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {primaryPartner ? (
                <div className="group relative overflow-hidden rounded-full bg-white/5 border border-white/10 px-4 py-2 transition-all hover:bg-white/10">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-cyan-300" />
                    <span className="text-sm font-semibold text-white/90">{primaryPartner.name}</span>
                  </div>
                </div>
              ) : null}
              {bindingStatus ? (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold uppercase tracking-wider ${getChannelStatusTone(bindingStatus)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                  {getChannelStatusLabel(tDash, bindingStatus)}
                </span>
              ) : null}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ChannelMetricCard
                label={tDash('dash.channel.metrics.pending')}
                value={formatMetric(overview.pending_commission, lang)}
                hint={tDash('dash.channel.metrics.pendingHint')}
                accentClass="bg-primary-500/10 text-primary-400 border border-primary-500/20"
              />
              <ChannelMetricCard
                label={tDash('dash.channel.metrics.earned')}
                value={formatMetric(overview.earned_commission, lang)}
                hint={tDash('dash.channel.metrics.earnedHint')}
                accentClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              />
              <ChannelMetricCard
                label={tDash('dash.channel.metrics.settled')}
                value={formatMetric(overview.settled_commission, lang)}
                hint={tDash('dash.channel.metrics.settledHint')}
                accentClass="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              />
              <ChannelMetricCard
                label={tDash('dash.channel.metrics.risk')}
                value={formatMetric(overview.pending_clawback, lang)}
                hint={tDash('dash.channel.metrics.riskHint')}
                accentClass="bg-rose-500/10 text-rose-400 border border-rose-500/20"
              />
            </div>
          </div>

          <div className="dashboard-surface relative overflow-hidden rounded-[28px] p-6 bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">{activeTabTitle}</p>
              <h2 className="mt-2 text-2xl font-black text-white">{tDash('dash.channel.commandTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{tDash('dash.channel.commandDesc')}</p>

              <div className="mt-6 space-y-3">
                <ActionRow label={tDash('dash.channel.command.totalCommission')} value={formatMetric(overview.total_commission, lang)} />
                <ActionRow label={tDash('dash.channel.command.settlements')} value={formatMetric(overview.settlement_count, lang)} />
                <ActionRow label={tDash('dash.channel.command.bindings')} value={formatMetric(overview.current_bindings.length, lang)} />
              </div>

              <button
                onClick={() => void refreshOverview()}
                disabled={overviewLoading}
                className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <RefreshCw className={`h-4 w-4 ${overviewLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                {overviewLoading ? tDash('dash.channel.refreshing') : tDash('dash.channel.refresh')}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-40 dashboard-surface rounded-[24px] p-2 bg-black/60 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <div className="flex overflow-x-auto hide-scrollbar gap-1">
          {channelTabs.map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/dashboard/channel' && location.pathname === '/dashboard/channel');
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard/channel'}
                className="relative flex-shrink-0"
              >
                {isActive && (
                  <motion.div
                    layoutId="channelTabIndicator"
                    className="absolute inset-0 rounded-xl bg-white/10 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`relative flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}>
                  {item.icon}
                  {tDash(item.key)}
                </span>
              </NavLink>
            );
          })}
        </div>
      </section>

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet context={{ overview, overviewLoading, refreshOverview, canManageChannel }} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function ActionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]">
      <span className="text-sm font-medium text-white/50 group-hover:text-white/70 transition-colors">{label}</span>
      <span className="text-sm font-black tracking-tight text-white">{value}</span>
    </div>
  );
}
