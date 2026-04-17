import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useI18n } from '@/hooks/useI18n';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore(state => state.login);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoadingAuth = useAuthStore(state => state.isLoading);
  const { showToast } = useToastStore();
  const { t } = useI18n();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate, location]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Connects to unified v-backend auth
      const response = await authService.login(email, password);
      login(response);
      
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
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
              <Lock className="w-6 h-6 text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">{t('auth.login.title')}</h1>
            <p className="text-gray-400 text-sm">{t('auth.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">{t('auth.password.label')}</label>
                <button 
                  type="button" 
                  className="text-xs text-primary-400 hover:text-primary-300 focus:outline-none focus:underline"
                  onClick={() => showToast(t('auth.error.contactSupport'), 'info')}
                >
                  {t('auth.password.forgot')}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-primary-500 focus:bg-white/10 transition-all placeholder:text-gray-600"
                  placeholder={t('auth.password.placeholder')}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.4)] transition-all flex items-center justify-center disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.login.btn')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors inline-flex items-center focus:outline-none focus:underline">
                {t('auth.login.signup')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
