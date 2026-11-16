import { FileText, TrendingUp } from 'lucide-react';
import { useI18n } from '../../lib/i18n/useI18n';
import { formatMoney } from '../../lib/money';
import { closeWeeklyReport, generateWeeklyReport, useSession } from '../../lib/store';
import { Card, DemoBanner, PageHeader, StatCard } from './ui';

export default function ReportsPage() {
  const { t } = useI18n();
  const { app, can } = useSession();

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        tourAnchor="tour-reports"
        actions={
          <button type="button" className="btn-clay" onClick={() => generateWeeklyReport()}>
            {t('reports.generateWeek')}
          </button>
        }
      />

      {!app.weeklyReports.length ? (
        <Card>
          <p className="text-sm text-ink-mute">{t('reports.empty')}</p>
        </Card>
      ) : (
        app.weeklyReports.map((r) => (
          <Card
            key={r.id}
            title={`${r.weekStart} → ${r.weekEnd}`}
            description={
              r.status === 'closed'
                ? t('reports.versionClosed', { version: r.version })
                : t('reports.versionDraft', { version: r.version })
            }
            action={
              <div className="flex gap-2">
                {r.status === 'draft' && can('approve') && (
                  <button type="button" className="btn-slate h-10 px-3 text-sm" onClick={() => closeWeeklyReport(r.id)}>
                    {t('reports.close')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-quiet h-10 px-3 text-sm"
                  onClick={() => {
                    const lines = [
                      t('reports.exportTitle', { start: r.weekStart, end: r.weekEnd }),
                      `CA: ${r.snapshot.revenue}`,
                      `Charges: ${r.snapshot.charges}`,
                      `Bénéfice: ${r.snapshot.profit}`,
                      `Marge: ${(r.snapshot.marginRate * 100).toFixed(1)}%`,
                      `Trésorerie: ${r.snapshot.treasury}`,
                      `Production: ${r.snapshot.productionBlocks} · sacs ${r.snapshot.bagsUsed} · pertes ${r.snapshot.losses}`,
                    ].join('\n');
                    const blob = new Blob([lines], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `recap-${r.id}.txt`;
                    a.click();
                  }}
                >
                  {t('reports.exportText')}
                </button>
              </div>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t('reports.revenue')} value={formatMoney(r.snapshot.revenue)} icon={TrendingUp} tone="clay" />
              <StatCard label={t('reports.charges')} value={formatMoney(r.snapshot.charges)} icon={FileText} />
              <StatCard label={t('reports.profit')} value={formatMoney(r.snapshot.profit)} icon={TrendingUp} tone="slate" />
              <StatCard
                label={t('reports.margin')}
                value={`${(r.snapshot.marginRate * 100).toFixed(1)} %`}
                icon={TrendingUp}
                tone={r.snapshot.marginRate >= 0 ? 'clay' : 'danger'}
              />
            </div>
            <p className="mt-4 text-sm text-ink-mute">
              {t('reports.treasury', { amount: formatMoney(r.snapshot.treasury) })}
              {t('reports.treasuryNote')}
            </p>
          </Card>
        ))
      )}
    </div>
  );
}
