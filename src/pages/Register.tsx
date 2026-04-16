import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Store, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { useI18n } from '@/hooks/useI18n';

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  const { showToast } = useToastStore();
  const { t } = useI18n();

  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.register(name, restaurantName, email, password);
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
