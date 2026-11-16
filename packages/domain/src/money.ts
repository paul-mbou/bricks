/** Format amounts in FCFA (XAF) without decimals by default. */
export function formatMoney(amount: number, currency = 'XAF', locale = 'fr-FR'): string {
  const rounded = Math.round(amount);
  if (currency === 'XAF' || currency === 'FCFA') {
    return `${rounded.toLocaleString(locale)}\u00a0FCFA`;
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(rounded);
}

export function roundMoney(amount: number): number {
  return Math.round(amount);
}
