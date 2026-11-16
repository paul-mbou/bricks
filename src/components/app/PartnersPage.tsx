import { useState } from 'react';
import { useI18n } from '../../lib/i18n/useI18n';
import { useSession } from '../../lib/store';
import { Card, DemoBanner, PageHeader, Tabs } from './ui';

export default function PartnersPage() {
  const { t } = useI18n();
  const { app } = useSession();
  const [tab, setTab] = useState<'suppliers' | 'customers'>('suppliers');
  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader title={t('partners.title')} description={t('partners.description')} />
      <Tabs
        label={t('partners.title')}
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'suppliers', label: t('partners.suppliers'), count: app.suppliers.length },
          { id: 'customers', label: t('partners.customers'), count: app.customers.length },
        ]}
      />
      <Card>
        <ul className="divide-y divide-line">
          {(tab === 'suppliers' ? app.suppliers : app.customers).map((p) => (
            <li key={p.id} className="py-4">
              <p className="font-bold text-ink">{p.name}</p>
              <p className="text-sm text-ink-mute">{'phone' in p ? p.phone : ''}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
