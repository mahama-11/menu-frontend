import { Link } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export default function Landing() {
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="glow-orb w-96 h-96 bg-primary-600/20 top-20 -left-20 animate-pulse-glow"></div>
        <div className="glow-orb w-80 h-80 bg-primary-400/15 bottom-20 -right-20 animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
        <div className="glow-orb w-64 h-64 bg-yellow-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" style={{ animationDelay: '0.8s' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-20">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm text-gray-300">{t('hero.badge')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span>{t('hero.title1')}</span><br />
            <span className="gradient-text">{t('hero.title2')}</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-primary px-8 py-4 rounded-xl text-base font-bold w-full sm:w-auto flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              <span>{isAuthenticated ? t('nav.cta') : t('hero.cta1')}</span>
            </Link>
            <Link to="/demo" className="btn-outline px-8 py-4 rounded-xl text-base font-semibold w-full sm:w-auto flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,3 19,12 5,21 5,3"/></svg>
              <span>{t('hero.cta2')}</span>
            </Link>
          </div>

          <div className="relative w-full max-w-5xl mx-auto" style={{ animationDelay: '0.4s' }}>
            <div className="relative w-full h-80 sm:h-96">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl animate-pulse-glow"></div>
              
              <div className="absolute left-0 top-0 w-64 sm:w-80 h-56 sm:h-64 rounded-2xl overflow-hidden shadow-2xl transform -rotate-3 card-float-1">
                <img src="/images/menu-template-preview_1776067857.png" alt="Menu Template" className="w-full h-full object-cover" />
              </div>
              
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-56 h-48 sm:h-56 rounded-2xl overflow-hidden shadow-2xl transform card-float-2 z-10">
                <img src="/images/thai-green-curry_1776067795.png" alt="Thai Green Curry" className="w-full h-full object-cover" />
              </div>
              
              <div className="absolute right-0 top-4 w-36 sm:w-44 h-32 sm:h-40 rounded-2xl overflow-hidden shadow-2xl transform rotate-3 card-float-3">
                <img src="/images/thai-tom-yum_1776067771.png" alt="Tom Yum" className="w-full h-full object-cover" />
              </div>
              
              <div className="absolute left-4 bottom-0 w-32 sm:w-40 h-28 sm:h-36 rounded-2xl overflow-hidden shadow-2xl transform -rotate-2 card-float-4">
                <img src="/images/thai-som-tam_1776067832.png" alt="Som Tam" className="w-full h-full object-cover" />
              </div>
              
              <div className="absolute right-4 bottom-8 w-28 sm:w-36 h-24 sm:h-32 rounded-2xl overflow-hidden shadow-2xl transform rotate-2 card-float-1">
                <img src="/images/thai-satay_1776067842.png" alt="Thai Satay" className="w-full h-full object-cover" />
              </div>
              
              <div className="absolute left-1/4 top-0 w-24 sm:w-32 h-20 sm:h-28 rounded-xl overflow-hidden shadow-xl transform -rotate-6 card-float-2">
                <img src="/images/thai-mango-sticky-rice_1776067806.png" alt="Mango Sticky Rice" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Marquee */}
      <section className="py-6 border-y border-white/5 overflow-hidden">
        <div className="flex whitespace-nowrap">
          <div className="flex gap-12 sm:gap-16 items-center text-gray-500 text-sm font-medium animate-marquee">
            <span>🇹🇭 <span>{t('proof.stat1')}</span></span>
            <span>📸 <span>{t('proof.stat2')}</span></span>
            <span>⭐ <span>{t('proof.stat3')}</span></span>
            <span>⚡ <span>{t('proof.stat4')}</span></span>
            <span>🌐 <span>{t('proof.stat5')}</span></span>
            <span>🔒 <span>{t('proof.stat6')}</span></span>
            <span>🇹🇭 <span>{t('proof.stat1')}</span></span>
            <span>📸 <span>{t('proof.stat2')}</span></span>
            <span>⭐ <span>{t('proof.stat3')}</span></span>
            <span>⚡ <span>{t('proof.stat4')}</span></span>
            <span>🌐 <span>{t('proof.stat5')}</span></span>
            <span>🔒 <span>{t('proof.stat6')}</span></span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center reveal">
              <p className="text-3xl sm:text-4xl font-black gradient-text">500+</p>
              <p className="text-sm text-gray-400 mt-1">{t('stats.s1')}</p>
            </div>
            <div className="text-center reveal" style={{ transitionDelay: '0.1s' }}>
              <p className="text-3xl sm:text-4xl font-black gradient-text">50K+</p>
              <p className="text-sm text-gray-400 mt-1">{t('stats.s2')}</p>
            </div>
            <div className="text-center reveal" style={{ transitionDelay: '0.2s' }}>
              <p className="text-3xl sm:text-4xl font-black gradient-text">4.9</p>
              <p className="text-sm text-gray-400 mt-1">{t('stats.s3')}</p>
            </div>
            <div className="text-center reveal" style={{ transitionDelay: '0.3s' }}>
              <p className="text-3xl sm:text-4xl font-black gradient-text">5s</p>
              <p className="text-sm text-gray-400 mt-1">{t('stats.s4')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-primary-400 font-semibold mb-3 text-sm uppercase tracking-widest">{t('features.label')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">{t('features.title')}</h2>
            <p className="text-gray-400 max-w-xl mx-auto">{t('features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass rounded-2xl p-6 sm:p-8 reveal transition hover:bg-white/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 mb-5 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"/><circle cx="12" cy="12" r="4"/></svg>
              </div>
              <h3 className="text-lg font-bold mb-2">{t('feat1.title')}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t('feat1.desc')}</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs bg-primary-500/10 text-primary-400 px-2.5 py-1 rounded-full">{t('feat1.tag1')}</span>
                <span className="text-xs bg-primary-500/10 text-primary-400 px-2.5 py-1 rounded-full">{t('feat1.tag2')}</span>
                <span className="text-xs bg-primary-500/10 text-primary-400 px-2.5 py-1 rounded-full">{t('feat1.tag3')}</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 sm:p-8 reveal transition hover:bg-white/[0.06]" style={{ transitionDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 mb-5 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              </div>
              <h3 className="text-lg font-bold mb-2">{t('feat2.title')}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t('feat2.desc')}</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">{t('feat2.tag1')}</span>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">{t('feat2.tag2')}</span>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">{t('feat2.tag3')}</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 sm:p-8 reveal transition hover:bg-white/[0.06]" style={{ transitionDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 mb-5 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              </div>
              <h3 className="text-lg font-bold mb-2">{t('feat3.title')}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t('feat3.desc')}</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">{t('feat3.tag1')}</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">{t('feat3.tag2')}</span>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">{t('feat3.tag3')}</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 sm:p-8 reveal transition hover:bg-white/[0.06]" style={{ transitionDelay: '0.3s' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 mb-5 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              </div>
              <h3 className="text-lg font-bold mb-2">{t('feat4.title')}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t('feat4.desc')}</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full">Facebook</span>
                <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full">Instagram</span>
                <span className="text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full">TikTok</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 sm:p-8 reveal transition hover:bg-white/[0.06]" style={{ transitionDelay: '0.4s' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 mb-5 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <h3 className="text-lg font-bold mb-2">{t('feat5.title')}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t('feat5.desc')}</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full">{t('feat5.tag1')}</span>
                <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full">{t('feat5.tag2')}</span>
                <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2.5 py-1 rounded-full">{t('feat5.tag3')}</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 sm:p-8 reveal transition hover:bg-white/[0.06]" style={{ transitionDelay: '0.5s' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/10 mb-5 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <h3 className="text-lg font-bold mb-2">{t('feat6.title')}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{t('feat6.desc')}</p>
              <div className="flex gap-2 mt-4 flex-wrap">
                <span className="text-xs bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-full">{t('feat6.tag1')}</span>
                <span className="text-xs bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-full">{t('feat6.tag2')}</span>
                <span className="text-xs bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-full">{t('feat6.tag3')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Showcase */}
      <section id="gallery" className="py-16 sm:py-24 relative overflow-hidden">
        <div className="glow-orb w-80 h-80 bg-purple-500/15 top-20 -right-20 animate-pulse-glow"></div>
        <div className="glow-orb w-64 h-64 bg-primary-400/10 bottom-20 -left-20 animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 reveal">
            <p className="text-primary-400 font-semibold mb-3 text-sm uppercase tracking-widest">{t('gallery.label')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">{t('gallery.title')}</h2>
            <p className="text-gray-400 max-w-xl mx-auto">{t('gallery.subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="relative group reveal">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img src="/images/thai-green-curry_1776067795.png" alt="Thai Green Curry" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            </div>
            <div className="relative group reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img src="/images/thai-tom-yum_1776067771.png" alt="Tom Yum" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            </div>
            <div className="relative group reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img src="/images/thai-som-tam_1776067832.png" alt="Som Tam" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            </div>
            <div className="relative group reveal" style={{ transitionDelay: '0.3s' }}>
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img src="/images/thai-satay_1776067842.png" alt="Thai Satay" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden reveal">
            <img src="/images/hero-thai-food_1776067758.png" alt="Hero Food" className="w-full h-64 sm:h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
              <div className="p-6 sm:p-8">
                <p className="text-xs text-primary-400 font-semibold mb-1">{t('gallery.featured')}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('gallery.featuredTitle')}</h3>
                <p className="text-sm text-gray-300 max-w-lg">{t('gallery.featuredDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Export Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <p className="text-primary-400 font-semibold mb-3 text-sm uppercase tracking-widest">{t('social.label')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">{t('social.title')}</h2>
            <p className="text-gray-400 max-w-xl mx-auto">{t('social.subtitle')}</p>
          </div>

          <div className="relative rounded-3xl overflow-hidden reveal">
            <img src="/images/social-media-mockup_1776067876.png" alt="Social Media Export" className="w-full rounded-3xl shadow-2xl" />
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8 reveal">
            <div className="glass rounded-full px-5 py-2.5 flex items-center gap-2">
              <span className="text-pink-500">●</span>
              <span className="text-sm font-medium">Instagram</span>
            </div>
            <div className="glass rounded-full px-5 py-2.5 flex items-center gap-2">
              <span className="text-blue-500">●</span>
              <span className="text-sm font-medium">Facebook</span>
            </div>
            <div className="glass rounded-full px-5 py-2.5 flex items-center gap-2">
              <span className="text-green-500">●</span>
              <span className="text-sm font-medium">LINE OA</span>
            </div>
            <div className="glass rounded-full px-5 py-2.5 flex items-center gap-2">
              <span className="text-white">●</span>
              <span className="text-sm font-medium">TikTok</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <p className="text-primary-400 font-semibold mb-3 text-sm uppercase tracking-widest">{t('workflow.label')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">{t('workflow.title')}</h2>
            <p className="text-gray-400 max-w-xl mx-auto">{t('workflow.subtitle')}</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4">
              <div className="relative reveal">
                <div className="glass rounded-2xl p-6 h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mx-auto mb-4 text-white font-black text-lg shadow-lg shadow-primary-500/30">1</div>
                  <div className="text-4xl mb-3">📸</div>
                  <h3 className="font-bold mb-2">{t('step1.title')}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{t('step1.desc')}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-400/10 px-3 py-1 rounded-full">{t('step1.credit')}</div>
                </div>
              </div>
              <div className="relative reveal" style={{ transitionDelay: '0.15s' }}>
                <div className="glass rounded-2xl p-6 h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 text-white font-black text-lg shadow-lg shadow-purple-500/30">2</div>
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="font-bold mb-2">{t('step2.title')}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{t('step2.desc')}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary-400 font-semibold bg-primary-400/10 px-3 py-1 rounded-full">{t('step2.credit')}</div>
                </div>
              </div>
              <div className="relative reveal" style={{ transitionDelay: '0.3s' }}>
                <div className="glass rounded-2xl p-6 h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 text-white font-black text-lg shadow-lg shadow-blue-500/30">3</div>
                  <div className="text-4xl mb-3">✍️</div>
                  <h3 className="font-bold mb-2">{t('step3.title')}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{t('step3.desc')}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-green-400 font-semibold bg-green-400/10 px-3 py-1 rounded-full">{t('step3.credit')}</div>
                </div>
              </div>
              <div className="relative reveal" style={{ transitionDelay: '0.45s' }}>
                <div className="glass rounded-2xl p-6 h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4 text-white font-black text-lg shadow-lg shadow-green-500/30">4</div>
                  <div className="text-4xl mb-3">🚀</div>
                  <h3 className="font-bold mb-2">{t('step4.title')}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{t('step4.desc')}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary-400 font-semibold bg-primary-400/10 px-3 py-1 rounded-full">{t('step4.credit')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <p className="text-primary-400 font-semibold mb-3 text-sm uppercase tracking-widest">{t('pricing.label')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">{t('pricing.title')}</h2>
            <p className="text-gray-400 max-w-xl mx-auto">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div className="pricing-card glass rounded-2xl p-6 sm:p-8 reveal">
              <div className="mb-6">
                <p className="text-gray-400 font-medium text-sm mb-1">{t('price.free.name')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">฿0</span>
                  <span className="text-gray-500 text-sm">{t('price.forever')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('price.free.desc')}</p>
              </div>
              <div className="space-y-3 mb-8">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className={`flex items-center justify-between gap-3 ${i > 4 ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-3">
                      <svg className={`w-5 h-5 ${i > 4 ? 'text-gray-600' : 'text-green-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>
                      <span className={`text-sm ${i > 4 ? 'text-gray-600' : 'text-gray-300'}`}>{t(`price.free.f${i}`)}</span>
                    </div>
                    {i <= 4 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${i === 1 ? 'text-green-400 bg-green-400/10' : 'text-primary-400 bg-primary-400/10'}`}>
                        {i === 1 ? t('price.credit.free') : `10 ${t('price.creditUnit')}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-outline w-full py-3 rounded-xl font-semibold block text-center">{t('price.free.btn')}</Link>
            </div>

            {/* Pro */}
            <div className="pricing-card pricing-popular glass rounded-2xl p-6 sm:p-8 reveal" style={{ transitionDelay: '0.1s' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">{t('price.popular')}</span>
              </div>
              <div className="mb-6">
                <p className="text-primary-400 font-medium text-sm mb-1">{t('price.pro.name')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black gradient-text">฿249</span>
                  <span className="text-gray-500 text-sm">{t('price.perMonth')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('price.pro.desc')}</p>
              </div>
              <div className="space-y-3 mb-8">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`flex items-center justify-between gap-3 ${i > 3 ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-3">
                      <svg className={`w-5 h-5 ${i > 3 ? 'text-gray-600' : 'text-green-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>
                      <span className={`text-sm ${i > 3 ? 'text-gray-600' : 'text-gray-300'}`}>{t(`price.pro.f${i}`)}</span>
                    </div>
                    {i <= 3 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 text-primary-400 bg-primary-400/10">
                        {i === 3 ? '15' : '10'} {t('price.creditUnit')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-primary w-full py-3 rounded-xl font-bold block text-center">{t('price.pro.btn')}</Link>
            </div>

            {/* Growth */}
            <div className="pricing-card glass rounded-2xl p-6 sm:p-8 reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="mb-6">
                <p className="text-gray-400 font-medium text-sm mb-1">{t('price.growth.name')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">฿499</span>
                  <span className="text-gray-500 text-sm">{t('price.perMonth')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('price.growth.desc')}</p>
              </div>
              <div className="space-y-3 mb-8">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg>
                      <span className="text-sm text-gray-300">{t(`price.growth.f${i}`)}</span>
                    </div>
                    {i <= 2 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 text-primary-400 bg-primary-400/10">
                        10 {t('price.creditUnit')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-outline w-full py-3 rounded-xl font-semibold block text-center">{t('price.growth.btn')}</Link>
            </div>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-8 reveal">{t('pricing.note')}</p>

          <div className="mt-8 glass rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto reveal">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-5xl flex-shrink-0">🎁</div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-lg mb-1">{t('referral.title')}</h3>
                <p className="text-sm text-gray-400">{t('referral.desc')}</p>
              </div>
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-primary px-6 py-3 rounded-xl font-semibold flex-shrink-0 block text-center">{t('referral.btn')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <p className="text-primary-400 font-semibold mb-3 text-sm uppercase tracking-widest">{t('faq.label')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">{t('faq.title')}</h2>
          </div>

          <div className="space-y-3 reveal">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/[0.03] focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-xl transition"
                  onClick={() => toggleFaq(i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-sm">{t(`faq.q${i}`)}</span>
                  <svg
                    className={`w-5 h-5 text-primary-400 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6,9 12,15 18,9" />
                  </svg>
                </button>
                <div
                  className={`faq-answer px-6 text-sm text-gray-400 leading-relaxed ${
                    openFaq === i ? 'open pb-5' : ''
                  }`}
                >
                  {t(`faq.a${i}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="glow-orb w-96 h-96 bg-primary-600/20 top-0 left-1/2 -translate-x-1/2 animate-pulse-glow"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-strong rounded-3xl p-8 sm:p-16 reveal">
            <div className="text-5xl mb-6">🍜</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4">{t('cta.title')}</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto">{t('cta.subtitle')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={isAuthenticated ? "/dashboard" : "/register"} className="btn-primary px-10 py-4 rounded-xl text-base font-bold w-full sm:w-auto flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                <span>{isAuthenticated ? t('nav.cta') : t('cta.cta1')}</span>
              </Link>
              <Link to="/#pricing" className="btn-outline px-10 py-4 rounded-xl text-base font-semibold w-full sm:w-auto">
                {t('cta.cta2')}
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-4">{t('cta.note')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
