import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { commercialService } from '@/services/commercial';
import type { CommercialAllowancePolicy, CommercialOfferingsResponse, CommercialOrderView, CommercialPackage, CommercialRateCard, CommercialSKU } from '@/types/commercial';

type LandingPlan = {
  id: string;
  skuCode: string;
  packageCode: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  periodLabel: string;
  features: string[];
  highlighted: boolean;
};

type SupportedLanguage = 'zh' | 'th' | 'en';

const safeParseJSON = (raw?: string): Record<string, unknown> => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const toSupportedLanguage = (lang: string): SupportedLanguage => {
  if (lang === 'zh' || lang === 'th') return lang;
  return 'en';
};

const localizedText = (value: unknown, lang: SupportedLanguage): string => {
  if (!value || typeof value !== 'object') return '';
  const source = value as Record<string, unknown>;
  const preferred = source[lang];
  if (typeof preferred === 'string' && preferred.trim()) return preferred;
  if (typeof source.en === 'string' && source.en.trim()) return source.en;
  if (typeof source.zh === 'string' && source.zh.trim()) return source.zh;
  if (typeof source.th === 'string' && source.th.trim()) return source.th;
  return '';
};

const localizedList = (value: unknown, lang: SupportedLanguage): string[] => {
  if (!value || typeof value !== 'object') return [];
  const source = value as Record<string, unknown>;
  return toStringArray(source[lang] ?? source.en ?? source.zh ?? source.th);
};

const displayTierName = (tier: string, pkg: CommercialPackage, sku: CommercialSKU): string => {
  const normalizedTier = tier.trim().toLowerCase();
  if (normalizedTier === 'basic') return 'Basic';
  if (normalizedTier === 'pro') return 'Pro';
  if (normalizedTier === 'growth') return 'Growth';
  return pkg.name.replace(/^Menu\s+/i, '').replace(/\s+Package$/i, '') || sku.name.replace(/^Menu\s+/i, '');
};

const priceSymbol = (currency: string): string => {
  switch (currency) {
    case 'THB':
      return '฿';
    case 'CNY':
      return '¥';
    case 'USD':
      return '$';
    default:
      return currency ? `${currency} ` : '';
  }
};

const formatPrice = (amount: number, currency: string): string => {
  const normalized = Math.round(amount) / 100;
  const symbol = priceSymbol(currency);
  if (symbol.endsWith(' ')) return `${symbol}${normalized.toLocaleString()}`;
  return `${symbol}${normalized.toLocaleString()}`;
};

const findBestRateCard = (rateCards: CommercialRateCard[], sku: CommercialSKU, packageCode: string): CommercialRateCard | undefined => {
  return rateCards
    .filter((item) => item.status === 'active' && (
      (item.target_type === 'sku' && item.target_id === sku.id) ||
      safeParseJSON(item.metadata).package_code === packageCode
    ))
    .sort((a, b) => b.version - a.version)[0];
};

const buildDynamicPlans = (offeringsData: CommercialOfferingsResponse | null, lang: SupportedLanguage): LandingPlan[] => {
  if (!offeringsData?.offerings) return [];
  const policiesByID = new Map<string, CommercialAllowancePolicy>();
  offeringsData.offerings.allowance_policies.forEach((item) => {
    policiesByID.set(item.id, item);
  });

  return offeringsData.offerings.packages
    .filter((pkg) => pkg.status === 'active' && pkg.package_type === 'subscription')
    .map((pkg) => {
      const packageMetadata = safeParseJSON(pkg.metadata);
      const linkedSKUCode = typeof packageMetadata.sku_code === 'string' ? packageMetadata.sku_code : '';
      const sku = offeringsData.offerings.skus.find((item) =>
        item.status === 'active' &&
        item.sku_type === 'subscription' &&
        item.billing_mode === 'recurring' &&
        (item.code === linkedSKUCode || safeParseJSON(item.metadata).package_code === pkg.code)
      );
      if (!sku) return null;

      const skuMetadata = safeParseJSON(sku.metadata);
      const rateCard = findBestRateCard(offeringsData.offerings.rate_cards, sku, pkg.code);
      const rateCardMetadata = safeParseJSON(rateCard?.metadata);
      const priceConfig = safeParseJSON(rateCard?.price_config);
      const mergedMetadata = { ...rateCardMetadata, ...skuMetadata, ...packageMetadata };

      const monthlyCalls = toNumber(mergedMetadata.monthly_calls) ?? 0;
      if (monthlyCalls <= 0) return null;

      const explicitDescription = localizedText(mergedMetadata.landing_description_i18n, lang)
        || (typeof mergedMetadata.landing_description === 'string' ? mergedMetadata.landing_description : '')
        || (typeof mergedMetadata.description === 'string' ? mergedMetadata.description : '');
      const explicitFeatures = localizedList(mergedMetadata.landing_features_i18n, lang).concat(toStringArray(mergedMetadata.landing_features));
      const tier = typeof mergedMetadata.tier === 'string' ? mergedMetadata.tier : '';
      const price = toNumber(priceConfig.unit_amount) ?? sku.list_price;
      if (!explicitDescription || explicitFeatures.length === 0) return null;

      return {
        id: pkg.code,
        skuCode: sku.code,
        packageCode: pkg.code,
        name: displayTierName(tier, pkg, sku),
        description: explicitDescription,
        price,
        currency: sku.currency || rateCard?.currency || 'CNY',
        periodLabel: lang === 'zh' ? '/月' : lang === 'th' ? '/เดือน' : '/month',
        features: explicitFeatures,
        highlighted: tier === 'pro' || sku.code.includes('.pro.'),
      } satisfies LandingPlan;
    })
    .filter((item): item is LandingPlan => Boolean(item))
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);
};

const buildFallbackPlans = (t: (key: string) => string): LandingPlan[] => ([
  {
    id: 'fallback-basic',
    skuCode: '',
    packageCode: '',
    name: t('price.free.name'),
    description: t('price.free.desc'),
    price: 900,
    currency: 'CNY',
    periodLabel: t('price.perMonth'),
    features: [t('price.free.f1'), t('price.free.f2'), t('price.free.f3'), t('price.free.f4')],
    highlighted: false,
  },
  {
    id: 'fallback-pro',
    skuCode: '',
    packageCode: '',
    name: t('price.pro.name'),
    description: t('price.pro.desc'),
    price: 24900,
    currency: 'CNY',
    periodLabel: t('price.perMonth'),
    features: [t('price.pro.f1'), t('price.pro.f2'), t('price.pro.f3'), t('price.pro.f4')],
    highlighted: true,
  },
  {
    id: 'fallback-growth',
    skuCode: '',
    packageCode: '',
    name: t('price.growth.name'),
    description: t('price.growth.desc'),
    price: 49900,
    currency: 'CNY',
    periodLabel: t('price.perMonth'),
    features: [t('price.growth.f1'), t('price.growth.f2'), t('price.growth.f3'), t('price.growth.f4')],
    highlighted: false,
  },
]);

export default function Landing() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const showToast = useToastStore((state) => state.showToast);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [offerings, setOfferings] = useState<CommercialOfferingsResponse | null>(null);
  const [pricingError, setPricingError] = useState(false);
  const [purchasingPlanID, setPurchasingPlanID] = useState<string | null>(null);
  const [orders, setOrders] = useState<CommercialOrderView[]>([]);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const fetchWalletSummaries = useAuthStore((state) => state.fetchWalletSummaries);

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
  }, [offerings, lang]);

  useEffect(() => {
    let cancelled = false;
    commercialService.getOfferings()
      .then((data) => {
        if (!cancelled) {
          setOfferings(data);
          setPricingError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPricingError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    commercialService.listOrders()
      .then((result) => {
        if (!cancelled) setOrders(result.items || []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const pricingPlans = useMemo(() => {
    const dynamicPlans = buildDynamicPlans(offerings, toSupportedLanguage(lang));
    return dynamicPlans.length > 0 ? dynamicPlans : buildFallbackPlans(t);
  }, [lang, offerings, t]);
  const pricingGridClassName = useMemo(() => {
    const count = pricingPlans.length;
    if (count >= 4) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-6xl mx-auto';
    }
    if (count === 3) {
      return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-5xl mx-auto';
    }
    if (count === 2) {
      return 'grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto';
    }
    return 'grid grid-cols-1 gap-6 max-w-xl mx-auto';
  }, [pricingPlans.length]);
  const activeSubscription = useMemo(() => {
    return [...orders]
      .filter((item) => item.order?.status === 'fulfilled' && item.order?.package_type === 'subscription')
      .sort((a, b) => {
        const aTime = new Date(a.order?.fulfilled_at || a.order?.updated_at || a.order?.created_at || 0).getTime();
        const bTime = new Date(b.order?.fulfilled_at || b.order?.updated_at || b.order?.created_at || 0).getTime();
        return bTime - aTime;
      })[0];
  }, [orders]);

  const handlePurchase = async (plan: LandingPlan) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    if (!plan.packageCode && !plan.skuCode) {
      showToast(lang === 'zh' ? '当前套餐暂不可购买' : lang === 'th' ? 'แพ็กเกจนี้ยังไม่พร้อมซื้อ' : 'This plan is not purchasable yet', 'error');
      return;
    }
    try {
      setPurchasingPlanID(plan.id);
      const orderView = await commercialService.createOrder({
        sku_code: plan.skuCode || undefined,
        package_code: plan.packageCode || undefined,
      });
      const orderID = orderView.order?.id;
      if (!orderID) {
        throw new Error(lang === 'zh' ? '创建订单失败' : lang === 'th' ? 'สร้างคำสั่งซื้อไม่สำเร็จ' : 'Failed to create order');
      }
      await commercialService.confirmOrderPayment(orderID, {
        payment_method: 'wallet_balance',
        provider_code: 'platform_wallet',
      });
      await fetchWalletSummaries(true);
      const latestOrders = await commercialService.listOrders();
      setOrders(latestOrders.items || []);
      showToast(
        lang === 'zh'
          ? `${plan.name} 购买成功，套餐已生效`
          : lang === 'th'
            ? `ซื้อ ${plan.name} สำเร็จและเริ่มใช้งานแล้ว`
            : `${plan.name} purchased successfully and is now active`,
        'success',
      );
      navigate('/dashboard');
    } catch (error) {
      const fallbackMessage = lang === 'zh'
        ? '购买失败，请检查余额后重试'
        : lang === 'th'
          ? 'ซื้อไม่สำเร็จ กรุณาตรวจสอบยอดคงเหลือแล้วลองใหม่'
          : 'Purchase failed. Please check your balance and try again.';
      showToast(error instanceof Error ? error.message : fallbackMessage, 'error');
    } finally {
      setPurchasingPlanID(null);
    }
  };
  const currentSubscriptionPackageCode = activeSubscription?.order?.package_code || '';

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
            <Link to="/studio" className="btn-outline px-8 py-4 rounded-xl text-base font-semibold w-full sm:w-auto flex items-center justify-center gap-2">
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

          <div className={pricingGridClassName}>
            {pricingPlans.map((plan, index) => (
              (() => {
                const isCurrentSubscription = Boolean(currentSubscriptionPackageCode) && currentSubscriptionPackageCode === plan.packageCode;
                const isBusy = purchasingPlanID === plan.id;
                return (
              <div
                key={plan.id}
                className={`pricing-card glass rounded-2xl p-6 sm:p-8 reveal relative ${plan.highlighted ? 'pricing-popular' : ''}`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {t('price.popular')}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <p className={`font-medium text-sm mb-1 ${plan.highlighted ? 'text-primary-400' : 'text-gray-400'}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${plan.highlighted ? 'gradient-text' : ''}`}>{formatPrice(plan.price, plan.currency)}</span>
                    <span className="text-gray-500 text-sm">{plan.periodLabel}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{plan.description}</p>
                </div>
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <polyline points="20,6 9,17 4,12"/>
                      </svg>
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={isBusy || isCurrentSubscription}
                  onClick={() => void handlePurchase(plan)}
                  className={`${plan.highlighted ? 'btn-primary font-bold' : 'btn-outline font-semibold'} w-full py-3 rounded-xl block text-center disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isCurrentSubscription
                    ? (lang === 'zh' ? '当前套餐' : lang === 'th' ? 'แพ็กเกจปัจจุบัน' : 'Current plan')
                    : isBusy
                    ? (lang === 'zh' ? '购买中...' : lang === 'th' ? 'กำลังซื้อ...' : 'Purchasing...')
                    : isAuthenticated
                      ? (lang === 'zh' ? '立即购买' : lang === 'th' ? 'ซื้อเลย' : 'Buy now')
                      : t('hero.cta1')}
                </button>
              </div>
                );
              })()
            ))}
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-8 reveal">{t('pricing.note')}</p>
          {pricingError && (
            <p className="text-center text-xs text-amber-400/80 mt-3 reveal">
              {lang === 'zh' ? '当前未取到最新套餐配置，已回退到默认展示。' : lang === 'th' ? 'ไม่สามารถโหลดแพ็กเกจล่าสุดได้ จึงแสดงข้อมูลสำรองแทน' : 'Latest pricing could not be loaded, so fallback plan copy is shown.'}
            </p>
          )}

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
