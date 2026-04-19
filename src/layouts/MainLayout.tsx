import { Outlet, Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { Globe, ChevronDown, Menu, X, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'zh', label: '简体中文', short: '中' },
  { code: 'th', label: 'ภาษาไทย', short: 'ไทย' },
];

export default function MainLayout() {
  const { t, lang, setLang } = useI18n();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isAuthenticated, user } = useAuthStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    // Close mobile menu when route changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);

    // Handle hash scrolling if hash is present
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLangSelect = (code: string) => {
    setLang(code);
    setIsLangOpen(false);
  };

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#060608] text-white transition-colors duration-200">
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">{t('nav.logo')}</span>
            </Link>
            <nav className="hidden md:flex ml-8 gap-8 text-sm font-medium">
              <Link to="/#features" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors">{t('nav.features')}</Link>
              <Link to="/#workflow" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors">{t('nav.how')}</Link>
              <Link to="/studio" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors">{t('nav.demo')}</Link>
              <Link to="/#pricing" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors">{t('nav.pricing')}</Link>
              <Link to="/#faq" className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded transition-colors">{t('nav.faq')}</Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)} 
                className="flex items-center gap-2 px-3 py-2 rounded-lg glass text-sm font-medium hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-white"
                aria-haspopup="true"
                aria-expanded={isLangOpen}
                aria-label="Language selector"
              >
                <Globe className="w-4 h-4 text-gray-400" />
                <span>{currentLang.short}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute top-full mt-2 right-0 w-32 glass-strong border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-slide-up origin-top-right z-50">
                  <div className="p-1">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => handleLangSelect(l.code)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                          lang === l.code 
                            ? 'bg-primary-500/20 text-primary-400 font-medium' 
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <Link to="/dashboard" className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span>{user?.name || user?.full_name || user?.email?.split('@')[0] || 'Console'}</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 transition-colors hidden md:block">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold hidden md:block text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#060608] focus:ring-primary-500">
                  {t('nav.cta')}
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-strong border-t border-white/10">
            <nav className="flex flex-col px-4 py-4 space-y-4">
              <Link to="/#features" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-white">{t('nav.features')}</Link>
              <Link to="/#workflow" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-white">{t('nav.how')}</Link>
              <Link to="/studio" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-white">{t('nav.demo')}</Link>
              <Link to="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-white">{t('nav.pricing')}</Link>
              <Link to="/#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-gray-300 hover:text-white">{t('nav.faq')}</Link>
              <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                {isAuthenticated ? (
                  <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-base font-semibold">
                    <User className="w-5 h-5" />
                    {user?.name || user?.full_name || user?.email?.split('@')[0] || 'Console'}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="text-base font-medium text-gray-300 hover:text-white text-center py-2">{t('nav.login')}</Link>
                    <Link to="/register" className="btn-primary px-4 py-3 rounded-xl text-center text-base font-semibold">{t('nav.cta')}</Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 py-6 md:py-0 relative z-10 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between h-16 gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} AI Menu Growth Engine. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Link to="/terms" className="hover:text-white transition-colors">{t('nav.terms')}</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">{t('nav.privacy')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
