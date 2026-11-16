import { useEffect } from 'react';
import { hydrateStoreFromSession } from '../../lib/store';

/** Hydrates demo state from sessionStorage after React hydration (avoids SSR mismatch). */
export default function StoreHydrator() {
  useEffect(() => {
    hydrateStoreFromSession();
  }, []);
  // Stable host — returning null can leave Astro islands with an empty React root.
  return <div id="br-store-hydrator" hidden aria-hidden="true" />;
}
