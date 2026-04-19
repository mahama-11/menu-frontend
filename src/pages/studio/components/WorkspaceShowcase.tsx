import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, MessageSquare, Share2 } from 'lucide-react';

export default function WorkspaceShowcase() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  // Auto-cycle through the 3 showcase features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 0, label: t('studio.showcase.tab.enhance', { defaultValue: 'Dish Refinement' }), icon: Sparkles },
    { id: 1, label: t('studio.showcase.tab.copy', { defaultValue: 'Smart Copy' }), icon: MessageSquare },
    { id: 2, label: t('studio.showcase.tab.export', { defaultValue: 'Multi-channel Export' }), icon: Share2 }
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center animate-slide-up px-4">
      {/* Introduction Text (Subdued) */}
      <div className="text-center mb-4 lg:mb-8">
        <h1 className="text-xl lg:text-3xl font-bold text-white mb-1 lg:mb-3 tracking-wide opacity-90">
          {t('studio.showcase.title', { defaultValue: 'Explore Core AI Capabilities' })}
        </h1>
        <p className="text-white/50 text-xs lg:text-base max-w-md mx-auto hidden lg:block">
          {t('studio.showcase.subtitle', { defaultValue: 'Restaurant-grade image refinement, smart copy generation, and one-click multi-channel output.' })}
        </p>
      </div>

      {/* Tabs (Non-actionable visual indicators) */}
      <div className="flex flex-wrap justify-center gap-2 lg:gap-3 mb-4 lg:mb-8">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-full text-xs lg:text-sm font-medium transition-all duration-700 border flex items-center gap-1.5 lg:gap-2 ${
              activeTab === tab.id
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400/90 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                : 'bg-transparent border-transparent text-white/30'
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* Showcase Area (Ambient Background Style) */}
      <div className="w-full max-w-2xl h-[280px] lg:h-[360px] relative rounded-[2rem] border border-white/5 bg-[#0A0A0F]/40 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden transition-opacity duration-1000">
        {/* Subtle Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 z-0" />
        
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center scale-75 lg:scale-100 origin-center">
          
          {/* TAB 0: Before/After Effect */}
          {activeTab === 0 && (
            <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
              <h3 className="text-lg lg:text-xl font-bold text-white mb-6 animate-pulse-glow">{t('d.enhance.title', '✨ AI 正在优化图片...')}</h3>
              <div className="flex items-center gap-4 lg:gap-6 w-full justify-center">
                <div className="relative w-40 h-40 lg:w-48 lg:h-48 rounded-2xl overflow-hidden grayscale opacity-50 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80" alt="Before" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white/80 backdrop-blur-md">{t('studio.showcase.before', { defaultValue: 'Before' })}</div>
                </div>
                <div className="text-orange-500 flex flex-col items-center">
                  <div className="h-0.5 w-8 lg:w-12 bg-gradient-to-r from-transparent via-orange-500 to-orange-500 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-400 rotate-45" />
                  </div>
                </div>
                <div className="relative w-48 h-48 lg:w-56 lg:h-56 rounded-2xl overflow-hidden border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                  <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=100&sat=150" alt="After" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 right-2 bg-orange-500/90 px-2 py-1 rounded text-[10px] font-bold text-white backdrop-blur-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('studio.showcase.after', { defaultValue: 'After' })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: AI Copywriting Effect */}
          {activeTab === 1 && (
            <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
              <h3 className="text-lg lg:text-xl font-bold text-white mb-3 lg:mb-4">{t('d.copy.title', '✍️ AI 为您生成广告语')}</h3>
              <p className="text-white/40 text-xs lg:text-sm mb-6 lg:mb-8">{t('d.copy.desc', '选择想要的风格，AI 将立即生成吸引人的菜单描述')}</p>
              
              <div className="flex gap-3 lg:gap-4 mb-6">
                <div className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-white/5 border border-white/10 text-xs lg:text-sm text-white/50">{t('d.copy.c1', '亲切风格')}</div>
                <div className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-orange-500/20 border border-orange-500/50 text-orange-400 text-xs lg:text-sm font-medium shadow-[0_0_15px_rgba(249,115,22,0.2)]">{t('d.copy.c2', '高端风格')}</div>
                <div className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl bg-white/5 border border-white/10 text-xs lg:text-sm text-white/50">{t('d.copy.c3', '促销风格')}</div>
              </div>

              <div className="w-full max-w-sm lg:max-w-md p-4 lg:p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
                <p className="relative z-10 text-base lg:text-lg font-serif text-white/90 text-center leading-relaxed">
                  {t('studio.showcase.copySample', { defaultValue: '"Experience a premium flavor moment with carefully selected ingredients for your special meal."' })}
                </p>
                <div className="relative z-10 text-center mt-3 text-[10px] lg:text-xs text-orange-400">✨ {t('studio.showcase.generated', { defaultValue: 'AI Generated' })}</div>
              </div>
            </div>
          )}

          {/* TAB 2: Social Share Effect */}
          {activeTab === 2 && (
            <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
              <h3 className="text-lg lg:text-xl font-bold text-white mb-2">{t('d.export.title', '🚀 可以导出了！')}</h3>
              <p className="text-white/40 text-xs lg:text-sm mb-6 lg:mb-8">{t('d.export.desc', '选择尺寸和平台，即可立即下载或分享')}</p>
              
              <div className="flex gap-4 lg:gap-6 items-end">
                {/* 1:1 IG */}
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-orange-500/50 group-hover:bg-orange-500/10 transition-all shadow-lg">
                    <span className="text-white/30 font-mono text-xs">1:1</span>
                  </div>
                  <span className="text-[10px] lg:text-xs text-white/50">{t('studio.showcase.platform.instagram', { defaultValue: 'Instagram' })}</span>
                </div>
                {/* 16:9 FB */}
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-24 h-14 lg:w-28 lg:h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-orange-500/50 group-hover:bg-orange-500/10 transition-all shadow-lg">
                    <span className="text-white/30 font-mono text-xs">16:9</span>
                  </div>
                  <span className="text-[10px] lg:text-xs text-white/50">{t('studio.showcase.platform.facebook', { defaultValue: 'Facebook' })}</span>
                </div>
                {/* 9:16 Tiktok/LINE */}
                <div className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-24 lg:w-16 lg:h-28 bg-orange-500/20 border border-orange-500/50 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                    <span className="text-orange-400 font-mono text-xs">9:16</span>
                  </div>
                  <span className="text-[10px] lg:text-xs text-orange-400 font-medium flex items-center gap-1">{t('studio.showcase.platform.line', { defaultValue: 'LINE OA' })} <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /></span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
