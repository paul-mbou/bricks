import { formatMoney as formatMoneyDomain, roundMoney } from '../../packages/domain/src/money';
import { getLocale, intlLocale } from './i18n';

export { roundMoney };

export function formatMoney(amount: number, currency = 'XAF') {
  return formatMoneyDomain(amount, currency, intlLocale(getLocale()));
}
