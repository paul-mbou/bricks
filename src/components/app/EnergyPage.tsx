import { useState } from 'react';
import { costPerThousandBlocks, meterConsumption } from '../../../packages/domain/src';
import { useI18n } from '../../lib/i18n/useI18n';
import { formatMoney } from '../../lib/money';
import { addMeterReading, addUtilityBill, useSession } from '../../lib/store';
import { Card, DemoBanner, FormField, Modal, PageHeader, SelectBox, inputClass } from './ui';

export default function EnergyPage() {
  const { t } = useI18n();
  const { app } = useSession();
  const [open, setOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);
  const [meterId, setMeterId] = useState(app.meters[0]?.id ?? '');
  const [prev, setPrev] = useState('0');
  const [next, setNext] = useState('0');
  const [billAmount, setBillAmount] = useState('');
  const blocks = app.productionRuns.reduce((s, r) => s + r.goodBlocks, 0);

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('energy.title')}
        description={t('energy.description')}
        actions={
          <div className="flex gap-2">
            <button type="button" className="btn-quiet" onClick={() => setBillOpen(true)}>
              {t('energy.openInvoice')}
            </button>
            <button type="button" className="btn-clay" onClick={() => setOpen(true)}>
              {t('energy.openReading')}
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {app.meters.map((meter) => {
          const readings = app.readings.filter((r) => r.meterId === meter.id);
          const last = readings[0];
          const consumption = last ? last.newIndex - last.previousIndex : 0;
          const estimated = consumption * meter.unitTariff;
          const bill = app.utilityBills.find((b) => b.meterId === meter.id);
          const charge = bill?.amount ?? estimated;
          return (
            <Card
              key={meter.id}
              title={meter.name}
              description={t('energy.tariff', { tariff: meter.unitTariff, unit: meter.unit })}
            >
              <p className="text-2xl font-extrabold tabular-nums">{formatMoney(charge)}</p>
              <p className="mt-1 text-sm text-ink-mute">
                {t('energy.readingDetail', {
                  source: bill ? t('energy.monthlyInvoice') : t('energy.estimate'),
                  consumption,
                  unit: meter.unit,
                })}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {t('energy.costPerThousand', { amount: formatMoney(costPerThousandBlocks(charge, blocks || 1)) })}
              </p>
            </Card>
          );
        })}
      </div>

      <Card title={t('energy.recentReadings')}>
        <ul className="divide-y divide-line">
          {app.readings.map((r) => {
            const meter = app.meters.find((m) => m.id === r.meterId);
            return (
              <li key={r.id} className="flex justify-between py-3 text-sm">
                <span>
                  {meter?.name} · {r.date}
                </span>
                <span className="font-semibold tabular-nums">
                  {r.previousIndex} → {r.newIndex}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('energy.newReading')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              meterConsumption(Number(prev), Number(next));
              addMeterReading({
                meterId,
                previousIndex: Number(prev),
                newIndex: Number(next),
                date: new Date().toISOString().slice(0, 10),
              });
              setOpen(false);
            } catch (err) {
              alert(err instanceof Error ? err.message : t('energy.invalidIndex'));
            }
          }}
        >
          <FormField id="meter" label={t('energy.meter')}>
            <SelectBox id="meter" value={meterId} onChange={(e) => setMeterId(e.target.value)}>
              {app.meters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </SelectBox>
          </FormField>
          <FormField id="prev" label={t('energy.previousIndex')}>
            <input id="prev" className={inputClass()} value={prev} onChange={(e) => setPrev(e.target.value)} required />
          </FormField>
          <FormField id="next" label={t('energy.newIndex')}>
            <input id="next" className={inputClass()} value={next} onChange={(e) => setNext(e.target.value)} required />
          </FormField>
          <button type="submit" className="btn-clay w-full">
            {t('energy.save')}
          </button>
        </form>
      </Modal>

      <Modal open={billOpen} onClose={() => setBillOpen(false)} title={t('energy.monthlyInvoice')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            addUtilityBill({
              meterId,
              month: new Date().toISOString().slice(0, 7),
              amount: Number(billAmount),
            });
            setBillOpen(false);
          }}
        >
          <FormField id="bmeter" label={t('energy.meter')}>
            <SelectBox id="bmeter" value={meterId} onChange={(e) => setMeterId(e.target.value)}>
              {app.meters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </SelectBox>
          </FormField>
          <FormField id="bamt" label={t('energy.billedAmount')}>
            <input id="bamt" className={inputClass()} value={billAmount} onChange={(e) => setBillAmount(e.target.value)} required />
          </FormField>
          <button type="submit" className="btn-clay w-full">
            {t('energy.replaceEstimate')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
