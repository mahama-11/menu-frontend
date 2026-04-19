import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import zh from './zh.json';
import th from './th.json';
import { DEFAULT_LANGUAGE, getStoredLanguage } from '@/lib/language';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      th: { translation: th },
    },
    lng: getStoredLanguage() || DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18n;
