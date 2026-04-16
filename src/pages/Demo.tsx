import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';

type TabKey = 'upload' | 'enhance' | 'copy' | 'export';

export default function Demo() {
  const { t, lang } = useI18n();
  const [activeTab, setActiveTab] = useState<TabKey>('upload');

  const tabs: { id: TabKey; label: string }[] = [
    { id: 'upload', label: t('demo.tab1') },
    { id: 'enhance', label: t('demo.tab2') },
    { id: 'copy', label: t('demo.tab3') },
    { id: 'export', label: t('demo.tab4') },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 relative overflow-hidden">
      <div className="glow-orb w-96 h-96 bg-primary-600/20 top-10 -left-20 animate-pulse-glow" style={{ animationDelay: '0.5s' }}></div>
      <div className="glow-orb w-80 h-80 bg-primary-400/15 bottom-10 -right-20 animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <p className="text-primary-400 font-semibold mb-3 text-sm uppercase tracking-widest">{t('demo.label')}</p>
        <h1 className="text-4xl sm:text-5xl font-black mb-4">{t('demo.title')}</h1>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">{t('demo.subtitle')}</p>
        <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold">
          <span>{lang === 'th' ? 'เริ่มใช้งานจริง — ฟรี 20 เครดิต' : lang === 'zh' ? '开始真实体验 — 免费 20 积分' : 'Start for real — 20 free credits'}</span>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#060608] ${
                activeTab === tab.id
                  ? 'text-white bg-white/5 border border-white/10'
                  : 'text-white/40 hover:text-white/70 border border-transparent'
              }`}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="glass-strong rounded-2xl p-6 sm:p-10 min-h-96 flex items-center justify-center">
          <div className="w-full max-w-2xl animate-fadeIn">
            {activeTab === 'upload' && (
              <div className="w-full max-w-lg mx-auto">
                <button className="w-full border-2 border-dashed border-primary-500/40 rounded-2xl p-16 text-center hover:border-primary-500/70 focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-colors cursor-pointer group bg-transparent">
                  <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📸</div>
                  <p className="font-bold text-xl mb-3 text-white">{t('d.upload.title')}</p>
                  <p className="text-gray-400 mb-4">{t('d.upload.desc')}</p>
                  <p className="text-primary-500 font-medium">{t('d.upload.hint')}</p>
                </button>
              </div>
            )}

            {activeTab === 'enhance' && (
              <div className="w-full">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-3 bg-primary-500/10 border border-primary-500/30 rounded-full px-6 py-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse"></div>
                    <span className="text-primary-400 font-medium">{t('d.enhance.title')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="glass rounded-2xl p-5 text-center">
                    <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl mb-4 flex items-center justify-center text-6xl grayscale opacity-60">🍜</div>
                    <p className="text-gray-500 font-medium">{lang === 'th' ? 'ก่อน' : lang === 'zh' ? '优化前' : 'Before'}</p>
                  </div>
                  <div className="glass rounded-2xl p-5 text-center border border-primary-500/20">
                    <div className="h-48 bg-gradient-to-br from-orange-500/80 to-red-700/60 rounded-xl mb-4 flex items-center justify-center text-6xl shadow-lg shadow-orange-500/30">🍜</div>
                    <p className="text-primary-500 font-medium">{lang === 'th' ? '✨ หลัง (AI)' : lang === 'zh' ? '✨ 优化后 (AI)' : '✨ After (AI)'}</p>
                  </div>
                </div>
                <p className="text-center text-gray-500">{t('d.enhance.desc')}</p>
              </div>
            )}

            {activeTab === 'copy' && (
              <div className="w-full max-w-lg mx-auto">
                <div className="text-center mb-6">
                  <p className="font-bold text-xl mb-2">{t('d.copy.title')}</p>
                  <p className="text-gray-400">{t('d.copy.desc')}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <button className="glass rounded-2xl p-5 text-center hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer text-white">
                    <p className="text-3xl mb-2">😊</p>
                    <p className="text-sm font-medium">{t('d.copy.c1')}</p>
                  </button>
                  <button className="glass rounded-2xl p-5 text-center border border-primary-500/30 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer text-white relative shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
                    <p className="text-3xl mb-2">💎</p>
                    <p className="text-sm font-medium">{t('d.copy.c2')}</p>
                  </button>
                  <button className="glass rounded-2xl p-5 text-center hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer text-white">
                    <p className="text-3xl mb-2">🏷️</p>
                    <p className="text-sm font-medium">{t('d.copy.c3')}</p>
                  </button>
                </div>
                <div className="glass rounded-2xl p-5 bg-primary-500/5 border border-primary-500/20">
                  <p className="text-primary-500 text-xs font-medium mb-2">{lang === 'th' ? '✨ ตัวอย่างคำโฆษณา:' : lang === 'zh' ? '✨ 广告语示例：' : '✨ Sample copy:'}</p>
                  <p className="text-gray-200 leading-relaxed italic">
                    {lang === 'th' 
                      ? '"ผัดไทยกุ้งสด รสชาติต้นตำรับ ที่ทำสดใหม่ทุกจาน กุ้งสดจั๋วๆ เสิร์ฟพร้อมถั่วงอกกรอบ ราดน้ำจิ้มเด็ดๆ ให้ลิ้มลอง!"'
                      : lang === 'zh'
                      ? '"泰式炒河粉，选用新鲜大虾，现点现炒。配上脆爽豆芽，配上独家泰式辣酱，一口满足！"'
                      : '"Fresh shrimp Pad Thai, hand-stir-fried to perfection. Crisp bean sprouts, roasted peanuts, and our signature tamarind sauce — every bite is authentic Thailand!"'
                    }
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="w-full">
                <div className="text-center mb-6">
                  <p className="font-bold text-xl mb-2">{t('d.export.title')}</p>
                  <p className="text-gray-400">{t('d.export.desc')}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <button className="w-full glass rounded-2xl p-4 text-center hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer text-white">
                    <div className="text-3xl mb-2">📱</div>
                    <p className="text-sm font-medium mb-1">Instagram</p>
                    <p className="text-xs text-gray-500">1:1 · Story</p>
                  </button>
                  <button className="w-full glass rounded-2xl p-4 text-center hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer text-white">
                    <div className="text-3xl mb-2">👥</div>
                    <p className="text-sm font-medium mb-1">Facebook</p>
                    <p className="text-xs text-gray-500">16:9 · Feed</p>
                  </button>
                  <button className="w-full glass rounded-2xl p-4 text-center hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer text-white">
                    <div className="text-3xl mb-2">📲</div>
                    <p className="text-sm font-medium mb-1">LINE OA</p>
                    <p className="text-xs text-gray-500">9:16 · Banner</p>
                  </button>
                  <button className="w-full glass rounded-2xl p-4 text-center hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-primary-500 transition cursor-pointer border border-primary-500/30 text-white relative shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent"></div>
                    <div className="text-3xl mb-2">🎨</div>
                    <p className="text-sm font-medium mb-1">QR Menu</p>
                    <p className="text-xs text-primary-500">{lang === 'th' ? '✨ ดาวน์โหลด' : lang === 'zh' ? '✨ 下载' : '✨ Download'}</p>
                  </button>
                </div>
                <div className="flex gap-3 justify-center">
                  <button className="btn-primary px-6 py-3 rounded-xl font-semibold">{lang === 'th' ? '📥 ดาวน์โหลดทั้งหมด' : lang === 'zh' ? '📥 全部下载' : '📥 Download All'}</button>
                  <button className="btn-outline px-6 py-3 rounded-xl font-semibold">{lang === 'th' ? '🔗 แชร์ลิงก์' : lang === 'zh' ? '🔗 分享链接' : '🔗 Share Link'}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400 font-medium">{t('demo.creditTitle')}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-white/[0.03]">
              <p className="text-2xl font-bold text-primary-500">~10</p>
              <p className="text-sm text-gray-500 mt-1">{t('demo.credit1')}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/[0.03]">
              <p className="text-2xl font-bold text-purple-400">{lang === 'th' ? 'ฟรี' : lang === 'zh' ? '免费' : 'Free'}</p>
              <p className="text-sm text-gray-500 mt-1">{t('demo.credit2')}</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/[0.03]">
              <p className="text-2xl font-bold text-blue-400">~10</p>
              <p className="text-sm text-gray-500 mt-1">{t('demo.credit3')}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center pb-20">
          <p className="text-gray-400 mb-4">{lang === 'th' ? 'ชมเท่านั้น หากต้องการใช้งานจริง สร้างบัญชีฟรีได้เลย' : lang === 'zh' ? '仅供演示，如需真实使用，免费创建账户即可' : 'View only. To try for real, create a free account.'}</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold">
            <span>{lang === 'th' ? 'เริ่มสร้างฟรี — 20 เครดิต' : lang === 'zh' ? '免费开始 — 20 积分' : 'Start Free — 20 credits'}</span>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
