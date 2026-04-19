import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Wallet } from 'lucide-react';
import { useWalletBalances } from '@/store/authStore';
import { useGenerationJobStore, useAssetStore } from '@/store/studioStore';
import CanvasArea from './components/CanvasArea';
import DynamicActionIsland from './components/DynamicActionIsland';
import StyleMarketDrawer from './components/StyleMarketDrawer';

export default function StudioLayout() {
  const { t } = useTranslation();
  const { usableBalance } = useWalletBalances();
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  
  const { activeJobId, jobs } = useGenerationJobStore();
  const { selectedAssetId } = useAssetStore();
  const activeJob = jobs.find((job) => job.job_id === activeJobId);

  // Derive view mode for ambient lighting
  const isGenerating = activeJob && ['queued', 'processing', 'running', 'dispatching'].includes(activeJob.status);
  const hasResult = activeJob?.status === 'completed' && (activeJob.variants?.length ?? 0) > 0;
  const isFailed = activeJob?.status === 'failed';
  
  const glowColor = useMemo(() => {
    if (isGenerating) {
      return 'from-purple-600/20 to-pink-600/20 animate-pulse-glow';
    }
    if (hasResult) {
      return 'from-green-500/10 to-emerald-500/10';
    }
    if (isFailed) {
      return 'from-red-500/10 to-orange-500/10';
    }
    if (selectedAssetId) {
      return 'from-orange-500/15 to-purple-500/15';
    }
    return 'from-white/5 to-white/5';
  }, [hasResult, isFailed, isGenerating, selectedAssetId]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#060608] text-white font-sans">
      {/* 1. Ambient Lighting (Z-0) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} transition-colors duration-1000 ease-in-out pointer-events-none z-0`} />
      
      {/* Glow Orbs */}
      <div className={`absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px] mix-blend-screen pointer-events-none z-0 ${isGenerating ? 'animate-pulse-glow' : ''}`} />
      <div className={`absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px] mix-blend-screen pointer-events-none z-0 ${isGenerating ? 'animate-pulse-glow' : ''}`} style={{ animationDelay: '1s' }} />

      {/* 2. Minimalist Top Nav (Z-20) */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 md:p-6 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white backdrop-blur-md">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('studio.shell.dashboard', { defaultValue: 'Dashboard' })}</span>
          </Link>
        </div>
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/75 backdrop-blur-md">
            <Wallet className="h-4 w-4 text-primary-400" />
            <span className="font-black text-white">{usableBalance ?? '--'}</span>
          </div>
        </div>
      </header>

      {/* 3. Full-screen Immersive Canvas (Z-10) */}
      <div className="absolute inset-0 z-10 pt-20 pb-32 md:pb-28">
        <CanvasArea />
      </div>

      {/* 4. Floating Action Island (Z-30) */}
      <div className="absolute bottom-6 md:bottom-8 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
        <div className="pointer-events-auto w-full max-w-[600px] flex justify-center">
          <DynamicActionIsland onOpenMarket={() => setIsMarketOpen(true)} />
        </div>
      </div>

      {/* 5. Glass Drawer (Z-40) */}
      <StyleMarketDrawer isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} />
    </div>
  );
}
