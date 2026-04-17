import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Store, Loader2, ArrowRight, Tag, CheckCircle2 } from 'lucide-react';
import { authService } from '@/services/auth';
import { referralService } from '@/services/referral';
import type { ReferralCodeResolve } from '@/types/referral';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useI18n } from '@/hooks/useI18n';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore(state => state.login);
  const { showToast } = useToastStore();
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [resolvedCode, setResolvedCode] = useState<ReferralCodeResolve | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      handleResolveCode(ref);
    }
  }, [searchParams]);

  const handleResolveCode = async (code: string) => {
    if (!code) {
      setResolvedCode(null);
      setResolveError('');
      return;
    }
    
    setIsResolving(true);
    setResolveError('');
    try {
      const res = await referralService.resolveCode(code);
      if (res && res.data) {
        setResolvedCode(res.data);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Invalid referral code';
      setResolveError(errorMsg);
      setResolvedCode(null);
    } finally {
      setIsResolving(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setReferralCode(val);
    setResolvedCode(null);
    setResolveError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalCode = resolvedCode ? referralCode : undefined;
      const response = await authService.register(name, restaurantName, email, password, finalCode);
      // Wait for a successful registration, then auto-login
     login(response);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create account. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] flex flex-col">
      <header className="px-6 py-4 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">{t('nav.logo')}</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="glow-orb w-96 h-96 bg-primary-600/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow"></div>
        
        <div className="w-full max-w-md glass-strong rounded-2xl p-8 relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-6 h-6 text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">{t('auth.register.title')}</h1>
            <p className="text-gray-400 text-sm">{t('auth.register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('auth.name.label')}</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-primary-500 focus:bg-white/10 transition-all placeholder:text-gray-600"
                  placeholder={t('auth.name.placeholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('auth.restaurant.label')}</label>
              <div className="relative">
                <Store className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input 
                  type="text" 
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-primary-500 focus:bg-white/10 transition-all placeholder:text-gray-600"
                  placeholder={t('auth.restaurant.placeholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('auth.email.label')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-primary-500 focus:bg-white/10 transition-all placeholder:text-gray-600"
                  placeholder={t('auth.email.placeholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">{t('auth.password.label')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-primary-500 focus:bg-white/10 transition-all placeholder:text-gray-600"
                  placeholder={t('auth.password.placeholder')}
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Invite Code (Optional)</label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input 
                  type="text" 
                  value={referralCode}
                  onChange={handleCodeChange}
                  onBlur={() => handleResolveCode(referralCode)}
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-white/5 text-white placeholder:text-gray-600 focus:outline-none transition-all uppercase ${
                    resolvedCode ? 'border-green-500/50 focus:border-green-500 focus:bg-white/10' :
                    resolveError ? 'border-red-500/50 focus:border-red-500 focus:bg-white/10' :
                    'border-white/10 focus:border-primary-500 focus:bg-white/10'
                  }`}
                  placeholder="GOT A CODE?"
                />
                {isResolving && <Loader2 className="absolute right-3 top-3 h-5 w-5 text-primary-500 animate-spin" />}
                {resolvedCode && !isResolving && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-green-500" />}
              </div>
              {resolvedCode && (
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-sm text-green-400 flex items-center gap-1 mb-2">
                    Valid code from <strong className="text-green-300">{resolvedCode.promoter_name || 'Partner'}</strong>
                  </p>
                  
                  {resolvedCode.reward_policy_desc && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-green-500/20">
                      <p className="text-xs text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 shrink-0 mt-0.5">•</span>
                        <span>
                          <span className="text-gray-400">{t('ref.resolve.reward')}: </span>
                          <span className="text-white">{resolvedCode.reward_policy_desc}</span>
                        </span>
                      </p>
                      
                      {(resolvedCode.settlement_delay_days !== undefined || resolvedCode.allow_repeat !== undefined) && (
                        <div className="flex items-center gap-4 text-xs text-gray-400 pl-4">
                          {resolvedCode.settlement_delay_days !== undefined && (
                            <span className="flex items-center gap-1">
                              <span>{t('ref.resolve.delay')}:</span>
                              <span className="text-gray-300">{resolvedCode.settlement_delay_days} {t('ref.resolve.delayDays')}</span>
                            </span>
                          )}
                          {resolvedCode.allow_repeat !== undefined && (
                            <span className="flex items-center gap-1">
                              <span>{t('ref.resolve.repeat')}:</span>
                              <span className="text-gray-300">
                                {resolvedCode.allow_repeat ? t('ref.resolve.repeatYes') : t('ref.resolve.repeatNo')}
                              </span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {resolveError && (
                <p className="text-xs text-red-400 mt-1">{resolveError}</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary mt-6 py-3 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.4)] transition-all flex items-center justify-center disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.register.btn')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors inline-flex items-center focus:outline-none focus:underline">
                {t('auth.register.signin')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
