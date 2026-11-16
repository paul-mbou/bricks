import { useEffect, useState } from 'react';
import {
  formatDateTime,
  formatNumber,
  getLocale,
  intlLocale,
  setLocale,
  subscribeLocale,
  t,
  type Locale,
} from './index';

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());

  useEffect(() => subscribeLocale(setLocaleState), []);

  return {
    locale,
    setLocale,
    t: (key: string, params?: Record<string, string | number>) => t(key, params, locale),
    formatNumber: (value: number) => formatNumber(value, locale),
    formatDateTime: (value: string | number | Date) => formatDateTime(value, locale),
    intlLocale: intlLocale(locale),
  };
}
