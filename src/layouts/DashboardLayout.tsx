import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Library, Menu, Settings, Sparkles, User, Users, WalletCards, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useI18n } from '@/hooks/useI18n';
import { getDashboardText } from '@/pages/dashboard/copy';

type NavItem = {
  to: string;
  key: string;
  icon: ReactNode;
  hidden?: boolean;
};

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { lang } = useI18n();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const walletSummaries = useAuthStore((state) => state.walletSummaries);
  const credits = useDashboardStore((state) => state.credits);
  const maxCredits = useDashboardStore((state) => state.maxCredits);
  const plan = useDashboardStore((state) => state.plan);
  const resetDate = useDashboardStore((state) => state.resetDate);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    void useDashboardStore.getState().fetchDashboardData();
    void useAuthStore.getState().fetchWalletSummaries();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const permissions = user?.access?.menu_permissions || [];
  const hasReferralAccess = permissions.includes('menu.referral.read') || permissions.includes('menu.referral.manage');
  const canManageReferral = permissions.includes('menu.referral.manage');
  const creditPercent = Math.min(100, Math.max(0, (credits / Math.max(maxCredits, 1)) * 100));
  const tDash = (key: string) => getDashboardText(lang, key);

  const navItems = useMemo<NavItem[]>(() => ([
    { to: '/dashboard', key: 'dash.nav.home', icon: <Sparkles className="h-4 w-4" /> },
    { to: '/dashboard/create', key: 'dash.nav.create', icon: <Sparkles className="h-4 w-4" /> },
    { to: '/dashboard/library', key: 'dash.nav.library', icon: <Library className="h-4 w-4" /> },
    { to: '/dashboard/history', key: 'dash.nav.history', icon: <WalletCards className="h-4 w-4" /> },
    { to: '/dashboard/referral', key: 'dash.route.referral', icon: <Users className="h-4 w-4" />, hidden: !hasReferralAccess },
    { to: '/dashboard/settings', key: 'dash.nav.settings', icon: <Settings className="h-4 w-4" /> },
  ]), [hasReferralAccess]);

  const pageTitle = (() => {
    const item = navItems.find((entry) => location.pathname === entry.to || (entry.to === '/dashboard' && location.pathname === '/dashboard'));
    return item ? tDash(item.key) : 'Dashboard';
  })();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#060608] text-white font-sans">
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-white/5 bg-[#08080C]/92 p-5 backdrop-blur-2xl md:flex">
        <NavBrand />

        <div
          className="glass mt-8 cursor-pointer rounded-xl border border-white/5 p-4 transition-all hover:border-primary-500/30"
          title={walletSummaries ? walletSummaries.map((item) => `${item.asset_code}: ${item.total_balance}`).join('\n') : 'Total usable balance'}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{tDash('dash.credits')}</span>
            <span className="inline-flex items-center rounded-full bg-green-400/10 px-2 py-0.5 text-xs font-bold text-green-400">{plan}</span>
          </div>
          <div className="mb-2 flex items-end gap-1">
            <span className="gradient-text text-3xl font-black">{credits}</span>
            <span className="mb-1 text-sm text-gray-500">/ {maxCredits}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-gradient-to-r from-primary-500 to-yellow-400 transition-all duration-700" style={{ width: `${creditPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-600">
            {resetDate ? `Resets ${new Date(resetDate).toLocaleDateString()}` : tDash('dash.creditReset')}
          </p>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {navItems.filter((item) => !item.hidden).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                  isActive ? 'border border-white/10 bg-white/8 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{tDash(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="glass mt-4 rounded-xl border border-primary-500/20 p-4">
          <p className="mb-1 text-xs font-semibold text-primary-400">{tDash('dash.upgrade.title')}</p>
          <p className="mb-3 text-xs text-gray-500">{tDash('dash.upgrade.desc')}</p>
          <NavLink to="/#pricing" className="btn-primary block rounded-lg py-2 text-center text-xs font-bold">
            {tDash('dash.upgrade.btn')}
          </NavLink>
        </div>

        <button onClick={handleLogout} className="mt-4 flex items-center gap-2 text-sm text-gray-500 transition hover:text-red-400">
          <X className="h-4 w-4 rotate-45" />
          <span>{tDash('dash.logout')}</span>
        </button>
      </aside>

      <main className="relative min-h-screen flex-1 overflow-x-hidden md:ml-64">
        <div className="glow-orb right-10 top-10 h-72 w-72 bg-primary-600/10 animate-pulse-glow" />

        <div className="sticky top-0 z-30 border-b border-white/5 bg-[#08080C]/88 px-4 py-3 backdrop-blur-2xl md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-bold">{pageTitle}</span>
              </div>
            </div>
            <div
              className="glass cursor-pointer rounded-lg px-3 py-1.5"
              title={walletSummaries ? walletSummaries.map((item) => `${item.asset_code}: ${item.total_balance}`).join('\n') : 'Total usable balance'}
            >
              <span className="gradient-text text-sm font-bold">{credits}</span>
              <span className="ml-1 text-xs text-gray-500">cr</span>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div ref={dropdownRef} className="relative h-full w-72 max-w-[84%] border-r border-white/10 bg-[#060608] p-5 shadow-2xl">
              <div className="mb-8 flex items-center justify-between">
                <NavBrand onClick={() => setIsMobileMenuOpen(false)} />
                <button onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="glass mb-6 rounded-xl border border-white/5 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-400">{tDash('dash.credits')}</span>
                  <span className="rounded-full bg-primary-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-400">{plan}</span>
                </div>
                <h3 className="mb-2 text-xl font-bold">
                  <span className="text-primary-400">{credits}</span>
                  <span className="ml-1 text-sm font-normal text-gray-500">/{maxCredits} cr</span>
                </h3>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-yellow-400" style={{ width: `${creditPercent}%` }} />
                </div>
              </div>

              <nav className="space-y-1">
                {navItems.filter((item) => !item.hidden).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all ${
                        isActive ? 'border border-white/10 bg-white/8 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{tDash(item.key)}</span>
                  </NavLink>
                ))}
              </nav>

              <button onClick={handleLogout} className="mt-6 flex items-center gap-2 border-t border-white/10 py-4 text-sm text-gray-500 transition hover:text-red-400">
                <X className="h-4 w-4 rotate-45" />
                <span>{tDash('dash.logout')}</span>
              </button>
            </div>
          </div>
        )}

        <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
          <Outlet context={{ hasReferralAccess, canManageReferral }} />
        </div>
      </main>
    </div>
  );
}

function NavBrand({ onClick }: { onClick?: () => void }) {
  return (
    <NavLink to="/" onClick={onClick} className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/30">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className="text-sm font-bold">AI Menu Engine</span>
    </NavLink>
  );
}
