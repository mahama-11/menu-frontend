import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLanguage, persistLanguage } from '@/lib/language';

export function useI18n() {
  const { t, i18n } = useTranslation();

  const setLang = useCallback((lang: string) => {
    const normalized = persistLanguage(lang);
    void i18n.changeLanguage(normalized);
  }, [i18n]);

  return {
    t,
    lang: normalizeLanguage(i18n.language),
    setLang,
  };
}
