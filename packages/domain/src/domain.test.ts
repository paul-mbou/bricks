import { describe, expect, it } from 'vitest';
import { computeProductionMetrics, isYieldAbnormal, blockMaterialUnitCost } from './production';
import { weightedAverageUnitCost, deriveStock, inventoryAdjustment, stockStatus } from './stock';
import { deliveryVariance, supplierPayableAmount, remainingSupplierBalance } from './delivery';
import { computeWeeklyProfit, allocateMonthlyBillToWeek, computeTreasury } from './finance';
import { computePayroll } from './payroll';
import { meterConsumption, costPerThousandBlocks, isAbnormalConsumption } from './utilities';

describe('production metrics', () => {
  it('computes theoretical, loss and real yield', () => {
    const m = computeProductionMetrics({ bagsUsed: 10, blocksPerBag: 70, goodBlocks: 650 });
    expect(m.theoreticalProduction).toBe(700);
    expect(m.manufacturingLossCount).toBe(50);
    expect(m.manufacturingLossRate).toBeCloseTo(50 / 700);
    expect(m.realYieldPerBag).toBe(65);
  });

  it('flags abnormal yield', () => {
    expect(isYieldAbnormal(55, 70, 0.15)).toBe(true);
    expect(isYieldAbnormal(68, 70, 0.15)).toBe(false);
  });

  it('computes unit material cost', () => {
    expect(blockMaterialUnitCost(140_000, 700)).toBe(200);
  });
});

describe('stock', () => {
  it('computes weighted average cost', () => {
    const cmp = weightedAverageUnitCost({
      stockQty: 100,
      stockValue: 500_000,
      inboundQty: 100,
      inboundUnitCost: 6000,
    });
    expect(cmp).toBe(5500);
  });

  it('derives stock from movements', () => {
    expect(deriveStock([{ quantity: 100 }, { quantity: -30 }, { quantity: 5 }])).toBe(75);
  });

  it('computes inventory adjustment', () => {
    expect(inventoryAdjustment(100, 95)).toBe(-5);
  });

  it('classifies stock status', () => {
    expect(stockStatus(0, 10)).toBe('out');
    expect(stockStatus(5, 10)).toBe('low');
    expect(stockStatus(50, 10)).toBe('ok');
  });
});

describe('delivery', () => {
  it('computes BL/BR variance and payable on received qty', () => {
    expect(deliveryVariance(500, 480)).toBe(20);
    expect(supplierPayableAmount(480, 5000)).toBe(2_400_000);
    expect(remainingSupplierBalance(2_400_000, 1_000_000)).toBe(1_400_000);
  });
});

describe('finance', () => {
  it('computes weekly profit and margin', () => {
    const r = computeWeeklyProfit({
      revenue: 1_000_000,
      materialCost: 400_000,
      electricityCost: 50_000,
      waterCost: 20_000,
      payrollCost: 200_000,
      otherExpenses: 30_000,
    });
    expect(r.charges).toBe(700_000);
    expect(r.profit).toBe(300_000);
    expect(r.marginRate).toBeCloseTo(0.3);
  });

  it('allocates monthly bill to week and treasury', () => {
    expect(allocateMonthlyBillToWeek(310_000, 7, 31)).toBe(70_000);
    expect(computeTreasury({ cashIn: 500_000, cashOut: 200_000 })).toBe(300_000);
  });
});

describe('payroll', () => {
  it('computes daily payroll with advances', () => {
    const r = computePayroll({
      contract: 'daily',
      baseSalaryOrRate: 5000,
      attendance: ['present', 'present', 'half', 'absent', 'present'],
      advances: 2000,
      bonuses: 1000,
    });
    expect(r.gross).toBe(5000 * 3.5 + 1000);
    expect(r.net).toBe(r.gross - 2000);
  });

  it('keeps CNPS off by default', () => {
    const r = computePayroll({
      contract: 'weekly',
      baseSalaryOrRate: 50_000,
      attendance: [],
      cnpsEnabled: false,
      cnpsEmployeeRate: 0.042,
    });
    expect(r.cnpsEmployee).toBe(0);
    expect(r.net).toBe(50_000);
  });
});

describe('utilities', () => {
  it('computes consumption and rejects decreasing index', () => {
    expect(meterConsumption(1000, 1120)).toBe(120);
    expect(() => meterConsumption(1000, 900)).toThrow();
  });

  it('cost per thousand and abnormal rise', () => {
    expect(costPerThousandBlocks(50_000, 10_000)).toBe(5000);
    expect(isAbnormalConsumption(150, 100, 0.2)).toBe(true);
  });
});
