export function meterConsumption(previousIndex: number, newIndex: number): number {
  if (newIndex < previousIndex) {
    throw new Error('New meter index cannot be lower than previous (unless meter replacement)');
  }
  return newIndex - previousIndex;
}

export function estimatedUtilityCost(consumption: number, unitTariff: number): number {
  return consumption * unitTariff;
}

/** Prefer billed amount when a real invoice exists. */
export function effectiveUtilityCharge(estimated: number, billedAmount: number | null | undefined): number {
  return billedAmount != null ? billedAmount : estimated;
}

export function costPerThousandBlocks(utilityCost: number, blocksProduced: number): number {
  if (blocksProduced <= 0) return 0;
  return (utilityCost / blocksProduced) * 1000;
}

export function isAbnormalConsumption(current: number, average: number, riseThresholdRate: number): boolean {
  if (average <= 0) return false;
  return (current - average) / average > riseThresholdRate;
}
