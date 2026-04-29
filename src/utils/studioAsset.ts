import type { StudioAsset } from '@/types/studio';

function isLocalDisplayUrl(url?: string): boolean {
  return Boolean(url && (url.startsWith('blob:') || url.startsWith('data:')));
}

export function getStudioAssetDisplayUrl(asset?: StudioAsset | null): string | undefined {
  if (!asset) return undefined;
  if (asset.display_url) return asset.display_url;
  if (isLocalDisplayUrl(asset.preview_url)) return asset.preview_url;
  if (isLocalDisplayUrl(asset.url)) return asset.url;
  if (isLocalDisplayUrl(asset.source_url)) return asset.source_url;
  return undefined;
}
