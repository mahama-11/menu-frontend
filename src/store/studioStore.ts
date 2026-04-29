import { create } from 'zustand';
import type { 
  StudioAsset, 
  StylePreset, 
  StudioCreativeSource,
  GenerationJob,
  StudioInputMode,
} from '@/types/studio';
import type { TemplateStudioLaunchPayload } from '@/types/templateCenter';
import { buildTemplateCreativeSource, creativeSourceKey } from '@/utils/studioCreativeSource';

function mergeGenerationJobDisplayState(current: GenerationJob, incoming: GenerationJob): GenerationJob {
  const variants = (incoming.variants || []).map((variant) => {
    const existingVariant = (current.variants || []).find((item) => item.variant_id === variant.variant_id);
    if (!existingVariant?.asset) {
      return variant;
    }
    return {
      ...variant,
      asset: variant.asset
        ? {
            ...existingVariant.asset,
            ...variant.asset,
            display_url: variant.asset.display_url || existingVariant.asset.display_url,
          }
        : existingVariant.asset,
    };
  });

  return {
    ...current,
    ...incoming,
    variants,
  };
}

// ==================== Asset Store ====================

interface AssetStoreState {
  assets: StudioAsset[];
  selectedAssetId: string | null;
  inputMode: StudioInputMode;
  promptDraft: string;
  loading: boolean;
  
  setAssets: (assets: StudioAsset[]) => void;
  addAsset: (asset: StudioAsset) => void;
  removeAsset: (id: string) => void;
  selectAsset: (id: string | null) => void;
  setInputMode: (mode: StudioInputMode) => void;
  setPromptDraft: (prompt: string) => void;
  resetAssetSession: () => void;
}

export const useAssetStore = create<AssetStoreState>((set) => ({
  assets: [],
  selectedAssetId: null,
  inputMode: 'image_to_image',
  promptDraft: '',
  loading: false,
  
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((state) => {
    const existing = state.assets.find((item) => item.asset_id === asset.asset_id);
    const merged = existing
      ? {
          ...existing,
          ...asset,
          display_url: asset.display_url || existing.display_url,
        }
      : asset;
    const next = state.assets.filter((item) => item.asset_id !== asset.asset_id);
    return { assets: [merged, ...next] };
  }),
  removeAsset: (id) => set((state) => ({
    assets: state.assets.filter((asset) => asset.asset_id !== id),
    selectedAssetId: state.selectedAssetId === id ? null : state.selectedAssetId,
  })),
  selectAsset: (id) => set({ selectedAssetId: id }),
  setInputMode: (mode) => set((state) => ({
    inputMode: mode,
    selectedAssetId: mode === 'text_to_image' ? null : state.selectedAssetId,
  })),
  setPromptDraft: (prompt) => set({ promptDraft: prompt }),
  resetAssetSession: () => set({
    assets: [],
    selectedAssetId: null,
    inputMode: 'image_to_image',
    promptDraft: '',
  }),
}));

// ==================== Creative Source Store ====================

interface StylePresetStoreState {
  presets: StylePreset[];
  officialTemplates: StudioCreativeSource[];
  selectedSourceKey: string | null;
  loading: boolean;
  officialTemplatesLoading: boolean;
  
  // Search & Filter
  searchQuery: string;
  selectedTags: string[];
  selectedDimensions: string[];
  
  setPresets: (presets: StylePreset[]) => void;
  upsertOfficialTemplate: (payload: TemplateStudioLaunchPayload) => void;
  setOfficialTemplates: (items: StudioCreativeSource[]) => void;
  setOfficialTemplatesLoading: (loading: boolean) => void;
  clearOfficialTemplates: () => void;
  selectPreset: (id: string | null) => void;
  selectOfficialTemplate: (id: string | null) => void;
  selectSourceByKey: (key: string | null) => void;
  clearSelectedSource: () => void;
  setFilters: (filters: { query?: string; tags?: string[]; dimensions?: string[] }) => void;
}

export const useStylePresetStore = create<StylePresetStoreState>((set) => ({
  presets: [],
  officialTemplates: [],
  selectedSourceKey: null,
  loading: false,
  officialTemplatesLoading: false,
  
  searchQuery: '',
  selectedTags: [],
  selectedDimensions: [],
  
  setPresets: (presets) => set({ presets }),
  upsertOfficialTemplate: (payload) => set((state) => {
    const item = buildTemplateCreativeSource(payload);
    const others = state.officialTemplates.filter((current) => current.source_id !== item.source_id);
    return {
      officialTemplates: [item, ...others],
      selectedSourceKey: creativeSourceKey(item.source_type, item.source_id),
    };
  }),
  setOfficialTemplates: (items) => set((state) => {
    const hydratedById = new Map(
      state.officialTemplates
        .filter((item) => item.is_hydrated)
        .map((item) => [item.source_id, item]),
    );
    return {
      officialTemplates: items.map((item) => hydratedById.get(item.source_id) || item),
    };
  }),
  setOfficialTemplatesLoading: (loading) => set({ officialTemplatesLoading: loading }),
  clearOfficialTemplates: () => set({ officialTemplates: [] }),
  selectPreset: (id) => set({ selectedSourceKey: id ? creativeSourceKey('style_preset', id) : null }),
  selectOfficialTemplate: (id) => set({ selectedSourceKey: id ? creativeSourceKey('template', id) : null }),
  selectSourceByKey: (key) => set({ selectedSourceKey: key }),
  clearSelectedSource: () => set({ selectedSourceKey: null }),
  setFilters: (filters) => set((state) => ({
    searchQuery: filters.query ?? state.searchQuery,
    selectedTags: filters.tags ?? state.selectedTags,
    selectedDimensions: filters.dimensions ?? state.selectedDimensions
  }))
}));

// ==================== Generation Job Store ====================

interface GenerationJobStoreState {
  jobs: GenerationJob[];
  activeJobId: string | null;
  loading: boolean;
  
  // Actions
  setJobs: (jobs: GenerationJob[]) => void;
  upsertJob: (job: GenerationJob) => void;
  setActiveJob: (id: string | null) => void;
  
  // Polling management (simplified for example)
  pollingJobs: Set<string>;
  startPolling: (jobId: string) => void;
  stopPolling: (jobId: string) => void;
  clearActiveJob: () => void;
}

export const useGenerationJobStore = create<GenerationJobStoreState>((set) => ({
  jobs: [],
  activeJobId: null,
  loading: false,
  pollingJobs: new Set(),
  
  setJobs: (jobs) => set({ jobs }),
  upsertJob: (newJob) => set((state) => {
    const current = state.jobs.find(j => j.job_id === newJob.job_id);
    const mergedJob = current ? mergeGenerationJobDisplayState(current, newJob) : newJob;
    const exists = state.jobs.some(j => j.job_id === newJob.job_id);
    if (exists) {
      return { jobs: state.jobs.map(j => j.job_id === newJob.job_id ? mergedJob : j) };
    }
    return { jobs: [mergedJob, ...state.jobs] };
  }),
  setActiveJob: (id) => set({ activeJobId: id }),
  
  startPolling: (jobId) => set((state) => {
    const newSet = new Set(state.pollingJobs);
    newSet.add(jobId);
    return { pollingJobs: newSet };
  }),
  stopPolling: (jobId) => set((state) => {
    const newSet = new Set(state.pollingJobs);
    newSet.delete(jobId);
    return { pollingJobs: newSet };
  }),
  clearActiveJob: () => set({ activeJobId: null })
}));

// ==================== Variant Selection Store ====================

interface VariantSelectionStoreState {
  selectedVariantId: string | null;
  comparisonMode: boolean; // Before/After view
  
  selectVariant: (id: string | null) => void;
  resetVariantSelection: () => void;
  toggleComparisonMode: () => void;
}

export const useVariantSelectionStore = create<VariantSelectionStoreState>((set) => ({
  selectedVariantId: null,
  comparisonMode: false,
  
  selectVariant: (id) => set({ selectedVariantId: id }),
  resetVariantSelection: () => set({ selectedVariantId: null, comparisonMode: false }),
  toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode }))
}));
