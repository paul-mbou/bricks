import { useMemo, useState } from 'react';
import { computeProductionMetrics } from '../../../packages/domain/src';
import { useI18n } from '../../lib/i18n/useI18n';
import { useSession, validateProduction } from '../../lib/store';
import { Card, DemoBanner, FormField, Modal, PageHeader, SelectBox, inputClass } from './ui';

export default function ProductionPage() {
  const { t } = useI18n();
  const { app } = useSession();
  const [open, setOpen] = useState(false);
  const [blockTypeId, setBlockTypeId] = useState(app.blockTypes.find((b) => b.blocksPerBag > 0)?.id ?? '');
  const [bags, setBags] = useState('10');
  const [good, setGood] = useState('700');
  const [lost, setLost] = useState('0');
  const [reason, setReason] = useState('');
  const [chief, setChief] = useState('Chef Atelier');

  const preview = useMemo(() => {
    const block = app.blockTypes.find((b) => b.id === blockTypeId);
    if (!block?.blocksPerBag) return null;
    return computeProductionMetrics({
      bagsUsed: Number(bags) || 0,
      blocksPerBag: block.blocksPerBag,
      goodBlocks: Number(good) || 0,
    });
  }, [app.blockTypes, blockTypeId, bags, good]);

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('production.title')}
        description={t('production.description')}
        tourAnchor="tour-production"
        actions={
          <button type="button" className="btn-clay" onClick={() => setOpen(true)}>
            {t('production.newSession')}
          </button>
        }
      />

      <Card title={t('production.history')}>
        <ul className="divide-y divide-line">
          {app.productionRuns.map((r) => {
            const block = app.blockTypes.find((b) => b.id === r.blockTypeId);
            const metrics = computeProductionMetrics({
              bagsUsed: r.bagsUsed,
              blocksPerBag: block?.blocksPerBag ?? 0,
              goodBlocks: r.goodBlocks,
            });
            return (
              <li key={r.id} className="py-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-bold text-ink">
                    {block?.name} · {r.date}
                  </p>
                  <p className="text-sm text-ink-mute">{r.chiefName}</p>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  {t('production.runSummary', {
                    bags: r.bagsUsed,
                    good: r.goodBlocks,
                    lossCount: metrics.manufacturingLossCount,
                    lossPct: (metrics.manufacturingLossRate * 100).toFixed(1),
                    yieldPerBag: metrics.realYieldPerBag.toFixed(1),
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={t('production.newSession')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            validateProduction({
              blockTypeId,
              bagsUsed: Number(bags),
              goodBlocks: Number(good),
              lostBlocks: Number(lost),
              lossReason: reason,
              chiefName: chief,
            });
            setOpen(false);
          }}
        >
          <FormField id="type" label={t('production.blockType')}>
            <SelectBox id="type" value={blockTypeId} onChange={(e) => setBlockTypeId(e.target.value)}>
              {app.blockTypes
                .filter((b) => b.blocksPerBag > 0)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({t('production.perBagOption', { blocks: b.blocksPerBag })})
                  </option>
                ))}
            </SelectBox>
          </FormField>
          <FormField id="bags" label={t('production.cementBags')}>
            <input id="bags" className={inputClass()} value={bags} onChange={(e) => setBags(e.target.value)} required />
          </FormField>
          <FormField id="good" label={t('production.goodBlocks')}>
            <input id="good" className={inputClass()} value={good} onChange={(e) => setGood(e.target.value)} required />
          </FormField>
          <FormField id="lost" label={t('production.lostBlocks')}>
            <input id="lost" className={inputClass()} value={lost} onChange={(e) => setLost(e.target.value)} />
          </FormField>
          <FormField id="reason" label={t('production.lossReason')}>
            <input id="reason" className={inputClass()} value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
          <FormField id="chief" label={t('production.productionLead')}>
            <input id="chief" className={inputClass()} value={chief} onChange={(e) => setChief(e.target.value)} required />
          </FormField>
          {preview && (
            <div className="rounded-xl bg-sunken p-3 text-sm text-ink-soft">
              {t('production.preview', {
                theoretical: preview.theoreticalProduction,
                loss: preview.manufacturingLossCount,
                yieldPerBag: preview.realYieldPerBag.toFixed(1),
              })}
            </div>
          )}
          <button type="submit" className="btn-clay w-full">
            {t('production.validate')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
