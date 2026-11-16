import { useI18n } from '../../lib/i18n/useI18n';
import { useSession } from '../../lib/store';
import { Card, DemoBanner, PageHeader } from './ui';

export default function NotificationsPage() {
  const { t } = useI18n();
  const { app } = useSession();
  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader title={t('notifications.title')} description={t('notifications.description')} tourAnchor="tour-notify" />
      <Card title={t('notifications.devices')}>
        <p className="text-sm text-ink-mute">{t('notifications.devicesBody')}</p>
        <p className="mt-3 text-sm text-ink-soft">
          {t('notifications.fallbackDelay', { minutes: app.settings.pushFallbackMinutes })}
        </p>
        <button
          type="button"
          className="btn-clay mt-4"
          onClick={async () => {
            if (!('Notification' in window)) return alert(t('notifications.unsupported'));
            const perm = await Notification.requestPermission();
            if (perm === 'granted') new Notification('Bricks', { body: t('notifications.testOk') });
          }}
        >
          {t('notifications.testLocal')}
        </button>
      </Card>
    </div>
  );
}
