import { en, type Messages } from './messages/en';
import { fr } from './messages/fr';
import type { Locale, TranslateFn } from './types';

export type { Locale, Messages, TranslateFn };

const STORAGE_KEY = 'br-locale';
const catalogs: Record<Locale, Messages> = { en, fr };

let currentLocale: Locale | null = null;
const listeners = new Set<(locale: Locale) => void>();

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of candidates) {
    const code = String(raw || '')
      .toLowerCase()
      .slice(0, 2);
    if (code === 'fr') return 'fr';
    if (code === 'en') return 'en';
  }
  return 'en';
}

export function getLocale(): Locale {
  if (currentLocale) return currentLocale;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fr') {
      currentLocale = stored;
      return stored;
    }
  }
  currentLocale = detectBrowserLocale();
  return currentLocale;
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.cookie = `${STORAGE_KEY}=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`;
  }
  listeners.forEach((fn) => fn(locale));
}

/** SSR / Astro: cookie override, else Accept-Language, else English. */
export function localeFromRequest(request: Request): Locale {
  const cookie = request.headers.get('cookie') ?? '';
  const match = new RegExp(`(?:^|;\\s*)${STORAGE_KEY}=(en|fr)(?:;|$)`).exec(cookie);
  if (match?.[1] === 'en' || match?.[1] === 'fr') return match[1];
  const header = request.headers.get('accept-language') ?? '';
  for (const part of header.split(',')) {
    const code = part.trim().toLowerCase().slice(0, 2);
    if (code === 'fr') return 'fr';
    if (code === 'en') return 'en';
  }
  return 'en';
}

export function subscribeLocale(listener: (locale: Locale) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function intlLocale(locale: Locale = getLocale()): string {
  return locale === 'fr' ? 'fr-FR' : 'en-CM';
}

function lookup(tree: Messages, key: string): string | undefined {
  const parts = key.split('.');
  let node: unknown = tree;
  for (const part of parts) {
    if (!node || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function t(key: string, params?: Record<string, string | number>, locale = getLocale()): string {
  const raw = lookup(catalogs[locale], key) ?? lookup(catalogs.en, key) ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

export const translate: TranslateFn = (key, params) => t(key, params);

export function formatNumber(value: number, locale = getLocale()) {
  return value.toLocaleString(intlLocale(locale));
}

export function formatDateTime(value: string | number | Date, locale = getLocale()) {
  return new Date(value).toLocaleString(intlLocale(locale));
}

/** Inline boot for Astro layouts — runs before paint; syncs cookie for SSR titles. */
export const LOCALE_BOOT_SCRIPT = `(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var lang=(s==='en'||s==='fr')?s:((navigator.language||'en').toLowerCase().indexOf('fr')===0?'fr':'en');document.documentElement.lang=lang;document.cookie='${STORAGE_KEY}='+lang+'; Path=/; SameSite=Lax; Max-Age=31536000';}catch(e){document.documentElement.lang='en';}})();`;
