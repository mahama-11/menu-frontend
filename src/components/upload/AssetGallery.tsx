/**
 * AssetGallery Component
 *
 * 资产库网格展示组件 - 支持筛选、选择、预览、无限滚动
 */

import React, { useEffect, useRef } from 'react';
import { Image, Check, Trash2, ExternalLink, Loader2, Filter } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import type { Asset, AssetFilter, AssetType } from '@/types/upload';

interface AssetGalleryProps {
  assets: Asset[];
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onDelete?: (asset: Asset) => void;
  onPreview?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  filter?: AssetFilter;
  onFilterChange?: (filter: AssetFilter) => void;
  emptyAction?: React.ReactNode;
}

const typeLabels: Record<AssetType, string> = {
  original: 'Original',
  menu: 'Menu',
  social: 'Social',
  enhanced: 'Enhanced',
  qr: 'QR'
};

const typeColors: Record<AssetType, string> = {
  original: 'bg-blue-500/20 text-blue-400',
  menu: 'bg-green-500/20 text-green-400',
  social: 'bg-purple-500/20 text-purple-400',
  enhanced: 'bg-orange-500/20 text-orange-400',
  qr: 'bg-pink-500/20 text-pink-400'
};

export const AssetGallery: React.FC<AssetGalleryProps> = ({
  assets,
  selectedIds = [],
  onSelect,
  onDelete,
  onPreview,
  onEdit,
  loading,
  hasMore,
  onLoadMore,
  filter,
  onFilterChange,
  emptyAction
}) => {
  const { t } = useI18n();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 无限滚动
  useEffect(() => {
    if (!hasMore || !onLoadMore || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, onLoadMore, loading]);

  const handleSelect = (assetId: string) => {
    if (!onSelect) return;
    
    const newSelected = selectedIds.includes(assetId)
      ? selectedIds.filter(id => id !== assetId)
      : [...selectedIds, assetId];
    onSelect(newSelected);
  };

  const handleSelectAll = () => {
    if (!onSelect) return;
    
    if (selectedIds.length === assets.length) {
      onSelect([]);
    } else {
      onSelect(assets.map(a => a.asset_id));
    }
  };

  // 空状态
  if (assets.length === 0 && !loading) {
    return (
      <div className="glass rounded-2xl p-12 text-center border border-dashed border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Image className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {t('gallery.empty.title') || 'No assets yet'}
        </h3>
        <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
          {t('gallery.empty.desc') || 'Upload your first image to get started with AI menu generation.'}
        </p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      {onFilterChange && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">
              {t('gallery.filter') || 'Filter'}:
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onFilterChange({ ...filter, type: undefined })}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${!filter?.type 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }
              `}
            >
              {t('gallery.all') || 'All'}
            </button>
            
            {(['original', 'menu', 'social', 'enhanced'] as AssetType[]).map(type => (
              <button
                key={type}
                onClick={() => onFilterChange({ ...filter, type })}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition
                  ${filter?.type === type
                    ? typeColors[type]
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }
                `}
              >
                {t(`gallery.type.${type}`) || typeLabels[type]}
              </button>
            ))}
          </div>

          {/* 全选 */}
          {onSelect && assets.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                {selectedIds.length === assets.length
                  ? t('gallery.deselectAll') || 'Deselect all'
                  : t('gallery.selectAll') || 'Select all'
                }
              </button>
              {selectedIds.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400 text-xs">
                  {selectedIds.length} {t('gallery.selected') || 'selected'}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 资产网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {assets.map((asset) => {
          const isSelected = selectedIds.includes(asset.asset_id);
          
          return (
            <div
              key={asset.asset_id}
              className={`
                group relative aspect-square rounded-xl overflow-hidden
                border-2 transition-all duration-200 cursor-pointer
                ${isSelected 
                  ? 'border-primary-500 shadow-lg shadow-primary-500/20' 
                  : 'border-transparent hover:border-white/20'
                }
              `}
              onClick={() => onPreview?.(asset)}
            >
              {/* 图片 */}
              <img
                src={asset.thumbnail || asset.url}
                alt={asset.filename}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* 遮罩层 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                {/* 选中框 */}
                {onSelect && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(asset.asset_id);
                    }}
                    className={`
                      absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center
                      transition border-2
                      ${isSelected
                        ? 'bg-primary-500 border-primary-500'
                        : 'bg-black/50 border-white/30 hover:border-white'
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                )}

                {/* 操作按钮 */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(asset);
                      }}
                      className="p-2 rounded-lg bg-black/50 hover:bg-primary-500 text-white transition"
                      title={t('gallery.edit') || 'Edit'}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(asset);
                      }}
                      className="p-2 rounded-lg bg-black/50 hover:bg-red-500 text-white transition"
                      title={t('gallery.delete') || 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 底部信息 */}
                <div className="absolute bottom-0 inset-x-0 p-3">
                  <p className="text-xs text-white truncate mb-1">
                    {asset.filename}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${typeColors[asset.type]}`}>
                      {t(`gallery.type.${asset.type}`) || typeLabels[asset.type]}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {asset.width}×{asset.height}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI 处理标记 */}
              {asset.metadata?.aiProcessed && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-orange-500/80 text-white text-[10px] font-medium">
                  AI
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 加载更多 */}
      {(hasMore || loading) && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">{t('gallery.loading') || 'Loading...'}</span>
            </div>
          ) : hasMore ? (
            <div className="h-8" /> // 触发观察的占位符
          ) : null}
        </div>
      )}
    </div>
  );
};
