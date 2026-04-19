/**
 * StyleSelector Component
 *
 * 风格选择器 - 支持分类筛选、搜索、预览
 */

import React, { useEffect, useState } from 'react';
import { Search, Sparkles, Star, ChevronRight, Flame, Clock, TrendingUp } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useStyleStore } from '@/store/styleStore';
import type { Style, StyleCategory, StylePreset } from '@/types/style';

interface StyleSelectorProps {
  selectedStyleId?: string;
  onSelect: (style: Style) => void;
  showFeatured?: boolean;
}

const CATEGORY_ICONS: Record<StyleCategory, string> = {
  cuisine: '🍜',
  scene: '📸',
  mood: '✨',
  platform: '📱',
  custom: '🎨'
};

const CATEGORY_LABELS: Record<StyleCategory, string> = {
  cuisine: '菜系风格',
  scene: '场景风格',
  mood: '氛围风格',
  platform: '平台适配',
  custom: '自定义'
};

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyleId,
  onSelect,
  showFeatured = true
}) => {
  const { t } = useI18n();
  const {
    presets,
    selectedStyleId: storeSelectedId,
    presetsLoading,
    fetchPresets,
    selectStyle
  } = useStyleStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<StyleCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'newest'>('featured');

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // 筛选风格
  const filteredPresets = presets.filter(preset => {
    const matchesCategory = activeCategory === 'all' || preset.category === activeCategory;
    const matchesSearch = !searchQuery ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 排序
  const sortedPresets = [...filteredPresets].sort((a, b) => {
    if (sortBy === 'featured') {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.order - b.order;
    }
    if (sortBy === 'popular') {
      return b.usage_count - a.usage_count;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleSelect = (preset: StylePreset) => {
    selectStyle(preset.style_id);
    onSelect(preset);
  };

  const currentSelectedId = selectedStyleId || storeSelectedId;

  return (
    <div className="space-y-6">
      {/* 标题区域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {t('style.selector.title') || '选择加工风格'}
            </h3>
            <p className="text-xs text-gray-400">
              {t('style.selector.subtitle') || '选择一种风格来加工您的图片'}
            </p>
          </div>
        </div>

        {/* 排序选项 */}
        <div className="flex items-center gap-1 glass rounded-lg p-1">
          {[
            { key: 'featured', icon: Star, label: t('style.sort.featured') || '推荐' },
            { key: 'popular', icon: TrendingUp, label: t('style.sort.popular') || '热门' },
            { key: 'newest', icon: Clock, label: t('style.sort.newest') || '最新' }
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key as typeof sortBy)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                sortBy === key
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('style.search.placeholder') || '搜索风格...'}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/50 transition"
        />
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeCategory === 'all'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'glass text-gray-400 hover:text-white'
          }`}
        >
          {t('style.category.all') || '全部'}
        </button>
        {(Object.keys(CATEGORY_LABELS) as StyleCategory[]).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeCategory === category
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            <span>{CATEGORY_ICONS[category]}</span>
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* 推荐风格 (Featured) */}
      {showFeatured && sortBy === 'featured' && activeCategory === 'all' && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-white">
              {t('style.featured.title') || '推荐风格'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPresets
              .filter(p => p.is_featured)
              .slice(0, 3)
              .map((preset) => (
                <StyleCard
                  key={preset.style_id}
                  preset={preset}
                  isSelected={currentSelectedId === preset.style_id}
                  onClick={() => handleSelect(preset)}
                  featured
                />
              ))}
          </div>
        </div>
      )}

      {/* 所有风格 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">
            {t('style.all.title') || '所有风格'}
          </span>
          <span className="text-xs text-gray-500">
            {sortedPresets.length} {t('style.count') || '个风格'}
          </span>
        </div>

        {presetsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-4 animate-pulse">
                <div className="h-32 bg-white/5 rounded-lg mb-3" />
                <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedPresets.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-400 text-sm">
              {t('style.empty.title') || '没有找到匹配的风格'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {t('style.empty.desc') || '尝试其他搜索词或分类'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPresets.map((preset) => (
              <StyleCard
                key={preset.style_id}
                preset={preset}
                isSelected={currentSelectedId === preset.style_id}
                onClick={() => handleSelect(preset)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== StyleCard 子组件 ====================

interface StyleCardProps {
  preset: StylePreset;
  isSelected: boolean;
  onClick: () => void;
  featured?: boolean;
}

const StyleCard: React.FC<StyleCardProps> = ({
  preset,
  isSelected,
  onClick,
  featured
}) => {
  const { t, lang } = useI18n();

  const displayName = lang === 'en' && preset.name_en
    ? preset.name_en
    : preset.name;

  return (
    <button
      onClick={onClick}
      className={`group relative text-left rounded-xl overflow-hidden transition-all duration-300 ${
        isSelected
          ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-[#060608]'
          : 'hover:scale-[1.02]'
      } ${featured ? 'glass-strong' : 'glass'}`}
    >
      {/* 预览图区域 */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        {preset.preview_url ? (
          <img
            src={preset.preview_url}
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">{CATEGORY_ICONS[preset.category]}</span>
          </div>
        )}

        {/* 选中状态 */}
        {isSelected && (
          <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Featured 标签 */}
        {preset.is_featured && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full bg-orange-500/80 text-white text-xs font-medium flex items-center gap-1">
              <Star className="w-3 h-3" />
              {t('style.badge.featured') || '推荐'}
            </span>
          </div>
        )}

        {/* 使用次数 */}
        <div className="absolute bottom-2 right-2">
          <span className="px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
            {preset.usage_count.toLocaleString()} {t('style.usage') || '次使用'}
          </span>
        </div>
      </div>

      {/* 信息区域 */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-white text-sm mb-1">
              {displayName}
            </h4>
            <div className="flex flex-wrap gap-1">
              {preset.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-white/5 text-gray-400 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-primary-400 transition-colors flex-shrink-0" />
        </div>

        {/* 评分 */}
        {preset.rating && (
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-400">
              {preset.rating.toFixed(1)} ({preset.rating_count})
            </span>
          </div>
        )}
      </div>
    </button>
  );
};
