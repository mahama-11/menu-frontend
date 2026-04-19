import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { assetService, sharePostService } from '@/services/studio';
import type { AssetLibraryItem, SharePost } from '@/types/studio';
import { useAssetStore } from '@/store/studioStore';
import { useToastStore } from '@/store/toastStore';
import { Archive, ImagePlus, Library, Send, Share2, Sparkles, Upload } from 'lucide-react';

export default function AssetLibrarySection() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const addAsset = useAssetStore((state) => state.addAsset);
  const selectAsset = useAssetStore((state) => state.selectAsset);
  const [items, setItems] = useState<AssetLibraryItem[]>([]);
  const [posts, setPosts] = useState<SharePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'generated' | 'source' | 'shared'>('all');
  const [publishingAssetId, setPublishingAssetId] = useState<string | null>(null);
  const errorLoadText = t('dash.library.errorLoad');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [library, shareList] = await Promise.all([
        assetService.getLibrary({ limit: 24, offset: 0 }),
        sharePostService.listPosts({ limit: 20 }),
      ]);
      setItems(library.items || []);
      setPosts(shareList.items || []);
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : errorLoadText, 'error');
    } finally {
      setLoading(false);
    }
  }, [errorLoadText, showToast]);

  useEffect(() => {
    // Load once on mount. Reloads should be explicit to avoid unstable callback loops.
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'shared') return Boolean(item.share);
      return item.asset.asset_type === filter;
    });
  }, [filter, items]);

  const handlePublish = async (item: AssetLibraryItem) => {
    setPublishingAssetId(item.asset.asset_id);
    try {
      await sharePostService.createPost({
        asset_id: item.asset.asset_id,
        job_id: item.produced_by_job_id,
        variant_id: item.variant_id,
        title: item.asset.file_name,
        visibility: 'public',
        metadata: { origin_role: item.origin_role },
      });
      showToast(t('dash.library.publishSuccess'), 'success');
      await load();
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : t('dash.library.publishError'), 'error');
    } finally {
      setPublishingAssetId(null);
    }
  };

  const handleRefine = (item: AssetLibraryItem) => {
    const existingAsset = useAssetStore.getState().assets.find((asset) => asset.asset_id === item.asset.asset_id);
    if (!existingAsset) {
      addAsset(item.asset);
    }
    selectAsset(item.asset.asset_id);
    navigate('/studio');
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="h-24 animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">{t('dash.library.title')}</h1>
        <p className="mt-2 text-sm text-gray-400">{t('dash.library.subtitle')}</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-purple-400/15 bg-gradient-to-br from-[#120f1c] via-[#181320] to-[#0d0c14] p-6 shadow-[0_0_40px_rgba(139,92,246,0.06)]">
        <div className="absolute -left-8 top-0 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-28 w-28 rounded-full bg-primary-500/8 blur-3xl" />
        <div className="relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <LibraryMetricCard
            icon={<Library className="h-5 w-5" />}
            value={items.length}
            label={t('dash.library.filters.all')}
            hint={t('dash.library.filters.allHint')}
            motionClass="card-float-1"
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <LibraryMetricCard
            icon={<Sparkles className="h-5 w-5" />}
            value={items.filter((item) => item.asset.asset_type === 'generated').length}
            label={t('dash.library.filters.generated')}
            hint={t('dash.library.filters.generatedHint')}
            motionClass="card-float-2"
            active={filter === 'generated'}
            onClick={() => setFilter('generated')}
          />
          <LibraryMetricCard
            icon={<Upload className="h-5 w-5" />}
            value={items.filter((item) => item.asset.asset_type === 'source').length}
            label={t('dash.library.filters.source')}
            hint={t('dash.library.filters.sourceHint')}
            motionClass="card-float-3"
            active={filter === 'source'}
            onClick={() => setFilter('source')}
          />
          <LibraryMetricCard
            icon={<Share2 className="h-5 w-5" />}
            value={posts.length}
            label={t('dash.library.filters.shared')}
            hint={t('dash.library.filters.sharedHint')}
            motionClass="card-float-1"
            accent
            active={filter === 'shared'}
            onClick={() => setFilter('shared')}
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-primary-400">
            <Library className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-white">{t('dash.library.emptyTitle')}</p>
          <p className="mt-2 text-sm text-gray-500">{t('dash.library.emptyDesc')}</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filteredItems.map((item) => (
            <div key={item.asset.asset_id} className="break-inside-avoid group relative rounded-3xl overflow-hidden bg-[#12121A] border border-white/10 shadow-2xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:border-purple-500/30">
              {/* Image Layer */}
              <img
                src={item.asset.preview_url || item.asset.source_url}
                alt={item.asset.file_name}
                className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Status Badges (Always visible at top) */}
              <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 pointer-events-none">
                <span className="rounded-full border border-purple-400/20 bg-purple-500/30 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                  {item.origin_role}
                </span>
                {item.share && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/30 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                    {t('dash.library.filters.shared')}
                  </span>
                )}
              </div>

              {/* Hover Overlay Layer (Dark glassmorphism) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none flex flex-col justify-end p-5">
                
                {/* Metadata */}
                <div className="transform translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
                  <p className="truncate text-lg font-black text-white drop-shadow-md">{item.asset.file_name}</p>
                  <p className="mt-1 text-xs text-white/70 font-medium">
                    {new Date(item.asset.created_at).toLocaleDateString()} · {item.asset.asset_type.toUpperCase()}
                  </p>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 pointer-events-auto">
                    <a
                      href={item.asset.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 flex-1"
                    >
                      <ImagePlus className="h-4 w-4" />
                      {t('dash.library.viewAsset')}
                    </a>
                    
                    {item.can_refine && (
                      <button
                        onClick={() => handleRefine(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/20 border border-purple-500/30 backdrop-blur-md px-3 py-2 text-xs font-bold text-purple-200 transition hover:bg-purple-500/30 flex-1"
                      >
                        <Sparkles className="h-4 w-4" />
                        {t('dash.library.refine')}
                      </button>
                    )}

                    {item.can_share && !item.share && (
                      <button
                        onClick={() => handlePublish(item)}
                        disabled={publishingAssetId === item.asset.asset_id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-60 flex-1"
                      >
                        <Send className="h-4 w-4" />
                        {publishingAssetId === item.asset.asset_id ? t('dash.library.publishing') : t('dash.library.publish')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-primary-300">
            <Archive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{t('dash.library.postsTitle')}</h3>
            <p className="text-sm text-gray-400">{t('dash.library.postsSubtitle')}</p>
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">{t('dash.library.noPosts')}</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.map((post) => (
              <div key={post.share_id} className="interactive-panel interactive-panel-purple rounded-xl border border-white/5 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{post.title || `${t('dash.library.shareLabel')} ${post.share_id.slice(0, 6)}`}</p>
                    <p className="mt-1 text-xs text-gray-500">{post.visibility} · {post.status}</p>
                  </div>
                  <a href={post.share_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-400 hover:text-primary-300">
                    {t('dash.library.open')}
                  </a>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                  <span>{post.view_count} {t('dash.library.views')}</span>
                  <span>{post.like_count} {t('dash.library.likes')}</span>
                  <span>{post.favorite_count} {t('dash.library.saves')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryMetricCard({
  icon,
  value,
  label,
  hint,
  motionClass,
  accent = false,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  hint: string;
  motionClass?: string;
  accent?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`interactive-panel ${accent || active ? '' : 'interactive-panel-purple'} rounded-2xl border p-5 text-left ${motionClass || ''} ${
        accent
          ? active
            ? 'border-primary-400/30 bg-primary-500/14 shadow-[0_0_34px_rgba(249,115,22,0.14)]'
            : 'border-primary-500/20 bg-primary-500/10 shadow-[0_0_30px_rgba(249,115,22,0.08)]'
          : active
            ? 'border-purple-400/24 bg-white/[0.08] shadow-[0_0_30px_rgba(139,92,246,0.14)]'
            : 'border-white/8 bg-white/[0.04]'
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          accent
            ? 'bg-primary-500/15 text-primary-200'
            : active
              ? 'bg-purple-400/12 text-purple-100'
              : 'bg-white/6 text-purple-200'
        }`}>
          {icon}
        </div>
        <Sparkles className={`h-4 w-4 ${accent ? 'text-primary-300/70' : active ? 'text-purple-200/70' : 'text-white/20'}`} />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-black tracking-tight ${accent ? 'text-primary-200' : active ? 'text-purple-100' : 'text-white'}`}>{value}</p>
      <p className="mt-2 text-sm text-gray-400">{hint}</p>
    </button>
  );
}
