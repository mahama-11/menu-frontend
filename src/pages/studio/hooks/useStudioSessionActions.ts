import { useAssetStore, useGenerationJobStore, useVariantSelectionStore } from '@/store/studioStore';
import type { StudioAsset } from '@/types/studio';
import { getStudioAssetDisplayUrl } from '@/utils/studioAsset';

export function useStudioSessionActions() {
  const {
    addAsset,
    removeAsset,
    selectAsset,
    selectedAssetId,
    setInputMode,
    resetAssetSession,
  } = useAssetStore();
  const {
    activeJobId,
    stopPolling,
    clearActiveJob,
  } = useGenerationJobStore();
  const { resetVariantSelection } = useVariantSelectionStore();

  const clearJobContext = () => {
    if (activeJobId) {
      stopPolling(activeJobId);
    }
    resetVariantSelection();
    clearActiveJob();
  };

  const reuseResultAsBase = (asset: StudioAsset) => {
    const displayUrl = getStudioAssetDisplayUrl(asset);
    addAsset({
      ...asset,
      display_url: displayUrl || asset.display_url,
    });
    selectAsset(asset.asset_id);
    setInputMode('image_to_image');
    clearJobContext();
  };

  const resetToCurrentBase = () => {
    clearJobContext();
    setInputMode('image_to_image');
  };

  const removeCurrentBaseAsset = () => {
    if (selectedAssetId) {
      removeAsset(selectedAssetId);
    }
    clearJobContext();
  };

  const resetStudioSession = () => {
    clearJobContext();
    resetAssetSession();
  };

  return {
    clearJobContext,
    reuseResultAsBase,
    resetToCurrentBase,
    removeCurrentBaseAsset,
    resetStudioSession,
  };
}
