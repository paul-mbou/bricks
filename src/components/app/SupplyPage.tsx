import { useState } from 'react';
import { AGGREGATE_TRUCK_PRICES } from '../../data/seed';
import { useI18n } from '../../lib/i18n/useI18n';
import { formatMoney } from '../../lib/money';
import {
  advanceSupplyStatus,
  createSupply,
  paySupplier,
  receiveSupply,
  useSession,
} from '../../lib/store';
import { Card, DemoBanner, FormField, Modal, PageHeader, SelectBox, inputClass } from './ui';
import { StatusChip } from './Topbar';

export default function SupplyPage() {
  const { t } = useI18n();
  const { app, can } = useSession();
  const [createOpen, setCreateOpen] = useState(false);
  const [receiveId, setReceiveId] = useState<string | null>(null);
  const [receivedQty, setReceivedQty] = useState('');
  const [payId, setPayId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [form, setForm] = useState({
    kind: 'CEMENT' as 'CEMENT' | 'AGGREGATE',
    materialId: 'mat-cement',
    supplierId: 'sup-1',
    blNumber: '',
    announcedQty: '',
    unitPrice: '5500',
    truckCapacity: '30t' as '20t' | '30t' | '50t',
  });

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('supply.title')}
        description={t('supply.description')}
        tourAnchor="tour-supply"
        actions={
          <button type="button" className="btn-clay" onClick={() => setCreateOpen(true)}>
            {t('supply.newBl')}
          </button>
        }
      />

      <Card title={t('supply.dossiers')}>
        <ul className="divide-y divide-line">
          {app.supplies.map((d) => {
            const supplier = app.suppliers.find((s) => s.id === d.supplierId);
            const material = app.materials.find((m) => m.id === d.materialId);
            const due = (d.receivedQty ?? 0) * d.unitPrice;
            const metaParts = [
              supplier?.name,
              t('supply.announced', { qty: d.announcedQty }),
              d.receivedQty != null ? t('supply.received', { qty: d.receivedQty }) : null,
              d.truckCapacity ? t('supply.truckCapacity', { capacity: d.truckCapacity }) : null,
            ].filter(Boolean);
            return (
              <li key={d.id} className="space-y-3 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-ink">
                      {d.blNumber} · {material?.name}
                    </p>
                    <p className="text-sm text-ink-mute">{metaParts.join(' · ')}</p>
                  </div>
                  <StatusChip status={d.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.status === 'BL_RECORDED' && can('supply') && (
                    <button type="button" className="btn-quiet h-10 px-3 text-sm" onClick={() => setReceiveId(d.id)}>
                      {t('supply.enterGr')}
                    </button>
                  )}
                  {d.status === 'RECEIVED' && can('supply') && (
                    <button
                      type="button"
                      className="btn-quiet h-10 px-3 text-sm"
                      onClick={() => advanceSupplyStatus(d.id, 'INVOICE_FILED')}
                    >
                      {t('supply.fileInvoice')}
                    </button>
                  )}
                  {d.status === 'INVOICE_FILED' && can('approve') && (
                    <>
                      <button type="button" className="btn-clay h-10 px-3 text-sm" onClick={() => advanceSupplyStatus(d.id, 'APPROVED')}>
                        {t('supply.validate')}
                      </button>
                      <button
                        type="button"
                        className="btn-quiet h-10 px-3 text-sm"
                        onClick={() => advanceSupplyStatus(d.id, 'REJECTED', t('supply.unjustifiedGap'))}
                      >
                        {t('supply.reject')}
                      </button>
                    </>
                  )}
                  {(d.status === 'APPROVED' || d.status === 'PARTIALLY_PAID') && can('pay') && (
                    <button type="button" className="btn-slate h-10 px-3 text-sm" onClick={() => setPayId(d.id)}>
                      {t('supply.payDue', { amount: formatMoney(due - d.paidTotal) })}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t('supply.deliveryNote')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createSupply({
              kind: form.kind,
              materialId: form.materialId,
              supplierId: form.supplierId,
              blNumber: form.blNumber,
              blDate: new Date().toISOString().slice(0, 10),
              announcedQty: Number(form.announcedQty),
              unitPrice: Number(form.unitPrice),
              truckCapacity: form.kind === 'AGGREGATE' ? form.truckCapacity : undefined,
              attachmentNames: [],
            });
            setCreateOpen(false);
          }}
        >
          <FormField id="kind" label={t('supply.kindType')}>
            <SelectBox
              id="kind"
              value={form.kind}
              onChange={(e) => {
                const kind = e.target.value as 'CEMENT' | 'AGGREGATE';
                setForm((f) => ({
                  ...f,
                  kind,
                  materialId: kind === 'CEMENT' ? 'mat-cement' : 'mat-pozzolan',
                  unitPrice:
                    kind === 'CEMENT'
                      ? '5500'
                      : String(AGGREGATE_TRUCK_PRICES.pouzzolane[f.truckCapacity] ?? 130000),
                }));
              }}
            >
              <option value="CEMENT">{t('supply.kindCement')}</option>
              <option value="AGGREGATE">{t('supply.kindAggregate')}</option>
            </SelectBox>
          </FormField>
          <FormField id="bl" label={t('supply.blNumber')}>
            <input
              id="bl"
              className={inputClass()}
              value={form.blNumber}
              onChange={(e) => setForm((f) => ({ ...f, blNumber: e.target.value }))}
              required
            />
          </FormField>
          <FormField
            id="qty"
            label={form.kind === 'CEMENT' ? t('supply.announcedBags') : t('supply.announcedTons')}
          >
            <input
              id="qty"
              className={inputClass()}
              value={form.announcedQty}
              onChange={(e) => setForm((f) => ({ ...f, announcedQty: e.target.value }))}
              required
              inputMode="decimal"
            />
          </FormField>
          {form.kind === 'AGGREGATE' && (
            <FormField id="truck" label={t('supply.truck')}>
              <SelectBox
                id="truck"
                value={form.truckCapacity}
                onChange={(e) => {
                  const truckCapacity = e.target.value as '20t' | '30t' | '50t';
                  const price = AGGREGATE_TRUCK_PRICES.pouzzolane[truckCapacity] ?? 0;
                  setForm((f) => ({
                    ...f,
                    truckCapacity,
                    announcedQty: truckCapacity.replace('t', ''),
                    unitPrice: String(Math.round(price / Number(truckCapacity.replace('t', '')))),
                  }));
                }}
              >
                <option value="20t">20 t</option>
                <option value="30t">30 t</option>
                <option value="50t">50 t</option>
              </SelectBox>
            </FormField>
          )}
          <FormField id="price" label={t('supply.unitPrice')}>
            <input
              id="price"
              className={inputClass()}
              value={form.unitPrice}
              onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
              required
            />
          </FormField>
          <button type="submit" className="btn-clay w-full">
            {t('supply.saveBl')}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(receiveId)} onClose={() => setReceiveId(null)} title={t('supply.goodsReceipt')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!receiveId) return;
            receiveSupply(receiveId, Number(receivedQty));
            setReceiveId(null);
            setReceivedQty('');
          }}
        >
          <FormField id="recv" label={t('supply.qtyReceived')}>
            <input id="recv" className={inputClass()} value={receivedQty} onChange={(e) => setReceivedQty(e.target.value)} required />
          </FormField>
          <button type="submit" className="btn-clay w-full">
            {t('supply.validateBr')}
          </button>
        </form>
      </Modal>

      <Modal open={Boolean(payId)} onClose={() => setPayId(null)} title={t('supply.supplierPayment')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!payId) return;
            try {
              paySupplier(payId, Number(payAmount));
              setPayId(null);
              setPayAmount('');
            } catch (err) {
              alert(err instanceof Error ? err.message : t('common.error'));
            }
          }}
        >
          <p className="text-sm text-ink-mute">{t('supply.paymentHint')}</p>
          <FormField id="amt" label={t('supply.amount')}>
            <input id="amt" className={inputClass()} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
          </FormField>
          <button type="submit" className="btn-clay w-full">
            {t('supply.savePayment')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
