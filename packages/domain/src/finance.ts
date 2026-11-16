export type WeeklyProfitInput = {
  revenue: number;
  materialCost: number;
  electricityCost: number;
  waterCost: number;
  payrollCost: number;
  otherExpenses: number;
};

export type WeeklyProfit = {
  charges: number;
  profit: number;
  marginRate: number;
};

/** Profit = revenue − charges. Losses already in material cost. */
export function computeWeeklyProfit(input: WeeklyProfitInput): WeeklyProfit {
  const charges =
    input.materialCost +
    input.electricityCost +
    input.waterCost +
    input.payrollCost +
    input.otherExpenses;
  const profit = input.revenue - charges;
  const marginRate = input.revenue === 0 ? 0 : profit / input.revenue;
  return { charges, profit, marginRate };
}

export type CashflowInput = {
  cashIn: number;
  cashOut: number;
};

export function computeTreasury(input: CashflowInput): number {
  return input.cashIn - input.cashOut;
}

/** Spread a monthly utility bill across weeks by day ratio. */
export function allocateMonthlyBillToWeek(
  billAmount: number,
  weekDaysInMonth: number,
  monthDays: number,
): number {
  if (monthDays <= 0) return 0;
  return (billAmount * weekDaysInMonth) / monthDays;
}

export function saleLineTotal(qty: number, unitPrice: number, deliveryFee = 0): number {
  return qty * unitPrice + deliveryFee;
}
