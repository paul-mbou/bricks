export type WeightedAverageCostInput = {
  stockQty: number;
  stockValue: number;
  inboundQty: number;
  inboundUnitCost: number;
};

/** CMP = (stock value + inbound value) / (stock qty + inbound qty). */
export function weightedAverageUnitCost(input: WeightedAverageCostInput): number {
  const { stockQty, stockValue, inboundQty, inboundUnitCost } = input;
  const newQty = stockQty + inboundQty;
  if (newQty <= 0) return 0;
  const inboundValue = inboundQty * inboundUnitCost;
  return (stockValue + inboundValue) / newQty;
}

export function deriveStock(
  movements: ReadonlyArray<{ quantity: number }>,
): number {
  return movements.reduce((sum, m) => sum + m.quantity, 0);
}

export function inventoryAdjustment(theoretical: number, counted: number): number {
  return counted - theoretical;
}

export type StockStatus = 'ok' | 'low' | 'out';

export function stockStatus(qty: number, alertThreshold: number): StockStatus {
  if (qty <= 0) return 'out';
  if (qty <= alertThreshold) return 'low';
  return 'ok';
}

export function estimateDaysRemaining(stockQty: number, avgDailyConsumption: number): number | null {
  if (avgDailyConsumption <= 0) return null;
  return stockQty / avgDailyConsumption;
}
