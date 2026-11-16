import { AlertTriangle, BrickWall, Package, TrendingUp, Truck } from 'lucide-react';
import { useI18n } from '../../lib/i18n/useI18n';
import { formatMoney } from '../../lib/money';
import { blockStock, materialStock, materialStatus, useSession } from '../../lib/store';
import { Badge, Card, DemoBanner, PageHeader, StatCard } from './ui';

export default function DashboardPage() {
  const { app, can } = useSession();
  const { t, formatNumber } = useI18n();
  const cement = app.materials.find((m) => m.kind === 'CEMENT')!;
  const cementQty = materialStock(app, cement.id);
  const cementStatus = materialStatus(app, cement.id);
  const activeAlerts = app.alerts.filter((a) => a.status !== 'resolved');
  const weekBlocks = app.productionRuns.reduce((s, r) => s + r.goodBlocks, 0);
  const weekSales = app.sales.reduce(
    (s, sale) => s + sale.lines.reduce((n, l) => n + l.qty * l.unitPrice + l.deliveryFee, 0),
    0,
  );
  const debts = app.supplies
    .filter((d) => d.status === 'APPROVED' || d.status === 'PARTIALLY_PAID')
    .reduce((s, d) => s + (d.receivedQty ?? 0) * d.unitPrice - d.paidTotal, 0);
  const receivables = app.sales
    .filter((s) => s.paymentMode === 'credit')
    .reduce((s, sale) => s + sale.lines.reduce((n, l) => n + l.qty * l.unitPrice, 0) - sale.deposit, 0);

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        tourAnchor="tour-dashboard"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.cement')}
          value={`${formatNumber(cementQty)} ${t('common.bags')}`}
          icon={Package}
          tone={cementStatus === 'ok' ? 'slate' : 'warning'}
        >
          <Badge tone={cementStatus === 'ok' ? 'success' : 'warning'}>
            {cementStatus === 'ok' ? t('common.ok') : t('common.belowThreshold')}
          </Badge>
        </StatCard>
        <StatCard
          label={t('dashboard.weekProduction')}
          value={formatNumber(weekBlocks)}
          icon={BrickWall}
          tone="clay"
        />
        <StatCard label={t('dashboard.weekSales')} value={formatMoney(weekSales)} icon={TrendingUp} />
        <StatCard
          label={t('dashboard.activeAlerts')}
          value={String(activeAlerts.length)}
          icon={AlertTriangle}
          tone={activeAlerts.length ? 'warning' : 'slate'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('dashboard.blockStock')} description={t('dashboard.blockStockHint')}>
          <ul className="divide-y divide-line">
            {app.blockTypes
              .filter((b) => b.blocksPerBag > 0)
              .map((b) => {
                const qty = blockStock(app, b.id);
                const tone = qty <= 0 ? 'danger' : qty <= b.alertThreshold ? 'warning' : 'success';
                return (
                  <li key={b.id} className="flex items-center justify-between py-3">
                    <span className="font-semibold text-ink">{b.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums text-ink">{formatNumber(qty)}</span>
                      <Badge tone={tone}>
                        {tone === 'success' ? t('common.ok') : tone === 'warning' ? t('common.low') : t('common.out')}
                      </Badge>
                    </div>
                  </li>
                );
              })}
          </ul>
        </Card>

        <Card
          title={t('dashboard.attention')}
          action={
            <a href="/app/alertes" className="text-sm font-semibold text-clay-700">
              {t('common.seeAll')}
            </a>
          }
        >
          <ul className="space-y-3">
            {activeAlerts.slice(0, 5).map((a) => (
              <li key={a.id}>
                <a href={a.href} className="block rounded-xl border border-line px-3 py-3 hover:bg-sunken">
                  <p className="font-semibold text-ink">{a.title}</p>
                  <p className="text-sm text-ink-mute">{a.message}</p>
                </a>
              </li>
            ))}
            {!activeAlerts.length && <p className="text-sm text-ink-mute">{t('dashboard.noActiveAlerts')}</p>}
          </ul>
        </Card>
      </div>

      {can('profit') && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label={t('dashboard.supplierDebts')} value={formatMoney(debts)} icon={Truck} tone="warning" />
          <StatCard label={t('dashboard.customerReceivables')} value={formatMoney(receivables)} icon={TrendingUp} />
          <StatCard
            label={t('dashboard.estimatedProfit')}
            value={formatMoney(weekSales - app.productionRuns.reduce((s, r) => s + r.materialCost, 0))}
            icon={TrendingUp}
            tone="clay"
          />
        </div>
      )}
    </div>
  );
}
