export type ProductionMetricsInput = {
  bagsUsed: number;
  blocksPerBag: number;
  goodBlocks: number;
  lostBlocks?: number;
};

export type ProductionMetrics = {
  theoreticalProduction: number;
  manufacturingLossCount: number;
  manufacturingLossRate: number;
  realYieldPerBag: number;
  yieldGap: number;
  yieldGapRate: number;
};

/** theoretical = bags × yield; loss = theoretical − good; real yield = good / bags. */
export function computeProductionMetrics(input: ProductionMetricsInput): ProductionMetrics {
  const { bagsUsed, blocksPerBag, goodBlocks } = input;
  if (bagsUsed < 0 || blocksPerBag < 0 || goodBlocks < 0) {
    throw new Error('Production quantities must be non-negative');
  }
  const theoreticalProduction = bagsUsed * blocksPerBag;
  const manufacturingLossCount = theoreticalProduction - goodBlocks;
  const manufacturingLossRate = theoreticalProduction === 0 ? 0 : manufacturingLossCount / theoreticalProduction;
  const realYieldPerBag = bagsUsed === 0 ? 0 : goodBlocks / bagsUsed;
  const yieldGap = blocksPerBag - realYieldPerBag;
  const yieldGapRate = blocksPerBag === 0 ? 0 : yieldGap / blocksPerBag;
  return {
    theoreticalProduction,
    manufacturingLossCount,
    manufacturingLossRate,
    realYieldPerBag,
    yieldGap,
    yieldGapRate,
  };
}

export function isYieldAbnormal(realYield: number, expectedYield: number, thresholdRate: number): boolean {
  if (expectedYield <= 0) return false;
  const gapRate = (expectedYield - realYield) / expectedYield;
  return gapRate > thresholdRate;
}

/** Material cost of one good block from a production run. */
export function blockMaterialUnitCost(totalMaterialCost: number, goodBlocks: number): number {
  if (goodBlocks <= 0) return 0;
  return totalMaterialCost / goodBlocks;
}

export function manufacturingLossValue(lossCount: number, unitCost: number): number {
  return Math.max(0, lossCount) * unitCost;
}
