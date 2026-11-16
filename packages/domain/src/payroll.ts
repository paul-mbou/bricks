export type PayContract = 'monthly' | 'weekly' | 'daily' | 'piece';

export type AttendanceCode = 'present' | 'absent' | 'half' | 'leave' | 'overtime';

export type PayrollInput = {
  baseSalaryOrRate: number;
  contract: PayContract;
  attendance: AttendanceCode[];
  overtimeHours?: number;
  overtimeRate?: number;
  bonuses?: number;
  advances?: number;
  deductions?: number;
  cnpsEnabled?: boolean;
  cnpsEmployeeRate?: number;
  workedDaysInPeriod?: number;
  expectedDaysInPeriod?: number;
};

export type PayrollResult = {
  gross: number;
  advances: number;
  deductions: number;
  cnpsEmployee: number;
  net: number;
};

function attendanceFactor(code: AttendanceCode): number {
  switch (code) {
    case 'present':
    case 'overtime':
      return 1;
    case 'half':
      return 0.5;
    case 'absent':
    case 'leave':
      return 0;
  }
}

export function computePayroll(input: PayrollInput): PayrollResult {
  const advances = input.advances ?? 0;
  const deductions = input.deductions ?? 0;
  const bonuses = input.bonuses ?? 0;
  const overtimePay = (input.overtimeHours ?? 0) * (input.overtimeRate ?? 0);

  let base = 0;
  switch (input.contract) {
    case 'monthly':
      base = input.baseSalaryOrRate;
      break;
    case 'weekly':
      base = input.baseSalaryOrRate;
      break;
    case 'daily': {
      const days = input.attendance.reduce((sum, code) => sum + attendanceFactor(code), 0);
      base = days * input.baseSalaryOrRate;
      break;
    }
    case 'piece':
      base = input.baseSalaryOrRate;
      break;
  }

  const gross = base + overtimePay + bonuses;
  const cnpsEmployee =
    input.cnpsEnabled && input.cnpsEmployeeRate
      ? gross * input.cnpsEmployeeRate
      : 0;
  const net = gross - advances - deductions - cnpsEmployee;
  return { gross, advances, deductions, cnpsEmployee, net };
}
