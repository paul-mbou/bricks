import { useState } from 'react';
import { useI18n } from '../../lib/i18n/useI18n';
import { formatMoney } from '../../lib/money';
import { createSale, useSession } from '../../lib/store';
import { Card, DemoBanner, FormField, Modal, PageHeader, SelectBox, inputClass } from './ui';

export default function SalesPage() {
  const { t } = useI18n();
  const { app } = useSession();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState(app.customers[0]?.id ?? '');
  const [blockTypeId, setBlockTypeId] = useState(app.blockTypes.find((b) => b.priceDeliveredCity > 0)?.id ?? '');
  const [qty, setQty] = useState('100');
  const [mode, setMode] = useState<'city' | 'exworks' | 'out_of_city'>('city');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'credit'>('cash');
  const [deposit, setDeposit] = useState('0');
  const [broken, setBroken] = useState('0');
  const [deliveryFee, setDeliveryFee] = useState('0');

  const block = app.blockTypes.find((b) => b.id === blockTypeId);
  const unitPrice =
    mode === 'exworks' ? block?.priceExWorks ?? 0 : mode === 'city' ? block?.priceDeliveredCity ?? 0 : block?.priceExWorks ?? 0;

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('sales.title')}
        description={t('sales.description')}
        actions={
          <button type="button" className="btn-clay" onClick={() => setOpen(true)}>
            {t('sales.newSale')}
          </button>
        }
      />

      <Card>
        <ul className="divide-y divide-line">
          {app.sales.map((sale) => {
            const customer = app.customers.find((c) => c.id === sale.customerId);
            const total = sale.lines.reduce((s, l) => s + l.qty * l.unitPrice + l.deliveryFee, 0);
            const paymentLabel =
              sale.paymentMode === 'cash'
                ? t('sales.cash')
                : t('sales.creditDeposit', { amount: formatMoney(sale.deposit) });
            const brokenLabel =
              sale.brokenInTransit > 0 ? ` · ${t('sales.brokenInTransitQty', { count: sale.brokenInTransit })}` : '';
            return (
              <li key={sale.id} className="py-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-bold text-ink">
                    {customer?.name} · {sale.date}
                  </p>
                  <p className="font-extrabold tabular-nums">{formatMoney(total)}</p>
                </div>
                <p className="text-sm text-ink-mute">
                  {paymentLabel}
                  {brokenLabel}
                </p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('sales.newSale')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createSale({
              customerId,
              date: new Date().toISOString().slice(0, 10),
              deliveryMode: mode,
              paymentMode,
              deposit: Number(deposit),
              brokenInTransit: Number(broken),
              lines: [
                {
                  blockTypeId,
                  qty: Number(qty),
                  unitPrice,
                  deliveryFee: mode === 'out_of_city' ? Number(deliveryFee) : 0,
                },
              ],
            });
            setOpen(false);
          }}
        >
          <FormField id="cus" label={t('sales.customer')}>
            <SelectBox id="cus" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {app.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectBox>
          </FormField>
          <FormField id="blk" label={t('sales.block')}>
            <SelectBox id="blk" value={blockTypeId} onChange={(e) => setBlockTypeId(e.target.value)}>
              {app.blockTypes
                .filter((b) => b.priceDeliveredCity > 0)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </SelectBox>
          </FormField>
          <FormField id="mode" label={t('sales.delivery')}>
            <SelectBox id="mode" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="city">{t('sales.deliveryCity')}</option>
              <option value="exworks">{t('sales.deliveryExWorks')}</option>
              <option value="out_of_city">{t('sales.deliveryOutOfCity')}</option>
            </SelectBox>
          </FormField>
          <FormField id="qty" label={t('sales.quantity')}>
            <input id="qty" className={inputClass()} value={qty} onChange={(e) => setQty(e.target.value)} required />
          </FormField>
          {mode === 'out_of_city' && (
            <FormField id="fee" label={t('sales.deliveryFee')}>
              <input id="fee" className={inputClass()} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} />
            </FormField>
          )}
          <FormField id="pay" label={t('sales.payment')}>
            <SelectBox id="pay" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}>
              <option value="cash">{t('sales.cash')}</option>
              <option value="credit">{t('sales.credit')}</option>
            </SelectBox>
          </FormField>
          {paymentMode === 'credit' && (
            <FormField id="dep" label={t('sales.deposit')}>
              <input id="dep" className={inputClass()} value={deposit} onChange={(e) => setDeposit(e.target.value)} />
            </FormField>
          )}
          <FormField id="brk" label={t('sales.brokenInTransit')}>
            <input id="brk" className={inputClass()} value={broken} onChange={(e) => setBroken(e.target.value)} />
          </FormField>
          <p className="rounded-xl bg-sunken p-3 text-sm">
            {t('sales.unitPriceLocked', {
              unit: formatMoney(unitPrice),
              total: formatMoney(Number(qty) * unitPrice + (mode === 'out_of_city' ? Number(deliveryFee) : 0)),
            })}
          </p>
          <button type="submit" className="btn-clay w-full">
            {t('sales.saveSale')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
