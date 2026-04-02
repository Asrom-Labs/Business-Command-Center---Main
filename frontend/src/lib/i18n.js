import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '@/locales/en/translation.json';
import arTranslations from '@/locales/ar/translation.json';

/**
 * BCC Internationalization System
 *
 * Language selection rules (strict priority order):
 *   1. User's explicit choice saved in localStorage → restored on return visits
 *   2. Default: English — regardless of browser, OS, or location
 *
 * The browser/OS language is intentionally NEVER read.
 */

/** All languages supported by BCC. */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English',  dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

/** localStorage key where the user's language choice is persisted. */
export const LANGUAGE_KEY = 'bcc_language';

/**
 * Version marker — increment this string any time we need to reset stored
 * language preferences for all existing users (e.g. after a broken migration).
 * When the stored version does not match CURRENT_VERSION, the key is cleared
 * and the user starts fresh in English.
 */
const I18N_VERSION_KEY = 'bcc_language_v';
const CURRENT_VERSION  = '2';

/**
 * Returns the language to use on startup.
 * Reads the user's previously saved choice from localStorage.
 * Falls back to 'en' if nothing is stored, the value is unrecognised,
 * or the version marker is stale (handles the LanguageDetector migration).
 */
function getStartupLanguage() {
  try {
    const version = localStorage.getItem(I18N_VERSION_KEY);
    const stored  = localStorage.getItem(LANGUAGE_KEY);
    const isKnown = SUPPORTED_LANGUAGES.some((l) => l.code === stored);

    // If this is an old install (no version marker) reset to English once.
    // This clears any 'ar' that was written by the old LanguageDetector.
    if (version !== CURRENT_VERSION) {
      localStorage.setItem(I18N_VERSION_KEY, CURRENT_VERSION);
      localStorage.removeItem(LANGUAGE_KEY);
      return 'en';
    }

    return isKnown ? stored : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Applies the correct `dir` and `lang` attributes to <html>.
 * Required for:
 *   - CSS [dir="rtl"] selectors to activate
 *   - Browser text-rendering to apply correct typography
 *   - Accessibility tools to announce the correct language
 */
export function applyLanguageDirection(langCode) {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
  document.documentElement.setAttribute('dir',  lang?.dir  ?? 'ltr');
  document.documentElement.setAttribute('lang', langCode   ?? 'en');
}

const startupLang = getStartupLanguage();

// Initialize — NO LanguageDetector plugin. Language is set explicitly via `lng`.
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
    },
    lng:           startupLang,
    fallbackLng:   'en',
    supportedLngs: ['en', 'ar'],
    interpolation: { escapeValue: false },
    react:         { useSuspense: true },
  });

// On every language change: persist the choice + update DOM direction
i18n.on('languageChanged', (code) => {
  try { localStorage.setItem(LANGUAGE_KEY, code); } catch { /* ignore */ }
  applyLanguageDirection(code);
});

// Apply direction immediately on module load (before any React component renders)
applyLanguageDirection(startupLang);

export default i18n;
