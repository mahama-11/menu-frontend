import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, BookTemplate, Clock3, CreditCard, Library, PackageCheck, Palette, Settings, Sparkles, Users, Wallet } from 'lucide-react';
import { useAuthStore, useWalletBalances } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useCommercialStore } from '@/store/commercialStore';
import { useI18n } from '@/hooks/useI18n';
import { getDashboardText } from './copy';
import { formatMenuPlanLabel } from '@/lib/commercialPlan';

function dashboardMoneyLabel(lang: string, cents: number): string {
  const amount = (cents || 0) / 100;
  if (lang === 'zh') return `¥${amount.toLocaleString()}`;
  if (lang === 'th') return `¥${amount.toLocaleString()}`;
  return `¥${amount.toLocaleString()}`;
}

export default function DashboardHomePage() {
  const { lang } = useI18n();
  const tDash = (key: string) => getDashboardText(lang, key);
  const user = useAuthStore((state) => state.user);
  const fetchWalletSummaries = useAuthStore((state) => state.fetchWalletSummaries);
  const legacyPlan = useDashboardStore((state) => state.plan);
  const activityLog = useDashboardStore((state) => state.activityLog);
  const orders = useCommercialStore((state) => state.orders);
  const latestSubscription = useCommercialStore((state) => state.latestSubscription);
  const fetchCommercialContext = useCommercialStore((state) => state.fetchCommercialContext);
  const { cash, quota, promoCredits, credits: walletCredits, quotaSummary } = useWalletBalances();
  const permissions = user?.access?.menu_permissions || [];
  const hasReferralAccess = permissions.includes('menu.referral.read') || permissions.includes('menu.referral.manage');
  const hasChannelAccess = permissions.includes('menu.channel.read') || permissions.includes('menu.channel.manage');
  const quickLinks = [
    { to: '/studio', titleKey: 'dash.home.studioTitle', descKey: 'dash.action.generate.desc', icon: <Sparkles className="h-5 w-5" />, accentClass: 'dashboard-accent-studio' },
    { to: '/dashboard/templates', titleKey: 'dash.home.templateTitle', descKey: 'dash.home.templateDesc', icon: <BookTemplate className="h-5 w-5" />, accentClass: 'dashboard-accent-primary' },
    { to: '/dashboard/library', titleKey: 'dash.home.libraryTitle', descKey: 'dash.home.libraryDesc', icon: <Library className="h-5 w-5" />, accentClass: 'dashboard-accent-library' },
    { to: '/dashboard/history', titleKey: 'dash.nav.history', descKey: 'dash.recentActivity', icon: <Clock3 className="h-5 w-5" />, accentClass: 'dashboard-accent-neutral' },
    ...(hasChannelAccess
      ? [{ to: '/dashboard/channel', titleKey: 'dash.route.channel', descKey: 'dash.home.channelDesc', icon: <BadgePercent className="h-5 w-5" />, accentClass: 'dashboard-accent-cyan' }]
      : []),
  ];

  useEffect(() => {
    void fetchWalletSummaries(true);
    void fetchCommercialContext();
  }, [fetchCommercialContext, fetchWalletSummaries]);

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const realSpendableCredits = quota + promoCredits + walletCredits;
  const currentPlanName = latestSubscription?.order?.package_code
    ? formatMenuPlanLabel(latestSubscription.order.package_code)
    : formatMenuPlanLabel(legacyPlan);
  const currentCredits = realSpendableCredits;
  const currentMaxCredits = quotaSummary?.granted || latestSubscription?.fulfillment?.amount || 0;
  const currentCreditPercent = Math.min(100, Math.max(0, (currentCredits / Math.max(currentMaxCredits, 1)) * 100));

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
                <h2 className="mt-2 text-3xl font-black text-white">{currentCredits}<span className="ml-2 text-base font-medium text-white/35">/ {currentMaxCredits}</span></h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                {currentPlanName}
              </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
              <div className="h-full bg-gradient-to-r from-primary-500 via-violet-400 to-orange-400 transition-all duration-700" style={{ width: `${currentCreditPercent}%` }} />
            </div>
            <p className="mt-3 text-xs text-white/40">
              {lang === 'zh'
                ? `已消费 ${quotaSummary?.consumed || 0}，预留 ${quotaSummary?.reserved || 0}`
                : lang === 'th'
                  ? `ใช้ไป ${quotaSummary?.consumed || 0} สำรอง ${quotaSummary?.reserved || 0}`
                  : `Consumed ${quotaSummary?.consumed || 0}, reserved ${quotaSummary?.reserved || 0}`}
            </p>
          </div>

          <div className="dashboard-surface rounded-[28px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="dashboard-kicker text-emerald-200/80">{lang === 'zh' ? '支付余额' : lang === 'th' ? 'ยอดคงเหลือสำหรับชำระ' : 'Payment Balance'}</p>
                <h3 className="mt-2 text-3xl font-black text-white">{dashboardMoneyLabel(lang, cash)}</h3>
                <p className="mt-2 text-sm text-white/55">
                  {lang === 'zh'
                    ? '购买套餐时将直接从平台钱包扣款'
                    : lang === 'th'
                      ? 'เมื่อซื้อแพ็กเกจ ระบบจะหักเงินจากกระเป๋าแพลตฟอร์มโดยตรง'
                      : 'Package purchases debit your platform wallet directly'}
                </p>
              </div>
              <div className="dashboard-accent-cyan flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="dashboard-surface rounded-[28px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="dashboard-kicker text-primary-200/80">{lang === 'zh' ? '当前套餐' : lang === 'th' ? 'แพ็กเกจปัจจุบัน' : 'Current Package'}</p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  {latestSubscription?.order?.package_code
                    ? formatMenuPlanLabel(latestSubscription.order.package_code)
                    : formatMenuPlanLabel(legacyPlan)}
                </h3>
                <p className="mt-2 text-sm text-white/55">
                  {latestSubscription?.order
                    ? (lang === 'zh'
                        ? `实付 ${dashboardMoneyLabel(lang, latestSubscription.order.total_amount)}，状态 ${latestSubscription.order.status}`
                        : lang === 'th'
                          ? `ชำระแล้ว ${dashboardMoneyLabel(lang, latestSubscription.order.total_amount)} สถานะ ${latestSubscription.order.status}`
                          : `Paid ${dashboardMoneyLabel(lang, latestSubscription.order.total_amount)}, status ${latestSubscription.order.status}`)
                    : (lang === 'zh'
                        ? '当前还没有已生效的订阅套餐'
                        : lang === 'th'
                          ? 'ขณะนี้ยังไม่มีแพ็กเกจสมาชิกที่เริ่มใช้งานแล้ว'
                          : 'No active subscription package yet')}
                </p>
              </div>
              <div className="dashboard-accent-studio flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                <PackageCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">{lang === 'zh' ? '剩余额度' : lang === 'th' ? 'โควตาคงเหลือ' : 'Remaining allowance'}</p>
                <p className="mt-2 text-xl font-black text-white">{quota}</p>
              </div>
              <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">{lang === 'zh' ? '最近生效时间' : lang === 'th' ? 'เวลาเริ่มใช้งานล่าสุด' : 'Latest activation'}</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {latestSubscription?.order?.fulfilled_at
                    ? new Date(latestSubscription.order.fulfilled_at).toLocaleString()
                    : (lang === 'zh' ? '暂无' : lang === 'th' ? 'ยังไม่มี' : 'N/A')}
                </p>
              </div>
            </div>
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
            <p className="dashboard-kicker">{lang === 'zh' ? '已购套餐' : lang === 'th' ? 'แพ็กเกจที่ซื้อแล้ว' : 'Purchased Packages'}</p>
            <h2 className="mt-2 text-xl font-black text-white">{lang === 'zh' ? '最近购买记录' : lang === 'th' ? 'ประวัติการซื้อล่าสุด' : 'Recent purchases'}</h2>
          </div>
          <div className="dashboard-accent-primary flex h-12 w-12 items-center justify-center rounded-2xl">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>

        {recentOrders.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {recentOrders.map((item) => (
              <div key={item.order?.id || item.payment?.id} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{formatMenuPlanLabel(item.order?.package_code || '')}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {item.order?.created_at ? new Date(item.order.created_at).toLocaleString() : ''}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-emerald-300">
                    {dashboardMoneyLabel(lang, item.order?.total_amount || 0)}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-300">
                    {lang === 'zh' ? `订单 ${item.order?.status || 'unknown'}` : lang === 'th' ? `คำสั่งซื้อ ${item.order?.status || 'unknown'}` : `Order ${item.order?.status || 'unknown'}`}
                  </span>
                  <span className="rounded-full border border-primary-400/20 bg-primary-400/10 px-3 py-1 text-primary-300">
                    {lang === 'zh' ? `支付 ${item.order?.payment_status || 'unknown'}` : lang === 'th' ? `ชำระเงิน ${item.order?.payment_status || 'unknown'}` : `Payment ${item.order?.payment_status || 'unknown'}`}
                  </span>
                  <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-violet-300">
                    {lang === 'zh' ? `履约 ${item.order?.fulfillment_status || 'unknown'}` : lang === 'th' ? `เริ่มใช้งาน ${item.order?.fulfillment_status || 'unknown'}` : `Fulfillment ${item.order?.fulfillment_status || 'unknown'}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/6 bg-black/20 px-4 py-10 text-center text-sm text-white/45">
            {lang === 'zh' ? '还没有购买记录，先去套餐页购买一个套餐。' : lang === 'th' ? 'ยังไม่มีประวัติการซื้อ ลองซื้อแพ็กเกจก่อน' : 'No purchases yet. Buy a package to get started.'}
          </div>
        )}
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
