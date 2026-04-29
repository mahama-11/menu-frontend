import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BookTemplate,
  ChevronRight,
  Copy,
  Eye,
  Heart,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { getDashboardText } from './copy';
import { useDashboardStore } from '@/store/dashboardStore';
import { useAuthStore } from '@/store/authStore';
import { useCommercialStore } from '@/store/commercialStore';
import { useToastStore } from '@/store/toastStore';
import { buildStudioLaunchPayload, templateCenterService } from '@/services/templateCenter';
import { formatMenuPlanLabel, resolveEffectiveMenuPlan } from '@/lib/commercialPlan';
import type {
  ListTemplateCatalogsParams,
  TemplateCatalogDetail,
  TemplateCatalogSummary,
  TemplateCenterMeta,
} from '@/types/templateCenter';

type FilterKey = 'cuisine' | 'dish_type' | 'platform' | 'mood';

const EMPTY_META: TemplateCenterMeta = {
  cuisines: [],
  dish_types: [],
  platforms: [],
  moods: [],
  plans: [],
};

export default function DashboardTemplateCenterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId: templateIdParam } = useParams<{ templateId?: string }>();
  const { lang } = useI18n();
  const tDash = useCallback((key: string) => getDashboardText(lang, key), [lang]);
  const legacyPlan = useDashboardStore((state) => state.plan);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const latestSubscription = useCommercialStore((state) => state.latestSubscription);
  const fetchCommercialContext = useCommercialStore((state) => state.fetchCommercialContext);
  const showToast = useToastStore((state) => state.showToast);
  const isPublicRoute = !location.pathname.startsWith('/dashboard');

  const effectivePlan = resolveEffectiveMenuPlan(latestSubscription?.order?.package_code, legacyPlan);
  const shouldSendPlanHint = isPublicRoute && !isAuthenticated;
  const detailRequestRef = useRef(0);
  const detailPanelRef = useRef<HTMLElement | null>(null);

  const [meta, setMeta] = useState<TemplateCenterMeta>(EMPTY_META);
  const [catalogs, setCatalogs] = useState<TemplateCatalogSummary[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [detail, setDetail] = useState<TemplateCatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);
  const [usingTemplateId, setUsingTemplateId] = useState<string | null>(null);
  const [copyingTemplateId, setCopyingTemplateId] = useState<string | null>(null);
  const [queryDraft, setQueryDraft] = useState('');
  const [filters, setFilters] = useState<ListTemplateCatalogsParams>({});
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchCommercialContext();
  }, [fetchCommercialContext, isAuthenticated]);

  const loadMeta = useCallback(async () => {
    try {
      const result = await templateCenterService.getMeta();
      setMeta(result);
    } catch (error) {
      console.error(error);
      showToast(tDash('dash.templateCenter.loadError'), 'error');
    }
  }, [showToast, tDash]);

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const favorites = await templateCenterService.listFavorites(effectivePlan);
      setFavoriteIds(new Set(favorites.map((item) => item.template_id)));
    } catch (error) {
      console.error(error);
    }
  }, [effectivePlan, isAuthenticated]);

  const loadCatalogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await templateCenterService.listCatalogs({
        ...filters,
        query: filters.query?.trim() || undefined,
        plan: shouldSendPlanHint ? effectivePlan : undefined,
      });
      const items = Array.isArray(result) ? result : [];
      setCatalogs(items);
      setSelectedTemplateId((current) => {
        if (templateIdParam && items.some((item) => item.template_id === templateIdParam)) {
          return templateIdParam;
        }
        if (current && items.some((item) => item.template_id === current)) {
          return current;
        }
        return items[0]?.template_id || null;
      });
    } catch (error) {
      console.error(error);
      showToast(tDash('dash.templateCenter.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [effectivePlan, filters, shouldSendPlanHint, showToast, tDash, templateIdParam]);

  useEffect(() => {
    void Promise.all([loadMeta(), loadFavorites()]);
  }, [loadFavorites, loadMeta]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalogs();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadCatalogs]);

  useEffect(() => {
    if (!templateIdParam) return;
    setSelectedTemplateId(templateIdParam);
  }, [templateIdParam]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setDetail(null);
      setSelectedPlatform('');
      return;
    }

    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setDetailLoading(true);

    void templateCenterService.getCatalogDetail(selectedTemplateId, shouldSendPlanHint ? effectivePlan : undefined)
      .then((result) => {
        if (detailRequestRef.current !== requestId) return;
        setDetail(result);
        setSelectedPlatform((current) => {
          if (current && result.platforms.includes(current)) {
            return current;
          }
          return result.platforms[0] || '';
        });
      })
      .catch((error) => {
        console.error(error);
        if (detailRequestRef.current !== requestId) return;
        showToast(tDash('dash.templateCenter.detailError'), 'error');
      })
      .finally(() => {
        if (detailRequestRef.current === requestId) {
          setDetailLoading(false);
        }
      });
  }, [effectivePlan, selectedTemplateId, shouldSendPlanHint, showToast, tDash]);

  const visibleCatalogs = useMemo(() => {
    if (!onlyFavorites) return catalogs;
    return catalogs.filter((item) => favoriteIds.has(item.template_id));
  }, [catalogs, favoriteIds, onlyFavorites]);

  const cuisineMap = useMemo(() => buildLabelMap(meta.cuisines), [meta.cuisines]);
  const dishTypeMap = useMemo(() => buildLabelMap(meta.dish_types), [meta.dish_types]);
  const platformMap = useMemo(() => buildLabelMap(meta.platforms), [meta.platforms]);
  const moodMap = useMemo(() => buildLabelMap(meta.moods), [meta.moods]);

  const featuredTemplates = useMemo(
    () => [...catalogs].sort((a, b) => b.recommend_score - a.recommend_score).slice(0, 3),
    [catalogs],
  );

  const favoriteCount = favoriteIds.size;

  const openTemplate = useCallback((templateId: string, replace = false) => {
    setSelectedTemplateId(templateId);
    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (!isPublicRoute) return;
    navigate(`/templates/${templateId}`, { replace });
  }, [isPublicRoute, navigate]);

  const ensureAuthenticated = useCallback(() => {
    if (isAuthenticated) return true;
    navigate('/login', { state: { from: location } });
    return false;
  }, [isAuthenticated, location, navigate]);

  const handleFilterChange = (key: FilterKey, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
  };

  const handleQuerySubmit = () => {
    setFilters((current) => ({
      ...current,
      query: queryDraft.trim() || undefined,
    }));
  };

  const handleToggleFavorite = async (templateId: string, active: boolean) => {
    if (!ensureAuthenticated()) return;
    setFavoritePendingId(templateId);
    try {
      if (active) {
        await templateCenterService.setFavorite(templateId);
        setFavoriteIds((current) => new Set([...current, templateId]));
        showToast(tDash('dash.templateCenter.favoriteAdded'), 'success');
      } else {
        await templateCenterService.removeFavorite(templateId);
        setFavoriteIds((current) => {
          const next = new Set(current);
          next.delete(templateId);
          return next;
        });
        showToast(tDash('dash.templateCenter.favoriteRemoved'), 'success');
      }
    } catch (error) {
      console.error(error);
      showToast(tDash('dash.templateCenter.favoriteError'), 'error');
    } finally {
      setFavoritePendingId(null);
    }
  };

  const handleUseTemplate = async () => {
    if (!detail || !selectedPlatform || detail.locked) return;
    if (!ensureAuthenticated()) return;
    setUsingTemplateId(detail.template_id);
    try {
      const result = await templateCenterService.useTemplate(detail.template_id, {
        target_platform: selectedPlatform,
        language: lang,
      });
      const payload = buildStudioLaunchPayload(detail, result, selectedPlatform);
      showToast(tDash('dash.templateCenter.useReady'), 'success');
      navigate('/studio', {
        state: {
          templateLaunch: payload,
        },
      });
    } catch (error) {
      console.error(error);
      showToast(tDash('dash.templateCenter.useError'), 'error');
    } finally {
      setUsingTemplateId(null);
    }
  };

  const handleCopyTemplate = async () => {
    if (!detail || detail.locked) return;
    if (!ensureAuthenticated()) return;
    setCopyingTemplateId(detail.template_id);
    try {
      await templateCenterService.copyToMyTemplates(detail.template_id, {
        name: `${detail.name} Copy`,
        visibility: 'private',
      });
      showToast(tDash('dash.templateCenter.copySuccess'), 'success');
    } catch (error) {
      console.error(error);
      showToast(tDash('dash.templateCenter.copyError'), 'error');
    } finally {
      setCopyingTemplateId(null);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-gradient-to-br from-[#12101b] via-[#181321] to-[#09090d] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:p-8">
        <div className="glow-orb -top-8 right-12 h-44 w-44 bg-primary-500/12 animate-pulse-glow" />
        <div className="glow-orb bottom-0 left-8 h-32 w-32 bg-purple-500/10 animate-pulse-glow" style={{ animationDelay: '1.1s' }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-400/20 bg-primary-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-200">
            <BookTemplate className="h-3.5 w-3.5" />
            {tDash('dash.templateCenter.badge')}
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {tDash('dash.templateCenter.title')}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">
            {tDash('dash.templateCenter.subtitle')}
          </p>

          {isPublicRoute && !isAuthenticated && (
            <div className="mt-6 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
              <span>{tDash('dash.templateCenter.publicHint')}</span>
              <button
                type="button"
                onClick={() => navigate('/login', { state: { from: location } })}
                className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-black transition hover:bg-white/90"
              >
                {tDash('dash.templateCenter.loginAction')}
              </button>
            </div>
          )}

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <MetricCard
              label={tDash('dash.templateCenter.stats.catalog')}
              value={String(catalogs.length)}
              hint={tDash('dash.templateCenter.stats.catalogHint')}
            />
            <MetricCard
              label={tDash('dash.templateCenter.stats.favorite')}
              value={String(favoriteCount)}
              hint={tDash('dash.templateCenter.stats.favoriteHint')}
            />
            <MetricCard
              label={tDash('dash.templateCenter.stats.plan')}
              value={formatMenuPlanLabel(latestSubscription?.order?.package_code || legacyPlan)}
              hint={tDash('dash.templateCenter.stats.planHint')}
            />
          </div>

          {featuredTemplates.length > 0 && (
            <div className="mt-8 grid gap-3 lg:grid-cols-3">
              {featuredTemplates.map((item) => (
                <button
                  key={item.template_id}
                  type="button"
                  onClick={() => openTemplate(item.template_id)}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-primary-500/30 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-200/70">
                        {tDash('dash.templateCenter.featured')}
                      </p>
                      <p className="mt-2 line-clamp-2 text-lg font-black text-white">{item.name}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/35" />
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-white/55">{item.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
        <div className="space-y-6">
          <div className="dashboard-surface rounded-[28px] p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))]">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {tDash('dash.templateCenter.filters.search')}
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <Search className="h-4 w-4 text-white/35" />
                  <input
                    value={queryDraft}
                    onChange={(event) => setQueryDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleQuerySubmit();
                      }
                    }}
                    placeholder={tDash('dash.templateCenter.searchPlaceholder')}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                  />
                  <button
                    type="button"
                    onClick={handleQuerySubmit}
                    className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    {tDash('dash.templateCenter.searchAction')}
                  </button>
                </div>
              </div>

              <SelectFilter
                label={tDash('dash.templateCenter.filters.cuisine')}
                value={filters.cuisine || ''}
                options={meta.cuisines}
                allLabel={tDash('dash.templateCenter.filters.all')}
                onChange={(value) => handleFilterChange('cuisine', value)}
              />
              <SelectFilter
                label={tDash('dash.templateCenter.filters.dishType')}
                value={filters.dish_type || ''}
                options={meta.dish_types}
                allLabel={tDash('dash.templateCenter.filters.all')}
                onChange={(value) => handleFilterChange('dish_type', value)}
              />
              <SelectFilter
                label={tDash('dash.templateCenter.filters.platform')}
                value={filters.platform || ''}
                options={meta.platforms}
                allLabel={tDash('dash.templateCenter.filters.all')}
                onChange={(value) => handleFilterChange('platform', value)}
              />
              <SelectFilter
                label={tDash('dash.templateCenter.filters.mood')}
                value={filters.mood || ''}
                options={meta.moods}
                allLabel={tDash('dash.templateCenter.filters.all')}
                onChange={(value) => handleFilterChange('mood', value)}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login', { state: { from: location } });
                    return;
                  }
                  setOnlyFavorites((current) => !current);
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  onlyFavorites
                    ? 'border-amber-400/25 bg-amber-500/12 text-amber-200'
                    : 'border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
                {tDash('dash.templateCenter.onlyFavorites')}
              </button>
              {filters.query && (
                <button
                  type="button"
                  onClick={() => {
                    setQueryDraft('');
                    setFilters((current) => ({ ...current, query: undefined }));
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {tDash('dash.templateCenter.clearSearch')}
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-surface rounded-[28px] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="dashboard-kicker">{tDash('dash.templateCenter.listKicker')}</p>
                <h2 className="mt-2 text-xl font-black text-white">{tDash('dash.templateCenter.listTitle')}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/60">
                {visibleCatalogs.length} {tDash('dash.templateCenter.results')}
              </span>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-40 animate-pulse rounded-3xl bg-white/[0.04]" />
                ))}
              </div>
            ) : visibleCatalogs.length === 0 ? (
              <div className="rounded-3xl border border-white/8 bg-black/20 px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] text-primary-300">
                  <BookTemplate className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-black text-white">{tDash('dash.templateCenter.emptyTitle')}</p>
                <p className="mt-2 text-sm text-white/45">{tDash('dash.templateCenter.emptyDesc')}</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleCatalogs.map((item) => {
                  const isFavorite = favoriteIds.has(item.template_id);
                  const selected = item.template_id === selectedTemplateId;
                  const locked = item.locked;
                  return (
                    <div
                      key={item.template_id}
                      onClick={() => openTemplate(item.template_id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openTemplate(item.template_id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`rounded-3xl border p-5 text-left transition ${
                        selected
                          ? 'border-primary-500/30 bg-primary-500/[0.08] shadow-[0_0_32px_rgba(249,115,22,0.08)]'
                          : 'border-white/8 bg-black/20 hover:border-white/14 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                              {platformSummary(item.platforms, platformMap)}
                            </span>
                            <span className="rounded-full border border-primary-400/20 bg-primary-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary-200">
                              {labelFor(item.cuisine, cuisineMap)}
                            </span>
                            {locked && (
                              <span className="rounded-full border border-amber-400/25 bg-amber-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
                                <Lock className="mr-1 inline h-3 w-3" />
                                {item.plan_required}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-3 line-clamp-2 text-lg font-black text-white">{item.name}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleToggleFavorite(item.template_id, !isFavorite);
                          }}
                          disabled={favoritePendingId === item.template_id}
                          className={`rounded-full border p-2 transition ${
                            isFavorite
                              ? 'border-amber-400/25 bg-amber-500/12 text-amber-200'
                              : 'border-white/10 bg-white/[0.04] text-white/45 hover:text-white'
                          }`}
                        >
                          {favoritePendingId === item.template_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                          )}
                        </button>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">{item.description}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.moods.slice(0, 3).map((mood) => (
                          <span key={mood} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/60">
                            {labelFor(mood, moodMap)}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{tDash('dash.templateCenter.credits')}</p>
                          <p className="mt-1 text-lg font-black text-white">{item.credits_cost} cr</p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openTemplate(item.template_id);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {tDash('dash.templateCenter.viewDetail')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside ref={detailPanelRef} className="dashboard-surface rounded-[28px] p-5">
          {detailLoading ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-primary-300" />
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="dashboard-kicker">{tDash('dash.templateCenter.detailKicker')}</p>
                  <h2 className="mt-2 text-2xl font-black text-white">{detail.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">{detail.description}</p>
                </div>
                {detail.locked ? (
                  <span className="rounded-full border border-amber-400/25 bg-amber-500/12 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200">
                    <Lock className="mr-1 inline h-3.5 w-3.5" />
                    {detail.plan_required}
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
                    {tDash('dash.templateCenter.availableNow')}
                  </span>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <DetailStat title={tDash('dash.templateCenter.detail.cuisine')} value={labelFor(detail.cuisine, cuisineMap)} />
                <DetailStat title={tDash('dash.templateCenter.detail.dishType')} value={labelFor(detail.dish_type, dishTypeMap)} />
                <DetailStat title={tDash('dash.templateCenter.detail.plan')} value={detail.plan_required} />
                <DetailStat title={tDash('dash.templateCenter.detail.credits')} value={`${detail.credits_cost} cr`} />
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {tDash('dash.templateCenter.detail.platform')}
                </p>
                <select
                  value={selectedPlatform}
                  onChange={(event) => setSelectedPlatform(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none"
                >
                  {detail.platforms.map((platform) => (
                    <option key={platform} value={platform} className="bg-[#111118]">
                      {labelFor(platform, platformMap)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {tDash('dash.templateCenter.detail.moods')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.moods.map((mood) => (
                    <span key={mood} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/70">
                      {labelFor(mood, moodMap)}
                    </span>
                  ))}
                </div>
              </div>

              {detail.tags.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    {tDash('dash.templateCenter.detail.tags')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {detail.tags.slice(0, 8).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {detail.examples.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                      {tDash('dash.templateCenter.detail.examples')}
                    </p>
                    <span className="text-xs text-white/35">{detail.examples.length}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {detail.examples.map((example, index) => {
                      const preview = example.preview_url || example.output_asset_url || example.input_asset_url;
                      if (!preview) return null;
                      return (
                        <div key={`${preview}-${index}`} className="overflow-hidden rounded-2xl border border-white/8 bg-black/20">
                          <img src={preview} alt={example.title || detail.name} className="h-32 w-full object-cover" />
                          <div className="px-3 py-2">
                            <p className="truncate text-xs font-semibold text-white/75">
                              {example.title || tDash('dash.templateCenter.detail.exampleFallback')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {detail.prompt_templates?.en && (
                <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    {tDash('dash.templateCenter.detail.promptPreview')}
                  </p>
                  <p className="mt-3 line-clamp-5 text-sm leading-6 text-white/65">{detail.prompt_templates.en}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleUseTemplate}
                  disabled={detail.locked || !selectedPlatform || usingTemplateId === detail.template_id}
                  className="btn-primary inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {usingTemplateId === detail.template_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {isAuthenticated ? tDash('dash.templateCenter.actions.use') : tDash('dash.templateCenter.loginAction')}
                </button>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  disabled={detail.locked || copyingTemplateId === detail.template_id}
                  className="btn-outline inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copyingTemplateId === detail.template_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {isAuthenticated ? tDash('dash.templateCenter.actions.copy') : tDash('dash.templateCenter.actions.copyLogin')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05] text-primary-300">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="mt-5 text-lg font-black text-white">{tDash('dash.templateCenter.detailEmptyTitle')}</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">{tDash('dash.templateCenter.detailEmptyDesc')}</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-sm text-white/45">{hint}</p>
    </div>
  );
}

function DetailStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">{title}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  allLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 px-3 py-3">
      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-transparent text-sm text-white outline-none"
      >
        <option value="" className="bg-[#111118]">
          {allLabel}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id} className="bg-[#111118]">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function buildLabelMap(items: Array<{ id: string; label: string }>) {
  return items.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.label;
    return acc;
  }, {});
}

function labelFor(id: string, labels: Record<string, string>) {
  return labels[id] || id;
}

function platformSummary(platforms: string[], labels: Record<string, string>) {
  if (platforms.length === 0) return 'Template';
  if (platforms.length === 1) return labelFor(platforms[0], labels);
  return `${labelFor(platforms[0], labels)} +${platforms.length - 1}`;
}
