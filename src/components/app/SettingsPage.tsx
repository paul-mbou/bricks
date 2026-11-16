import { ROLES } from '../../data/roles';
import { useI18n } from '../../lib/i18n/useI18n';
import {
  exitDemoMode,
  replayPresentation,
  resetDemo,
  restoreDemoAsOwner,
  updateNotificationPrefs,
  useSession,
} from '../../lib/store';
import { Card, DemoBanner, PageHeader, Switch } from './ui';

const PREF_KEYS = ['stock', 'supply', 'production', 'payroll', 'weekly'] as const;
const PREF_LABEL_KEYS: Record<(typeof PREF_KEYS)[number], string> = {
  stock: 'settings.prefStock',
  supply: 'settings.prefSupply',
  production: 'settings.prefProduction',
  payroll: 'settings.prefPayroll',
  weekly: 'settings.prefWeekly',
};

export default function SettingsPage() {
  const { app, can, roleId } = useSession();
  const { t, locale, setLocale } = useI18n();
  const prefs = app.profile.notificationPrefs;

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader title={t('settings.title')} description={t('settings.description')} />

      <Card title={t('common.language')} description={t('common.languageHint')}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={locale === 'en' ? 'btn-clay' : 'btn-quiet'}
            onClick={() => setLocale('en')}
          >
            {t('common.english')}
          </button>
          <button
            type="button"
            className={locale === 'fr' ? 'btn-clay' : 'btn-quiet'}
            onClick={() => setLocale('fr')}
          >
            {t('common.french')}
          </button>
        </div>
      </Card>

      {app.demoMode && roleId !== 'owner' && (
        <Card
          title={t('settings.demoRoleTitle')}
          description={t('settings.demoRoleBody', { role: t(ROLES[roleId].labelKey) })}
        >
          <button
            type="button"
            className="btn-clay"
            onClick={() => {
              restoreDemoAsOwner();
              window.location.assign('/app');
            }}
          >
            {t('settings.backOwner')}
          </button>
        </Card>
      )}

      {can('users') && app.demoMode && (
        <Card title={t('settings.testRoleTitle')} description={t('settings.testRoleBody')}>
          <a href="/app/utilisateurs" className="btn-quiet inline-flex">
            {t('settings.openUsers')}
          </a>
        </Card>
      )}

      <Card title={t('settings.notifPrefs')}>
        <ul className="space-y-4">
          {PREF_KEYS.map((key) => {
            const label = t(PREF_LABEL_KEYS[key]);
            return (
              <li key={key} className="flex items-center justify-between gap-4">
                <span className="font-semibold text-ink">{label}</span>
                <Switch
                  checked={prefs[key]}
                  label={label}
                  onChange={(checked) => updateNotificationPrefs({ ...prefs, [key]: checked })}
                />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title={t('settings.demoPresentation')} description={t('settings.demoPresentationBody')}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-clay"
            onClick={() => {
              try {
                sessionStorage.setItem('br-tour-active', '1');
                sessionStorage.setItem('br-tour-step', '0');
              } catch {
                /* ignore */
              }
              replayPresentation();
              window.location.assign('/app');
            }}
          >
            {t('settings.replay')}
          </button>
          <button
            type="button"
            className="btn-quiet"
            onClick={() => {
              try {
                sessionStorage.setItem('br-tour-active', '1');
                sessionStorage.setItem('br-tour-step', '0');
              } catch {
                /* ignore */
              }
              window.dispatchEvent(new Event('br-reopen-tour'));
            }}
          >
            {t('settings.revisit')}
          </button>
        </div>
        <p className="mt-3 text-sm text-ink-mute">{t('settings.replayHint')}</p>
      </Card>

      <Card title={t('settings.data')}>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-quiet" onClick={() => resetDemo()}>
            {t('settings.resetDemo')}
          </button>
          {app.demoMode && (
            <button type="button" className="btn-quiet" onClick={() => exitDemoMode()}>
              {t('settings.exitDemo')}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
