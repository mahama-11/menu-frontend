import type { CommercialOrderView } from '@/types/commercial';

export type MenuPlanTier = 'basic' | 'pro' | 'growth';

export function deriveLatestSubscription(items: CommercialOrderView[]): CommercialOrderView | null {
  return [...items]
    .filter((item) => item.order?.status === 'fulfilled' && item.order?.package_type === 'subscription')
    .sort((a, b) => {
      const aTime = new Date(a.order?.fulfilled_at || a.order?.updated_at || a.order?.created_at || 0).getTime();
      const bTime = new Date(b.order?.fulfilled_at || b.order?.updated_at || b.order?.created_at || 0).getTime();
      return bTime - aTime;
    })[0] || null;
}

export function normalizeMenuPlan(value?: string | null): MenuPlanTier {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('growth') || normalized.includes('max')) return 'growth';
  if (normalized.includes('pro')) return 'pro';
  return 'basic';
}

export function deriveMenuPlanFromPackageCode(packageCode?: string | null): MenuPlanTier | null {
  const normalized = String(packageCode || '').trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('.growth.') || normalized.includes('.max.')) return 'growth';
  if (normalized.includes('.pro.')) return 'pro';
  if (normalized.includes('.basic.')) return 'basic';
  return null;
}

export function resolveEffectiveMenuPlan(packageCode?: string | null, fallbackPlan?: string | null): MenuPlanTier {
  return deriveMenuPlanFromPackageCode(packageCode) || normalizeMenuPlan(fallbackPlan);
}

export function formatMenuPlanLabel(planOrPackageCode?: string | null): string {
  switch (resolveEffectiveMenuPlan(planOrPackageCode, planOrPackageCode)) {
    case 'growth':
      return 'Growth';
    case 'pro':
      return 'Pro';
    default:
      return 'Basic';
  }
}
