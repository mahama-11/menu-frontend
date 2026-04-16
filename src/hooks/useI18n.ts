import { useTranslation } from 'react-i18next';

export function useI18n() {
  const { t, i18n } = useTranslation();

  const setLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return {
    t,
    lang: i18n.language,
    setLang,
  };
}
