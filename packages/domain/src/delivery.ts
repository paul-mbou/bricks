/** Delivery loss = announced (BL) − received (BR). */
export function deliveryVariance(announcedQty: number, receivedQty: number): number {
  return announcedQty - receivedQty;
}

export function deliveryLossValue(varianceQty: number, unitPrice: number): number {
  return Math.max(0, varianceQty) * unitPrice;
}

/** Payable amount is based on received qty unless direction overrides. */
export function supplierPayableAmount(
  receivedQty: number,
  unitPrice: number,
  overrideAmount?: number | null,
): number {
  if (overrideAmount != null) return overrideAmount;
  return receivedQty * unitPrice;
}

export function remainingSupplierBalance(totalDue: number, paidTotal: number): number {
  return Math.max(0, totalDue - paidTotal);
}

export function customerDeliveryLossValue(brokenBlocks: number, unitCost: number): number {
  return Math.max(0, brokenBlocks) * unitCost;
}
