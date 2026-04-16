import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { referralService } from '@/services/referral';
import type { ReferralOverview, ReferralCode, ReferralConversion, Commission } from '@/types/referral';
import { useToastStore } from '@/store/toastStore';
import { 
  Copy, Loader2, Gift, Share2, Users, Wallet, Clock, TrendingUp, Zap, Award, Tag
} from 'lucide-react';

interface ReferralCenterProps {
  canManageReferral: boolean;
}

export default function ReferralCenter({ canManageReferral }: ReferralCenterProps) {
  const { t } = useI18n();
  const { showToast } = useToastStore();
  const [overview, setOverview] = useState<ReferralOverview | null>(null);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  
  const [convStatus, setConvStatus] = useState<string>('all');
  const [commStatus, setCommStatus] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [convStatus, commStatus]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const convParam = convStatus === 'all' ? undefined : convStatus;
      const commParam = commStatus === 'all' ? undefined : commStatus;

      const [overviewRes, codesRes, convRes, commRes] = await Promise.all([
        referralService.getOverview(convParam, commParam),
        referralService.getCodes(),
        referralService.getConversions(20, 0, convParam),
        referralService.getCommissions(20, 0, commParam)
      ]);
      if (overviewRes?.data) setOverview(overviewRes.data);
      if (codesRes?.data) setCodes(codesRes.data.codes);
      if (convRes?.data) setConversions(convRes.data.conversions);
      if (commRes?.data) setCommissions(commRes.data.commissions);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load referral data';
      console.error(errorMsg, err);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnsureCode = async () => {
    if (!overview?.programs?.[0]) return;
    setIsGenerating(true);
    try {
      await referralService.ensureCode(overview.programs[0].program_code);
      showToast(t('ref.toast.codeCreated') || 'Code ready successfully', 'success');
      await fetchData(); // refresh all
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to ensure referral code';
      console.error(errorMsg, err);
      showToast(errorMsg, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeCode = overview?.active_codes?.[0]?.code || codes[0]?.code;
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  const handleCopyLink = () => {
    if (activeCode) {
      navigator.clipboard.writeText(`${appUrl}/register?ref=${activeCode}`);
      showToast(t('ref.toast.linkCopied') || 'Link copied to clipboard!', 'success');
    } else if (canManageReferral) {
      handleEnsureCode();
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(t('ref.toast.codeCopied') || 'Code copied to clipboard!', 'success');
  };

  const feedItems = useMemo(() => {
    const items = [
      ...conversions.map(c => ({
        id: `conv-${c.id}`,
        type: 'conversion',
        date: new Date(c.created_at),
        amount: c.commission_amount,
        currency: c.commission_currency,
        status: c.status,
        desc: ''
      })),
      ...commissions.map(c => ({
        id: `comm-${c.id}`,
        type: 'commission',
        date: new Date(c.created_at),
        amount: c.amount,
        currency: c.currency,
        status: c.status,
        desc: c.description
      }))
    ];
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [conversions, commissions]);

  if (isLoading && !overview) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8 pb-10">
      {/* Top Header */}
      <div>
        <h2 className="text-3xl font-black text-white mb-2">{t('ref.title')}</h2>
        <p className="text-gray-400">{t('ref.subtitle')}</p>
      </div>

      {/* 1. Hero Area: SaaS Style Gradient Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-purple-600 to-blue-700 p-8 sm:p-10 shadow-2xl shadow-primary-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold mb-4 border border-white/20">
              <Gift className="w-3.5 h-3.5" />
              <span>{t('ref.hero.badge') || 'Refer & Earn'}</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">{t('ref.hero.title') || 'Invite friends, earn free credits'}</h3>
            <p className="text-white/80 text-lg leading-relaxed">{t('ref.hero.desc') || 'Give your friends a boost and earn commissions for every successful referral.'}</p>
          </div>
          
          <div className="w-full md:w-auto flex-shrink-0 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 shadow-xl">
            <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-widest">{t('ref.link.label')}</label>
            <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1.5 border border-white/10">
              <input 
                type="text" 
                readOnly 
                value={activeCode ? `${appUrl}/register?ref=${activeCode}` : t('ref.code.empty') || 'Generate code to get link'}
                className="bg-transparent w-full px-3 py-2 text-white outline-none text-sm font-mono"
              />
              <button 
                onClick={handleCopyLink}
                disabled={isGenerating}
                className="whitespace-nowrap bg-white text-black hover:bg-gray-100 transition-colors px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Copy className="w-4 h-4 text-black" />}
                {activeCode ? t('ref.link.copy') : t('ref.link.generate')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Funnel: Roadmap instead of simple stats */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          {t('ref.funnel.title') || 'How it works & Your progress'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
              <Share2 className="w-24 h-24" />
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 font-bold">1</div>
            <h4 className="text-white font-bold mb-1">{t('ref.funnel.step1') || 'Share Link'}</h4>
            <p className="text-xs text-gray-400 mb-4">{t('ref.funnel.step1Desc') || 'Share your exclusive link with friends.'}</p>
            <div className="mt-auto pt-4 border-t border-white/5">
              <p className="text-2xl font-black text-white">{overview?.total_conversions || 0}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t('ref.stat.conversions')}</p>
            </div>
          </div>
          
          <div className="glass rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
              <Users className="w-24 h-24" />
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-4 font-bold">2</div>
            <h4 className="text-white font-bold mb-1">{t('ref.funnel.step2') || 'Friends Join'}</h4>
            <p className="text-xs text-gray-400 mb-4">{t('ref.funnel.step2Desc') || 'They sign up and start using the platform.'}</p>
            <div className="mt-auto pt-4 border-t border-white/5">
              <p className="text-2xl font-black text-white">{overview?.total_commissions_pending || 0} <span className="text-sm font-normal text-gray-500">{overview?.currency}</span></p>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{t('ref.stat.pending')}</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 relative overflow-hidden group border border-primary-500/30 bg-primary-500/5">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
              <Award className="w-24 h-24 text-primary-500" />
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center mb-4 font-bold">3</div>
            <h4 className="text-white font-bold mb-1">{t('ref.funnel.step3') || 'Earn Rewards'}</h4>
            <p className="text-xs text-gray-400 mb-4">{t('ref.funnel.step3Desc') || 'You both get rewarded automatically.'}</p>
            <div className="mt-auto pt-4 border-t border-primary-500/20">
              <p className="text-3xl font-black text-primary-400">{overview?.total_commissions_earned || 0} <span className="text-sm font-normal text-primary-500/50">{overview?.currency}</span></p>
              <p className="text-xs text-primary-500/70 uppercase tracking-wider font-semibold">{t('ref.stat.earned')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Content: Activity Feed & My Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Activity Feed */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-400" />
            {t('ref.feed.title') || 'Recent Activity'}
          </h3>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <select 
              value={convStatus}
              onChange={(e) => setConvStatus(e.target.value)}
              className="bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
            >
              <option value="all">All Conversions</option>
              <option value="tracked">Tracked</option>
              <option value="pending">Pending</option>
              <option value="eligible">Eligible</option>
              <option value="commission_earned">Earned</option>
              <option value="rejected">Rejected</option>
              <option value="reversed">Reversed</option>
            </select>
            <select 
              value={commStatus}
              onChange={(e) => setCommStatus(e.target.value)}
              className="bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-primary-500"
            >
              <option value="all">All Commissions</option>
              <option value="pending">Pending</option>
              <option value="earned">Earned</option>
              <option value="settled">Settled</option>
              <option value="rejected">Rejected</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
        </div>
        
        <div className="glass rounded-3xl p-6 sm:p-8">
          {feedItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">{t('ref.feed.empty') || "No activity yet. Share your link to get started!"}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feedItems.slice(0, 10).map((item, i) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      item.type === 'conversion' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : ['settled', 'earned'].includes(item.status)
                          ? 'bg-green-500/20 text-green-500' 
                          : ['rejected', 'reversed'].includes(item.status)
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.type === 'conversion' ? <Users className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                    </div>
                    {i !== Math.min(feedItems.length - 1, 9) && (
                      <div className="w-px h-full bg-white/10 mt-2 group-hover:bg-primary-500/30 transition-colors"></div>
                    )}
                  </div>
                  
                  <div className="pb-6 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-white font-medium text-sm">
                          {item.type === 'conversion' 
                            ? (t('ref.feed.conv') || '🎉 Someone joined using your link') 
                            : ['settled', 'earned'].includes(item.status)
                              ? (t('ref.feed.comm') || '💰 Commission earned') 
                              : ['rejected'].includes(item.status)
                                ? (t('ref.feed.commRejected') || '❌ Commission rejected')
                                : ['reversed'].includes(item.status)
                                  ? (t('ref.feed.commReversed') || '↩️ Commission reversed')
                                  : (t('ref.feed.commPending') || '⏳ Commission pending')
                          }
                        </p>
                        {item.desc && <p className="text-xs text-gray-500 mt-1">{item.desc}</p>}
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      <div className={`text-right ${
                        ['settled', 'earned', 'commission_earned'].includes(item.status) || item.type === 'conversion' 
                          ? 'text-green-400' 
                          : ['rejected', 'reversed'].includes(item.status)
                            ? 'text-red-400 line-through opacity-70'
                            : 'text-yellow-400'
                      }`}>
                        <p className="font-bold text-lg">+{item.amount}</p>
                        <p className="text-xs opacity-70 uppercase tracking-wider">{item.currency}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right Column: My Codes */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-400" />
              {t('ref.tab.codes') || 'My Codes'}
            </h3>
          </div>
          
          <div className="space-y-3">
            {codes.length === 0 ? (
              <div className="glass rounded-3xl p-8 text-center border border-dashed border-white/10">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-5 h-5 text-gray-500" />
                </div>
                <p className="text-white font-medium mb-1">{t('ref.empty.codes') || 'No invite codes yet'}</p>
                <p className="text-gray-400 text-sm mb-4">{t('ref.empty.codesDesc') || 'Generate an invite code to start earning commissions.'}</p>
                {canManageReferral && (
                  <button 
                    onClick={handleEnsureCode}
                    disabled={isGenerating}
                    className="btn-primary px-4 py-2 text-sm rounded-lg font-bold inline-flex items-center justify-center w-full"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('ref.link.generate')}
                  </button>
                )}
              </div>
            ) : (
              codes.map(code => (
                <div key={code.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-primary-500/30 transition-colors group">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xl font-mono font-bold tracking-widest text-white">{code.code}</p>
                    <button 
                      onClick={() => handleCopyCode(code.code)}
                      className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-primary-500/20 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full ${code.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'} capitalize`}>
                      {code.status}
                    </span>
                    <span className="text-gray-500">{new Date(code.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
