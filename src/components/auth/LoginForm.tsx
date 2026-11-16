import { BrickWall, Factory, Mail, Package, Sparkles, Wallet } from 'lucide-react';
import { useState } from 'react';
import { enterDemoSession, isAppwriteLive, isDemoEnabled, signIn } from '../../lib/auth';
import { useI18n } from '../../lib/i18n/useI18n';
import { restoreDemoAsOwner } from '../../lib/store';
import PasswordField from './PasswordField';

function safeNextPath() {
  try {
    const raw = new URLSearchParams(window.location.search).get('next');
    if (!raw || !raw.startsWith('/') || raw.startsWith('//') || !raw.startsWith('/app')) return '/app';
    return raw;
  } catch {
    return '/app';
  }
}

const emailFieldClass =
  'h-11 w-full rounded-xl border border-line bg-panel py-0 pr-4 pl-11 text-[0.9375rem] focus:border-clay-500 focus:ring-4 focus:ring-clay-400/25 focus-visible:outline-none';

export default function LoginForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const safeLoginError = (err: unknown) => {
    if (err instanceof Error && /démonstration|demonstration/i.test(err.message)) return err.message;
    return t('auth.errorGeneric');
  };

  const featureChips = [
    { labelKey: 'auth.chipStocks', Icon: Package },
    { labelKey: 'auth.chipProd', Icon: Factory },
    { labelKey: 'auth.chipPayroll', Icon: Wallet },
  ] as const;

  return (
    <div className="flex max-h-full flex-col justify-center">
      <div className="mb-4 flex items-center gap-3 lg:hidden">
        <span className="grid size-10 place-items-center rounded-2xl bg-clay-100 text-clay-600 dark:bg-clay-400/15 dark:text-clay-300">
          <BrickWall className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold tracking-[0.16em] text-clay-600 uppercase dark:text-clay-300">
            {t('brand.name')}
          </p>
          <p className="text-xs text-ink-mute">{t('brand.tagline')}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[1.5rem] border border-line bg-panel/90 p-5 shadow-card sm:p-6 dark:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{t('auth.title')}</h1>
            <p className="mt-1 text-sm text-ink-mute">
              {isAppwriteLive ? t('auth.liveHint') : t('auth.demoHint')}
            </p>
          </div>
          <span className="hidden size-11 shrink-0 place-items-center rounded-2xl bg-lime-400/20 text-slate-800 sm:grid dark:bg-lime-400/10 dark:text-lime-300">
            <BrickWall className="size-5" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-line/80 bg-slate-950 lg:hidden">
          <img
            src="/auth-yard.svg"
            alt=""
            width="560"
            height="420"
            className="h-20 w-full object-contain object-bottom px-2 pt-1"
            decoding="async"
          />
        </div>

        {isAppwriteLive && (
          <form
            className="mt-5 space-y-3.5"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError('');
              try {
                await signIn(email, password);
                window.location.href = safeNextPath();
              } catch (err) {
                setError(safeLoginError(err));
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-mute"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className={emailFieldClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <PasswordField
              label={t('auth.password')}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn-clay w-full" disabled={loading}>
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>
        )}

        {isDemoEnabled && (
          <button
            type="button"
            className={`${isAppwriteLive ? 'btn-quiet mt-2.5' : 'btn-clay mt-5'} inline-flex w-full items-center justify-center gap-2`}
            data-demo-login
            onClick={() => {
              try {
                enterDemoSession();
                restoreDemoAsOwner();
                window.location.href = safeNextPath();
              } catch (err) {
                setError(safeLoginError(err));
              }
            }}
          >
            <Sparkles className="size-4 opacity-80" aria-hidden="true" />
            {t('auth.demoEnter')}
          </button>
        )}

        <ul className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
          {featureChips.map(({ labelKey, Icon }) => (
            <li
              key={labelKey}
              className="flex flex-col items-center gap-1 rounded-xl bg-sunken/80 px-2 py-2.5 text-center"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-clay-50 text-clay-600 dark:bg-clay-400/10 dark:text-clay-300">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-[0.625rem] font-semibold tracking-wide text-ink-mute uppercase">
                {t(labelKey)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
