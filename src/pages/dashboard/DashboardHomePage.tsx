import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, Clock3, Library, Palette, Settings, Sparkles, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useI18n } from '@/hooks/useI18n';
import { getDashboardText } from './copy';

export default function DashboardHomePage() {
  const { lang } = useI18n();
  const tDash = (key: string) => getDashboardText(lang, key);
  const user = useAuthStore((state) => state.user);
  const credits = useDashboardStore((state) => state.credits);
  const maxCredits = useDashboardStore((state) => state.maxCredits);
  const plan = useDashboardStore((state) => state.plan);
  const resetDate = useDashboardStore((state) => state.resetDate);
  const activityLog = useDashboardStore((state) => state.activityLog);
  const permissions = user?.access?.menu_permissions || [];
  const hasReferralAccess = permissions.includes('menu.referral.read') || permissions.includes('menu.referral.manage');
  const hasChannelAccess = permissions.includes('menu.channel.read') || permissions.includes('menu.channel.manage');
  const creditPercent = Math.min(100, Math.max(0, (credits / Math.max(maxCredits, 1)) * 100));
  const quickLinks = [
    { to: '/studio', titleKey: 'dash.home.studioTitle', descKey: 'dash.action.generate.desc', icon: <Sparkles className="h-5 w-5" />, accentClass: 'dashboard-accent-studio' },
    { to: '/dashboard/library', titleKey: 'dash.home.libraryTitle', descKey: 'dash.home.libraryDesc', icon: <Library className="h-5 w-5" />, accentClass: 'dashboard-accent-library' },
    { to: '/dashboard/history', titleKey: 'dash.nav.history', descKey: 'dash.recentActivity', icon: <Clock3 className="h-5 w-5" />, accentClass: 'dashboard-accent-neutral' },
    ...(hasChannelAccess
      ? [{ to: '/dashboard/channel', titleKey: 'dash.route.channel', descKey: 'dash.home.channelDesc', icon: <BadgePercent className="h-5 w-5" />, accentClass: 'dashboard-accent-cyan' }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_420px]">
        <div className="dashboard-surface-strong relative overflow-hidden rounded-[32px] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:p-8">
          <div className="glow-orb -right-10 -top-8 h-48 w-48 bg-primary-500/12 animate-pulse-glow" />
          <div className="glow-orb bottom-0 left-12 h-32 w-32 bg-purple-500/10 animate-pulse-glow" style={{ animationDelay: '1.2s' }} />
          <p className="dashboard-kicker text-primary-300/80">{tDash('dash.welcome.label')}</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {tDash('dash.welcome.prefix')} {user?.name || user?.full_name || 'Menu Team'}
          </h1>
          <h2 className="mt-3 max-w-4xl text-2xl font-black text-white/95 sm:text-3xl">
            {tDash('dash.home.heroTitle')}
          </h2>
          <p className="dashboard-copy mt-4 max-w-3xl text-sm leading-7 sm:text-base">
            {tDash('dash.home.heroDesc')}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/studio" className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">
              {tDash('dash.home.primaryCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/dashboard/library" className="btn-outline inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
              {tDash('dash.home.secondaryCta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="interactive-panel rounded-2xl border border-white/8 bg-black/20 p-4 transition hover:border-primary-500/25"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.accentClass}`}>
                  {item.icon}
                </div>
                <p className="mt-4 text-lg font-black text-white">{tDash(item.titleKey)}</p>
                <p className="dashboard-copy mt-2 text-sm">{tDash(item.descKey)}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="dashboard-surface rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="dashboard-kicker">{tDash('dash.credits')}</p>
                <h2 className="mt-2 text-3xl font-black text-white">{credits}<span className="ml-2 text-base font-medium text-white/35">/ {maxCredits}</span></h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                {plan}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
              <div className="h-full bg-gradient-to-r from-primary-500 via-violet-400 to-orange-400 transition-all duration-700" style={{ width: `${creditPercent}%` }} />
            </div>
            <p className="mt-3 text-xs text-white/40">
              {resetDate ? `Resets ${new Date(resetDate).toLocaleDateString()}` : tDash('dash.creditReset')}
            </p>
          </div>

          {hasReferralAccess && (
            <Link to="/dashboard/referral" className="dashboard-surface interactive-panel interactive-panel-purple block rounded-[28px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="dashboard-kicker text-purple-200/70">{tDash('dash.route.referral')}</p>
                  <h3 className="mt-2 text-xl font-black text-white">{tDash('dash.home.referralTitle')}</h3>
                  <p className="dashboard-copy mt-2 text-sm">{tDash('dash.home.referralDesc')}</p>
                </div>
                <div className="dashboard-accent-studio flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </Link>
          )}

          {hasChannelAccess && (
            <Link to="/dashboard/channel" className="dashboard-surface interactive-panel block rounded-[28px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="dashboard-kicker text-cyan-100/70">{tDash('dash.route.channel')}</p>
                  <h3 className="mt-2 text-xl font-black text-white">{tDash('dash.home.channelTitle')}</h3>
                  <p className="dashboard-copy mt-2 text-sm">{tDash('dash.home.channelDesc')}</p>
                </div>
                <div className="dashboard-accent-cyan flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                  <BadgePercent className="h-5 w-5" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="dashboard-surface rounded-[28px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="dashboard-kicker">{tDash('dash.recentActivity')}</p>
            <h2 className="mt-2 text-xl font-black text-white">{tDash('dash.history.title')}</h2>
          </div>
          <Link to="/dashboard/history" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/[0.08] hover:text-white">
            {tDash('dash.home.activityViewAll')}
          </Link>
        </div>

        {activityLog.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {activityLog.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-1 h-10 w-1.5 rounded-full bg-gradient-to-b from-primary-400 to-purple-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{activity.action_name || activity.action_type}</p>
                    <p className="mt-1 text-xs text-white/40">{new Date(activity.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="shrink-0 text-sm font-bold text-orange-300">-{activity.credits_used || 0} cr</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/6 bg-black/20 px-4 py-10 text-center text-sm text-white/45">
            {tDash('dash.noActivity')}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Link to="/studio" className="dashboard-surface interactive-panel rounded-[28px] p-6">
          <div className="dashboard-accent-studio flex h-12 w-12 items-center justify-center rounded-2xl">
            <Palette className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-xl font-black text-white">{tDash('dash.home.studioTitle')}</h3>
          <p className="dashboard-copy mt-2 text-sm">{tDash('dash.action.generate.desc')}</p>
        </Link>

        <Link to="/dashboard/settings" className="dashboard-surface interactive-panel rounded-[28px] p-6">
          <div className="dashboard-accent-primary flex h-12 w-12 items-center justify-center rounded-2xl">
            <Settings className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-xl font-black text-white">{tDash('dash.settings.title')}</h3>
          <p className="dashboard-copy mt-2 text-sm">{tDash('dash.home.settingsDesc')}</p>
        </Link>
      </section>
    </div>
  );
}
