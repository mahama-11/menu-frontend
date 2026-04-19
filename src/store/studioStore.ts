import { create } from 'zustand';
import type { 
  StudioAsset, 
  StylePreset, 
  GenerationJob,
} from '@/types/studio';

// ==================== Asset Store ====================

interface AssetStoreState {
  assets: StudioAsset[];
  selectedAssetId: string | null;
  loading: boolean;
  
  setAssets: (assets: StudioAsset[]) => void;
  addAsset: (asset: StudioAsset) => void;
  selectAsset: (id: string | null) => void;
}

export const useAssetStore = create<AssetStoreState>((set) => ({
  assets: [],
  selectedAssetId: null,
  loading: false,
  
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((state) => ({ assets: [asset, ...state.assets] })),
  selectAsset: (id) => set({ selectedAssetId: id })
}));

// ==================== Style Preset Store ====================

interface StylePresetStoreState {
  presets: StylePreset[];
  selectedPresetId: string | null;
  loading: boolean;
  
  // Search & Filter
  searchQuery: string;
  selectedTags: string[];
  selectedDimensions: string[];
  
  setPresets: (presets: StylePreset[]) => void;
  selectPreset: (id: string | null) => void;
  setFilters: (filters: { query?: string; tags?: string[]; dimensions?: string[] }) => void;
}

export const useStylePresetStore = create<StylePresetStoreState>((set) => ({
  presets: [],
  selectedPresetId: null,
  loading: false,
  
  searchQuery: '',
  selectedTags: [],
  selectedDimensions: [],
  
  setPresets: (presets) => set({ presets }),
  selectPreset: (id) => set({ selectedPresetId: id }),
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
}

export const useGenerationJobStore = create<GenerationJobStoreState>((set) => ({
  jobs: [],
  activeJobId: null,
  loading: false,
  pollingJobs: new Set(),
  
  setJobs: (jobs) => set({ jobs }),
  upsertJob: (newJob) => set((state) => {
    const exists = state.jobs.some(j => j.job_id === newJob.job_id);
    if (exists) {
      return { jobs: state.jobs.map(j => j.job_id === newJob.job_id ? newJob : j) };
    }
    return { jobs: [newJob, ...state.jobs] };
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
  })
}));

// ==================== Variant Selection Store ====================

interface VariantSelectionStoreState {
  selectedVariantId: string | null;
  comparisonMode: boolean; // Before/After view
  
  selectVariant: (id: string | null) => void;
  toggleComparisonMode: () => void;
}

export const useVariantSelectionStore = create<VariantSelectionStoreState>((set) => ({
  selectedVariantId: null,
  comparisonMode: false,
  
  selectVariant: (id) => set({ selectedVariantId: id }),
  toggleComparisonMode: () => set((state) => ({ comparisonMode: !state.comparisonMode }))
}));
