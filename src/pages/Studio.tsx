import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStylePresetStore } from '@/store/studioStore';
import { stylePresetService } from '@/services/studio';
import { useAuthStore } from '@/store/authStore';

import StudioLayout from './studio/StudioLayout';

export default function Studio() {
  const { setPresets, presets } = useStylePresetStore();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const location = useLocation();

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

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#060608]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div>;
  }

  return <StudioLayout />;
}
