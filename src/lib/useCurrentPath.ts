import { useEffect, useState } from 'react';

function normalizePath(path: string) {
  return path.replace(/\/+$/, '') || '/';
}

/**
 * Keeps active route in sync across Astro ClientRouter soft navigations.
 * Initial state must match SSR (fallback prop) — reading window in useState
 * causes hydration mismatches that wipe React islands.
 */
export function useCurrentPath(fallback = '/app') {
  const [path, setPath] = useState(() => normalizePath(fallback));

  useEffect(() => {
    const sync = () => setPath(normalizePath(window.location.pathname));
    sync();
    document.addEventListener('astro:page-load', sync);
    document.addEventListener('astro:after-swap', sync);
    window.addEventListener('popstate', sync);
    return () => {
      document.removeEventListener('astro:page-load', sync);
      document.removeEventListener('astro:after-swap', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  return path;
}
