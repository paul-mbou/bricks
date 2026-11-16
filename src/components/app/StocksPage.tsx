import { Warehouse } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useI18n } from '../../lib/i18n/useI18n';
import { formatMoney } from '../../lib/money';
import {
  blockStock,
  currentCmp,
  materialStock,
  materialStatus,
  performInventory,
  useSession,
} from '../../lib/store';
import { downloadCsv } from '../../lib/exportCsv';
import { Card, DemoBanner, EmptyState, FormField, Modal, PageHeader, SelectBox, Tabs, inputClass } from './ui';
import { StatusChip } from './Topbar';

export default function StocksPage() {
  const { t, formatNumber, formatDateTime } = useI18n();
  const { app } = useSession();
  const [tab, setTab] = useState<'materials' | 'blocks' | 'movements'>('materials');
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [materialId, setMaterialId] = useState(app.materials[0]?.id ?? '');
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');

  const movements = useMemo(
    () => [...app.movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [app.movements],
  );

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('stocks.title')}
        description={t('stocks.description')}
        tourAnchor="tour-stocks"
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-quiet"
              onClick={() =>
                downloadCsv(
                  'mouvements-stock.csv',
                  ['id', 'date', 'itemType', 'itemId', 'quantity', 'reason'],
                  movements.map((m) => [m.id, m.createdAt, m.itemType, m.itemId, m.quantity, m.reason]),
                )
              }
            >
              {t('stocks.exportCsv')}
            </button>
            <button type="button" className="btn-clay" onClick={() => setInventoryOpen(true)}>
              {t('stocks.openInventory')}
            </button>
          </div>
        }
      />

      <Tabs
        label={t('stocks.views')}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'materials', label: t('stocks.materials') },
          { id: 'blocks', label: t('stocks.blocks') },
          { id: 'movements', label: t('stocks.movementsTab'), count: movements.length },
        ]}
      />

      {tab === 'materials' && (
        <Card>
          <ul className="divide-y divide-line">
            {app.materials.map((m) => {
              const qty = materialStock(app, m.id);
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-bold text-ink">{m.name}</p>
                    <p className="text-sm text-ink-mute">
                      {t('stocks.materialMeta', {
                        threshold: m.alertThreshold,
                        cmp: formatMoney(currentCmp(m.id) || m.unitCost),
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold tabular-nums">
                      {qty} {m.unit}
                    </span>
                    <StatusChip status={materialStatus(app, m.id)} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {tab === 'blocks' && (
        <Card>
          <ul className="divide-y divide-line">
            {app.blockTypes.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-bold text-ink">{b.name}</p>
                  <p className="text-sm text-ink-mute">
                    {b.blocksPerBag
                      ? t('stocks.perBag', { count: b.blocksPerBag })
                      : t('stocks.yieldTodo')}{' '}
                    · {t('stocks.thresholdShort', { threshold: b.alertThreshold })}
                  </p>
                </div>
                <span className="text-lg font-extrabold tabular-nums">{formatNumber(blockStock(app, b.id))}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'movements' && (
        <Card title={t('stocks.movements')}>
          {!movements.length ? (
            <EmptyState icon={Warehouse} title={t('stocks.noMovements')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-ink-mute">
                  <tr>
                    <th className="pb-3 font-semibold">{t('stocks.table.date')}</th>
                    <th className="pb-3 font-semibold">{t('stocks.table.type')}</th>
                    <th className="pb-3 font-semibold">{t('stocks.table.reason')}</th>
                    <th className="pb-3 font-semibold">{t('stocks.table.qty')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3">{formatDateTime(m.createdAt)}</td>
                      <td className="py-3">{m.itemType}</td>
                      <td className="py-3">{m.reason}</td>
                      <td className="py-3 font-semibold tabular-nums">{m.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal open={inventoryOpen} onClose={() => setInventoryOpen(false)} title={t('stocks.inventory')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            performInventory(materialId, Number(counted), note.trim());
            setInventoryOpen(false);
            setCounted('');
            setNote('');
          }}
        >
          <FormField id="mat" label={t('stocks.material')}>
            <SelectBox id="mat" value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
              {app.materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({t('stocks.theoretical', { qty: materialStock(app, m.id) })})
                </option>
              ))}
            </SelectBox>
          </FormField>
          <FormField id="counted" label={t('stocks.counted')}>
            <input id="counted" className={inputClass()} value={counted} onChange={(e) => setCounted(e.target.value)} inputMode="decimal" required />
          </FormField>
          <FormField id="note" label={t('stocks.varianceReason')} hint={t('stocks.varianceRequired')}>
            <input id="note" className={inputClass()} value={note} onChange={(e) => setNote(e.target.value)} required />
          </FormField>
          <button type="submit" className="btn-clay w-full">
            {t('stocks.saveAdjustment')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
