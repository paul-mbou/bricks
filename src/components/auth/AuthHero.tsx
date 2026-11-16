import { useI18n } from '../../lib/i18n/useI18n';

const pillars = [
  { titleKey: 'auth.pillarStocks', bodyKey: 'auth.pillarStocksBody', icon: 'package' as const },
  { titleKey: 'auth.pillarProd', bodyKey: 'auth.pillarProdBody', icon: 'factory' as const },
  { titleKey: 'auth.pillarProfit', bodyKey: 'auth.pillarProfitBody', icon: 'chart' as const },
];

export default function AuthHero() {
  const { t } = useI18n();

  return (
    <>
      <div className="relative z-10 min-h-0">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-clay-500/20 ring-1 ring-clay-300/30">
            <svg className="size-5 text-clay-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M12 9v6" />
              <path d="M16 15v6" />
              <path d="M16 3v6" />
              <path d="M3 15h18" />
              <path d="M3 9h18" />
              <path d="M8 15v6" />
              <path d="M8 3v6" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-clay-300 uppercase">{t('brand.name')}</p>
            <p className="text-xs text-white/45">{t('brand.tagline')}</p>
          </div>
        </div>

        <h1 className="mt-6 max-w-md text-3xl font-extrabold tracking-tight text-balance xl:text-4xl">
          {t('auth.heroTitle')}
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">{t('auth.heroBody')}</p>

        <ul className="mt-6 space-y-2">
          {pillars.map((pillar) => (
            <li key={pillar.titleKey} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-clay-400/15 text-clay-300">
                {pillar.icon === 'package' && (
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
                    <path d="M12 22V12" />
                    <polyline points="3.29 7 12 12 20.71 7" />
                  </svg>
                )}
                {pillar.icon === 'factory' && (
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  </svg>
                )}
                {pillar.icon === 'chart' && (
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-white/95">{t(pillar.titleKey)}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/50">{t(pillar.bodyKey)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-4 min-h-0 shrink">
        <img
          src="/auth-yard.svg"
          alt=""
          width="560"
          height="420"
          className="mx-auto h-[min(28vh,220px)] w-full max-w-sm object-contain opacity-95"
          decoding="async"
        />
        <p className="mt-2 text-center text-xs text-slate-500">{t('auth.footerMeta')}</p>
      </div>
    </>
  );
}
