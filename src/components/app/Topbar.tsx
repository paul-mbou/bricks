import {
  Bell,
  BrickWall,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BOTTOM_NAV, NAV_ITEMS, ROLES } from '../../data/roles';
import { signOut } from '../../lib/auth';
import { useI18n } from '../../lib/i18n/useI18n';
import { restoreDemoAsOwner, useSession } from '../../lib/store';
import { applyTheme, getThemePreference } from '../../lib/theme';
import { useCurrentPath } from '../../lib/useCurrentPath';
import { Avatar, Badge } from './ui';

const iconButton =
  'relative grid size-10 place-items-center rounded-xl text-ink-soft transition hover:bg-sunken hover:text-ink aria-expanded:bg-sunken';

export default function Topbar({ current: initialCurrent }: { current: string }) {
  const current = useCurrentPath(initialCurrent);
  const [menuOpen, setMenuOpen] = useState(false);
  const { can, roleId, profile, app } = useSession();
  const { t } = useI18n();
  const unread = app.alerts.filter((a) => a.status === 'new').length;

  const alertsAria =
    unread > 0 ? t('topbar.alertsAriaCount', { count: unread }) : t('topbar.alertsAria');

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[96rem] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <button
            type="button"
            className={`${iconButton} -ml-2 lg:hidden`}
            onClick={() => setMenuOpen(true)}
            aria-label={t('nav.open')}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <a href="/app" className="lg:hidden" aria-label={t('nav.homeAria')}>
            <BrickWall className="size-7 text-clay-500" />
          </a>
          <p className="hidden text-sm font-semibold text-ink-mute md:block">
            {app.settings.companyName} · {app.settings.city}
          </p>
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <span className="mr-1 hidden rounded-full bg-clay-100 px-2.5 py-1 text-xs font-bold text-clay-700 sm:inline dark:bg-clay-400/10 dark:text-clay-300">
              {t(ROLES[roleId].labelKey)}
            </span>
            {app.demoMode && roleId !== 'owner' && (
              <button
                type="button"
                className="mr-1 hidden h-9 rounded-xl bg-lime-400/25 px-2.5 text-xs font-bold text-slate-900 sm:inline-flex sm:items-center"
                onClick={() => {
                  restoreDemoAsOwner();
                  window.location.assign('/app');
                }}
              >
                {t('topbar.backOwner')}
              </button>
            )}
            <ThemeToggle />
            <a
              href="/app/alertes"
              className={iconButton}
              aria-label={alertsAria}
              data-tour="tour-alerts-bell"
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-clay-500" aria-hidden="true" />
              )}
            </a>
            <UserMenu name={profile.name} />
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50"
            aria-label={t('common.close')}
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-slate-950 text-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4">
              <p className="font-extrabold">{t('brand.name')}</p>
              <button
                type="button"
                className="grid size-10 place-items-center rounded-xl hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
                aria-label={t('common.close')}
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-8">
              {NAV_ITEMS.filter((i) => can(i.permission)).map((item) => {
                const active = current === item.href || (item.href !== '/app' && current.startsWith(item.href));
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`block rounded-xl px-3 py-3 text-sm font-semibold ${active ? 'bg-clay-500/20 text-clay-200' : 'text-white/75'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(item.labelKey)}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
        aria-label={t('nav.mobile')}
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          {BOTTOM_NAV.filter((i) => can(i.permission)).map((item) => {
            const active = current === item.href || (item.href !== '/app' && current.startsWith(item.href));
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-col items-center rounded-xl px-1 py-2 text-[0.6875rem] font-bold ${active ? 'text-clay-600' : 'text-ink-mute'}`}
                >
                  {t(item.labelKey)}
                </a>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex w-full flex-col items-center rounded-xl px-1 py-2 text-[0.6875rem] font-bold text-ink-mute"
            >
              {t('common.more')}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

function ThemeToggle() {
  const { t } = useI18n();
  const [pref, setPref] = useState<'light' | 'dark' | 'system'>('light');
  useEffect(() => {
    setPref(getThemePreference());
  }, []);
  return (
    <button
      type="button"
      className={iconButton}
      aria-label={t('topbar.theme')}
      onClick={() => {
        const next = pref === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        setPref(next);
      }}
    >
      {pref === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const { app, roleId } = useSession();
  const { t } = useI18n();
  return (
    <div className="relative">
      <button
        type="button"
        className={`${iconButton} gap-0`}
        aria-expanded={open}
        aria-label={t('topbar.account')}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={name} size="xs" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-panel p-2 shadow-card">
          <p className="px-3 py-2 text-sm font-semibold text-ink">{name}</p>
          {app.demoMode && roleId !== 'owner' && (
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-clay-700 hover:bg-sunken"
              onClick={() => {
                restoreDemoAsOwner();
                window.location.assign('/app');
              }}
            >
              {t('topbar.backOwnerLong')}
            </button>
          )}
          <a href="/app/parametres" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-sunken">
            <User className="size-4" /> {t('topbar.settings')}
          </a>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-sunken"
            onClick={async () => {
              restoreDemoAsOwner();
              await signOut();
              window.location.href = '/connexion';
            }}
          >
            <LogOut className="size-4" /> {t('topbar.signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'slate';

const STATUS_TONES: Record<string, StatusTone> = {
  ok: 'success',
  low: 'warning',
  out: 'danger',
  BL_RECORDED: 'neutral',
  RECEIVED: 'warning',
  INVOICE_FILED: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
};

const STATUS_KEYS: Record<string, string> = {
  ok: 'common.ok',
  low: 'common.low',
  out: 'common.out',
  BL_RECORDED: 'status.BL_RECORDED',
  RECEIVED: 'status.RECEIVED',
  INVOICE_FILED: 'status.INVOICE_FILED',
  APPROVED: 'status.APPROVED',
  REJECTED: 'status.REJECTED',
  PARTIALLY_PAID: 'status.PARTIALLY_PAID',
  PAID: 'status.PAID',
};

export function StatusChip({ status }: { status: string }) {
  const { t } = useI18n();
  const tone = STATUS_TONES[status] ?? 'neutral';
  const label = STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : status;
  return <Badge tone={tone}>{label}</Badge>;
}
