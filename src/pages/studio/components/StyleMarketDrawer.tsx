import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStylePresetStore } from '@/store/studioStore';
import { Search, X, Sparkles, Filter, Check } from 'lucide-react';

interface StyleMarketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StyleMarketDrawer({ isOpen, onClose }: StyleMarketDrawerProps) {
  const { t } = useTranslation();
  const { presets, selectedPresetId, selectPreset } = useStylePresetStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const pool = new Set<string>();
    presets.forEach((preset) => {
      preset.tags?.forEach((tag) => pool.add(tag));
      preset.dimensions?.forEach((dimension) => pool.add(dimension.label || dimension.key));
    });
    return ['all', ...Array.from(pool).slice(0, 5)];
  }, [presets]);

  const filteredPresets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return presets.filter((preset) => {
      const matchesQuery = !normalizedQuery || [preset.name, preset.description || '', ...(preset.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);

      const presetLabels = [
        ...(preset.tags || []),
        ...(preset.dimensions || []).map((dimension) => dimension.label || dimension.key),
      ];
      const matchesCategory = category === 'all' || presetLabels.includes(category);
      return matchesQuery && matchesCategory;
    });
  }, [category, presets, query]);

  const selectedPreset = presets.find((preset) => preset.style_preset_id === selectedPresetId);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] z-50 bg-black/80 backdrop-blur-3xl border-l border-white/10 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/15 bg-purple-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-purple-200">
              <Sparkles className="h-3.5 w-3.5" />
              {t('studio.market.badge', { defaultValue: 'Style Market' })}
            </div>
            <h2 className="mt-3 text-2xl font-black text-white">{t('studio.market.title')}</h2>
            <p className="text-sm text-gray-400 mt-1">{t('studio.market.subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder={t('studio.market.search')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-400/25 focus:bg-white/[0.07] transition-all"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              {t('studio.market.categories', { defaultValue: 'Categories' })}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    category === item
                      ? 'bg-white/10 border border-purple-400/20 text-white shadow-[0_0_18px_rgba(139,92,246,0.12)]'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {item === 'all' ? t('studio.market.cat.all') : item}
                </button>
              ))}
            </div>
          </div>

          {selectedPreset && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t('studio.market.selected', { defaultValue: 'Selected style' })}</p>
              <div className="mt-3 flex items-center gap-3">
                <img src={selectedPreset.preview_url || `https://picsum.photos/seed/${selectedPreset.style_preset_id}/120/120`} alt={selectedPreset.name} className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{selectedPreset.name}</p>
                  <p className="mt-1 truncate text-xs text-gray-400">{selectedPreset.description || t('studio.market.selectedHint', { defaultValue: 'Ready to be used in your next generation.' })}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto h-[calc(100%-250px)] space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
          {filteredPresets.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8 text-center text-sm text-gray-400">
              {t('studio.market.empty', { defaultValue: 'No styles match this search yet.' })}
            </div>
          ) : (
            filteredPresets.map((preset, index) => (
              <button
                key={preset.style_preset_id}
                onClick={() => {
                  selectPreset(preset.style_preset_id);
                  onClose();
                }}
                className="interactive-panel interactive-panel-purple group relative w-full text-left overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] animate-slide-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={preset.preview_url || `https://picsum.photos/seed/${preset.style_preset_id}/400/300`}
                    alt={preset.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  {selectedPresetId === preset.style_preset_id && (
                    <div className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-[0_0_16px_rgba(249,115,22,0.45)]">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-white">{preset.name}</p>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-2">{preset.description || t('studio.market.cardFallback', { defaultValue: 'Designed for restaurant-friendly commercial outputs.' })}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {preset.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
