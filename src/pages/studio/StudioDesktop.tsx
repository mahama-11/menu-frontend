import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, History, Wallet } from 'lucide-react';
import { useWalletBalances } from '@/store/authStore';
import ControlPanel from './components/ControlPanel';
import WorkspaceCanvas from './components/WorkspaceCanvas';
import StyleMarketDrawer from './components/StyleMarketDrawer';

export default function StudioDesktop() {
  const { t } = useTranslation();
  const { usableBalance } = useWalletBalances();
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#060608] text-white overflow-hidden relative font-sans">
      {/* Global Ambient Lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none glow-orb z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none glow-orb z-0" />

      <div className="flex w-full h-full relative z-10 flex-col">
        <header className="h-18 shrink-0 border-b border-white/5 bg-black/25 backdrop-blur-2xl">
          <div className="h-full px-6 xl:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                {t('studio.shell.back', { defaultValue: 'Back' })}
              </Link>
              <div>
                <h1 className="text-xl font-black text-white">{t('studio.ws.title')}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-white/75">
                <Wallet className="h-4 w-4 text-primary-300" />
                <span>{t('studio.shell.balance', { defaultValue: 'Usable balance' })}</span>
                <span className="font-black text-white">{usableBalance ?? '--'}</span>
              </div>
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.06] hover:text-white">
                <History className="h-4 w-4" />
                {t('studio.shell.dashboard', { defaultValue: 'Dashboard' })}
              </Link>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="px-6 pb-3 pt-3 xl:px-8">
            <ControlPanel onOpenMarket={() => setIsMarketOpen(true)} />
          </div>

          <div className="min-h-0 flex-1 px-6 pb-6 xl:px-8">
            <WorkspaceCanvas compactHeader />
          </div>
        </div>
      </div>

      {/* Floating Style Market Drawer */}
      <StyleMarketDrawer isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} />
    </div>
  );
}
