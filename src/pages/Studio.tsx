import { useEffect, useRef } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useStylePresetStore } from '@/store/studioStore';
import { useAssetStore } from '@/store/studioStore';
import { stylePresetService } from '@/services/studio';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useCommercialStore } from '@/store/commercialStore';
import { buildTemplateCatalogCreativeSource } from '@/utils/studioCreativeSource';
import { prepareStudioTemplateLaunch, templateCenterService } from '@/services/templateCenter';
import { useI18n } from '@/hooks/useI18n';
import type { TemplateStudioLaunchPayload } from '@/types/templateCenter';
import { useStudioJobPolling } from './studio/hooks/useStudioJobPolling';

import StudioLayout from './studio/StudioLayout';

export default function Studio() {
  useStudioJobPolling();

  const {
    setPresets,
    presets,
    officialTemplates,
    selectedSourceKey,
    upsertOfficialTemplate,
    setOfficialTemplates,
    setOfficialTemplatesLoading,
  } = useStylePresetStore();
  const { setPromptDraft, setInputMode } = useAssetStore();
  const { lang } = useI18n();
  const fetchDashboardData = useDashboardStore(state => state.fetchDashboardData);
  const fetchCommercialContext = useCommercialStore(state => state.fetchCommercialContext);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const location = useLocation();
  const navigate = useNavigate();
  const hydratedTemplateRef = useRef<string | null>(null);
  const hydratingTemplatesRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchDashboardData();
    void fetchCommercialContext();
  }, [fetchCommercialContext, fetchDashboardData, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let alive = true;
    async function loadOfficialTemplates() {
      setOfficialTemplatesLoading(true);
      try {
        const items = await templateCenterService.listCatalogs();
        if (!alive) return;
        setOfficialTemplates(items.map(buildTemplateCatalogCreativeSource));
      } catch (err) {
        console.error('Failed to load official templates:', err);
      } finally {
        if (alive) {
          setOfficialTemplatesLoading(false);
        }
      }
    }

    void loadOfficialTemplates();
    return () => {
      alive = false;
    };
  }, [isAuthenticated, setOfficialTemplates, setOfficialTemplatesLoading]);

  useEffect(() => {
    const payload = (location.state as { templateLaunch?: TemplateStudioLaunchPayload } | null)?.templateLaunch;
    if (!payload) return;

    const payloadKey = `${payload.templateId}:${payload.templateVersionId}:${payload.targetPlatform}`;
    if (hydratedTemplateRef.current === payloadKey) {
      return;
    }

    hydratedTemplateRef.current = payloadKey;
    setInputMode('image_to_image');
    setPromptDraft('');
    upsertOfficialTemplate(payload);

    navigate(location.pathname, {
      replace: true,
      state: {
        ...location.state,
        templateLaunch: undefined,
      },
    });
  }, [location.pathname, location.state, navigate, setInputMode, setPromptDraft, upsertOfficialTemplate]);

  useEffect(() => {
    if (!selectedSourceKey?.startsWith('template:')) return;
    const templateId = selectedSourceKey.slice('template:'.length);
    const selectedTemplate = officialTemplates.find((item) => item.source_id === templateId);
    if (!selectedTemplate || selectedTemplate.locked || selectedTemplate.is_hydrated || hydratingTemplatesRef.current.has(templateId)) {
      return;
    }

    hydratingTemplatesRef.current.add(templateId);
    void prepareStudioTemplateLaunch({
      templateId,
      targetPlatform: selectedTemplate.target_platform || selectedTemplate.available_platforms?.[0],
      language: lang,
    })
      .then((payload) => {
        upsertOfficialTemplate(payload);
        setInputMode('image_to_image');
        setPromptDraft('');
      })
      .catch((err) => {
        console.error('Failed to hydrate official template:', err);
      })
      .finally(() => {
        hydratingTemplatesRef.current.delete(templateId);
      });
  }, [lang, officialTemplates, selectedSourceKey, setInputMode, setPromptDraft, upsertOfficialTemplate]);

  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#060608]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" /></div>;
  }

  return <StudioLayout />;
}
