import { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { Layers3, ReceiptText, ShieldCheck, Sparkles } from 'lucide-react';
import WalletHistory from './WalletHistory';
import JobHistorySection from './JobHistorySection';
import AuditHistorySection from './AuditHistorySection';

type TabKey = 'wallet' | 'jobs' | 'audit';

const tabs: Array<{ key: TabKey; motionClass: string }> = [
  { key: 'wallet', motionClass: 'card-float-1' },
  { key: 'jobs', motionClass: 'card-float-2' },
  { key: 'audit', motionClass: 'card-float-3' },
];

export default function HistoryCenter() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('wallet');

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">{t('dash.historyCenter.title')}</h1>
        <p className="mt-2 text-sm text-gray-400">{t('dash.historyCenter.subtitle')}</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-purple-400/15 bg-gradient-to-br from-[#140f20] via-[#17111f] to-[#0d0c14] p-6 shadow-[0_0_40px_rgba(139,92,246,0.06)]">
        <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-primary-500/8 blur-3xl" />
        <div className="relative z-10 grid gap-4 md:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`interactive-panel interactive-panel-purple rounded-2xl border p-5 text-left ${
                activeTab === tab.key
                  ? 'border-purple-400/20 bg-white/[0.08] shadow-[0_0_30px_rgba(139,92,246,0.12)]'
                  : 'border-white/8 bg-white/[0.04]'
              } ${tab.motionClass}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  activeTab === tab.key ? 'bg-purple-400/12 text-purple-100' : 'bg-white/6 text-purple-200'
                }`}>
                  {tab.key === 'wallet' && <ReceiptText className="h-5 w-5" />}
                  {tab.key === 'jobs' && <Layers3 className="h-5 w-5" />}
                  {tab.key === 'audit' && <ShieldCheck className="h-5 w-5" />}
                </div>
                <Sparkles className={`h-4 w-4 ${activeTab === tab.key ? 'text-purple-200/70' : 'text-white/20'}`} />
              </div>
              <p className="text-sm font-black text-white">{t(`dash.historyCenter.tabs.${tab.key}.label`)}</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">{t(`dash.historyCenter.tabs.${tab.key}.desc`)}</p>
              <div className={`mt-4 h-[2px] rounded-full transition-all ${
                activeTab === tab.key ? 'bg-gradient-to-r from-purple-300/80 via-primary-300/70 to-transparent' : 'bg-white/5'
              }`}
            >
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'wallet' && <WalletHistory embedded />}
      {activeTab === 'jobs' && <JobHistorySection />}
      {activeTab === 'audit' && <AuditHistorySection />}
    </div>
  );
}
