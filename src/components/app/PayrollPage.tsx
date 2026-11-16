import { useState } from 'react';
import { useI18n } from '../../lib/i18n/useI18n';
import { formatMoney } from '../../lib/money';
import { addAttendance, approvePayroll, markPayrollPaid, useSession } from '../../lib/store';
import { StatusChip } from './Topbar';
import { Card, DemoBanner, FormField, Modal, PageHeader, SelectBox } from './ui';

export default function PayrollPage() {
  const { t } = useI18n();
  const { app, can } = useSession();
  const [attOpen, setAttOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(app.employees[0]?.id ?? '');
  const [code, setCode] = useState<'present' | 'absent' | 'half' | 'leave' | 'overtime'>('present');

  return (
    <div className="space-y-6">
      <DemoBanner visible={app.demoMode} />
      <PageHeader
        title={t('payroll.title')}
        description={t('payroll.description')}
        tourAnchor="tour-payroll"
        actions={
          <button type="button" className="btn-quiet" onClick={() => setAttOpen(true)}>
            {t('payroll.attendance')}
          </button>
        }
      />

      <Card title={t('payroll.employees')}>
        <ul className="divide-y divide-line">
          {app.employees.map((e) => (
            <li key={e.id} className="flex justify-between py-3">
              <div>
                <p className="font-bold text-ink">{e.name}</p>
                <p className="text-sm text-ink-mute">
                  {e.role} · {e.contract} · {formatMoney(e.baseRate)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t('payroll.periods')}>
        <ul className="space-y-4">
          {app.payrollPeriods.map((p) => (
            <li key={p.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-ink">{p.label}</p>
                  <p className="text-sm text-ink-mute">
                    {p.start} → {p.end}
                  </p>
                </div>
                <StatusChip status={p.status === 'ready' ? 'RECEIVED' : p.status === 'approved' ? 'APPROVED' : p.status === 'paid' ? 'PAID' : 'BL_RECORDED'} />
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {p.slips.map((s) => {
                  const emp = app.employees.find((e) => e.id === s.employeeId);
                  return (
                    <li key={s.employeeId} className="flex justify-between">
                      <span>{emp?.name}</span>
                      <span className="font-semibold tabular-nums">
                        {t('payroll.net', { amount: formatMoney(s.net) })}
                        {s.advances ? t('payroll.advance', { amount: formatMoney(s.advances) }) : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.status === 'ready' && can('approve') && (
                  <button type="button" className="btn-clay h-10 px-3 text-sm" onClick={() => approvePayroll(p.id)}>
                    {t('payroll.approveDg')}
                  </button>
                )}
                {p.status === 'approved' && can('payrollPay') && (
                  <button
                    type="button"
                    className="btn-slate h-10 px-3 text-sm"
                    onClick={() => {
                      try {
                        markPayrollPaid(p.id);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : t('common.error'));
                      }
                    }}
                  >
                    {t('payroll.markPaid')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-quiet h-10 px-3 text-sm"
                  onClick={() => {
                    const text = p.slips
                      .map((s) => {
                        const emp = app.employees.find((e) => e.id === s.employeeId);
                        return `${emp?.name}: brut ${s.gross} / net ${s.net}`;
                      })
                      .join('\n');
                    const blob = new Blob([`Bulletin ${p.label}\n${text}`], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `paie-${p.id}.txt`;
                    a.click();
                  }}
                >
                  {t('payroll.exportSlip')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal open={attOpen} onClose={() => setAttOpen(false)} title={t('payroll.todayAttendance')} variant="sheet">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            addAttendance({
              employeeId,
              date: new Date().toISOString().slice(0, 10),
              code,
            });
            setAttOpen(false);
          }}
        >
          <FormField id="emp" label={t('payroll.employee')}>
            <SelectBox id="emp" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {app.employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </SelectBox>
          </FormField>
          <FormField id="code" label={t('payroll.statusLabel')}>
            <SelectBox id="code" value={code} onChange={(e) => setCode(e.target.value as typeof code)}>
              <option value="present">{t('payroll.attendancePresent')}</option>
              <option value="half">{t('payroll.attendanceHalf')}</option>
              <option value="absent">{t('payroll.attendanceAbsent')}</option>
              <option value="leave">{t('payroll.attendanceLeave')}</option>
              <option value="overtime">{t('payroll.attendanceOvertime')}</option>
            </SelectBox>
          </FormField>
          <button type="submit" className="btn-clay w-full">
            {t('payroll.save')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
