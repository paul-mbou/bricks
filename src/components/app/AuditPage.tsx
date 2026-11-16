import { ScrollText } from 'lucide-react';
import { useI18n } from '../../lib/i18n/useI18n';
import { useSession } from '../../lib/store';
import { Card, DemoBanner, EmptyState, PageHeader } from './ui';

export default function AuditPage() {
  const { t, formatDateTime } = useI18n();
  const { app } = useSession();
  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader title={t('audit.title')} description={t('audit.description')} />
      <Card>
        {!app.auditLogs.length ? (
          <EmptyState icon={ScrollText} title={t('audit.empty')}>
            {t('audit.emptyHint')}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {app.auditLogs.map((log) => (
              <li key={log.id} className="py-3 text-sm">
                <p className="font-semibold text-ink">
                  {log.action} · {log.entity} {log.entityId}
                </p>
                <p className="text-ink-mute">
                  {formatDateTime(log.at)} · {t('audit.actor', { id: log.actorId })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
