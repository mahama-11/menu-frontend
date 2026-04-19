import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { createEmptyReferralOverview, referralService } from '@/services/referral';
import type { Commission, ReferralCode, ReferralCodeResolve, ReferralConversion, ReferralOverview } from '@/types/referral';
import { useToastStore } from '@/store/toastStore';
import { Clock3, Copy, Gift, Loader2, Share2, Sparkles, Wallet, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReferralCenterProps {
  canManageReferral: boolean;
}

export default function ReferralCenter({ canManageReferral }: ReferralCenterProps) {
  const { t } = useI18n();
  const { showToast } = useToastStore();
  const [overview, setOverview] = useState<ReferralOverview>(createEmptyReferralOverview);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [convStatus, setConvStatus] = useState<string>('all');
  const [commStatus, setCommStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [resolvedCode, setResolvedCode] = useState<ReferralCodeResolve | null>(null);

  const formatAssetLabel = (assetCode?: string) => {
    switch (assetCode) {
      case 'MENU_PROMO_CREDIT':
        return t('ref.asset.menuPromoCredit');
      case 'MENU_CREDIT':
        return t('ref.asset.menuCredit');
      case 'MENU_MONTHLY_ALLOWANCE':
        return t('ref.asset.menuMonthlyAllowance');
      default:
        return assetCode || '-';
    }
  };

  const formatReferralStatus = (status: string) => {
    switch (status) {
      case 'tracked':
        return t('ref.page.status.tracked');
      case 'pending_reward':
        return t('ref.page.status.pendingReward');
      case 'commission_earned':
        return t('ref.page.status.commissionEarned');
      case 'reward_issued':
        return t('ref.page.status.rewardIssued');
      case 'pending':
        return t('ref.page.status.pending');
      case 'earned':
        return t('ref.page.status.earned');
      case 'redeemed':
        return t('ref.page.status.redeemed');
      case 'settled':
        return t('ref.page.status.settled');
      case 'rejected':
        return t('ref.page.status.rejected');
      case 'reversed':
        return t('ref.page.status.reversed');
      default:
        return status;
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const convParam = convStatus === 'all' ? undefined : convStatus;
      const commParam = commStatus === 'all' ? undefined : commStatus;
      const [overviewRes, codesRes, convRes, commRes] = await Promise.all([
        referralService.getOverview(convParam, commParam),
        referralService.getCodes(),
        referralService.getConversions(20, 0, convParam),
        referralService.getCommissions(20, 0, commParam),
      ]);
      setOverview(overviewRes);
      setCodes(codesRes.codes);
      setConversions(convRes.conversions);
      setCommissions(commRes.commissions);
    } catch (err: unknown) {
      console.error(err);
      showToast(err instanceof Error ? err.message : t('ref.page.loadError'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [commStatus, convStatus, showToast, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const activeCodeObj = overview.codes[0] || codes[0];
  const activeCode = activeCodeObj?.code;
  const primaryProgram = overview.programs[0];
  const inviteLink = activeCodeObj?.invite_url || activeCodeObj?.signup_url || t('ref.page.generateHint');
  const redeemTargetAssetCode = overview.redeem_target_asset_code;
  const redeemableCommission = overview.redeemable_commission;
  const redeemedCommission = overview.redeemed_commission;
  const pendingCommission = overview.pending_commission;
  const totalConversions = overview.total_conversions;
  const hasOverviewData =
    overview.programs.length > 0 ||
    overview.codes.length > 0 ||
    conversions.length > 0 ||
    commissions.length > 0;

  useEffect(() => {
    if (!activeCode) {
      setResolvedCode(null);
      return;
    }
    referralService.resolveCode(activeCode).then(setResolvedCode).catch((err) => {
      console.error('Failed to resolve code', err);
    });
  }, [activeCode]);

  const handleEnsureCode = async () => {
    if (!canManageReferral || !primaryProgram) return;
    setIsGenerating(true);
    try {
      await referralService.ensureCode(primaryProgram.program_code);
      showToast(t('ref.page.linkReady'), 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : t('ref.page.generateError'), 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    const value = activeCodeObj?.invite_url || activeCodeObj?.signup_url;
    if (!value) {
      await handleEnsureCode();
      return;
    }
    await navigator.clipboard.writeText(value);
    showToast(t('ref.toast.linkCopied') || 'Link copied to clipboard!', 'success');
  };

  const handleRedeem = async () => {
    setIsRedeeming(true);
    try {
      const result = await referralService.redeemCommissions();
      // Gamification: Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#a855f7', '#10b981', '#fcd34d']
      });
      showToast(t('ref.page.redeemSuccess', { amount: result.total_amount, asset: formatAssetLabel(result.asset_code) }), 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast(err instanceof Error ? err.message : t('ref.page.redeemError'), 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  const timelineItems = useMemo(() => {
    const items = [
      ...conversions.map((item) => ({
        id: `conv-${item.id}`,
        title: t('ref.page.newConversion'),
        description: item.trigger_type ? `${t('ref.page.trigger')}: ${item.trigger_type}` : t('ref.page.conversionDesc'),
        amount: item.commission_amount,
        currency: item.commission_currency,
        status: item.status,
        createdAt: item.created_at,
        kind: 'conversion' as const,
      })),
      ...commissions.map((item) => ({
        id: `comm-${item.id}`,
        title: item.status === 'redeemed' ? t('ref.page.commissionRedeemed') : item.status === 'reversed' ? t('ref.page.commissionReversed') : t('ref.page.commissionUpdated'),
        description: item.reference_type || t('ref.page.commissionDesc'),
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        createdAt: item.created_at,
        kind: 'commission' as const,
      })),
    ];

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  }, [commissions, conversions, t]);

  if (isLoading && !hasOverviewData) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-500/20 border-t-primary-500" />
          <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">{t('ref.title')}</h1>
        <p className="mt-2 max-w-3xl text-base text-gray-400">
          {t('ref.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        
        {/* VIP Pass Card for Invite Link */}
        <div className="relative rounded-[2rem] p-[1px] overflow-hidden group">
          {/* Holographic Animated Border */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-orange-500 to-emerald-500 opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          <div className="absolute -inset-[100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000_0%,#000_50%,rgba(168,85,247,0.5)_100%)] opacity-30 pointer-events-none" />
          
          <div className="relative h-full bg-[#0a0610]/90 backdrop-blur-2xl rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden shadow-2xl">
            {/* Background patterns */}
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-purple-500/20 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-primary-500/10 blur-[60px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none mix-blend-overlay" />
            
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('ref.page.vipPassBadge')}
                </div>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-purple-200">{t('ref.page.heroTitle')}</h2>
                <p className="mt-3 text-base text-purple-100/60 max-w-md leading-relaxed">
                  {t('ref.page.heroDesc')}
                </p>
              </div>
              <div className="hidden h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white shadow-inner lg:flex backdrop-blur-md rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <QrCode className="h-8 w-8" />
              </div>
            </div>

            <div className="relative z-10 mt-8 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 min-w-0 w-full">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-purple-200/50">{t('ref.page.inviteUrl')}</p>
                <p className="truncate font-mono text-sm text-white/90 bg-white/5 px-3 py-2 rounded-lg border border-white/5 w-full">
                  {inviteLink}
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                disabled={isGenerating}
                className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] shrink-0"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                {activeCode ? t('ref.link.copy') : t('ref.link.generate')}
              </button>
            </div>

            <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
              <RuleChip label={t('ref.resolve.reward')} value={resolvedCode?.reward_policy_desc || t('ref.page.rulePending')} />
              <RuleChip label={t('ref.resolve.delay')} value={typeof resolvedCode?.settlement_delay_days === 'number' ? `${resolvedCode.settlement_delay_days} ${t('ref.page.daysUnit')}` : t('ref.page.pending')} />
              <RuleChip label={t('ref.page.repeatTrigger')} value={resolvedCode?.allow_repeat ? t('ref.page.allowed') : t('ref.page.singleTrigger')} />
            </div>
          </div>
        </div>

        {/* Redeem Card */}
        <div className="glass rounded-[2rem] p-8 border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/20">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{t('ref.page.redeemSnapshot')}</h3>
                <p className="text-sm text-gray-400 mt-1">{t('ref.page.redeemSnapshotDesc')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <SnapshotRow label={t('ref.page.redeemTarget')} value={formatAssetLabel(redeemTargetAssetCode)} accent />
              <SnapshotRow label={t('ref.page.redeemableNow')} value={String(redeemableCommission)} valueClass="text-emerald-400 text-lg" />
              <SnapshotRow label={t('ref.page.alreadyRedeemed')} value={String(redeemedCommission)} />
              <SnapshotRow label={t('ref.page.pending')} value={String(pendingCommission)} />
            </div>
          </div>

          <button
            onClick={handleRedeem}
            disabled={redeemableCommission <= 0 || isRedeeming}
            className="mt-8 relative w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-base font-black text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed overflow-hidden"
          >
            {/* Button inner shine effect */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] translate-x-[-100%] animate-[scan_3s_ease-in-out_infinite]" />
            
            {isRedeeming ? <Loader2 className="h-5 w-5 animate-spin relative z-10" /> : <Gift className="h-5 w-5 relative z-10" />}
            <span className="relative z-10">{t('ref.page.redeemCommission')}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard label={t('ref.page.totalConversions')} value={totalConversions} icon={<Share2 className="h-6 w-6" />} hint={t('ref.page.totalConversionsHint')} motionClass="card-float-1" />
        <MetricCard label={t('ref.page.pendingCommission')} value={pendingCommission} icon={<Clock3 className="h-6 w-6" />} hint={t('ref.page.pendingCommissionHint')} motionClass="card-float-2" />
        <MetricCard label={t('ref.page.redeemableValue')} value={redeemableCommission} icon={<Gift className="h-6 w-6" />} hint={t('ref.page.redeemableValueHint')} accent motionClass="card-float-3" />
      </div>

      {/* Activity Timeline */}
      <div className="glass rounded-[2rem] p-8 border border-white/5">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">{t('ref.page.activityTitle')}</h3>
            <p className="text-sm text-gray-400 mt-1">{t('ref.page.activityDesc')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={convStatus}
              onChange={(e) => setConvStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#12121A] px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-primary-500 shadow-inner"
            >
              <option value="all">{t('ref.page.allConversions')}</option>
              <option value="tracked">{t('ref.page.status.tracked')}</option>
              <option value="pending_reward">{t('ref.page.status.pendingReward')}</option>
              <option value="commission_earned">{t('ref.page.status.commissionEarned')}</option>
              <option value="reward_issued">{t('ref.page.status.rewardIssued')}</option>
              <option value="rejected">{t('ref.page.status.rejected')}</option>
              <option value="reversed">{t('ref.page.status.reversed')}</option>
            </select>
            <select
              value={commStatus}
              onChange={(e) => setCommStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#12121A] px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-primary-500 shadow-inner"
            >
              <option value="all">{t('ref.page.allCommissions')}</option>
              <option value="pending">{t('ref.page.status.pending')}</option>
              <option value="earned">{t('ref.page.status.earned')}</option>
              <option value="redeemed">{t('ref.page.status.redeemed')}</option>
              <option value="settled">{t('ref.page.status.settled')}</option>
              <option value="rejected">{t('ref.page.status.rejected')}</option>
              <option value="reversed">{t('ref.page.status.reversed')}</option>
            </select>
          </div>
        </div>

        {timelineItems.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] py-16 text-center">
            <p className="text-base text-gray-500 font-medium">{t('ref.page.noActivity')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timelineItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/5 bg-[#12121A] p-5 transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-lg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-inner ${item.kind === 'conversion' ? 'border border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                        {item.kind === 'conversion' ? t('ref.page.conversion') : t('ref.page.commission')}
                      </span>
                      <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                        {formatReferralStatus(item.status)}
                      </span>
                    </div>
                    <p className="text-base font-bold text-white tracking-wide">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-400">{item.description}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className={`text-2xl font-black ${item.kind === 'conversion' ? 'text-white' : 'text-emerald-400'}`}>
                      {item.amount > 0 ? '+' : ''}{item.amount} <span className="text-xs font-bold text-gray-500 tracking-wider uppercase ml-1">{item.currency}</span>
                    </p>
                    <p className="mt-2 text-xs font-medium text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, hint, accent = false, motionClass }: { label: string; value: number; icon: ReactNode; hint: string; accent?: boolean; motionClass?: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-[2rem] border p-6 sm:p-8 transition-all duration-500 hover:-translate-y-2 ${motionClass || ''} ${accent ? 'border-primary-500/30 bg-primary-500/10 shadow-[0_10px_40px_rgba(249,115,22,0.15)] hover:shadow-[0_20px_50px_rgba(249,115,22,0.25)]' : 'glass border-white/5 hover:border-white/10 shadow-lg'}`}>
      <div className={`absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 ${accent ? 'bg-primary-500/20 opacity-100' : 'bg-purple-500/15 opacity-50 group-hover:opacity-100'}`} />
      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner ${accent ? 'bg-gradient-to-br from-primary-500/20 to-orange-500/20 text-primary-300 border border-primary-500/20' : 'bg-white/5 text-purple-200 border border-white/10'}`}>
            {icon}
          </div>
          <Sparkles className={`h-5 w-5 transition-transform duration-700 group-hover:rotate-12 ${accent ? 'text-primary-300/70' : 'text-white/20 group-hover:text-white/50'}`} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <p className={`mt-3 text-4xl font-black tracking-tight ${accent ? 'text-transparent bg-clip-text bg-gradient-to-br from-primary-200 to-orange-400' : 'text-white'}`}>{value}</p>
        <p className="mt-3 text-sm text-gray-400 font-medium">{hint}</p>
      </div>
    </div>
  );
}

function RuleChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 shadow-inner">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white/90 truncate">{value}</p>
    </div>
  );
}

function SnapshotRow({ label, value, accent = false, valueClass = '' }: { label: string; value: string; accent?: boolean; valueClass?: string }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-5 py-3.5 transition-colors ${accent ? 'border-primary-500/20 bg-primary-500/10' : 'border-white/5 bg-black/20 hover:bg-white/[0.03]'}`}>
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <span className={`text-sm font-black tracking-wide ${valueClass || 'text-white'}`}>{value}</span>
    </div>
  );
}
