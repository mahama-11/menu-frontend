import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Copy, Download, ExternalLink, Heart, Loader2, Share2 } from 'lucide-react';
import { sharePostService } from '@/services/studio';
import type { ShareEngagement, SharePostDetail } from '@/types/studio';
import { useToastStore } from '@/store/toastStore';
import { useAuthStore } from '@/store/authStore';
import { useI18n } from '@/hooks/useI18n';

const buildFallbackEngagement = (detail: SharePostDetail): ShareEngagement => ({
  share_id: detail.share_id,
  view_count: detail.view_count,
  like_count: detail.like_count,
  favorite_count: detail.favorite_count,
  viewer_liked: false,
  viewer_favorited: false,
});

export default function SharePostPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const showToast = useToastStore((state) => state.showToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [detail, setDetail] = useState<SharePostDetail | null>(null);
  const [engagement, setEngagement] = useState<ShareEngagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'share' | 'like' | 'favorite' | null>(null);

  const shareUrl = useMemo(() => {
    if (detail?.share_url) {
      return detail.share_url;
    }
    return typeof window !== 'undefined' ? window.location.href : '';
  }, [detail?.share_url]);

  const loadPublicPost = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const item = await sharePostService.getPublicPost(token);
      setDetail(item);
      setEngagement(buildFallbackEngagement(item));
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : t('share.public.loadError'), 'error');
      setDetail(null);
      setEngagement(null);
    } finally {
      setLoading(false);
    }
  }, [showToast, t, token]);

  useEffect(() => {
    void loadPublicPost();
  }, [loadPublicPost]);

  useEffect(() => {
    if (!token || !detail) {
      return;
    }
    const viewKey = `menu_share_viewed:${token}`;
    if (sessionStorage.getItem(viewKey)) {
      return;
    }
    sessionStorage.setItem(viewKey, '1');
    void sharePostService.recordPublicView(token)
      .then((result) => {
        setEngagement((prev) => ({
          share_id: result.share_id,
          view_count: result.view_count,
          like_count: result.like_count,
          favorite_count: result.favorite_count,
          viewer_liked: prev?.viewer_liked ?? false,
          viewer_favorited: prev?.viewer_favorited ?? false,
        }));
      })
      .catch((error) => {
        console.error(error);
      });
  }, [detail, token]);

  useEffect(() => {
    if (!detail || !isAuthenticated) {
      return;
    }
    void sharePostService.getEngagement(detail.share_id)
      .then((result) => {
        setEngagement(result);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [detail, isAuthenticated]);

  const ensureAuthenticated = () => {
    if (isAuthenticated) {
      return true;
    }
    showToast(t('share.public.loginRequired'), 'info');
    navigate('/login', { state: { from: location } });
    return false;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(t('share.public.copySuccess'), 'success');
    } catch (error) {
      console.error(error);
      showToast(t('share.public.copyError'), 'error');
    }
  };

  const handleNativeShare = async () => {
    if (!detail) {
      return;
    }
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    setActionLoading('share');
    try {
      await navigator.share({
        title: detail.title || detail.asset.file_name || t('share.public.defaultTitle'),
        text: detail.caption || t('share.public.defaultCaption'),
        url: shareUrl,
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleLike = async () => {
    if (!detail || !engagement || !ensureAuthenticated()) {
      return;
    }
    setActionLoading('like');
    try {
      const result = await sharePostService.setLike(detail.share_id, !engagement.viewer_liked);
      setEngagement(result);
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : t('share.public.likeError'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFavorite = async () => {
    if (!detail || !engagement || !ensureAuthenticated()) {
      return;
    }
    setActionLoading('favorite');
    try {
      const result = await sharePostService.setFavorite(detail.share_id, !engagement.viewer_favorited);
      setEngagement(result);
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : t('share.public.favoriteError'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = engagement || (detail ? buildFallbackEngagement(detail) : null);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060608] px-6 text-white">
        <div className="glass-strong flex items-center gap-3 rounded-2xl border border-white/10 px-6 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary-300" />
          <span>{t('share.public.loading')}</span>
        </div>
      </div>
    );
  }

  if (!detail || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060608] px-6 text-white">
        <div className="glass-strong max-w-xl rounded-[28px] border border-white/10 p-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300/70">{t('share.public.badge')}</p>
          <h1 className="mt-4 text-2xl font-black text-white">{t('share.public.notFoundTitle')}</h1>
          <p className="mt-3 text-sm text-white/65">{t('share.public.notFoundDesc')}</p>
          <div className="mt-6 flex justify-center">
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              {t('share.public.backHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const imageUrl = detail.asset.preview_url || detail.asset.source_url;

  return (
    <div className="min-h-screen bg-[#060608] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_28%),linear-gradient(180deg,#07070b_0%,#09090d_100%)]" />
        <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/[0.08] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              {t('share.public.backHome')}
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
              >
                <Copy className="h-4 w-4" />
                {t('share.public.copy')}
              </button>
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500"
              >
                {actionLoading === 'share' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                {t('share.public.share')}
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_420px]">
            <div className="glass-strong overflow-hidden rounded-[32px] border border-white/10 shadow-[0_0_60px_rgba(168,85,247,0.08)]">
              <img src={imageUrl} alt={detail.title || detail.asset.file_name} className="h-full w-full object-cover" />
            </div>

            <div className="space-y-6">
              <div className="glass-strong rounded-[32px] border border-white/10 p-7 shadow-[0_0_40px_rgba(249,115,22,0.08)]">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary-300/70">{t('share.public.badge')}</p>
                <h1 className="mt-4 text-3xl font-black leading-tight text-white">{detail.title || detail.asset.file_name || t('share.public.defaultTitle')}</h1>
                <p className="mt-3 text-sm leading-7 text-white/70">{detail.caption || t('share.public.defaultCaption')}</p>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <StatCard label={t('share.public.views')} value={stats.view_count} />
                  <StatCard label={t('share.public.likes')} value={stats.like_count} />
                  <StatCard label={t('share.public.favorites')} value={stats.favorite_count} />
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleLike}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      stats.viewer_liked
                        ? 'border-rose-400/30 bg-rose-500/15 text-rose-100'
                        : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {actionLoading === 'like' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                    {stats.viewer_liked ? t('share.public.liked') : t('share.public.like')}
                  </button>
                  <button
                    type="button"
                    onClick={handleFavorite}
                    className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                      stats.viewer_favorited
                        ? 'border-amber-400/30 bg-amber-500/15 text-amber-100'
                        : 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {actionLoading === 'favorite' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bookmark className="h-4 w-4" />}
                    {stats.viewer_favorited ? t('share.public.saved') : t('share.public.save')}
                  </button>
                  <a
                    href={detail.asset.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                    {t('share.public.openAsset')}
                  </a>
                </div>
              </div>

              <div className="glass rounded-[28px] border border-white/10 p-6">
                <h2 className="text-lg font-black text-white">{t('share.public.reuseTitle')}</h2>
                <p className="mt-2 text-sm text-white/65">{t('share.public.reuseDesc')}</p>
                <div className="mt-4 grid gap-3">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    <span className="truncate">{shareUrl}</span>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/38">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
