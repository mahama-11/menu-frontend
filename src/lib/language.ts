export const LANGUAGE_STORAGE_KEY = 'menu_lang';
export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = new Set(['en', 'zh', 'th']);

export function normalizeLanguage(lang?: string | null): string {
  if (!lang) return DEFAULT_LANGUAGE;
  return SUPPORTED_LANGUAGES.has(lang) ? lang : DEFAULT_LANGUAGE;
}

export function getStoredLanguage(): string | null {
  const value = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return value ? normalizeLanguage(value) : null;
}

export function persistLanguage(lang: string): string {
  const normalized = normalizeLanguage(lang);
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  return normalized;
}
