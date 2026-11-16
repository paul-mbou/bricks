import { Bell } from 'lucide-react';
import { useI18n } from '../../lib/i18n/useI18n';
import { markAlert, useSession } from '../../lib/store';
import { Badge, Card, DemoBanner, EmptyState, PageHeader } from './ui';

export default function AlertsPage() {
  const { t } = useI18n();
  const { app } = useSession();
  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader title={t('alerts.title')} description={t('alerts.description')} tourAnchor="tour-alerts" />
      <Card>
        {!app.alerts.length ? (
          <EmptyState icon={Bell} title={t('alerts.empty')} />
        ) : (
          <ul className="divide-y divide-line">
            {app.alerts.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-ink">{a.title}</p>
                    <Badge tone={a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'slate'}>
                      {a.severity}
                    </Badge>
                    <Badge tone={a.status === 'resolved' ? 'success' : 'neutral'}>{a.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-mute">{a.message}</p>
                </div>
                <div className="flex gap-2">
                  <a href={a.href} className="btn-quiet h-10 px-3 text-sm">
                    {t('alerts.open')}
                  </a>
                  {a.status !== 'resolved' && (
                    <button type="button" className="btn-slate h-10 px-3 text-sm" onClick={() => markAlert(a.id, 'resolved')}>
                      {t('alerts.resolve')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
