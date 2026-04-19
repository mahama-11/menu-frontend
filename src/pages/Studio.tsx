import { useEffect } from 'react';
import { useStylePresetStore } from '@/store/studioStore';
import { stylePresetService } from '@/services/studio';

import StudioLayout from './studio/StudioLayout';

export default function Studio() {
  const { setPresets, presets } = useStylePresetStore();

  // Load initial styles on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const { presets } = await stylePresetService.listPresets();
        setPresets(presets);
      } catch (err) {
        console.error('Failed to load presets:', err);
      }
    }
    
    if (presets.length === 0) {
      loadInitialData();
    }
  }, [presets.length, setPresets]);

  return <StudioLayout />;
}
