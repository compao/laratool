import { ref, computed } from 'vue';
import fr from './locales/fr';
import en from './locales/en';

const messages = {
  fr,
  en
};

export const availableLocales = [
  { code: 'fr', name: 'Français', flag: '🇫🇷', short: 'FR' },
  { code: 'en', name: 'English', flag: '🇬🇧', short: 'EN' }
];

// Read initial locale from localStorage or system language
function getInitialLocale() {
  try {
    const saved = localStorage.getItem('laratool_locale');
    if (saved && messages[saved]) {
      return saved;
    }
    const navLang = navigator.language?.slice(0, 2)?.toLowerCase();
    if (navLang && messages[navLang]) {
      return navLang;
    }
  } catch (e) {
    console.warn('Error reading locale preference:', e);
  }
  return 'fr';
}

const currentLocale = ref(getInitialLocale());

/**
 * Nested key lookup with parameter interpolation:
 * t('sidebar.dashboard')
 * t('header.downloading', { item: 'PHP 8.3' })
 */
export function t(path, params = {}) {
  const loc = currentLocale.value;
  const dict = messages[loc] || messages.fr;
  
  let val = resolvePath(dict, path);
  
  // Fallback to French if missing in current locale
  if (val === undefined && loc !== 'fr') {
    val = resolvePath(messages.fr, path);
  }

  // If still not found, return the path key itself
  if (val === undefined) {
    return path;
  }

  if (typeof val !== 'string') {
    return val;
  }

  // Interpolate {paramName}
  return val.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

function resolvePath(obj, path) {
  if (!obj || !path) return undefined;
  const segments = path.split('.');
  let current = obj;
  for (const seg of segments) {
    if (current && typeof current === 'object' && seg in current) {
      current = current[seg];
    } else {
      return undefined;
    }
  }
  return current;
}

export function setLocale(newLocale) {
  if (messages[newLocale]) {
    currentLocale.value = newLocale;
    try {
      localStorage.setItem('laratool_locale', newLocale);
      // Also update electron config if available
      if (window.laratool?.config?.save) {
        window.laratool.config.save({ locale: newLocale }).catch(() => {});
      }
    } catch (e) {}
  }
}

export function useI18n() {
  return {
    t,
    locale: currentLocale,
    setLocale,
    availableLocales
  };
}

export const i18nPlugin = {
  install(app) {
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$locale = currentLocale;
    app.config.globalProperties.$setLocale = setLocale;
    app.provide('i18n', {
      t,
      locale: currentLocale,
      setLocale,
      availableLocales
    });
  }
};

export default i18nPlugin;
